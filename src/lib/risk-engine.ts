import {
  RiskEvaluation,
  RiskContributor,
  TelemetryReading,
  SeededIncident,
  WaterZone,
} from '@/types';
import { DEMO_THRESHOLDS } from './constants';

export interface RiskEngineInput {
  interruptionDurationHours: number;
  minimumObservedPressurePsi: number;
  currentTelemetry: TelemetryReading;
  incidents: SeededIncident[];
  pipeVulnerabilityScore?: number; // 0 (low) to 1 (high), e.g., based on cast-iron age
  recentVerificationChlorine?: number; // from field verification if completed
  currentTimeIso?: string;
}

/**
 * Deterministic, Explainable Risk Evaluation Engine
 * Evaluates physical risk factors and evidence completeness for intermittent water restart.
 */
export function evaluateRestartRisk(input: RiskEngineInput): RiskEvaluation {
  const contributors: RiskContributor[] = [];
  const missingEvidence: string[] = [];
  let riskScore = 0; // Illustrative score 0-100

  // 1. Validate inputs
  if (
    isNaN(input.interruptionDurationHours) ||
    input.interruptionDurationHours < 0 ||
    isNaN(input.minimumObservedPressurePsi)
  ) {
    return {
      level: 'HIGH',
      action: 'HOLD',
      contributors: [
        {
          factor: 'interruption_duration',
          severity: 'HIGH',
          explanation: 'Invalid input parameters supplied to risk evaluation engine.',
        },
      ],
      missingEvidence: ['valid_operational_telemetry'],
      requiresVerification: true,
      score: 100,
      calculatedAt: new Date().toISOString(),
    };
  }

  // 2. Interruption Duration Risk
  if (input.interruptionDurationHours >= DEMO_THRESHOLDS.SEVERE_INTERRUPTION_HOURS) {
    contributors.push({
      factor: 'interruption_duration',
      severity: 'HIGH',
      explanation: `Prolonged supply interruption (${input.interruptionDurationHours.toFixed(1)} hrs) exceeds severe threshold (${DEMO_THRESHOLDS.SEVERE_INTERRUPTION_HOURS} hrs). Severe back-siphonage and biofilm detachment risk.`,
    });
    riskScore += 35;
  } else if (input.interruptionDurationHours >= DEMO_THRESHOLDS.MAX_SAFE_INTERRUPTION_HOURS) {
    contributors.push({
      factor: 'interruption_duration',
      severity: 'MEDIUM',
      explanation: `Interruption duration (${input.interruptionDurationHours.toFixed(1)} hrs) exceeds baseline threshold (${DEMO_THRESHOLDS.MAX_SAFE_INTERRUPTION_HOURS} hrs). Stagnation and low-pressure ingress possible.`,
    });
    riskScore += 20;
  } else {
    contributors.push({
      factor: 'interruption_duration',
      severity: 'LOW',
      explanation: `Interruption duration (${input.interruptionDurationHours.toFixed(1)} hrs) within nominal limits.`,
    });
    riskScore += 5;
  }

  // 3. Minimum Pressure / Depressurization Risk
  if (input.minimumObservedPressurePsi <= DEMO_THRESHOLDS.NEGATIVE_PRESSURE_RISK_PSI) {
    contributors.push({
      factor: 'min_pressure',
      severity: 'HIGH',
      explanation: `Critical depressurization observed (min ${input.minimumObservedPressurePsi.toFixed(1)} psi <= ${DEMO_THRESHOLDS.NEGATIVE_PRESSURE_RISK_PSI} psi). High likelihood of ground water or contaminant aspiration into distribution mains.`,
    });
    riskScore += 40;
  } else if (input.minimumObservedPressurePsi < DEMO_THRESHOLDS.CRITICAL_LOW_PRESSURE_PSI) {
    contributors.push({
      factor: 'min_pressure',
      severity: 'MEDIUM',
      explanation: `Low pressure recorded (${input.minimumObservedPressurePsi.toFixed(1)} psi < ${DEMO_THRESHOLDS.CRITICAL_LOW_PRESSURE_PSI} psi). Cross-connection vulnerability elevated.`,
    });
    riskScore += 20;
  } else {
    contributors.push({
      factor: 'min_pressure',
      severity: 'LOW',
      explanation: `Minimum observed pressure (${input.minimumObservedPressurePsi.toFixed(1)} psi) maintained above positive pressure floor.`,
    });
  }

  // 4. Telemetry Freshness & Stale Data Check
  const currentTimestamp = input.currentTimeIso ? new Date(input.currentTimeIso).getTime() : Date.now();
  const telemetryTimestamp = new Date(input.currentTelemetry.timestamp).getTime();
  const telemetryAgeMinutes = (currentTimestamp - telemetryTimestamp) / (1000 * 60);

  if (input.currentTelemetry.isStale || telemetryAgeMinutes > DEMO_THRESHOLDS.TELEMETRY_STALE_MINUTES) {
    contributors.push({
      factor: 'stale_telemetry',
      severity: 'HIGH',
      explanation: `Telemetry data is stale (${telemetryAgeMinutes > 0 ? telemetryAgeMinutes.toFixed(0) : 'unknown'} minutes old > threshold ${DEMO_THRESHOLDS.TELEMETRY_STALE_MINUTES} min). Live hydraulic conditions cannot be confirmed.`,
    });
    missingEvidence.push('fresh_scada_telemetry');
    riskScore += 25;
  }

  // 5. Unresolved Leaks and Infrastructure Incidents
  const activeUnresolvedLeaks = input.incidents.filter((inc) => !inc.isResolved && inc.type === 'UNRESOLVED_LEAK');
  if (activeUnresolvedLeaks.length > 0) {
    contributors.push({
      factor: 'unresolved_leak',
      severity: 'HIGH',
      explanation: `${activeUnresolvedLeaks.length} unresolved physical pipe leak(s) active in this zone. Direct pathway for external ingress upon depressurization.`,
    });
    missingEvidence.push('leak_isolation_and_repair_verification');
    riskScore += 30;
  }

  // 6. Chlorine Residual Evaluation
  const effectiveChlorine =
    input.recentVerificationChlorine !== undefined
      ? input.recentVerificationChlorine
      : input.currentTelemetry.chlorineMgL;

  if (effectiveChlorine === undefined || effectiveChlorine === null) {
    contributors.push({
      factor: 'chlorine_residual',
      severity: 'HIGH',
      explanation: 'No chlorine residual measurement recorded. Disinfection barrier cannot be confirmed.',
    });
    missingEvidence.push('free_chlorine_residual_measurement');
    riskScore += 30;
  } else if (effectiveChlorine < DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L) {
    contributors.push({
      factor: 'chlorine_residual',
      severity: 'HIGH',
      explanation: `Free chlorine residual (${effectiveChlorine.toFixed(2)} mg/L) is below demonstration safety threshold (${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L). Disinfection residual depleted.`,
    });
    missingEvidence.push('post_flush_free_chlorine_verification');
    riskScore += 30;
  } else if (effectiveChlorine < DEMO_THRESHOLDS.OPTIMAL_FREE_CHLORINE_MG_L) {
    contributors.push({
      factor: 'chlorine_residual',
      severity: 'MEDIUM',
      explanation: `Free chlorine residual (${effectiveChlorine.toFixed(2)} mg/L) is marginally acceptable but below optimal target (${DEMO_THRESHOLDS.OPTIMAL_FREE_CHLORINE_MG_L} mg/L).`,
    });
    riskScore += 10;
  } else {
    contributors.push({
      factor: 'chlorine_residual',
      severity: 'LOW',
      explanation: `Adequate free chlorine residual present (${effectiveChlorine.toFixed(2)} mg/L >= ${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L).`,
    });
  }

  // 7. Pipe Vulnerability (e.g. unlined cast iron or old mains)
  if (input.pipeVulnerabilityScore && input.pipeVulnerabilityScore > 0.6) {
    contributors.push({
      factor: 'pipe_vulnerability',
      severity: 'MEDIUM',
      explanation: 'High concentration of aged cast-iron unlined pipes increases tuberculation and biofilm sloughing risk during recharge surges.',
    });
    riskScore += 10;
  }

  // 8. Determine Action and Risk Level
  // Cap risk score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, riskScore));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (normalizedScore >= 50 || contributors.some((c) => c.severity === 'HIGH')) {
    level = 'HIGH';
  } else if (normalizedScore >= 25 || contributors.some((c) => c.severity === 'MEDIUM')) {
    level = 'MEDIUM';
  }

  // Mandatory Safety Rule: Any HIGH contributor OR any missing evidence triggers a HOLD!
  // Missing evidence must NEVER be interpreted as passing.
  const hasHighSeverity = contributors.some((c) => c.severity === 'HIGH');
  const action: 'PROCEED' | 'HOLD' = hasHighSeverity || missingEvidence.length > 0 ? 'HOLD' : 'PROCEED';
  const requiresVerification = action === 'HOLD' || missingEvidence.length > 0 || level !== 'LOW';

  return {
    level,
    action,
    contributors,
    missingEvidence,
    requiresVerification,
    score: normalizedScore,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to compute evidence completeness percentage (0 to 100%)
 */
export function calculateEvidenceCompleteness(
  hasFreshTelemetry: boolean,
  hasChlorineMeasurement: boolean,
  hasLeakResolution: boolean,
  hasHydrantFlushingRecord: boolean,
  hasTurbidityMeasurement: boolean
): number {
  const items = [
    hasFreshTelemetry,
    hasChlorineMeasurement,
    hasLeakResolution,
    hasHydrantFlushingRecord,
    hasTurbidityMeasurement,
  ];
  const completed = items.filter(Boolean).length;
  return Math.round((completed / items.length) * 100);
}
