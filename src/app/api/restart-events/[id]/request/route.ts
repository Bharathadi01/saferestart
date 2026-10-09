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

    const event = store.getRestartEvent(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: `Event ${id} not found` },
        { status: 404 }
      );
    }

    const result = store.requestRestart(event.zoneId, actor);

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
