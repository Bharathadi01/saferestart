import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { explainDecisionWithBedrock } from '@/lib/aws-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = body.eventId;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    const event = store.getRestartEvent(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: `Event ${eventId} not found` }, { status: 404 });
    }

    const zone = store.getZone(event.zoneId);

    const explanationResult = await explainDecisionWithBedrock({
      zoneName: zone ? zone.name : event.zoneId,
      action: event.riskEvaluation.action,
      riskScore: event.riskEvaluation.score,
      contributors: event.riskEvaluation.contributors,
      missingEvidence: event.riskEvaluation.missingEvidence,
    });

    return NextResponse.json({
      success: true,
      data: explanationResult,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate explanation';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
