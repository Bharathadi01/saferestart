import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getCloudEnvironmentStatus } from '@/lib/aws-client';

export async function GET() {
  const zones = store.getZones();
  const cloudStatus = getCloudEnvironmentStatus();

  return NextResponse.json({
    success: true,
    data: zones,
    cloudStatus,
    timestamp: new Date().toISOString(),
  });
}
