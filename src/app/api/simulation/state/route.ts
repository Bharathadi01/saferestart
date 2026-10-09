import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getCloudEnvironmentStatus } from '@/lib/aws-client';

export async function GET() {
  const state = store.getState();
  const cloudStatus = getCloudEnvironmentStatus();

  return NextResponse.json({
    success: true,
    data: {
      zones: state.zones,
      restartEvents: state.restartEvents,
      auditTrail: state.auditTrail,
      currentSimulatedTime: state.currentSimulatedTime,
    },
    cloudStatus,
    timestamp: new Date().toISOString(),
  });
}
