import {
  ZoneOperationalState,
  RestartEvent,
  AuditEvent,
  VerificationSubmission,
  SupervisorDecision,
} from '@/types';
import { DEMO_THRESHOLDS } from './constants';

export interface TransitionRequest {
  targetState: ZoneOperationalState;
  actor: string;
  actorRole: AuditEvent['actorRole'];
  reason: string;
  evidenceReference?: string;
  verificationData?: Partial<VerificationSubmission>;
  supervisorDecision?: Partial<SupervisorDecision>;
}

export interface TransitionResult {
  success: boolean;
  event: RestartEvent;
  auditRecord?: AuditEvent;
  error?: string;
}

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<ZoneOperationalState, ZoneOperationalState[]> = {
  NORMAL: ['INTERRUPTED'],
  INTERRUPTED: ['RESTART_REQUESTED'],
  RESTART_REQUESTED: ['ASSESSMENT_REQUIRED', 'HOLD'],
  ASSESSMENT_REQUIRED: ['HOLD', 'MITIGATION_REQUIRED', 'VERIFICATION_REQUIRED'],
  HOLD: ['MITIGATION_REQUIRED', 'VERIFICATION_REQUIRED', 'INTERRUPTED'],
  MITIGATION_REQUIRED: ['VERIFICATION_REQUIRED', 'HOLD'],
  VERIFICATION_REQUIRED: ['AWAITING_APPROVAL', 'HOLD'],
  AWAITING_APPROVAL: ['RESTORED', 'HOLD'],
  RESTORED: ['NORMAL', 'INTERRUPTED'],
};

/**
 * Validates whether a state transition is legal according to strict operational rules.
 */
export function validateTransition(
  currentEvent: RestartEvent,
  request: TransitionRequest
): { allowed: boolean; reason?: string } {
  const { state: currentState } = currentEvent;
  const { targetState, actorRole, verificationData, supervisorDecision } = request;

  // 1. Check if transition path is defined in DAG
  const allowedTargets = ALLOWED_TRANSITIONS[currentState];
  if (!allowedTargets || !allowedTargets.includes(targetState)) {
    return {
      allowed: false,
      reason: `Illegal state transition from ${currentState} to ${targetState}. Valid transitions are: ${allowedTargets?.join(', ') || 'none'}.`,
    };
  }

  // 2. Specific guard: VERIFICATION_REQUIRED -> AWAITING_APPROVAL
  if (currentState === 'VERIFICATION_REQUIRED' && targetState === 'AWAITING_APPROVAL') {
    // Must have verification submission
    const submission = verificationData || currentEvent.verificationSubmission;
    if (!submission) {
      return {
        allowed: false,
        reason: 'Cannot transition to AWAITING_APPROVAL: Verification submission data is missing.',
      };
    }

    if (!submission.flushingCompleted) {
      return {
        allowed: false,
        reason: 'Flushing procedure must be recorded as completed before submitting for approval.',
      };
    }

    if (
      submission.freeChlorineMgL === undefined ||
      submission.freeChlorineMgL < DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L
    ) {
      return {
        allowed: false,
        reason: `Field chlorine measurement (${submission.freeChlorineMgL ?? 'null'} mg/L) does not meet minimum safety threshold (${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L).`,
      };
    }

    if (
      submission.observedPressurePsi === undefined ||
      submission.observedPressurePsi < DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI
    ) {
      return {
        allowed: false,
        reason: `Field observed pressure (${submission.observedPressurePsi ?? 'null'} psi) is below minimum service threshold (${DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI} psi).`,
      };
    }
  }

  // 3. Specific guard: AWAITING_APPROVAL -> RESTORED
  if (currentState === 'AWAITING_APPROVAL' && targetState === 'RESTORED') {
    // Only authorized SUPERVISOR or CHIEF_WATER_ENGINEER can sign off
    const authorizedRoles: AuditEvent['actorRole'][] = ['SUPERVISOR', 'CHIEF_WATER_ENGINEER'];
    if (!authorizedRoles.includes(actorRole)) {
      return {
        allowed: false,
        reason: `Role '${actorRole}' is not authorized to approve service restoration. Must be SUPERVISOR or CHIEF_WATER_ENGINEER.`,
      };
    }

    const decision = supervisorDecision || currentEvent.supervisorDecision;
    if (!decision || decision.decision !== 'APPROVE') {
      return {
        allowed: false,
        reason: 'Restoration approval requires an explicit positive supervisor sign-off.',
      };
    }

    if (!decision.complianceChecksVerified) {
      return {
        allowed: false,
        reason: 'Supervisor must confirm that all compliance checklists were manually verified.',
      };
    }

    // Must not have outstanding missing evidence
    if (currentEvent.riskEvaluation.missingEvidence.length > 0) {
      return {
        allowed: false,
        reason: `Outstanding missing evidence (${currentEvent.riskEvaluation.missingEvidence.join(', ')}) blocks service restoration.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Executes state transition, updates event timestamps, and generates tamper-resistant audit entry.
 */
export function transitionRestartEvent(
  currentEvent: RestartEvent,
  request: TransitionRequest
): TransitionResult {
  const validation = validateTransition(currentEvent, request);

  if (!validation.allowed) {
    return {
      success: false,
      event: currentEvent,
      error: validation.reason,
    };
  }

  const now = new Date().toISOString();
  const previousState = currentEvent.state;
  const auditId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Create audit event
  const auditRecord: AuditEvent = {
    id: auditId,
    eventId: currentEvent.id,
    zoneId: currentEvent.zoneId,
    timestamp: now,
    actor: request.actor,
    actorRole: request.actorRole,
    action: `TRANSITION_${previousState}_TO_${request.targetState}`,
    previousState,
    newState: request.targetState,
    decisionReason: request.reason,
    evidenceReference: request.evidenceReference,
  };

  // Build updated event
  const updatedEvent: RestartEvent = {
    ...currentEvent,
    state: request.targetState,
    updatedAt: now,
    auditTrailIds: [...currentEvent.auditTrailIds, auditId],
  };

  if (request.verificationData) {
    updatedEvent.verificationSubmission = {
      eventId: currentEvent.id,
      submittedBy: request.actor,
      role: request.actorRole as 'FIELD_TECHNICIAN' | 'WATER_QUALITY_SPECIALIST',
      timestamp: now,
      freeChlorineMgL: request.verificationData.freeChlorineMgL ?? 0,
      turbidityNtu: request.verificationData.turbidityNtu ?? 0,
      observedPressurePsi: request.verificationData.observedPressurePsi ?? 0,
      flushingCompleted: request.verificationData.flushingCompleted ?? false,
      leakInspectedAndSecured: request.verificationData.leakInspectedAndSecured ?? false,
      photoProofAttached: request.verificationData.photoProofAttached ?? false,
      notes: request.verificationData.notes ?? '',
    };
  }

  if (request.supervisorDecision) {
    updatedEvent.supervisorDecision = {
      eventId: currentEvent.id,
      supervisorName: request.actor,
      supervisorRole: request.actorRole as 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER',
      decision: request.supervisorDecision.decision ?? 'APPROVE',
      rationale: request.reason,
      timestamp: now,
      complianceChecksVerified: request.supervisorDecision.complianceChecksVerified ?? false,
    };
  }

  return {
    success: true,
    event: updatedEvent,
    auditRecord,
  };
}
