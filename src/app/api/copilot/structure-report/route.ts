import { NextRequest, NextResponse } from 'next/server';
import { structureFieldReportWithCopilot } from '@/lib/copilot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawReport = body.rawReport;

    if (!rawReport || typeof rawReport !== 'string' || rawReport.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawReport text string is required.' },
        { status: 400 }
      );
    }

    const structured = await structureFieldReportWithCopilot({
      rawReport,
    });

    return NextResponse.json({
      success: true,
      data: structured,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to structure field report';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
