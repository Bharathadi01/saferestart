import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import {
  explainAssessmentWithCopilot,
  structureFieldReportWithCopilot,
  getBedrockClient,
} from '../src/lib/copilot';
import { explainDecisionWithBedrock, getCloudEnvironmentStatus } from '../src/lib/aws-client';

describe('AWS Integration Verification Suite — Amazon Bedrock & Fallback Guardrails', () => {
  const originalEnv = process.env;
  const setNodeEnv = (val: string) => {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    setNodeEnv('test');
    delete process.env.AWS_BEARER_TOKEN_BEDROCK;
    delete process.env.BEDROCK_API_KEY;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_REGION;
    delete process.env.BEDROCK_MODEL_ID;
    delete process.env.AWS_USE_IAM_ROLE;
    delete process.env.AWS_AUTH_STRATEGY;
    delete process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
    delete process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
    delete process.env.AWS_EXECUTION_ENV;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
    delete process.env.AWS_ROLE_ARN;
    delete process.env.AWS_APP_ID;
    delete process.env.AMPLIFY_SSR;
    delete process.env.USE_LOCAL_FALLBACK_ONLY;
    delete process.env.USE_DYNAMODB;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('1. Uncredentialed / Offline Mode', () => {
    it('accurately identifies absent AWS credentials and defaults to deterministic local fallback', async () => {
      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 85,
        contributors: [
          { factor: 'unresolved_leak', severity: 'HIGH', explanation: 'Active collar crack' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      // Must be explicitly declared as fallback
      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
      expect(result.modelUsed).toContain('Local Engineering Heuristics');
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD');
      expect(result.nextVerificationSteps.length).toBeGreaterThan(0);
    });

    it('ensures deterministic risk decision is never overridden by AI explanation', async () => {
      const result = await explainDecisionWithBedrock({
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 85,
        contributors: [
          { factor: 'unresolved_leak', severity: 'HIGH', explanation: 'Active collar crack' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      expect(result.explanation).toContain('OPERATIONAL HOLD');
      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toContain('Amazon Bedrock was not called');
    });

    it('reports LOCAL_SIMULATOR status when no credentials exist', () => {
      const status = getCloudEnvironmentStatus();
      expect(status.provider).toBe('LOCAL_SIMULATOR');
      expect(status.region).toBe('ap-southeast-2');
      expect(status.bedrockConfigured).toBe(false);
      expect(status.notice).toContain('Local Development Adapter');
    });
  });

  describe('2. Amazon Bedrock API Key / Bearer Token Authentication (AWS_BEARER_TOKEN_BEDROCK)', () => {
    it('initializes client with bearer token and default region ap-southeast-2 and model amazon.nova-micro-v1:0', () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token-12345';

      const config = getBedrockClient();
      expect(config).not.toBeNull();
      expect(config?.modelId).toBe('amazon.nova-micro-v1:0');
      expect(config?.client).toBeInstanceOf(BedrockRuntimeClient);
    });

    it('processes a successful Bedrock Converse response with bearer token auth', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token-12345';
      process.env.AWS_REGION = 'ap-southeast-2';
      process.env.BEDROCK_MODEL_ID = 'amazon.nova-micro-v1:0';

      const mockBedrockResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [
              {
                text: JSON.stringify({
                  statusExplanation: 'Zone 1 restart is held due to severe depressurization and pending residual verification.',
                  missingEvidenceSummary: 'Missing chlorine residual and repair inspection.',
                  nextVerificationSteps: [
                    'Perform 15-minute terminal hydrant scour flush.',
                    'Measure free chlorine using DPD colorimeter (target >= 0.20 mg/L).',
                  ],
                  uncertaintiesAndLimitations: 'Advisory synthesis only. Requires authorized supervisor sign-off.',
                }),
              },
            ],
          },
        },
      };

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockResolvedValueOnce(mockBedrockResponse as never);

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 80,
        contributors: [
          { factor: 'interruption_duration', severity: 'HIGH', explanation: '14 hour shutdown' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      expect(result.isSimulatedFallback).toBe(false);
      expect(result.sourceLabel).toBe('AI-assisted explanation — review against recorded evidence');
      expect(result.modelUsed).toBe('amazon.nova-micro-v1:0');
      expect(result.nextVerificationSteps.length).toBe(2);
      expect(result.nextVerificationSteps[0]).toContain('terminal hydrant scour flush');
    });

    it('reports AWS_SERVERLESS status when bearer token is configured', () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token-12345';
      const status = getCloudEnvironmentStatus();
      expect(status.provider).toBe('AWS_SERVERLESS');
      expect(status.region).toBe('ap-southeast-2');
      expect(status.bedrockConfigured).toBe(true);
      expect(status.notice).toContain('Amazon Bedrock API Key Runtime');
    });
  });

  describe('3. Standard AWS IAM Credentials (SigV4) Fallback Compatibility', () => {
    it('initializes client with standard IAM keys when bearer token is absent', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-iam-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-iam-secret';
      process.env.AWS_REGION = 'ap-southeast-2';

      const config = getBedrockClient();
      expect(config).not.toBeNull();
      expect(config?.modelId).toBe('amazon.nova-micro-v1:0');
    });
  });

  describe('4. Error Handling & Offline Fallback Guardrails', () => {
    it('safely falls back to local heuristics when Bedrock returns AccessDeniedException', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token-12345';
      process.env.AWS_REGION = 'ap-southeast-2';

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockRejectedValueOnce(
        new Error('AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel')
      );

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 75,
        contributors: [
          { factor: 'unresolved_leak', severity: 'HIGH', explanation: 'Active pipe crack' },
        ],
        missingEvidence: ['leak_isolation_and_repair_verification'],
      });

      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
      expect(result.modelUsed).toContain('Local Engineering Heuristics');
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD');
    });

    it('safely falls back to local heuristics when Bedrock token has expired (ExpiredTokenException)', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'expired-token';

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockRejectedValueOnce(
        new Error('ExpiredTokenException: The security token included in the request is expired')
      );

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 75,
        contributors: [],
        missingEvidence: [],
      });

      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
    });

    it('safely falls back to local heuristics when network times out or endpoint is unreachable', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-token';

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockRejectedValueOnce(
        new Error('FetchError: connect ECONNREFUSED bedrock-runtime.ap-southeast-2.amazonaws.com')
      );

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 75,
        contributors: [],
        missingEvidence: [],
      });

      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
    });

    it('structures field reports with live Bedrock response and preserves uncertainty', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token';
      process.env.AWS_REGION = 'ap-southeast-2';
      process.env.BEDROCK_MODEL_ID = 'amazon.nova-micro-v1:0';

      const mockReportResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [
              {
                text: JSON.stringify({
                  zoneReference: 'zone-2',
                  reportedEvent: 'Overnight pressure collapse',
                  suspectedFault: {
                    description: 'Suspected leak near valve V-04',
                    status: 'SUSPECTED',
                    location: 'V-04',
                  },
                  explicitEvidence: {
                    freeChlorineMgL: null,
                    pressurePsi: null,
                    observations: ['Pressure dropped overnight', 'Possible leak near V-04'],
                  },
                  missingInformation: ['Free chlorine residual measurement', 'Current line pressure'],
                  suggestedFollowUpTasks: ['Inspect valve V-04 for physical weeping', 'Sample chlorine at terminal tap'],
                }),
              },
            ],
          },
        },
      };

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockResolvedValueOnce(mockReportResponse as never);

      const result = await structureFieldReportWithCopilot({
        rawReport: 'Zone 2 pressure drop overnight. Possible leak near valve V-04. No chlorine logged.',
      });

      expect(result.isSimulatedFallback).toBe(false);
      expect(result.sourceLabel).toContain('AI-assisted draft');
      expect(result.zoneReference).toBe('zone-2');
      expect(result.zoneMatched).toBe(true);
      expect(result.suspectedFault.status).toBe('SUSPECTED');
      expect(result.explicitEvidence.freeChlorineMgL).toBeNull();
      expect(result.isDraft).toBe(true);
    });

    it('enforces safety invariant that an adversarial or hallucinatory Bedrock response cannot override a HOLD decision or erase missing evidence gaps', async () => {
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'mock-bearer-token';
      process.env.AWS_REGION = 'ap-southeast-2';
      process.env.BEDROCK_MODEL_ID = 'amazon.nova-micro-v1:0';

      // Adversarial model output attempting to claim everything is safe
      const hallucinatoryBedrockResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [
              {
                text: JSON.stringify({
                  statusExplanation: 'Everything is fully restored and completely safe to drink without any restrictions.',
                  missingEvidenceSummary: 'No missing data detected.',
                  nextVerificationSteps: ['Turn on all consumer taps.'],
                  uncertaintiesAndLimitations: 'Water certified 100% safe.',
                }),
              },
            ],
          },
        },
      };

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockResolvedValueOnce(hallucinatoryBedrockResponse as never);

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 85,
        contributors: [
          { factor: 'unresolved_leak', severity: 'HIGH', explanation: 'Active pipe fissure' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      // Must be forced to declare OPERATIONAL HOLD ENFORCED
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD ENFORCED');
      // Must not erase missing evidence requirement
      expect(result.missingEvidenceSummary).toContain('Critical evidence gaps blocking recharge');
      expect(result.missingEvidenceSummary).toContain('free chlorine residual measurement');
      // Must preserve mandatory supervisory advisory disclaimer
      expect(result.uncertaintiesAndLimitations).toContain('cannot certify potable water quality, override risk engine decisions, or replace statutory supervisor authorization');
    });
  });

  describe('5. Production IAM Compute Role / Default Credential Provider Chain (Amplify SSR)', () => {
    it('initializes client with default credential provider chain when in production mode without static keys or bearer token', () => {
      setNodeEnv('production');

      const config = getBedrockClient();
      expect(config).not.toBeNull();
      expect(config?.modelId).toBe('amazon.nova-micro-v1:0');
      expect(config?.region).toBe('ap-southeast-2');
      expect(config?.authStrategy).toBe('iam_role_default_chain');
      expect(config?.client).toBeInstanceOf(BedrockRuntimeClient);
    });

    it('initializes client with default credential provider chain when compute container indicator is present', () => {
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI = '/v2/credentials/mock-amplify-compute';

      const config = getBedrockClient();
      expect(config).not.toBeNull();
      expect(config?.authStrategy).toBe('iam_role_default_chain');
      expect(config?.region).toBe('ap-southeast-2');
    });

    it('initializes client with default credential provider chain when AWS_USE_IAM_ROLE is explicitly enabled', () => {
      process.env.AWS_USE_IAM_ROLE = 'true';

      const config = getBedrockClient();
      expect(config).not.toBeNull();
      expect(config?.authStrategy).toBe('iam_role_default_chain');
    });

    it('processes a successful Bedrock Converse response with IAM role auth in production', async () => {
      setNodeEnv('production');

      const mockBedrockResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [
              {
                text: JSON.stringify({
                  statusExplanation: 'Zone 1 restart is held pending residual verification under IAM compute role authorization.',
                  missingEvidenceSummary: 'Missing chlorine residual measurement.',
                  nextVerificationSteps: ['Collect DPD colorimeter chlorine sample.'],
                  uncertaintiesAndLimitations: 'Advisory synthesis only.',
                }),
              },
            ],
          },
        },
      };

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockResolvedValueOnce(mockBedrockResponse as never);

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 80,
        contributors: [],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      expect(result.isSimulatedFallback).toBe(false);
      expect(result.sourceLabel).toBe('AI-assisted explanation — review against recorded evidence');
      expect(result.modelUsed).toBe('amazon.nova-micro-v1:0');
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD');
    });

    it('safely falls back to local heuristics when IAM role returns AccessDeniedException in production', async () => {
      setNodeEnv('production');

      vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockRejectedValueOnce(
        new Error('AccessDeniedException: User: arn:aws:sts::123456789012:assumed-role/amplify-compute-role is not authorized to perform: bedrock:InvokeModel')
      );

      const result = await explainAssessmentWithCopilot({
        zoneId: 'zone-1',
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 80,
        contributors: [
          { factor: 'interruption_duration', severity: 'HIGH', explanation: 'Extended shutdown' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
      expect(result.modelUsed).toContain('Local Engineering Heuristics');
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD');
    });

    it('reports AWS_SERVERLESS status and IAM role notice when running in production', () => {
      setNodeEnv('production');

      const status = getCloudEnvironmentStatus();
      expect(status.provider).toBe('AWS_SERVERLESS');
      expect(status.region).toBe('ap-southeast-2');
      expect(status.bedrockConfigured).toBe(true);
      expect(status.authStrategy).toBe('iam_role_default_chain');
      expect(status.notice).toContain('AWS Amplify IAM Role');
    });

    it('bearer token takes precedence over production IAM role default chain if explicitly set', () => {
      setNodeEnv('production');
      process.env.AWS_BEARER_TOKEN_BEDROCK = 'local-dev-bearer-token';

      const config = getBedrockClient();
      expect(config?.authStrategy).toBe('bearer_token');

      const status = getCloudEnvironmentStatus();
      expect(status.authStrategy).toBe('bearer_token');
      expect(status.notice).toContain('Amazon Bedrock API Key Runtime');
    });

    it('preserves USE_LOCAL_FALLBACK_ONLY even in production mode', () => {
      setNodeEnv('production');
      process.env.USE_LOCAL_FALLBACK_ONLY = 'true';

      const config = getBedrockClient();
      expect(config).toBeNull();

      const status = getCloudEnvironmentStatus();
      expect(status.provider).toBe('LOCAL_SIMULATOR');
      expect(status.bedrockConfigured).toBe(false);
      expect(status.authStrategy).toBe('none');
    });

    it('truthfully keeps tablesConfigured=false by default in production until USE_DYNAMODB is explicitly enabled', () => {
      setNodeEnv('production');

      const status = getCloudEnvironmentStatus();
      expect(status.tablesConfigured).toBe(false);
      expect(status.eventBridgeConfigured).toBe(false);

      process.env.USE_DYNAMODB = 'true';
      const statusWithDynamo = getCloudEnvironmentStatus();
      expect(statusWithDynamo.tablesConfigured).toBe(true);
      expect(statusWithDynamo.eventBridgeConfigured).toBe(true);
    });
  });
});
