import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const hours = Number(body.hours || 1);

    const state = store.advanceSimulation(hours);

    return NextResponse.json({
      success: true,
      data: state,
      message: `Simulation clock advanced by ${hours} hours.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to advance simulation';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
