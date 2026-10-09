import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST() {
  const state = store.reset();
  return NextResponse.json({
    success: true,
    data: state,
    message: 'Simulation state reset to initial deterministic demonstration baseline.',
  });
}
