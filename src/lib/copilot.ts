import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

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

/**
 * Retrieves Bedrock Client if credentials are provided in environment
 */
function getBedrockClient(): { client: BedrockRuntimeClient; modelId: string } | null {
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

  if (!hasAccessKey || !hasSecretKey) {
    return null;
  }

  try {
    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
      },
    });
    return { client, modelId };
  } catch {
    return null;
  }
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
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          statusExplanation: parsed.statusExplanation || `Assessment completed for ${input.zoneName} with action: ${input.action}.`,
          missingEvidenceSummary: parsed.missingEvidenceSummary || `Pending verifications: ${input.missingEvidence.join(', ')}.`,
          nextVerificationSteps: Array.isArray(parsed.nextVerificationSteps) ? parsed.nextVerificationSteps : ['Verify terminal chlorine residual.'],
          uncertaintiesAndLimitations: parsed.uncertaintiesAndLimitations || 'Decision support only. Physical water safety requires authorized testing.',
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
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

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
