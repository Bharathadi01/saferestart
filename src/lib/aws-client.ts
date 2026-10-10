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
}

export function getCloudEnvironmentStatus(): CloudStorageStatus {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.BEDROCK_API_KEY;
  const hasBearerToken = !!bearerToken && bearerToken.trim().length > 0;
  const hasAwsRegion = !!process.env.AWS_REGION || !!process.env.AWS_DEFAULT_REGION;
  const hasAwsCreds = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
  const isAwsConfigured = hasBearerToken || (hasAwsRegion && hasAwsCreds);
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';

  return {
    provider: isAwsConfigured ? 'AWS_SERVERLESS' : 'LOCAL_SIMULATOR',
    region,
    tablesConfigured: hasAwsCreds,
    eventBridgeConfigured: hasAwsCreds,
    bedrockConfigured: hasBearerToken || (hasAwsCreds && !!process.env.BEDROCK_MODEL_ID),
    notice: hasBearerToken
      ? `Connected to Amazon Bedrock API Key Runtime (${region})`
      : isAwsConfigured
      ? `Connected to AWS Serverless (DynamoDB + EventBridge + Bedrock: ${region})`
      : 'Running Local Development Adapter. Data persisted in memory with deterministic simulation.',
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
} from './copilot';

