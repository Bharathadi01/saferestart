import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const zoneId = body.zoneId || 'zone-5';
    const actor = body.actor || 'Operations Console (Simulated Fault)';

    const result = store.triggerInterruption(zoneId, actor);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Interruption triggered in zone ${zoneId}. Pressure dropped, restart event generated.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to trigger interruption';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
