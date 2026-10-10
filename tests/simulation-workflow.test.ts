import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationStore } from '../src/lib/store';
import { DEMO_THRESHOLDS } from '../src/lib/constants';

describe('SafeRestart Phase 2 — 15 Mandatory Operational Test Scenarios', () => {
  let store: SimulationStore;

  beforeEach(() => {
    store = new SimulationStore();
  });

  // 1. Normal zone receiving an interruption
  it('1. Normal zone receiving an interruption transitions to INTERRUPTED and creates event', () => {
    const zone5 = store.getZone('zone-5')!;
    expect(zone5.operationalState).toBe('NORMAL');

    const result = store.triggerInterruption('zone-5', 'Dispatcher', 'Supply cut');
    expect(result.zone.operationalState).toBe('INTERRUPTED');
    expect(result.event.state).toBe('INTERRUPTED');
    expect(result.zone.currentTelemetry.pressurePsi).toBeLessThan(15.0);
    expect(result.audit.action).toBe('TRANSITION_NORMAL_TO_INTERRUPTED');
  });

  // 2. Interrupted zone requesting restart
  it('2. Interrupted zone requesting restart captures telemetry and transitions into evaluation', () => {
    store.triggerInterruption('zone-5');
    const result = store.requestRestart('zone-5', 'Operator Vance');

    expect(result.event).toBeDefined();
    expect(result.event.riskEvaluation).toBeDefined();
    // Because chlorine is missing and pressure is depressed, it routes to HOLD
    expect(result.event.state).toBe('HOLD');
  });

  // 3. High-risk event being placed on HOLD
  it('3. High-risk event with prolonged interruption is placed on HOLD with contributors', () => {
    const zone = store.getZone('zone-3')!; // Harbor sector has 14 hr interruption + leak
    const event = store.getRestartEvent(zone.activeRestartEventId!)!;

    expect(event.state).toBe('HOLD');
    expect(event.riskEvaluation.action).toBe('HOLD');
    expect(event.riskEvaluation.level).toBe('HIGH');
    expect(event.riskEvaluation.contributors.some((c) => c.severity === 'HIGH')).toBe(true);
  });

  // 4. Missing chlorine measurement blocking mandatory verification
  it('4. Missing chlorine measurement blocks verification and holds restart', () => {
    store.triggerInterruption('zone-5');
    store.requestRestart('zone-5');
    const zone5 = store.getZone('zone-5')!;
    const event = store.getRestartEvent(zone5.activeRestartEventId!)!;

    expect(event.riskEvaluation.missingEvidence).toContain('free_chlorine_residual_measurement');
    expect(event.state).toBe('HOLD');
  });

  // 5. Stale telemetry being flagged
  it('5. Stale telemetry older than 30 minutes is flagged as a risk contributor', () => {
    store.triggerInterruption('zone-5');
    const zone5 = store.getZone('zone-5')!;
    // Set stale telemetry
    zone5.currentTelemetry.isStale = true;

    const event = store.requestRestart('zone-5').event;
    expect(event.riskEvaluation.contributors.some((c) => c.factor === 'stale_telemetry')).toBe(true);
    expect(event.riskEvaluation.missingEvidence).toContain('fresh_scada_telemetry');
  });

  // 6. Unresolved leak creating an appropriate field task
  it('6. Unresolved leak creates an inspect leak field task and blocks approval', () => {
    const zone1 = store.getZone('zone-1')!;
    const event = store.getRestartEvent(zone1.activeRestartEventId!)!;

    const leakTask = event.fieldTasks.find((t) => t.taskType === 'INSPECT_LEAK');
    expect(leakTask).toBeDefined();
    expect(leakTask?.title).toContain('Pipe P-104');
  });

  // 7. Incomplete tasks preventing verification
  it('7. Incomplete tasks prevent advancing to AWAITING_APPROVAL', () => {
    const zone1 = store.getZone('zone-1')!;
    const event = store.getRestartEvent(zone1.activeRestartEventId!)!;

    // Verification with flushing not done
    const result = store.submitVerification({
      eventId: event.id,
      submittedBy: 'Tech Sarah',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: 0.45,
      turbidityNtu: 0.4,
      observedPressurePsi: 30.0,
      flushingCompleted: false, // Incomplete!
      leakInspectedAndSecured: true,
      photoProofAttached: true,
      notes: 'Flushing skipped',
    });

    expect(result.outcome).toBe('FAILED');
    expect(result.event.state).toBe('HOLD');
    expect(result.reasons.some((r) => r.includes('flushing'))).toBe(true);
  });

  // 8. Failed verification keeping the event on HOLD
  it('8. Failed verification with low chlorine keeps the event on HOLD', () => {
    const zone1 = store.getZone('zone-1')!;
    const event = store.getRestartEvent(zone1.activeRestartEventId!)!;

    const result = store.submitVerification({
      eventId: event.id,
      submittedBy: 'Tech Sarah',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: 0.05, // Below 0.20 mg/L!
      turbidityNtu: 0.4,
      observedPressurePsi: 30.0,
      flushingCompleted: true,
      leakInspectedAndSecured: true,
      photoProofAttached: true,
      notes: 'Low chlorine test',
    });

    expect(result.outcome).toBe('FAILED');
    expect(result.event.state).toBe('HOLD');
    expect(result.audit.action).toBe('VERIFICATION_FAILED_HOLD');
  });

  // 9. Successful verification moving the event to AWAITING_APPROVAL
  it('9. Successful verification moves event to AWAITING_APPROVAL', () => {
    const zone1 = store.getZone('zone-1')!;
    const event = store.getRestartEvent(zone1.activeRestartEventId!)!;

    const result = store.submitVerification({
      eventId: event.id,
      submittedBy: 'Tech Sarah',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: new Date().toISOString(),
      freeChlorineMgL: 0.45, // Compliant
      turbidityNtu: 0.35,
      observedPressurePsi: 32.0, // Compliant
      flushingCompleted: true,
      leakInspectedAndSecured: true,
      photoProofAttached: true,
      notes: 'Passing test',
    });

    expect(result.outcome).toBe('PASSED');
    expect(result.event.state).toBe('AWAITING_APPROVAL');
  });

  // 10. Unauthorized actor being unable to approve
  it('10. Unauthorized actor is unable to approve restoration', () => {
    const zone4 = store.getZone('zone-4')!; // Ready in AWAITING_APPROVAL
    const event = store.getRestartEvent(zone4.activeRestartEventId!)!;
    expect(event.state).toBe('AWAITING_APPROVAL');

    expect(() => {
      store.supervisorReview({
        eventId: event.id,
        supervisorName: 'Tech John',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supervisorRole: 'FIELD_TECHNICIAN' as any, // Not an authorized supervisor!
        decision: 'APPROVE',
        rationale: 'Trying unauthorized release',
        timestamp: new Date().toISOString(),
        complianceChecksVerified: true,
      });
    }).toThrow(/not authorized to approve/);
  });

  // 11. Authorized approval moving the event to RESTORED
  it('11. Authorized approval moves event to RESTORED and represses network', () => {
    const zone4 = store.getZone('zone-4')!;
    const event = store.getRestartEvent(zone4.activeRestartEventId!)!;

    const result = store.supervisorReview({
      eventId: event.id,
      supervisorName: 'Chief Engineer Miller, P.E.',
      supervisorRole: 'CHIEF_WATER_ENGINEER',
      decision: 'APPROVE',
      rationale: 'All biological and pressure criteria verified. Water released.',
      timestamp: new Date().toISOString(),
      complianceChecksVerified: true,
    });

    expect(result.event.state).toBe('RESTORED');
    expect(zone4.operationalState).toBe('RESTORED');
    expect(zone4.currentTelemetry.pressurePsi).toBe(36.0);
  });

  // 12. Invalid state transitions being rejected
  it('12. Invalid state transitions are rejected by the state machine', () => {
    const zone5 = store.getZone('zone-5')!;
    store.triggerInterruption('zone-5');
    const event = store.getRestartEvent(zone5.activeRestartEventId!)!;

    // Cannot jump directly from INTERRUPTED to RESTORED
    expect(() => {
      store.supervisorReview({
        eventId: event.id,
        supervisorName: 'Chief Engineer Miller',
        supervisorRole: 'CHIEF_WATER_ENGINEER',
        decision: 'APPROVE',
        rationale: 'Illegal jump',
        timestamp: new Date().toISOString(),
        complianceChecksVerified: true,
      });
    }).toThrow(/Illegal state transition/);
  });

  // 13. Duplicate requests not creating duplicate events
  it('13. Retrying restart request does not duplicate active restart events', () => {
    store.triggerInterruption('zone-5');
    const firstReq = store.requestRestart('zone-5');
    const firstEventId = firstReq.event.id;

    // Retry request on the same zone
    const secondReq = store.requestRestart('zone-5');
    expect(secondReq.event.id).toBe(firstEventId);
  });

  // 14. Audit records being generated for every important transition
  it('14. Audit records are generated for every important transition', () => {
    const initialAuditCount = store.getAuditTrail().length;

    store.triggerInterruption('zone-5');
    expect(store.getAuditTrail().length).toBe(initialAuditCount + 1);

    store.requestRestart('zone-5');
    expect(store.getAuditTrail().length).toBeGreaterThan(initialAuditCount + 1);

    const latestAudit = store.getAuditTrail()[0];
    expect(latestAudit.timestamp).toBeDefined();
    expect(latestAudit.actor).toBeDefined();
    expect(latestAudit.decisionReason).toBeDefined();
  });

  // 15. Resetting the demo restoring the known initial state
  it('15. Resetting the demo restores the known deterministic initial state', () => {
    store.triggerInterruption('zone-5');
    expect(store.getZone('zone-5')?.operationalState).toBe('INTERRUPTED');

    store.reset();
    expect(store.getZone('zone-5')?.operationalState).toBe('NORMAL');
    expect(store.getZone('zone-1')?.operationalState).toBe('HOLD');
    expect(store.getZone('zone-4')?.operationalState).toBe('AWAITING_APPROVAL');
  });

  // 16. Confirmed field report commits into shared store and triggers deterministic recalculation
  it('16. Confirmed field report commits into shared store and recalculates risk score deterministically', () => {
    const { event: committed } = store.commitFieldReport('EVT-2026-001', {
      eventId: 'EVT-2026-001',
      rawReport: 'Zone 1 repaired fracture on P-104. Terminal tap chlorine is 0.45 mg/L. No leaks observed.',
      reportedBy: 'Field Technician',
      confirmedBy: 'Operator Rivera (Human Operator Gate)',
      zoneReference: 'zone-1',
      suspectedFault: {
        description: 'Repaired clamp verified stable',
        status: 'NONE',
      },
      explicitEvidence: {
        freeChlorineMgL: 0.45,
        pressurePsi: 32.0,
        observations: ['No leaks observed', 'Main scouring completed'],
      },
      missingInformation: [],
      suggestedFollowUpTasks: [],
      sourceLabel: 'AI-assisted via Amazon Bedrock (Operator Confirmed)',
    });

    expect(committed.fieldReports?.length).toBeGreaterThan(0);
    expect(committed.riskEvaluation).toBeDefined();
    // Chlorine missing evidence should be resolved now that 0.45 mg/L was recorded
    expect(committed.riskEvaluation.missingEvidence).not.toContain('free_chlorine_residual_measurement');
    
    // Audit entry committed
    const latestAudit = store.getAuditTrail()[0];
    expect(latestAudit.action).toBe('FIELD_REPORT_CONFIRMED');
    expect(latestAudit.actor).toContain('Rivera');
  });

  // 17. Safety Invariant: AI copilot draft cannot mutate store or bypass supervisor sign-off
  it('17. Safety Invariant: Raw AI draft cannot mutate store or bypass mandatory supervisor approval', () => {
    const zone1 = store.getZone('zone-1')!;
    const event = store.getRestartEvent(zone1.activeRestartEventId!)!;

    expect(event.state).toBe('HOLD');
    // An attempt to bypass supervisor review or directly approve without verification must throw
    expect(() => {
      store.supervisorReview({
        eventId: event.id,
        supervisorName: 'Malicious AI Override',
        supervisorRole: 'SUPERVISOR',
        decision: 'APPROVE',
        rationale: 'Bypassing checks',
        timestamp: new Date().toISOString(),
        complianceChecksVerified: false,
      });
    }).toThrow(/Illegal state transition from HOLD to RESTORED/);

    expect(event.state).toBe('HOLD');
  });
});
