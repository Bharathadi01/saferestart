// AWS Lambda Handler: SubmitVerification
export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const chlorine = Number(body.freeChlorineMgL ?? 0);
    const pressure = Number(body.observedPressurePsi ?? 0);
    const flushingCompleted = Boolean(body.flushingCompleted);

    const passed = chlorine >= 0.20 && pressure >= 20.0 && flushingCompleted;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          outcome: passed ? 'PASSED' : 'FAILED',
          targetState: passed ? 'AWAITING_APPROVAL' : 'HOLD',
          timestamp: new Date().toISOString(),
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
