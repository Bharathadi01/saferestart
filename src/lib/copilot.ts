import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  ConfirmedFieldReport,
  InvestigationHypothesis,
  IncidentIntelligenceBrief,
  TelemetryReading,
  RiskEvaluation,
  SeededIncident,
  FieldTask,
} from '@/types';

export interface IncidentBriefInput {
  eventId: string;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  interruptionDurationHours: number;
  minimumObservedPressurePsi: number;
  currentTelemetry: TelemetryReading;
  riskEvaluation: RiskEvaluation;
  incidents: SeededIncident[];
  fieldTasks: FieldTask[];
  fieldReports?: ConfirmedFieldReport[];
}

export interface InvestigationInput {
  eventId: string;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  interruptionDurationHours: number;
  minimumObservedPressurePsi: number;
  currentTelemetry: TelemetryReading;
  incidents: SeededIncident[];
  fieldReports?: ConfirmedFieldReport[];
}

export interface CopilotAssessmentInput {
  zoneId: string;
  zoneName: string;
  action: 'HOLD' | 'PROCEED';
  riskScore: number;
  contributors: Array<{ factor: string; severity: string; explanation: string }>;
  missingEvidence: string[];
}

export interface CopilotAssessmentOutput {
  statusExplanation: string;
  missingEvidenceSummary: string;
  nextVerificationSteps: string[];
  uncertaintiesAndLimitations: string;
  modelUsed: string;
  isSimulatedFallback: boolean;
  sourceLabel: string;
  rawResponseTimestamp: string;
}

export interface CopilotFieldReportInput {
  rawReport: string;
  knownZoneIds?: string[];
}

export interface CopilotStructuredReportOutput {
  zoneReference: string | null;
  zoneMatched: boolean;
  reportedEvent: string;
  suspectedFault: {
    description: string;
    status: 'SUSPECTED' | 'CONFIRMED' | 'NONE';
    location?: string;
  };
  explicitEvidence: {
    freeChlorineMgL: number | null;
    pressurePsi: number | null;
    observations: string[];
  };
  missingInformation: string[];
  suggestedFollowUpTasks: string[];
  isDraft: true;
  requiresOperatorConfirmation: true;
  modelUsed: string;
  isSimulatedFallback: boolean;
  sourceLabel: string;
  extractedAt: string;
}

const KNOWN_ZONES = ['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5'];
const ZONE_NAME_MAP: Record<string, string> = {
  'zone-1': 'Zone 1: Central Business & Historic District',
  'zone-2': 'Zone 2: North Ridge High-Elevation Sector',
  'zone-3': 'Zone 3: East Industrial & Harbor Sector',
  'zone-4': 'Zone 4: Valley Park Residential District',
  'zone-5': 'Zone 5: West Hills Peripheral Sector',
};

/**
 * Sanitizes user input against prompt injection and excessive token payloads
 */
function sanitizeInput(text: string, maxLength = 1000): string {
  if (!text) return '';
  return text
    .slice(0, maxLength)
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // remove control chars
    .trim();
}

export type BedrockAuthStrategy = 'bearer_token' | 'iam_static_keys' | 'iam_role_default_chain';

export interface BedrockClientConfig {
  client: BedrockRuntimeClient;
  modelId: string;
  region: string;
  authStrategy: BedrockAuthStrategy;
}

/**
 * Retrieves Bedrock Client using 3-tier authentication:
 * Tier 1: Local development bearer token (AWS_BEARER_TOKEN_BEDROCK or BEDROCK_API_KEY) via httpBearerAuth
 * Tier 2: Explicit IAM credentials (AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY) via SigV4
 * Tier 3: Production IAM Compute Role / Default Credential Provider Chain (Amplify SSR, Lambda, ECS) via SigV4
 * Tier 4: Returns null for uncredentialed local offline mode (graceful deterministic fallback)
 */
export function getBedrockClient(): BedrockClientConfig | null {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.BEDROCK_API_KEY;
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID.trim().length > 0;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_SECRET_ACCESS_KEY.trim().length > 0;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0';

  // Explicit opt-out for local testing/offline isolation
  if (process.env.USE_LOCAL_FALLBACK_ONLY === 'true') {
    return null;
  }

  // Tier 1: Bedrock Bearer Token (Local / short-term API key)
  if (bearerToken && bearerToken.trim().length > 0) {
    try {
      const client = new BedrockRuntimeClient({
        region,
        token: { token: bearerToken.trim() },
        authSchemePreference: ['httpBearerAuth'],
      });
      return { client, modelId, region, authStrategy: 'bearer_token' };
    } catch {
      return null;
    }
  }

  // Tier 2: Explicit IAM Static Keys
  if (hasAccessKey && hasSecretKey) {
    try {
      const client = new BedrockRuntimeClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
          ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
        },
      });
      return { client, modelId, region, authStrategy: 'iam_static_keys' };
    } catch {
      return null;
    }
  }

  // Tier 3: Production IAM Compute Role / Default Credential Provider Chain
  // Activated in production environments (e.g. AWS Amplify Hosting SSR), or when AWS compute role / container / execution environment variables are present,
  // or explicitly enabled via AWS_USE_IAM_ROLE / AWS_AUTH_STRATEGY.
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

  if (isAwsComputeEnvironment || isProduction) {
    try {
      const client = new BedrockRuntimeClient({
        region,
      });
      return { client, modelId, region, authStrategy: 'iam_role_default_chain' };
    } catch {
      return null;
    }
  }

  // Tier 4: Uncredentialed local development
  return null;
}

