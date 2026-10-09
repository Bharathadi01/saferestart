import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = store.getRestartEvent(id);

  if (!event) {
    return NextResponse.json(
      { success: false, error: `Restart event ${id} not found` },
      { status: 404 }
    );
  }

  const zone = store.getZone(event.zoneId);
  const audits = store.getAuditTrail(event.zoneId, event.id);

  return NextResponse.json({
    success: true,
    data: {
      event,
      zone,
      audits,
    },
  });
}
