// AWS Lambda Handler: AuthorizeRestoration
export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const role = body.supervisorRole;
    const isAuthorized = role === 'SUPERVISOR' || role === 'CHIEF_WATER_ENGINEER';

    if (!isAuthorized) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Role '${role}' is not authorized to sign off water service restoration.`,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          restored: true,
          authorizedBy: body.supervisorName || 'Operations Supervisor',
          state: 'RESTORED',
          authorizedAt: new Date().toISOString(),
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