/**
 * Capability A: Explain an assessment using Amazon Bedrock or deterministic local fallback
 */
export async function explainAssessmentWithCopilot(
  input: CopilotAssessmentInput
): Promise<CopilotAssessmentOutput> {
  const now = new Date().toISOString();
  const bedrockConfig = getBedrockClient();

  // 1. Try Amazon Bedrock if configured
  if (bedrockConfig) {
    try {
      const { client, modelId } = bedrockConfig;
      const prompt = `You are the SafeRestart Evidence Copilot for water utilities.
Analyze this deterministic risk assessment:
- Zone: "${input.zoneName}" (${input.zoneId})
- Deterministic Decision: ${input.action} (Risk Score: ${input.riskScore}/100)
- Contributing Factors: ${JSON.stringify(input.contributors)}
- Missing Evidence Items: ${JSON.stringify(input.missingEvidence)}

Generate a strictly valid JSON response with keys:
"statusExplanation": concise explanation of why the zone is in this state,
"missingEvidenceSummary": summary of data gaps blocking progress,
"nextVerificationSteps": array of 2-3 specific field tasks,
"uncertaintiesAndLimitations": statement of limitations (emphasizing decision support, not water certification).
Do NOT include markdown formatting or extra text outside JSON.`;

      const command = new ConverseCommand({
        modelId,
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        system: [{ text: 'Respond only with pure JSON matching the requested schema. Never authorize drinking water release or override a HOLD decision.' }],
        inferenceConfig: { maxTokens: 400, temperature: 0.1 },
      });

      // 8 second timeout
      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Bedrock timeout (8000ms)')), 8000)),
      ]);

      const rawText = response.output?.message?.content?.[0]?.text;
      if (rawText) {
        let parsed: Record<string, any> = {};
        try {
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { statusExplanation: rawText.trim() };
        }

        let statusExplanation = parsed.statusExplanation || `Assessment completed for ${input.zoneName} with action: ${input.action}.`;
        // Safety Guardrail: If deterministic engine issued a HOLD, the AI explanation must never override or obscure it
        if (input.action === 'HOLD' && !statusExplanation.toUpperCase().includes('HOLD') && !statusExplanation.toLowerCase().includes('do not restart')) {
          statusExplanation = `[OPERATIONAL HOLD ENFORCED] ${statusExplanation}`;
        }

        let missingEvidenceSummary = parsed.missingEvidenceSummary || (input.missingEvidence.length > 0 ? `Pending verifications: ${input.missingEvidence.join(', ')}.` : 'No critical evidence gaps.');
        // Safety Guardrail: Missing evidence items must never be dropped, obscured, or falsely claimed to be absent
        const allItemsMentioned = input.missingEvidence.every((m: string) =>
          missingEvidenceSummary.toLowerCase().includes(m.replace(/_/g, ' ').toLowerCase())
        );
        if (input.missingEvidence.length > 0 && (!allItemsMentioned || missingEvidenceSummary.toLowerCase().includes('no missing') || missingEvidenceSummary.toLowerCase().includes('no issues'))) {
          missingEvidenceSummary = `Critical evidence gaps blocking recharge: ${input.missingEvidence.map((m: string) => m.replace(/_/g, ' ')).join(', ')}. ${missingEvidenceSummary}`;
        }

        const uncertaintiesAndLimitations =
          'Notice: SafeRestart Evidence Copilot provides advisory decision support only. It cannot certify potable water quality, override risk engine decisions, or replace statutory supervisor authorization.';

        return {
          statusExplanation,
          missingEvidenceSummary,
          nextVerificationSteps: Array.isArray(parsed.nextVerificationSteps) && parsed.nextVerificationSteps.length > 0 ? parsed.nextVerificationSteps : ['Verify terminal chlorine residual.'],
          uncertaintiesAndLimitations,
          modelUsed: modelId,
          isSimulatedFallback: false,
          sourceLabel: 'AI-assisted explanation — review against recorded evidence',
          rawResponseTimestamp: now,
        };
      }
    } catch {
      // Fall through to deterministic local fallback
    }
  }

  // 2. Deterministic Local Fallback (Honest & Transparent)
  const isHold = input.action === 'HOLD';
  const factors = input.contributors.map((c) => `[${c.severity}] ${c.explanation}`).join(' ');
  const missingText = input.missingEvidence.length > 0
    ? `The assessment is currently blocked by ${input.missingEvidence.length} missing evidence item(s): ${input.missingEvidence.map((m) => m.replace(/_/g, ' ')).join(', ')}.`
    : 'All baseline evidence completeness requirements have been satisfied.';

  const steps: string[] = [];
  if (input.contributors.some((c) => c.factor === 'interruption_duration' && c.severity !== 'LOW')) {
    steps.push('Execute a 15-minute high-velocity scouring flush at the farthest terminal hydrant to purge stagnant boundary layer.');
  }
  if (input.contributors.some((c) => c.factor === 'unresolved_leak' && c.severity !== 'LOW')) {
    steps.push('Dispatch field crew to inspect repair sleeve and verify zero leakage on damaged distribution main prior to pressure ramp.');
  }
  if (input.missingEvidence.includes('free_chlorine_residual_measurement') || input.contributors.some((c) => c.factor === 'chlorine_residual' && c.severity !== 'LOW')) {
    steps.push('Collect sample at terminal distribution tap using a calibrated DPD colorimeter (Minimum Target: >= 0.20 mg/L free chlorine).');
  }
  if (steps.length === 0 || input.action === 'PROCEED') {
    steps.push('Gradually step-up inlet control valve while monitoring acoustic transducers for pressure surge transients.');
  }

  return {
    statusExplanation: `SafeRestart Deterministic Rationale (${isHold ? 'OPERATIONAL HOLD' : 'CONDITIONAL RECHARGE AUTHORIZED'}): For zone "${input.zoneName}", the rules engine scored ${input.riskScore}/100. Primary factors: ${factors}`,
    missingEvidenceSummary: missingText,
    nextVerificationSteps: steps,
    uncertaintiesAndLimitations: 'Notice: This summary is generated by SafeRestart for operational decision support and does not replace statutory drinking-water compliance testing or authorized supervisor sign-off.',
    modelUsed: 'Local Engineering Heuristics Engine (Offline Mode)',
    isSimulatedFallback: true,
    sourceLabel: 'Local explanation — Amazon Bedrock was not called',
    rawResponseTimestamp: now,
  };
}

