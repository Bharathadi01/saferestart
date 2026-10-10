import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ConfirmedFieldReport } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body.rawReport || typeof body.rawReport !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Original rawReport text is required for human-confirmed records.' },
        { status: 400 }
      );
    }

    const report: Omit<ConfirmedFieldReport, 'id' | 'confirmedAt'> = {
      eventId: id,
      rawReport: body.rawReport,
      reportedBy: body.reportedBy || 'Field Technician',
      confirmedBy: body.confirmedBy || 'Operator (Confirmed)',
      zoneReference: body.zoneReference || 'zone-1',
      suspectedFault: {
        description: body.suspectedFault?.description || 'No defect noted',
        status: body.suspectedFault?.status === 'CONFIRMED' ? 'CONFIRMED' : body.suspectedFault?.status === 'NONE' ? 'NONE' : 'SUSPECTED',
        location: body.suspectedFault?.location,
      },
      explicitEvidence: {
        freeChlorineMgL: typeof body.explicitEvidence?.freeChlorineMgL === 'number' ? body.explicitEvidence.freeChlorineMgL : null,
        pressurePsi: typeof body.explicitEvidence?.pressurePsi === 'number' ? body.explicitEvidence.pressurePsi : null,
        observations: Array.isArray(body.explicitEvidence?.observations) ? body.explicitEvidence.observations : [],
      },
      missingInformation: Array.isArray(body.missingInformation) ? body.missingInformation : [],
      suggestedFollowUpTasks: Array.isArray(body.suggestedFollowUpTasks) ? body.suggestedFollowUpTasks : [],
      sourceLabel: body.sourceLabel || 'Human-Confirmed Field Report',
    };

    const result = store.commitFieldReport(id, report);

    return NextResponse.json({
      success: true,
      data: result.event,
      audit: result.audit,
      recalculatedRisk: result.recalculatedRisk,
      reasons: result.reasons,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to commit field report';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
