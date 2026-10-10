// AWS Client Abstraction and Dual-Mode Adapter
// Provides seamless interface for Amazon DynamoDB, EventBridge, S3, and Amazon Bedrock
// Falls back cleanly to local validated adapter when cloud credentials are not supplied.

import { explainAssessmentWithCopilot } from './copilot';

export interface CloudStorageStatus {
  provider: 'AWS_SERVERLESS' | 'LOCAL_SIMULATOR';
  region: string;
  tablesConfigured: boolean;
  eventBridgeConfigured: boolean;
  bedrockConfigured: boolean;
  notice: string;
  authStrategy?: 'bearer_token' | 'iam_static_keys' | 'iam_role_default_chain' | 'none';
}

export function getCloudEnvironmentStatus(): CloudStorageStatus {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.BEDROCK_API_KEY;
  const hasBearerToken = !!bearerToken && bearerToken.trim().length > 0;
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID.trim().length > 0;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_SECRET_ACCESS_KEY.trim().length > 0;
  const hasAwsCreds = hasAccessKey && hasSecretKey;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';

  const isAwsComputeEnvironment =
    !!process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    !!process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ||
    !!process.env.AWS_EXECUTION_ENV ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
    !!process.env.AWS_ROLE_ARN ||
    !!process.env.AWS_APP_ID ||
    !!process.env.AMPLIFY_SSR ||
    process.env.AWS_USE_IAM_ROLE === 'true' ||
    process.env.AWS_AUTH_STRATEGY === 'iam_role';

  const isProduction = process.env.NODE_ENV === 'production';
  const isFallbackOnly = process.env.USE_LOCAL_FALLBACK_ONLY === 'true';
  const hasIamRole = (isAwsComputeEnvironment || isProduction) && !isFallbackOnly;

  const isDynamoConfigured = process.env.USE_DYNAMODB === 'true';

  if (!isFallbackOnly && hasBearerToken) {
    return {
      provider: 'AWS_SERVERLESS',
      region,
      tablesConfigured: isDynamoConfigured,
      eventBridgeConfigured: isDynamoConfigured,
      bedrockConfigured: true,
      authStrategy: 'bearer_token',
      notice: `Connected to Amazon Bedrock API Key Runtime (${region})`,
    };
  }

  if (!isFallbackOnly && hasAwsCreds) {
    return {
      provider: 'AWS_SERVERLESS',
      region,
      tablesConfigured: isDynamoConfigured,
      eventBridgeConfigured: isDynamoConfigured,
      bedrockConfigured: true,
      authStrategy: 'iam_static_keys',
      notice: isDynamoConfigured
        ? `Connected to AWS Serverless (DynamoDB + EventBridge + Bedrock: ${region})`
        : `Connected to AWS Serverless (IAM Keys: ${region}) — In-Memory Store active (USE_DYNAMODB=false)`,
    };
  }

  if (hasIamRole) {
    return {
      provider: 'AWS_SERVERLESS',
      region,
      tablesConfigured: isDynamoConfigured,
      eventBridgeConfigured: isDynamoConfigured,
      bedrockConfigured: true,
      authStrategy: 'iam_role_default_chain',
      notice: `Connected to AWS Amplify IAM Role (${region}) — SigV4 Bedrock Runtime`,
    };
  }

  return {
    provider: 'LOCAL_SIMULATOR',
    region,
    tablesConfigured: false,
    eventBridgeConfigured: false,
    bedrockConfigured: false,
    authStrategy: 'none',
    notice: 'Running Local Development Adapter. Data persisted in memory with deterministic simulation.',
  };
}

/**
 * Amazon Bedrock Explainer Service
 * Structures operator notes and explains risk engine decisions.
 * Uses Evidence Copilot with graceful fallback to deterministic local heuristics.
 */
export async function explainDecisionWithBedrock(params: {
  zoneName: string;
  action: 'HOLD' | 'PROCEED';
  riskScore: number;
  contributors: Array<{ factor: string; severity: string; explanation: string }>;
  missingEvidence: string[];
}): Promise<{
  explanation: string;
  fieldDirectives: string[];
  regulatoryNote: string;
  modelUsed: string;
  isSimulatedFallback: boolean;
  sourceLabel: string;
}> {
  const result = await explainAssessmentWithCopilot({
    zoneId: params.zoneName,
    zoneName: params.zoneName,
    action: params.action,
    riskScore: params.riskScore,
    contributors: params.contributors,
    missingEvidence: params.missingEvidence,
  });

  return {
    explanation: `${result.statusExplanation} ${result.missingEvidenceSummary}`,
    fieldDirectives: result.nextVerificationSteps,
    regulatoryNote: result.uncertaintiesAndLimitations,
    modelUsed: result.modelUsed,
    isSimulatedFallback: result.isSimulatedFallback,
    sourceLabel: result.sourceLabel,
  };
}

export {
  generateIncidentBrief,
  investigateIncidentCauses,
  structureFieldReportWithCopilot,
  getBedrockClient,
} from './copilot';
export type { BedrockAuthStrategy, BedrockClientConfig } from './copilot';