/**
 * Capability B: Structure an unstructured field report
 */
export async function structureFieldReportWithCopilot(
  input: CopilotFieldReportInput
): Promise<CopilotStructuredReportOutput> {
  const sanitized = sanitizeInput(input.rawReport);
  const now = new Date().toISOString();
  const knownZones = input.knownZoneIds || KNOWN_ZONES;
  const bedrockConfig = getBedrockClient();

  // 1. Try Amazon Bedrock if configured
  if (bedrockConfig && sanitized.length > 5) {
    try {
      const { client, modelId } = bedrockConfig;
      const prompt = `You are the SafeRestart Evidence Copilot for municipal drinking-water network operations.
An operator or technician provided this unstructured field note:
"""${sanitized}"""

Known valid zone IDs: ${JSON.stringify(knownZones)}

Extract a structured representation. You MUST preserve uncertainty:
- A reported leak is SUSPECTED, not confirmed, unless explicitly repaired.
- An unreported chlorine reading is NULL, not zero.
- Extract zoneReference if mentioned (e.g. "Zone 2" -> "zone-2"). If uncertain or unknown, return null.

Return pure JSON matching:
{
  "zoneReference": string or null,
  "reportedEvent": string,
  "suspectedFault": { "description": string, "status": "SUSPECTED" | "CONFIRMED" | "NONE", "location": string or null },
  "explicitEvidence": { "freeChlorineMgL": number or null, "pressurePsi": number or null, "observations": string[] },
  "missingInformation": string[],
  "suggestedFollowUpTasks": string[]
}`;

      const command = new ConverseCommand({
        modelId,
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        system: [{ text: 'Respond only with pure JSON. Never alter workflow state or certify water safety.' }],
        inferenceConfig: { maxTokens: 450, temperature: 0.1 },
      });

      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Bedrock timeout (8000ms)')), 8000)),
      ]);

      const rawText = response.output?.message?.content?.[0]?.text;
      if (rawText) {
        let parsed: Record<string, any> = {};
        try {
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { reportedEvent: rawText.trim() };
        }

        const matchedZone = parsed.zoneReference && knownZones.includes(parsed.zoneReference)
          ? parsed.zoneReference
          : null;

        return {
          zoneReference: matchedZone,
          zoneMatched: matchedZone !== null,
          reportedEvent: parsed.reportedEvent || 'Field observation reported',
          suspectedFault: {
            description: parsed.suspectedFault?.description || 'None noted',
            status: parsed.suspectedFault?.status === 'CONFIRMED' ? 'CONFIRMED' : parsed.suspectedFault?.description ? 'SUSPECTED' : 'NONE',
            location: parsed.suspectedFault?.location || undefined,
          },
          explicitEvidence: {
            freeChlorineMgL: typeof parsed.explicitEvidence?.freeChlorineMgL === 'number' ? parsed.explicitEvidence.freeChlorineMgL : null,
            pressurePsi: typeof parsed.explicitEvidence?.pressurePsi === 'number' ? parsed.explicitEvidence.pressurePsi : null,
            observations: Array.isArray(parsed.explicitEvidence?.observations) ? parsed.explicitEvidence.observations : [],
          },
          missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : ['Current free chlorine residual', 'Terminal flush status'],
          suggestedFollowUpTasks: Array.isArray(parsed.suggestedFollowUpTasks) ? parsed.suggestedFollowUpTasks : ['Verify physical parameters in field'],
          isDraft: true,
          requiresOperatorConfirmation: true,
          modelUsed: modelId,
          isSimulatedFallback: false,
          sourceLabel: 'AI-assisted draft — review against physical evidence',
          extractedAt: now,
        };
      }
    } catch {
      // Fall through to deterministic local rule-based extractor
    }
  }

  // 2. Deterministic Local Pattern Extractor (Offline Mode)
  // Extract zone
  let matchedZone: string | null = null;
  const zoneMatch = sanitized.match(/zone[\s-_]?([1-5])/i);
  if (zoneMatch) {
    const candidate = `zone-${zoneMatch[1]}`;
    if (knownZones.includes(candidate)) {
      matchedZone = candidate;
    }
  }

  // Extract pressure
  let extractedPressure: number | null = null;
  const pressureMatch = sanitized.match(/(\d+(?:\.\d+)?)\s*(?:psi|bars?)/i);
  if (pressureMatch) {
    extractedPressure = parseFloat(pressureMatch[1]);
  }

  // Extract chlorine
  let extractedChlorine: number | null = null;
  const chlorineMatch = sanitized.match(/(?:chlorine|residual)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mg\/l|ppm)?/i);
  if (chlorineMatch) {
    extractedChlorine = parseFloat(chlorineMatch[1]);
  }

  // Extract suspected fault (preserve uncertainty)
  const hasLeak = /leak|fracture|pipe break|collar|bubbling water|surfacing water|washout/i.test(sanitized);
  const locationMatch = sanitized.match(/near\s+(?:valve\s+)?([A-Za-z0-9-_]+)/i);

  // Missing info check
  const missing: string[] = [];
  if (extractedChlorine === null) {
    missing.push('Free chlorine residual measurement');
  }
  if (!/flush/i.test(sanitized)) {
    missing.push('Hydrant scour flushing documentation');
  }
  if (extractedPressure === null && !/pressure/i.test(sanitized)) {
    missing.push('Observed gauge pressure reading');
  }

  // Suggested follow-up tasks
  const tasks: string[] = [];
  if (hasLeak) {
    tasks.push(`Dispatch repair crew to inspect suspected pipe defect ${locationMatch ? `near ${locationMatch[1]}` : 'in reported sector'}.`);
  }
  if (extractedChlorine === null) {
    tasks.push('Collect DPD colorimeter chlorine sample at terminal hydrant sampling tap.');
  }
  tasks.push('Conduct 15-minute scouring flush to eliminate stagnant water.');

  return {
    zoneReference: matchedZone,
    zoneMatched: matchedZone !== null,
    reportedEvent: sanitized.length > 0 ? (sanitized.length > 80 ? `${sanitized.slice(0, 77)}...` : sanitized) : 'Unspecified operational observation',
    suspectedFault: {
      description: hasLeak ? 'Suspected pipe leak or structural defect' : 'No explicit pipe defect reported',
      status: hasLeak ? 'SUSPECTED' : 'NONE',
      location: locationMatch ? locationMatch[1] : undefined,
    },
    explicitEvidence: {
      freeChlorineMgL: extractedChlorine,
      pressurePsi: extractedPressure,
      observations: [
        ...(hasLeak ? ['Technician reported physical leak symptoms'] : []),
        ...(extractedPressure !== null ? [`Observed gauge pressure recorded: ${extractedPressure} psi`] : []),
        ...(extractedChlorine !== null ? [`Free chlorine residual noted: ${extractedChlorine} mg/L`] : []),
      ],
    },
    missingInformation: missing,
    suggestedFollowUpTasks: tasks,
    isDraft: true,
    requiresOperatorConfirmation: true,
    modelUsed: 'Local Heuristics Pattern Extractor (Offline Mode)',
    isSimulatedFallback: true,
    sourceLabel: 'Local explanation — Amazon Bedrock was not called',
    extractedAt: now,
  };
}

