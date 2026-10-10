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
  const hasAwsRegion = !!process.env.AWS_REGION || !!process.env.AWS_DEFAULT_REGION;
  const hasAwsCreds = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
  const isAwsConfigured = hasAwsRegion && hasAwsCreds;

  return {
    provider: isAwsConfigured ? 'AWS_SERVERLESS' : 'LOCAL_SIMULATOR',
    region: process.env.AWS_REGION || 'us-east-1',
    tablesConfigured: isAwsConfigured,
    eventBridgeConfigured: isAwsConfigured,
    bedrockConfigured: isAwsConfigured && !!process.env.BEDROCK_MODEL_ID,
    notice: isAwsConfigured
      ? 'Connected to AWS Serverless (DynamoDB + EventBridge + Bedrock)'
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
