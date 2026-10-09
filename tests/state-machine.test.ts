import { describe, it, expect } from 'vitest';
import { validateTransition, transitionRestartEvent } from '../src/lib/state-machine';
import { RestartEvent } from '../src/types';

describe('SafeRestart State Machine', () => {
  const mockEvent: RestartEvent = {
    id: 'EVT-TEST',
    zoneId: 'zone-1',
    state: 'INTERRUPTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interruptionStartedAt: new Date().toISOString(),
    interruptionDurationHours: 3.0,
    minimumObservedPressurePsi: 8.0,
    riskEvaluation: {
      level: 'HIGH',
      action: 'HOLD',
      contributors: [],
      missingEvidence: [],
      requiresVerification: true,
      score: 75,
      calculatedAt: new Date().toISOString(),
    },
    fieldTasks: [],
    auditTrailIds: [],
  };

  it('allows valid transition from INTERRUPTED to RESTART_REQUESTED', () => {
    const validation = validateTransition(mockEvent, {
      targetState: 'RESTART_REQUESTED',
      actor: 'Dispatcher',
      actorRole: 'SUPERVISOR',
      reason: 'Restart process initiated',
    });

    expect(validation.allowed).toBe(true);
  });

  it('rejects arbitrary invalid jumps such as INTERRUPTED directly to RESTORED', () => {
    const validation = validateTransition(mockEvent, {
      targetState: 'RESTORED',
      actor: 'Dispatcher',
      actorRole: 'SUPERVISOR',
      reason: 'Direct jump attempted',
    });

    expect(validation.allowed).toBe(false);
    expect(validation.reason).toContain('Illegal state transition');
  });

  it('blocks transition to AWAITING_APPROVAL if flushing is incomplete', () => {
    const verificationEvent: RestartEvent = {
      ...mockEvent,
      state: 'VERIFICATION_REQUIRED',
    };

    const result = transitionRestartEvent(verificationEvent, {
      targetState: 'AWAITING_APPROVAL',
      actor: 'Tech John',
      actorRole: 'FIELD_TECHNICIAN',
      reason: 'Tried submitting without flushing',
      verificationData: {
        flushingCompleted: false, // Incomplete!
        freeChlorineMgL: 0.35,
        observedPressurePsi: 28.0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Flushing procedure must be recorded');
  });

  it('blocks transition to AWAITING_APPROVAL if chlorine is below threshold', () => {
    const verificationEvent: RestartEvent = {
      ...mockEvent,
      state: 'VERIFICATION_REQUIRED',
    };

    const result = transitionRestartEvent(verificationEvent, {
      targetState: 'AWAITING_APPROVAL',
      actor: 'Tech John',
      actorRole: 'WATER_QUALITY_SPECIALIST',
      reason: 'Low chlorine test',
      verificationData: {
        flushingCompleted: true,
        freeChlorineMgL: 0.08, // Too low!
        observedPressurePsi: 30.0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not meet minimum safety threshold');
  });

  it('prevents non-supervisor roles from authorizing service restoration', () => {
    const awaitingApprovalEvent: RestartEvent = {
      ...mockEvent,
      state: 'AWAITING_APPROVAL',
      verificationSubmission: {
        eventId: 'EVT-TEST',
        submittedBy: 'Tech Sarah',
        role: 'WATER_QUALITY_SPECIALIST',
        timestamp: new Date().toISOString(),
        freeChlorineMgL: 0.45,
        turbidityNtu: 0.3,
        observedPressurePsi: 32.0,
        flushingCompleted: true,
        leakInspectedAndSecured: true,
        photoProofAttached: true,
        notes: 'Ready',
      },
    };

    const result = transitionRestartEvent(awaitingApprovalEvent, {
      targetState: 'RESTORED',
      actor: 'Tech John',
      actorRole: 'FIELD_TECHNICIAN', // Not supervisor!
      reason: 'Unauthorized field approval attempt',
      supervisorDecision: {
        complianceChecksVerified: true,
        decision: 'APPROVE',
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not authorized to approve service restoration');
  });

  it('successfully transitions to RESTORED with authorized supervisor and creates audit record', () => {
    const awaitingApprovalEvent: RestartEvent = {
      ...mockEvent,
      state: 'AWAITING_APPROVAL',
      verificationSubmission: {
        eventId: 'EVT-TEST',
        submittedBy: 'Tech Sarah',
        role: 'WATER_QUALITY_SPECIALIST',
        timestamp: new Date().toISOString(),
        freeChlorineMgL: 0.45,
        turbidityNtu: 0.3,
        observedPressurePsi: 32.0,
        flushingCompleted: true,
        leakInspectedAndSecured: true,
        photoProofAttached: true,
        notes: 'Ready',
      },
    };

    const result = transitionRestartEvent(awaitingApprovalEvent, {
      targetState: 'RESTORED',
      actor: 'Chief Engineer Miller',
      actorRole: 'CHIEF_WATER_ENGINEER',
      reason: 'All biological and pressure criteria verified. Water released to service.',
      supervisorDecision: {
        complianceChecksVerified: true,
        decision: 'APPROVE',
      },
    });

    expect(result.success).toBe(true);
    expect(result.event.state).toBe('RESTORED');
    expect(result.auditRecord).toBeDefined();
    expect(result.auditRecord?.action).toBe('TRANSITION_AWAITING_APPROVAL_TO_RESTORED');
    expect(result.auditRecord?.actor).toBe('Chief Engineer Miller');
    expect(result.event.auditTrailIds.length).toBe(1);
  });
});
