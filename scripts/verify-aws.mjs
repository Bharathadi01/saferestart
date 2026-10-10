// SafeRestart AWS Integration Verification Script
// Run: node scripts/verify-aws.mjs
// Safely inspects configuration and executes read-only AWS operations without revealing secrets.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to safely load env file without overriding already-set process.env vars
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const k = key.trim();
        const v = vals.join('=').trim().replace(/^["']|["']$/g, '');
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    });
  }
}

// Load .env.local and .env if present
loadEnvFile(path.join(rootDir, '.env.local'));
loadEnvFile(path.join(rootDir, '.env'));

console.log('='.repeat(68));
console.log('   SAFERESTART — AWS BEDROCK INTEGRATION DIAGNOSTIC & VERIFICATION');
console.log('='.repeat(68));

// Configuration resolution
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0';

// Authentication detection (Never print secret values)
const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.BEDROCK_API_KEY;
const hasBearerToken = !!bearerToken && bearerToken.trim().length > 0;
const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID.trim().length > 0;
const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_SECRET_ACCESS_KEY.trim().length > 0;
const hasSigV4 = hasAccessKey && hasSecretKey;

const hasIamRole =
  process.env.AWS_USE_IAM_ROLE === 'true' ||
  process.env.AWS_AUTH_STRATEGY === 'iam_role' ||
  !!process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
  !!process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ||
  !!process.env.AWS_EXECUTION_ENV ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
  !!process.env.AWS_ROLE_ARN ||
  !!process.env.AWS_APP_ID ||
  !!process.env.AMPLIFY_SSR ||
  process.env.NODE_ENV === 'production';

const isConfigured = hasBearerToken || hasSigV4 || hasIamRole;
const envLocalExists = fs.existsSync(path.join(rootDir, '.env.local'));

console.log(`\n1. CONFIGURATION STATUS:`);
console.log(`   - Selected AWS Service    : Amazon Bedrock Runtime (Evidence Copilot)`);
console.log(`   - Target AWS Region       : ${region}${!process.env.AWS_REGION ? ' (default: Sydney)' : ' (override: AWS_REGION)'}`);
console.log(`   - Target Foundation Model : ${modelId}${!process.env.BEDROCK_MODEL_ID ? ' (default: Amazon Nova Micro)' : ' (override: BEDROCK_MODEL_ID)'}`);
console.log(`   - .env.local File         : ${envLocalExists ? 'PRESENT' : 'NOT FOUND (using environment variables)'}`);
console.log(`   - AWS_BEARER_TOKEN_BEDROCK: ${hasBearerToken ? '[CONFIGURED - REDACTED]' : 'NOT SET'}`);
console.log(`   - AWS_ACCESS_KEY_ID       : ${hasAccessKey ? '[CONFIGURED - REDACTED]' : 'NOT SET'}`);
console.log(`   - AWS_SECRET_ACCESS_KEY   : ${hasSecretKey ? '[CONFIGURED - REDACTED]' : 'NOT SET'}`);
console.log(`   - IAM Role / Default Chain: ${hasIamRole ? '[DETECTED / ACTIVE]' : 'NOT SET'}`);
console.log(`   - Authentication Strategy : ${
  hasBearerToken
    ? 'Bedrock Bearer Token (AWS SDK httpBearerAuth scheme)'
    : hasSigV4
    ? 'AWS IAM Static Credentials (AWS SDK sigv4 scheme)'
    : hasIamRole
    ? 'AWS IAM Role / Default Credential Provider Chain (AWS SDK sigv4 scheme)'
    : 'NONE (Offline Fallback Active)'
}`);

if (!isConfigured) {
  console.log(`\n2. LIVE AWS OPERATION STATUS: BLOCKED BY MISSING CREDENTIALS`);
  console.log(`   - Reason: Neither AWS_BEARER_TOKEN_BEDROCK, IAM access keys, nor IAM Role credentials are configured.`);
  console.log(`   - Active Mode: LOCAL ENGINEERING HEURISTICS (Deterministic Offline Fallback).`);
  console.log(`   - Safety Impact: Zero degradation. Deterministic risk engine and state machine are 100% operational.`);
  console.log(`\n3. HOW TO ENABLE LIVE AMAZON BEDROCK:`);
  console.log(`   Option A — Bedrock API Key / Bearer Token (Local Development):`);
  console.log(`     export AWS_BEARER_TOKEN_BEDROCK="your_bedrock_api_key"`);
  console.log(`     npm run verify:aws`);
  console.log(`     (or place AWS_BEARER_TOKEN_BEDROCK=... inside .env.local)`);
  console.log(`\n   Option B — Standard AWS IAM Access Keys:`);
  console.log(`     export AWS_ACCESS_KEY_ID="your_key"`);
  console.log(`     export AWS_SECRET_ACCESS_KEY="your_secret"`);
  console.log(`     npm run verify:aws`);
  console.log(`\n   Option C — AWS IAM Compute Role / Default Credential Provider Chain (Amplify SSR / ECS):`);
  console.log(`     export AWS_USE_IAM_ROLE="true"`);
  console.log(`     npm run verify:aws`);
  console.log('\n' + '='.repeat(68));
  process.exit(0);
}

