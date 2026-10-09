import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { VerificationSubmission } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const submission: VerificationSubmission = {
      eventId: id,
      submittedBy: body.submittedBy || 'Field Tech A. Rivera',
      role: body.role || 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: Number(body.freeChlorineMgL),
      turbidityNtu: Number(body.turbidityNtu || 0.4),
      observedPressurePsi: Number(body.observedPressurePsi || 30),
      flushingCompleted: Boolean(body.flushingCompleted),
      leakInspectedAndSecured: Boolean(body.leakInspectedAndSecured),
      photoProofAttached: Boolean(body.photoProofAttached),
      notes: body.notes || 'Routine restart verification protocol performed.',
    };

    const result = store.submitVerification(submission);

    return NextResponse.json({
      success: true,
      data: result.event,
      audit: result.audit,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Verification submission failed';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
