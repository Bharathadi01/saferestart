import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const events = store.getRestartEvents();
  return NextResponse.json({
    success: true,
    data: events,
  });
}
