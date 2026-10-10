import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { generateIncidentBrief } from '@/lib/copilot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventId = body.eventId;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    const event = store.getRestartEvent(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: `Event ${eventId} not found` }, { status: 404 });
    }

    const zone = store.getZone(event.zoneId);
    if (!zone) {
      return NextResponse.json({ success: false, error: `Zone for event ${eventId} not found` }, { status: 404 });
    }

    const brief = await generateIncidentBrief({
      eventId: event.id,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneCode: zone.code,
      interruptionDurationHours: event.interruptionDurationHours,
      minimumObservedPressurePsi: event.minimumObservedPressurePsi,
      currentTelemetry: zone.currentTelemetry,
      riskEvaluation: event.riskEvaluation,
      incidents: zone.incidents,
      fieldTasks: event.fieldTasks,
      fieldReports: event.fieldReports,
    });

    return NextResponse.json({
      success: true,
      data: brief,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate incident intelligence brief';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
