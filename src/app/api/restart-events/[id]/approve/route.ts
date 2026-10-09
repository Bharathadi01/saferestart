import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SupervisorDecision } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const actionType: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' =
      body.actionType || (body.decision === 'HOLD' ? 'REJECT_HOLD' : 'APPROVE');

    const decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' } = {
      eventId: id,
      supervisorName: body.supervisorName || 'Chief Water Works Engineer H. Miller',
      supervisorRole: body.supervisorRole || 'SUPERVISOR',
      decision: actionType === 'APPROVE' ? 'APPROVE' : 'HOLD',
      rationale:
        body.rationale ||
        (actionType === 'APPROVE'
          ? 'Field parameters verified. Statutory flushing and residual safety protocol documented.'
          : actionType === 'REQUEST_MORE_VERIFICATION'
          ? 'Additional secondary microbiological verification requested by supervisor.'
          : 'Service restoration rejected; operational HOLD enforced.'),
      timestamp: new Date().toISOString(),
      complianceChecksVerified: Boolean(body.complianceChecksVerified),
      actionType,
    };

    const result = store.supervisorReview(decision);

    return NextResponse.json({
      success: true,
      data: result.event,
      audit: result.audit,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Supervisor review action failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