/**
 * Capability A & F: Generate a concise, grounded Incident Intelligence Brief
 * Consumes real telemetry, topology, deterministic evaluation, field tasks, and confirmed field reports.
 */
export async function generateIncidentBrief(
  input: IncidentBriefInput
): Promise<IncidentIntelligenceBrief> {
  const now = new Date().toISOString();
  const bedrockConfig = getBedrockClient();

  // 1. Try Amazon Bedrock if configured
  if (bedrockConfig) {
    try {
      const { client, modelId } = bedrockConfig;
      const prompt = `You are the SafeRestart Incident Intelligence Copilot for municipal drinking-water network operations.
Generate a concise, factual incident intelligence brief based on these ACTUAL recorded parameters:
- Distribution Zone: "${input.zoneName}" (${input.zoneCode})
- Interruption Duration: ${input.interruptionDurationHours.toFixed(1)} hours
- Minimum Observed Pressure: ${input.minimumObservedPressurePsi.toFixed(1)} psi (Depressurization limit: 15.0 psi)
- Current Telemetry: Pressure ${input.currentTelemetry.pressurePsi.toFixed(1)} psi, Flow ${input.currentTelemetry.flowLps.toFixed(1)} L/s, Free Chlorine: ${input.currentTelemetry.chlorineMgL !== undefined ? `${input.currentTelemetry.chlorineMgL} mg/L` : 'UNRECORDED (NULL)'}, Turbidity: ${input.currentTelemetry.turbidityNtu ?? 'N/A'} NTU, Data Stale: ${input.currentTelemetry.isStale ? 'YES' : 'NO'}
- Active Reported Incidents: ${JSON.stringify(input.incidents.map((i) => ({ id: i.id, type: i.type, desc: i.description, severity: i.severity })))}
- Deterministic Safety Decision: ${input.riskEvaluation.action} (Risk Score: ${input.riskEvaluation.score}/100, Level: ${input.riskEvaluation.level})
- Safety Contributors: ${JSON.stringify(input.riskEvaluation.contributors.map((c) => ({ factor: c.factor, severity: c.severity, text: c.explanation })))}
- Missing Evidence Required: ${JSON.stringify(input.riskEvaluation.missingEvidence)}
- Completed Field Tasks: ${input.fieldTasks.filter((t) => t.status === 'COMPLETED').length}/${input.fieldTasks.length} (${JSON.stringify(input.fieldTasks.map((t) => ({ title: t.title, status: t.status })))})
- Confirmed Field Reports: ${JSON.stringify((input.fieldReports || []).map((r) => ({ by: r.reportedBy, fault: r.suspectedFault, explicit: r.explicitEvidence })))}

CRITICAL GROUNDING RULES:
1. Ground every statement strictly in the provided records. Never invent measurements or unobserved events.
2. Strictly separate verified observations from unconfirmed assumptions.
3. Identify missing or contradictory evidence (e.g., pressure loss without chlorine residual confirmation).
4. Outline investigation needs and outstanding actions.
5. Highlight what the supervisor must review before any authorization.
6. Return pure JSON matching this schema:
{
  "incidentSummary": string (1-2 sentences summarizing the actual situation),
  "timeline": string (chronological summary based on actual duration and events),
  "verifiedObservations": string[] (facts confirmed by sensors or verified technicians),
  "suspectedUnconfirmedCauses": string[] (potential issues reported or suspected but not physically verified),
  "supportingEvidenceMap": { [key: string]: string } (e.g. "Negative Pressure": "Transducer dropped to 3.8 psi (<15 psi floor)"),
  "missingOrContradictoryEvidence": string[] (data gaps or discrepancies),
  "investigationNeeds": string[] (physical areas/assets needing inspection),
  "outstandingActions": string[] (uncompleted tasks),
  "supervisorReviewFocus": string[] (specific criteria the supervisor must inspect)
}`;

      const command = new ConverseCommand({
        modelId,
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        system: [{ text: 'Respond only with pure JSON matching the requested schema. Never alter workflow state or certify water safety.' }],
        inferenceConfig: { maxTokens: 600, temperature: 0.1 },
      });

      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Bedrock timeout (8000ms)')), 8000)),
      ]);

      const rawText = response.output?.message?.content?.[0]?.text;
      if (rawText) {
        let parsed: Record<string, any> = {};
        try {
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { incidentSummary: rawText.trim() };
        }

        return {
          incidentSummary: parsed.incidentSummary || `Operational assessment for ${input.zoneName}: ${input.riskEvaluation.action} enforced.`,
          timeline: parsed.timeline || `Outage active for ${input.interruptionDurationHours.toFixed(1)} hours.`,
          verifiedObservations: Array.isArray(parsed.verifiedObservations) && parsed.verifiedObservations.length > 0
            ? parsed.verifiedObservations
            : [`Pressure reached minimum ${input.minimumObservedPressurePsi.toFixed(1)} psi.`],
          suspectedUnconfirmedCauses: Array.isArray(parsed.suspectedUnconfirmedCauses) ? parsed.suspectedUnconfirmedCauses : [],
          supportingEvidenceMap: typeof parsed.supportingEvidenceMap === 'object' && parsed.supportingEvidenceMap !== null ? parsed.supportingEvidenceMap : {},
          missingOrContradictoryEvidence: Array.isArray(parsed.missingOrContradictoryEvidence) ? parsed.missingOrContradictoryEvidence : input.riskEvaluation.missingEvidence,
          investigationNeeds: Array.isArray(parsed.investigationNeeds) ? parsed.investigationNeeds : ['Inspect terminal sampling hydrant.'],
          outstandingActions: Array.isArray(parsed.outstandingActions) ? parsed.outstandingActions : ['Complete pending field tasks.'],
          supervisorReviewFocus: Array.isArray(parsed.supervisorReviewFocus) ? parsed.supervisorReviewFocus : ['Verify statutory disinfection residual.'],
          sourceLabel: 'AI-assisted incident brief — review against recorded evidence',
          modelUsed: modelId,
          generatedAt: now,
        };
      }
    } catch {
      // Fall through to deterministic local fallback
    }
  }

  // 2. Deterministic Local Fallback (Honest & Grounded in Real Data)
  const isHold = input.riskEvaluation.action === 'HOLD';
  const verifiedObs: string[] = [
    `Minimum observed network pressure: ${input.minimumObservedPressurePsi.toFixed(1)} psi (${input.minimumObservedPressurePsi <= 15 ? 'Back-siphonage ingress hazard active (<15.0 psi floor)' : 'Maintained above back-siphonage floor'})`,
    `Current telemetry: Pressure ${input.currentTelemetry.pressurePsi.toFixed(1)} psi, Flow ${input.currentTelemetry.flowLps.toFixed(1)} L/s`,
    input.currentTelemetry.chlorineMgL !== undefined
      ? `Recorded chlorine residual: ${input.currentTelemetry.chlorineMgL.toFixed(2)} mg/L (${input.currentTelemetry.chlorineMgL >= 0.20 ? 'Satisfies minimum floor' : 'Depleted below 0.20 mg/L minimum'})`
      : 'Free chlorine residual unverified on file (NULL)',
    `${input.fieldTasks.filter((t) => t.status === 'COMPLETED').length} of ${input.fieldTasks.length} field tasks recorded as completed`,
  ];

  const suspectedCauses: string[] = [];
  input.incidents.forEach((inc) => {
    if (!inc.isResolved) {
      suspectedCauses.push(`Active infrastructure breach: ${inc.description} (${inc.type}, Severity: ${inc.severity})`);
    }
  });
  (input.fieldReports || []).forEach((r) => {
    if (r.suspectedFault.status === 'SUSPECTED') {
      suspectedCauses.push(`Technician note: ${r.suspectedFault.description} ${r.suspectedFault.location ? `near ${r.suspectedFault.location}` : ''}`);
    }
  });
  if (suspectedCauses.length === 0 && input.minimumObservedPressurePsi <= 15) {
    suspectedCauses.push('Low-pressure aspiration through aged pipe joints or undetected lateral leaks');
  }

  const supportingMap: Record<string, string> = {
    'Depressurization Floor': `Transducers observed ${input.minimumObservedPressurePsi.toFixed(1)} psi (Ingress hazard <= 15.0 psi)`,
    'Stagnation Window': `Duration ${input.interruptionDurationHours.toFixed(1)} hrs (${input.interruptionDurationHours >= 4.0 ? 'Exceeds safe 4.0 hr limit' : 'Within baseline'})`,
    'Disinfection Barrier': input.currentTelemetry.chlorineMgL !== undefined ? `${input.currentTelemetry.chlorineMgL.toFixed(2)} mg/L` : 'Missing / unmeasured',
    'Rules Engine Decision': `${input.riskEvaluation.action} (Risk Score: ${input.riskEvaluation.score}/100, Level: ${input.riskEvaluation.level})`,
  };

  const missingOrContradictory: string[] = [];
  if (input.riskEvaluation.missingEvidence.length > 0) {
    input.riskEvaluation.missingEvidence.forEach((m) => {
      missingOrContradictory.push(`Missing mandatory evidence: ${m.replace(/_/g, ' ')}`);
    });
  }
  if (input.currentTelemetry.isStale) {
    missingOrContradictory.push('Telemetry reading is stale (>30 minutes old); live hydraulic state unconfirmed.');
  }

  const investigationNeeds: string[] = [
    'Inspect terminal sampling hydrant and scour drainage point.',
    'Verify repair collar and joint tightness on any reported leak segments.',
    'Test residual chlorine with calibrated DPD colorimeter after 15-minute scour flush.',
  ];

  const outstandingActions = input.fieldTasks
    .filter((t) => t.status !== 'COMPLETED')
    .map((t) => `${t.title} [${t.status}] - Assigned to ${t.assignedRole}`);

  const supervisorFocus: string[] = [
    'Confirm free chlorine residual >= 0.20 mg/L verified at terminal point.',
    'Confirm positive gauge pressure >= 20.0 psi maintained before valve opening.',
    'Review field photos and technician sign-offs before statutory authorization.',
  ];

  return {
    incidentSummary: `Water-supply interruption on ${input.zoneName} (${input.zoneCode}) active for ${input.interruptionDurationHours.toFixed(1)} hrs. Deterministic safety engine enforces ${isHold ? 'OPERATIONAL HOLD' : 'CONDITIONAL RECHARGE AUTHORIZED'} (Score: ${input.riskEvaluation.score}/100).`,
    timeline: `Supply depressurized to ${input.minimumObservedPressurePsi.toFixed(1)} psi; ${input.interruptionDurationHours.toFixed(1)} hours elapsed under unpressurized/stagnant conditions.`,
    verifiedObservations: verifiedObs,
    suspectedUnconfirmedCauses: suspectedCauses,
    supportingEvidenceMap: supportingMap,
    missingOrContradictoryEvidence: missingOrContradictory,
    investigationNeeds,
    outstandingActions: outstandingActions.length > 0 ? outstandingActions : ['All dispatched field tasks completed.'],
    supervisorReviewFocus: supervisorFocus,
    sourceLabel: 'Local incident brief — Amazon Bedrock was not called',
    modelUsed: 'Local Engineering Heuristics Engine (Offline Mode)',
    generatedAt: now,
  };
}