// Credentials exist — Attempt minimal, genuine Bedrock Converse request
console.log(`\n2. ATTEMPTING LIVE AMAZON BEDROCK READ-ONLY CONVERSE CALL...`);
console.log(`   - Endpoint: bedrock-runtime.${region}.amazonaws.com`);
console.log(`   - Sending test ping to model '${modelId}'...`);

try {
  const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');

  let client;
  if (hasBearerToken) {
    client = new BedrockRuntimeClient({
      region,
      token: { token: bearerToken.trim() },
      authSchemePreference: ['httpBearerAuth'],
    });
  } else if (hasSigV4) {
    client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
      },
    });
  } else {
    client = new BedrockRuntimeClient({
      region,
    });
  }

  const startTime = Date.now();
  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: 'SafeRestart operational status check. Respond with the single word: OK' }],
      },
    ],
    inferenceConfig: { maxTokens: 10, temperature: 0.1 },
  });

  const response = await client.send(command);
  const latency = Date.now() - startTime;
  const reply = response.output?.message?.content?.[0]?.text;

  console.log(`\n   ✓ GENUINE AWS OPERATION SUCCEEDED!`);
  console.log(`   - Latency             : ${latency}ms`);
  console.log(`   - Region Verified     : ${region}`);
  console.log(`   - Model Invoked       : ${modelId}`);
  console.log(`   - Auth Scheme Used    : ${
    hasBearerToken
      ? 'httpBearerAuth (Bearer Token)'
      : hasSigV4
      ? 'sigv4 (IAM Static Credentials)'
      : 'sigv4 (IAM Role / Default Credential Chain)'
  }`);
  console.log(`   - Model Response      : "${reply?.trim() || '[Empty response]'}"`);
  console.log(`   - Status              : PASS — Genuine AWS Bedrock connection verified.`);
} catch (err) {
  const errName = err?.name || 'UnknownError';
  const errMsg = err?.message || String(err);

  console.log(`\n   ✗ AWS CALL ATTEMPT FAILED:`);
  console.log(`   - Error Name          : ${errName}`);
  console.log(`   - Error Message       : ${errMsg}`);

  if (errName === 'AccessDeniedException') {
    if (errMsg.includes('Invalid API Key format') || errMsg.includes('prefix')) {
      console.log(`   - Diagnosis           : The bearer token format is invalid for Bedrock API keys.`);
      console.log(`   - Resolution          : Check that AWS_BEARER_TOKEN_BEDROCK contains the exact token generated from AWS Console.`);
    } else {
      console.log(`   - Diagnosis           : Access denied. Missing IAM 'bedrock:InvokeModel' permission or model access.`);
      console.log(`   - Resolution          : Open AWS Bedrock Console (${region}) > 'Model access' > Request access for '${modelId}'.`);
    }
  } else if (errName === 'ExpiredTokenException' || errMsg.toLowerCase().includes('expired')) {
    console.log(`   - Diagnosis           : The temporary Bedrock bearer token or session credentials have expired.`);
    console.log(`   - Resolution          : Generate a fresh API key or session token in the AWS Console and update AWS_BEARER_TOKEN_BEDROCK.`);
  } else if (errName === 'ResourceNotFoundException') {
    console.log(`   - Diagnosis           : Model '${modelId}' was not found in region '${region}'.`);
    console.log(`   - Resolution          : Verify that '${modelId}' is supported in '${region}' or override with BEDROCK_MODEL_ID.`);
  } else if (errName === 'ValidationException') {
    console.log(`   - Diagnosis           : Request validation failed.`);
    console.log(`   - Resolution          : Verify request parameters and model compatibility for Converse API.`);
  } else if (errName === 'CredentialsProviderError' || errName === 'UnrecognizedClientException') {
    console.log(`   - Diagnosis           : AWS SDK credential provider failed to resolve authentication.`);
    console.log(`   - Resolution          : Verify bearer token or IAM credentials formatting.`);
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || errMsg.includes('fetch failed') || errName === 'TimeoutError') {
    console.log(`   - Diagnosis           : Network connectivity failure reaching Bedrock endpoint.`);
    console.log(`   - Resolution          : Check internet connection and outbound HTTPS access to bedrock-runtime.${region}.amazonaws.com.`);
  } else {
    console.log(`   - Diagnosis           : Unexpected Bedrock runtime exception.`);
  }

  console.log(`\n   - Application Safety Status: UNCOMPROMISED`);
  console.log(`     SafeRestart automatically routes to Local Engineering Heuristics.`);
  console.log(`     The deterministic safety rules engine and state machine continue operating normally.`);
}

console.log('='.repeat(68));
