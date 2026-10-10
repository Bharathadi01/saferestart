import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  explainAssessmentWithCopilot,
  structureFieldReportWithCopilot,
} from '../src/lib/copilot';
import { explainDecisionWithBedrock } from '../src/lib/aws-client';

describe('AWS Integration Verification Suite — Amazon Bedrock & Fallback Guardrails', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('1. Uncredentialed / Offline Mode (Current State)', () => {
    it('accurately identifies absent AWS credentials and defaults to deterministic local fallback', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

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
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const result = await explainDecisionWithBedrock({
        zoneName: 'Central Business District',
        action: 'HOLD',
        riskScore: 85,
        contributors: [
          { factor: 'unresolved_leak', severity: 'HIGH', explanation: 'Active collar crack' },
        ],
        missingEvidence: ['free_chlorine_residual_measurement'],
      });

      // The explanation must reflect the authoritative HOLD decision
      expect(result.explanation).toContain('OPERATIONAL HOLD');
      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toContain('Amazon Bedrock was not called');
    });
  });

  describe('2. Live / Configured AWS Bedrock Handling (Simulated SDK Responses)', () => {
    it('processes a successful Bedrock Converse response, setting isSimulatedFallback to false', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-mock-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-mock-secret';
      process.env.AWS_REGION = 'us-east-1';
      process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

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

      // Live response must be identified as real Bedrock integration
      expect(result.isSimulatedFallback).toBe(false);
      expect(result.sourceLabel).toBe('AI-assisted explanation — review against recorded evidence');
      expect(result.modelUsed).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
      expect(result.nextVerificationSteps.length).toBe(2);
      expect(result.nextVerificationSteps[0]).toContain('terminal hydrant scour flush');
    });

    it('safely falls back to local heuristics when Bedrock returns AccessDeniedException or network error', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-mock-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-mock-secret';
      process.env.AWS_REGION = 'us-east-1';

      // Simulate AWS IAM AccessDeniedException
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

      // Even with an AWS failure, application does NOT crash; falls back gracefully
      expect(result.isSimulatedFallback).toBe(true);
      expect(result.sourceLabel).toBe('Local explanation — Amazon Bedrock was not called');
      expect(result.modelUsed).toContain('Local Engineering Heuristics');
      expect(result.statusExplanation).toContain('OPERATIONAL HOLD');
    });

    it('structures field reports with live Bedrock response and preserves uncertainty', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-mock-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-mock-secret';
      process.env.AWS_REGION = 'us-east-1';
      process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

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
  });
});
