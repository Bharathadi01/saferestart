import { describe, it, expect } from 'vitest';
import { evaluateRestartRisk, calculateEvidenceCompleteness } from '../src/lib/risk-engine';
import { TelemetryReading, SeededIncident } from '../src/types';

describe('SafeRestart Risk Engine', () => {
  const baseTelemetry: TelemetryReading = {
    timestamp: new Date().toISOString(),
    pressurePsi: 30.0,
    flowLps: 20.0,
    chlorineMgL: 0.45,
    turbidityNtu: 0.4,
    isStale: false,
  };

  it('correctly evaluates a high-risk scenario with prolonged interruption and severe depressurization', () => {
    const input = {
      interruptionDurationHours: 15.0, // > 12 hr severe threshold
      minimumObservedPressurePsi: 2.0, // <= 5 psi negative ingress risk
      currentTelemetry: {
        ...baseTelemetry,
        chlorineMgL: 0.05,
      },
      incidents: [
        {
          id: 'INC-TEST',
          zoneId: 'z1',
          type: 'UNRESOLVED_LEAK' as const,
          severity: 'HIGH' as const,
          description: 'Pipe fracture',
          reportedAt: new Date().toISOString(),
          isResolved: false,
        },
      ],
    };

    const result = evaluateRestartRisk(input);

    expect(result.level).toBe('HIGH');
    expect(result.action).toBe('HOLD');
    expect(result.requiresVerification).toBe(true);
    expect(result.contributors.some((c) => c.factor === 'interruption_duration' && c.severity === 'HIGH')).toBe(true);
    expect(result.contributors.some((c) => c.factor === 'min_pressure' && c.severity === 'HIGH')).toBe(true);
    expect(result.contributors.some((c) => c.factor === 'unresolved_leak' && c.severity === 'HIGH')).toBe(true);
  });

  it('marks action as HOLD when mandatory chlorine evidence is missing', () => {
    const input = {
      interruptionDurationHours: 2.0,
      minimumObservedPressurePsi: 24.0,
      currentTelemetry: {
        ...baseTelemetry,
        chlorineMgL: undefined, // Missing chlorine!
      },
      incidents: [],
    };

    const result = evaluateRestartRisk(input);

    expect(result.action).toBe('HOLD');
    expect(result.missingEvidence).toContain('free_chlorine_residual_measurement');
    expect(result.contributors.some((c) => c.factor === 'chlorine_residual')).toBe(true);
  });

  it('flags stale telemetry data and holds restart', () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const input = {
      interruptionDurationHours: 1.5,
      minimumObservedPressurePsi: 28.0,
      currentTelemetry: {
        ...baseTelemetry,
        timestamp: fortyFiveMinutesAgo,
        isStale: true,
      },
      incidents: [],
    };

    const result = evaluateRestartRisk(input);

    expect(result.action).toBe('HOLD');
    expect(result.missingEvidence).toContain('fresh_scada_telemetry');
    expect(result.contributors.some((c) => c.factor === 'stale_telemetry' && c.severity === 'HIGH')).toBe(true);
  });

  it('allows PROCEED when nominal parameters and adequate verified chlorine exist', () => {
    const input = {
      interruptionDurationHours: 1.5,
      minimumObservedPressurePsi: 28.0,
      currentTelemetry: baseTelemetry,
      incidents: [],
      recentVerificationChlorine: 0.55,
    };

    const result = evaluateRestartRisk(input);

    expect(result.level).toBe('LOW');
    expect(result.action).toBe('PROCEED');
    expect(result.missingEvidence.length).toBe(0);
  });

  it('enforces HOLD when verified chlorine is below demonstration safety threshold (0.20 mg/L)', () => {
    const input = {
      interruptionDurationHours: 1.5,
      minimumObservedPressurePsi: 28.0,
      currentTelemetry: baseTelemetry,
      incidents: [],
      recentVerificationChlorine: 0.12, // Below 0.20 mg/L
    };

    const result = evaluateRestartRisk(input);

    expect(result.action).toBe('HOLD');
    expect(result.contributors.some((c) => c.factor === 'chlorine_residual' && c.severity === 'HIGH')).toBe(true);
  });

  it('safely flags invalid inputs without throwing', () => {
    const input = {
      interruptionDurationHours: -5,
      minimumObservedPressurePsi: NaN,
      currentTelemetry: baseTelemetry,
      incidents: [],
    };

    const result = evaluateRestartRisk(input);

    expect(result.action).toBe('HOLD');
    expect(result.score).toBe(100);
  });

  it('calculates evidence completeness percentage accurately', () => {
    expect(calculateEvidenceCompleteness(true, true, true, true, true)).toBe(100);
    expect(calculateEvidenceCompleteness(true, false, false, false, false)).toBe(20);
    expect(calculateEvidenceCompleteness(false, false, false, false, false)).toBe(0);
  });
});
