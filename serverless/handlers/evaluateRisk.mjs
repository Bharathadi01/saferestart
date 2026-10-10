// AWS Lambda Handler: EvaluateRisk
export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const interruptionHours = Number(body.interruptionDurationHours || 0);
    const pressurePsi = Number(body.minimumObservedPressurePsi || 30);

    // Pure deterministic evaluation logic
    const isHold = interruptionHours >= 12 || pressurePsi <= 5;
    const score = Math.min(100, (interruptionHours >= 12 ? 35 : 10) + (pressurePsi <= 5 ? 40 : 5));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          action: isHold ? 'HOLD' : 'PROCEED',
          score,
          evaluatedAt: new Date().toISOString(),
          decisionSupportNote: 'AWS Lambda deterministic risk calculation. Prototype decision-support only.',
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
