// AWS Lambda Handler: BedrockExplain
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const region = process.env.AWS_REGION || 'us-east-1';
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

    const client = new BedrockRuntimeClient({ region });
    const prompt = `SafeRestart Evidence Copilot: Explain this restart assessment: Zone "${body.zoneName || 'Sector'}", Action: ${body.action || 'HOLD'}, Score: ${body.riskScore || 50}/100. Generate a 2-sentence summary and 2 physical field directives.`;

    const command = new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      system: [{ text: 'Respond with pure JSON: {"explanation": string, "fieldDirectives": string[]}. Never authorize service restoration.' }],
      inferenceConfig: { maxTokens: 300, temperature: 0.1 },
    });

    const response = await client.send(command);
    const text = response.output?.message?.content?.[0]?.text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          response: text,
          modelUsed: modelId,
          timestamp: new Date().toISOString(),
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: err.message,
        fallbackNote: 'Bedrock invocation failed or model access pending in this region.',
      }),
    };
  }
}