/**
 * Capability B: Root-Cause Investigation Assistant
 * Formulates plausible hypotheses, supporting vs contradicting evidence, and verification steps.
 */
export async function investigateIncidentCauses(
  input: InvestigationInput
): Promise<{
  hypotheses: InvestigationHypothesis[];
  standardProcedures: string[];
  sourceLabel: string;
  modelUsed: string;
}> {
  const bedrockConfig = getBedrockClient();

  // 1. Try Amazon Bedrock if configured
  if (bedrockConfig) {
    try {
      const { client, modelId } = bedrockConfig;
      const prompt = `You are the SafeRestart Root-Cause Investigation Assistant for municipal drinking-water networks.
Analyze potential physical causes of this water-supply interruption using real data:
- Zone: "${input.zoneName}" (${input.zoneCode})
- Interruption Duration: ${input.interruptionDurationHours.toFixed(1)} hours
- Minimum Observed Pressure: ${input.minimumObservedPressurePsi.toFixed(1)} psi
- Telemetry: Pressure ${input.currentTelemetry.pressurePsi.toFixed(1)} psi, Flow ${input.currentTelemetry.flowLps.toFixed(1)} L/s, Chlorine: ${input.currentTelemetry.chlorineMgL ?? 'NULL'} mg/L
- Active Incidents: ${JSON.stringify(input.incidents.map((i) => ({ type: i.type, desc: i.description })))}
- Field Reports: ${JSON.stringify((input.fieldReports || []).map((r) => ({ fault: r.suspectedFault, explicit: r.explicitEvidence })))}

Generate 2 to 3 plausible physical hypotheses (e.g., Sub-atmospheric ingress, pipe fracture, disinfectant depletion, PRV throttling).
For each hypothesis:
- title: clear hypothesis name
- likelihood: "HIGH" | "MEDIUM" | "LOW"
- description: concise physical mechanism
- supportingEvidence: string[] (actual data points supporting it)
- contradictingEvidence: string[] (data points against it or ["None observed"])
- missingInformation: string[] (what data is needed to confirm or reject)
- suggestedVerificationSteps: string[] (actionable physical inspection steps)
- limitations: string (explicitly note this is an unconfirmed hypothesis until verified)

Output pure JSON matching this schema:
{
  "hypotheses": [
    {
      "id": string,
      "title": string,
      "likelihood": "HIGH" | "MEDIUM" | "LOW",
      "description": string,
      "supportingEvidence": string[],
      "contradictingEvidence": string[],
      "missingInformation": string[],
      "suggestedVerificationSteps": string[],
      "limitations": string
    }
  ],
  "standardProcedures": string[]
}`;

      const command = new ConverseCommand({
        modelId,
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        system: [{ text: 'Respond only with pure JSON. Never claim an unconfirmed hypothesis is a confirmed diagnosis.' }],
        inferenceConfig: { maxTokens: 700, temperature: 0.1 },
      });

      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Bedrock timeout (8000ms)')), 8000)),
      ]);

      const rawText = response.output?.message?.content?.[0]?.text;
      if (rawText) {
        let parsed: Record<string, any> = {};
        try {
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = {};
        }

        if (Array.isArray(parsed.hypotheses) && parsed.hypotheses.length > 0) {
          return {
            hypotheses: parsed.hypotheses,
            standardProcedures: Array.isArray(parsed.standardProcedures) ? parsed.standardProcedures : [
              'AWWA C651: Continuous disinfectant residual verification before valve restoration',
              'WHO Guidelines: Scour flush purging stagnant volume before consumer draw',
            ],
            sourceLabel: 'AI-assisted investigation — review against recorded evidence',
            modelUsed: modelId,
          };
        }
      }
    } catch {
      // Fall through to deterministic local fallback
    }
  }

  // 2. Deterministic Local Fallback (Hydraulic Engineering Models)
  const hypotheses: InvestigationHypothesis[] = [];

  // Hypothesis 1: Sub-Atmospheric Back-Siphonage Ingress
  if (input.minimumObservedPressurePsi <= 15) {
    hypotheses.push({
      id: 'HYP-INGRESS',
      title: 'Sub-Atmospheric External Contaminant Ingress (Back-Siphonage)',
      likelihood: 'HIGH',
      description: 'Severe depressurization below 15 psi created negative hydraulic gradients, aspirating shallow groundwater, soil bacteria, or proximate drainage through unsealed joints.',
      supportingEvidence: [
        `Transducer recorded minimum pressure of ${input.minimumObservedPressurePsi.toFixed(1)} psi (below 15.0 psi critical safety floor)`,
        `Supply unpressurized for ${input.interruptionDurationHours.toFixed(1)} hours in intermittent supply zone`,
      ],
      contradictingEvidence: ['None observed — physical pressure drop confirmed by SCADA log'],
      missingInformation: [
        'Post-recharge microbiological swab at terminal hydrant',
        'Visual soil dampness inspection along lateral pipeline trenches',
      ],
      suggestedVerificationSteps: [
        'Execute 15-minute terminal scour flushing until effluent clears (< 1.0 NTU)',
        'Collect DPD colorimeter sample to verify free chlorine >= 0.20 mg/L',
      ],
      limitations: 'Physical depressurization is verified, but actual microbial presence depends on soil condition and pipe wall integrity.',
    });
  }

  // Hypothesis 2: Physical Main Fracture or Collar Leak
  const activeLeak = input.incidents.find((i) => i.type === 'UNRESOLVED_LEAK');
  if (activeLeak) {
    hypotheses.push({
      id: 'HYP-LEAK',
      title: 'Structural Pipe Breach / Unsealed Collar Crack',
      likelihood: 'HIGH',
      description: `Reported physical defect on distribution main (${activeLeak.description}) provides an open conduit for external intrusion when internal pressure collapses.`,
      supportingEvidence: [
        `Active incident record: ${activeLeak.description}`,
        `Aged cast-iron or ductile iron section vulnerable to soil shifting during dry shutdown`,
      ],
      contradictingEvidence: ['None — active defect reported in incident log'],
      missingInformation: [
        'Physical verification of repair clamp sleeve tightness',
        'Post-repair static pressure hold test',
      ],
      suggestedVerificationSteps: [
        'Dispatch field technician to inspect excavation and verify zero leakage under line pressure',
        'Confirm sleeve clamp torque specification before line recharge',
      ],
      limitations: 'Reported collar crack is documented, but isolation completeness must be physically verified by field crew.',
    });
  }

  // Hypothesis 3: Stagnant Biofilm Shearing & Disinfectant Decay
  if (input.interruptionDurationHours >= 2.0) {
    hypotheses.push({
      id: 'HYP-STAGNATION',
      title: 'Disinfectant Residual Decay and Biofilm Sloughing',
      likelihood: input.interruptionDurationHours >= 4.0 ? 'HIGH' : 'MEDIUM',
      description: 'Prolonged stagnant shutdown causes free chlorine to decay exponentially through wall oxidation. Abrupt repressurization surges risk scouring biofilm and tuberculation.',
      supportingEvidence: [
        `Outage duration of ${input.interruptionDurationHours.toFixed(1)} hours exceeds baseline stability window`,
        input.currentTelemetry.chlorineMgL !== undefined && input.currentTelemetry.chlorineMgL < 0.20
          ? `Recorded free chlorine is depleted (${input.currentTelemetry.chlorineMgL.toFixed(2)} mg/L < 0.20 mg/L)`
          : 'Free chlorine residual currently unverified at terminal sampling point',
      ],
      contradictingEvidence: ['None observed'],
      missingInformation: [
        'Terminal tap DPD colorimeter chlorine reading',
        'Turbidity reading during initial flush cycle',
      ],
      suggestedVerificationSteps: [
        'Open terminal scour hydrant to discharge stagnant water slug',
        'Verify clear effluent with turbidity <= 1.0 NTU and free chlorine >= 0.20 mg/L',
      ],
      limitations: 'Biofilm sloughing severity depends on interior pipe lining material and valve opening ramp rate.',
    });
  }

  return {
    hypotheses,
    standardProcedures: [
      'AWWA Standard C651: Disinfection of Water Mains — Scour flushing, chlorine residual confirmation, and bacteriological clearance.',
      'WHO Guidelines for Drinking-water Quality: Chapter 4 — Water Safety Plans for intermittent distribution depressurization.',
      'SafeRestart Standard Operating Gate: Free chlorine >= 0.20 mg/L, Pressure >= 20.0 psi, Turbidity <= 1.0 NTU prior to supervisor authorization.',
    ],
    sourceLabel: 'Local investigation — Amazon Bedrock was not called',
    modelUsed: 'Local Engineering Heuristics Engine (Offline Mode)',
  };
}

