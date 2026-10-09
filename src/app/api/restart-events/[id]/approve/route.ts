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

    const decision: SupervisorDecision = {
      eventId: id,
      supervisorName: body.supervisorName || 'Chief Water Works Engineer H. Miller',
      supervisorRole: body.supervisorRole || 'SUPERVISOR',
      decision: body.decision === 'HOLD' ? 'HOLD' : 'APPROVE',
      rationale: body.rationale || 'Field parameters verified. Statutory flushing and residual safety protocol documented.',
      timestamp: new Date().toISOString(),
      complianceChecksVerified: Boolean(body.complianceChecksVerified),
    };

    const result = store.authorizeRestoration(decision);

    return NextResponse.json({
      success: true,
      data: result.event,
      audit: result.audit,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Supervisor authorization failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
