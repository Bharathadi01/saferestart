import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId') || undefined;
  const eventId = searchParams.get('eventId') || undefined;

  const audits = store.getAuditTrail(zoneId, eventId);

  return NextResponse.json({
    success: true,
    data: audits,
  });
}
