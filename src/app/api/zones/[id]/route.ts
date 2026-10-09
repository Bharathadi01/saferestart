import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const zone = store.getZone(id);

  if (!zone) {
    return NextResponse.json(
      { success: false, error: `Zone with ID ${id} not found` },
      { status: 404 }
    );
  }

  const activeEvent = zone.activeRestartEventId
    ? store.getRestartEvent(zone.activeRestartEventId)
    : undefined;

  const audits = store.getAuditTrail(zone.id);

  return NextResponse.json({
    success: true,
    data: {
      zone,
      activeEvent,
      audits,
    },
  });
}
