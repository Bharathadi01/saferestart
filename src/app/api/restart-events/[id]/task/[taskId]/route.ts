import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();

    const result = store.updateFieldTask(taskId, {
      status: body.status,
      measurementsRecorded: body.measurementsRecorded,
      fieldNotes: body.fieldNotes,
      photoUrl: body.photoUrl,
      actor: body.actor || 'Certified Field Technician',
    });

    return NextResponse.json({
      success: true,
      data: result.task,
      event: result.event,
      audit: result.audit,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update field task';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
