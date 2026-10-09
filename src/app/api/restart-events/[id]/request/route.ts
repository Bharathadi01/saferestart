import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actor = body.actor || 'Operator J. Vance';

    let zoneId = body.zoneId;

    if (!zoneId) {
      const event = store.getRestartEvent(id);
      if (event) {
        zoneId = event.zoneId;
      } else {
        const directZone = store.getZone(id);
        if (directZone) zoneId = directZone.id;
      }
    }

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: `Could not identify zone for event ${id}` },
        { status: 404 }
      );
    }

    const result = store.requestRestart(zoneId, actor);

    return NextResponse.json({
      success: true,
      data: result.event,
      audit: result.audit,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to request restart';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
