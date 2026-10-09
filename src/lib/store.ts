import {
  WaterZone,
  RestartEvent,
  AuditEvent,
  SimulationState,
  VerificationSubmission,
  SupervisorDecision,
  ZoneOperationalState,
  FieldTask,
  TelemetryReading,
} from '@/types';
import { createInitialZones } from './synthetic-data';
import { evaluateRestartRisk, calculateEvidenceCompleteness } from './risk-engine';
import { transitionRestartEvent } from './state-machine';
import { DEMO_THRESHOLDS } from './constants';

export class SimulationStore {
  private state: SimulationState;

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): SimulationState {
    const { zones, events, audits } = createInitialZones();
    return {
      currentSimulatedTime: new Date().toISOString(),
      isAutoAdvancing: false,
      zones,
      restartEvents: events,
      auditTrail: audits,
    };
  }

  public getState(): SimulationState {
    return this.state;
  }

  public reset(): SimulationState {
    this.state = this.getInitialState();
    return this.state;
  }

  public getZones(): WaterZone[] {
    return this.state.zones;
  }

  public getZone(id: string): WaterZone | undefined {
    return this.state.zones.find((z) => z.id === id);
  }

  public getRestartEvent(id: string): RestartEvent | undefined {
    return this.state.restartEvents[id];
  }

  public getRestartEvents(): RestartEvent[] {
    return Object.values(this.state.restartEvents);
  }

  public getAuditTrail(zoneId?: string, eventId?: string): AuditEvent[] {
    let logs = [...this.state.auditTrail];
    if (zoneId) {
      logs = logs.filter((l) => l.zoneId === zoneId);
    }
    if (eventId) {
      logs = logs.filter((l) => l.eventId === eventId);
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 1. Trigger supply interruption on a zone
   */
  public triggerInterruption(
    zoneId: string,
    actor = 'SCADA Telemetry Engine',
    reason = 'Main feeder depressurization detected below 15 psi threshold'
  ): { zone: WaterZone; event: RestartEvent; audit: AuditEvent } {
    const zone = this.getZone(zoneId);
    if (!zone) throw new Error(`Zone ${zoneId} not found`);

    const now = this.state.currentSimulatedTime || new Date().toISOString();
    const eventId = `EVT-2026-${Date.now().toString().slice(-4)}`;

    // Update zone operational state
    zone.operationalState = 'INTERRUPTED';
    const newReading: TelemetryReading = {
      timestamp: now,
      pressurePsi: 3.8,
      flowLps: 0.5,
      chlorineMgL: undefined, // Depleted / unverified
      turbidityNtu: 0.85,
      isStale: false,
    };
    zone.currentTelemetry = newReading;
    zone.telemetryHistory.push(newReading);
    zone.activeRestartEventId = eventId;
    zone.evidenceCompletenessPercent = 10;
    zone.lastUpdated = now;

    // Update network nodes to reflect physical depressurization
    zone.nodes.forEach((node) => {
      if (node.type === 'VALVE') {
        node.status = 'INTERRUPTED';
        if (node.metadata) node.metadata.valveState = 'CLOSED';
      } else if (node.type === 'JUNCTION' || node.type === 'HYDRANT') {
        node.status = 'HOLD';
        node.pressurePsi = 3.5;
      }
    });

    // Evaluate preliminary risk
    const risk = evaluateRestartRisk({
      interruptionDurationHours: 1.0,
      minimumObservedPressurePsi: 3.8,
      currentTelemetry: zone.currentTelemetry,
      incidents: zone.incidents,
      pipeVulnerabilityScore: 0.5,
      currentTimeIso: now,
    });

    // Generate physical field tasks tailored to this zone's actual conditions
    const fieldTasks: FieldTask[] = [];

    // Leak inspection task if unresolved leaks exist
    const unresolvedLeaks = zone.incidents.filter((i) => !i.isResolved && i.type === 'UNRESOLVED_LEAK');
    if (unresolvedLeaks.length > 0) {
      fieldTasks.push({
        id: `TSK-${Date.now()}-LEAK`,
        zoneId: zone.id,
        restartEventId: eventId,
        taskType: 'INSPECT_LEAK',
        title: `Inspect and secure physical leak (${unresolvedLeaks[0].id})`,
        description: `Verify pipe repair clamp on ${unresolvedLeaks[0].description}. Soil stability and isolation check required.`,
        status: 'PENDING',
        assignedRole: 'FIELD_TECHNICIAN',
      });
    }

    // Hydrant flushing task
    fieldTasks.push({
      id: `TSK-${Date.now()}-FLUSH`,
      zoneId: zone.id,
      restartEventId: eventId,
      taskType: 'FLUSH_HYDRANT',
      title: `Execute authorized scour flushing in ${zone.name}`,
      description: 'Scour flush terminal hydrant for minimum 15 minutes until turbidity clarifies (< 1.0 NTU).',
      status: 'PENDING',
      assignedRole: 'FIELD_TECHNICIAN',
    });

    // Free chlorine verification task
    fieldTasks.push({
      id: `TSK-${Date.now()}-CHLORINE`,
      zoneId: zone.id,
      restartEventId: eventId,
      taskType: 'MEASURE_CHLORINE',
      title: 'Measure free chlorine residual at terminal hydrant',
      description: 'Collect sample and measure free chlorine with DPD colorimeter. Mandatory: >= 0.20 mg/L.',
      status: 'PENDING',
      assignedRole: 'WATER_QUALITY_SPECIALIST',
    });

    // Interruption event
    const newEvent: RestartEvent = {
      id: eventId,
      zoneId: zone.id,
      state: 'INTERRUPTED',
      createdAt: now,
      updatedAt: now,
      interruptionStartedAt: now,
      interruptionDurationHours: 1.0,
      minimumObservedPressurePsi: 3.8,
      riskEvaluation: risk,
      fieldTasks,
      auditTrailIds: [],
    };

    // Audit record
    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const auditRecord: AuditEvent = {
      id: auditId,
      eventId,
      zoneId: zone.id,
      timestamp: now,
      actor,
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'TRANSITION_NORMAL_TO_INTERRUPTED',
      previousState: 'NORMAL',
      newState: 'INTERRUPTED',
      decisionReason: reason,
    };
    newEvent.auditTrailIds.push(auditId);

    this.state.restartEvents[eventId] = newEvent;
    this.state.auditTrail.unshift(auditRecord);

    return { zone, event: newEvent, audit: auditRecord };
  }

  /**
   * 2. Request restart for an interrupted zone
   */
  public requestRestart(
    zoneId: string,
    actor = 'Operator J. Vance'
  ): { event: RestartEvent; audit: AuditEvent } {
    const zone = this.getZone(zoneId);
    if (!zone) throw new Error(`Zone ${zoneId} not found`);

    if (!zone.activeRestartEventId) {
      // If no active event, create an interruption first
      this.triggerInterruption(zoneId, actor, 'Manual restart request on unmonitored zone');
    }

    const event = this.getRestartEvent(zone.activeRestartEventId!);
    if (!event) throw new Error('Active restart event not found');

    // Prevent duplicate restart events if retrying an already requested or evaluated event
    if (
      event.state === 'RESTART_REQUESTED' ||
      event.state === 'ASSESSMENT_REQUIRED' ||
      event.state === 'HOLD' ||
      event.state === 'VERIFICATION_REQUIRED' ||
      event.state === 'AWAITING_APPROVAL' ||
      event.state === 'RESTORED'
    ) {
      return { event, audit: this.state.auditTrail[0] };
    }

    // Step A: Transition to RESTART_REQUESTED
    const reqResult = transitionRestartEvent(event, {
      targetState: 'RESTART_REQUESTED',
      actor,
      actorRole: 'SUPERVISOR',
      reason: 'Field operator requested restart assessment. Evaluating evidence.',
    });
    if (!reqResult.success) throw new Error(reqResult.error);
    if (reqResult.auditRecord) this.state.auditTrail.unshift(reqResult.auditRecord);

    // Step B: Transition to ASSESSMENT_REQUIRED
    const assessResult = transitionRestartEvent(reqResult.event, {
      targetState: 'ASSESSMENT_REQUIRED',
      actor: 'Risk Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      reason: 'Gathering SCADA pressure curves and microbiological evidence.',
    });
    if (assessResult.auditRecord) this.state.auditTrail.unshift(assessResult.auditRecord);

    // Run risk engine
    const updatedRisk = evaluateRestartRisk({
      interruptionDurationHours: event.interruptionDurationHours,
      minimumObservedPressurePsi: event.minimumObservedPressurePsi,
      currentTelemetry: zone.currentTelemetry,
      incidents: zone.incidents,
      currentTimeIso: this.state.currentSimulatedTime,
    });
    assessResult.event.riskEvaluation = updatedRisk;

    // Step C: Route to HOLD or VERIFICATION_REQUIRED
    const nextTargetState: ZoneOperationalState =
      updatedRisk.action === 'HOLD' ? 'HOLD' : 'VERIFICATION_REQUIRED';

    const finalResult = transitionRestartEvent(assessResult.event, {
      targetState: nextTargetState,
      actor: 'Risk Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      reason:
        nextTargetState === 'HOLD'
          ? `Automatic HOLD enforced: ${updatedRisk.contributors.map((c) => c.explanation).join(' ')}`
          : 'Preliminary indicators nominal. Mandatory verification dispatched to field.',
    });

    this.state.restartEvents[event.id] = finalResult.event;
    zone.operationalState = finalResult.event.state;
    zone.lastUpdated = new Date().toISOString();

    if (finalResult.auditRecord) this.state.auditTrail.unshift(finalResult.auditRecord);

    return { event: finalResult.event, audit: finalResult.auditRecord! };
  }

  /**
   * 3. Update an individual field task (mark in progress, record measurements, attach photo)
   */
  public updateFieldTask(
    taskId: string,
    update: {
      status?: FieldTask['status'];
      measurementsRecorded?: FieldTask['measurementsRecorded'];
      fieldNotes?: string;
      photoUrl?: string;
      actor?: string;
    }
  ): { task: FieldTask; event: RestartEvent; audit: AuditEvent } {
    let targetEvent: RestartEvent | undefined;
    let targetTask: FieldTask | undefined;

    for (const evt of Object.values(this.state.restartEvents)) {
      const found = evt.fieldTasks.find((t) => t.id === taskId);
      if (found) {
        targetEvent = evt;
        targetTask = found;
        break;
      }
    }

    if (!targetEvent || !targetTask) {
      throw new Error(`Field task ${taskId} not found`);
    }

    const now = this.state.currentSimulatedTime || new Date().toISOString();

    if (update.status) targetTask.status = update.status;
    if (update.status === 'COMPLETED') targetTask.completedAt = now;
    if (update.measurementsRecorded) {
      targetTask.measurementsRecorded = {
        ...targetTask.measurementsRecorded,
        ...update.measurementsRecorded,
      };
    }
    if (update.fieldNotes !== undefined) targetTask.fieldNotes = update.fieldNotes;
    if (update.photoUrl !== undefined) targetTask.photoUrl = update.photoUrl;

    // Update evidence completeness for the zone
    const zone = this.getZone(targetEvent.zoneId);
    if (zone) {
      const completedCount = targetEvent.fieldTasks.filter((t) => t.status === 'COMPLETED').length;
      zone.evidenceCompletenessPercent = Math.round((completedCount / targetEvent.fieldTasks.length) * 100);
      zone.lastUpdated = now;
    }

    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const auditRecord: AuditEvent = {
      id: auditId,
      eventId: targetEvent.id,
      zoneId: targetEvent.zoneId,
      timestamp: now,
      actor: update.actor || 'Field Technician',
      actorRole: targetTask.assignedRole,
      action: `FIELD_TASK_${targetTask.status}_${targetTask.taskType}`,
      previousState: targetEvent.state,
      newState: targetEvent.state,
      decisionReason: `Field task '${targetTask.title}' marked ${targetTask.status}. ${update.fieldNotes || ''}`,
      evidenceReference: targetTask.id,
    };
    targetEvent.auditTrailIds.push(auditId);
    this.state.auditTrail.unshift(auditRecord);

    return { task: targetTask, event: targetEvent, audit: auditRecord };
  }

  /**
   * 4. Submit verification package (Evaluates measurements, routes to HOLD or AWAITING_APPROVAL)
   */
  public submitVerification(submission: VerificationSubmission): {
    success: boolean;
    outcome: 'PASSED' | 'FAILED' | 'INCOMPLETE';
    event: RestartEvent;
    audit: AuditEvent;
    reasons: string[];
  } {
    const event = this.getRestartEvent(submission.eventId);
    if (!event) throw new Error(`Event ${submission.eventId} not found`);

    const zone = this.getZone(event.zoneId);
    const now = this.state.currentSimulatedTime || new Date().toISOString();
    const reasons: string[] = [];

    // Complete associated field tasks
    event.fieldTasks.forEach((t) => {
      t.status = 'COMPLETED';
      t.completedAt = now;
      if (t.taskType === 'MEASURE_CHLORINE') {
        t.measurementsRecorded = {
          chlorineMgL: submission.freeChlorineMgL,
          turbidityNtu: submission.turbidityNtu,
          pressurePsi: submission.observedPressurePsi,
        };
      }
      if (t.taskType === 'INSPECT_LEAK') {
        t.fieldNotes = submission.leakInspectedAndSecured
          ? 'Leak secured and repair confirmed'
          : 'Leak repair pending';
      }
      if (t.taskType === 'FLUSH_HYDRANT') {
        t.measurementsRecorded = { flushingDurationMinutes: 15 };
      }
    });

    // Check verification criteria
    const chlorinePassing = submission.freeChlorineMgL >= DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L;
    const pressurePassing = submission.observedPressurePsi >= DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI;
    const flushingPassing = submission.flushingCompleted;

    if (!chlorinePassing) {
      reasons.push(
        `Free chlorine residual (${submission.freeChlorineMgL.toFixed(2)} mg/L) below minimum demonstration safety floor (${DEMO_THRESHOLDS.MIN_REQUIRED_FREE_CHLORINE_MG_L} mg/L).`
      );
    }
    if (!pressurePassing) {
      reasons.push(
        `Observed field pressure (${submission.observedPressurePsi.toFixed(1)} psi) below minimum service threshold (${DEMO_THRESHOLDS.MIN_NORMAL_PRESSURE_PSI} psi).`
      );
    }
    if (!flushingPassing) {
      reasons.push('Main scour flushing procedure was not completed.');
    }

    const verificationPassed = chlorinePassing && pressurePassing && flushingPassing;

    if (verificationPassed) {
      // Re-evaluate risk with submitted passing parameters
      const updatedRisk = evaluateRestartRisk({
        interruptionDurationHours: event.interruptionDurationHours,
        minimumObservedPressurePsi: event.minimumObservedPressurePsi,
        currentTelemetry: {
          timestamp: now,
          pressurePsi: submission.observedPressurePsi,
          flowLps: 18.0,
          chlorineMgL: submission.freeChlorineMgL,
          turbidityNtu: submission.turbidityNtu,
        },
        incidents: zone?.incidents.filter((i) => !submission.leakInspectedAndSecured || i.type !== 'UNRESOLVED_LEAK') || [],
        recentVerificationChlorine: submission.freeChlorineMgL,
        currentTimeIso: now,
      });
      event.riskEvaluation = updatedRisk;

      const result = transitionRestartEvent(event, {
        targetState: 'AWAITING_APPROVAL',
        actor: submission.submittedBy,
        actorRole: submission.role,
        reason: `Field verification PASSED. Free chlorine: ${submission.freeChlorineMgL} mg/L, Pressure: ${submission.observedPressurePsi} psi, Flushing complete.`,
        verificationData: submission,
      });

      if (!result.success) throw new Error(result.error);

      this.state.restartEvents[event.id] = result.event;
      if (zone) {
        zone.operationalState = result.event.state;
        zone.evidenceCompletenessPercent = 90;
        zone.currentTelemetry.chlorineMgL = submission.freeChlorineMgL;
        zone.currentTelemetry.pressurePsi = submission.observedPressurePsi;
        zone.currentTelemetry.turbidityNtu = submission.turbidityNtu;
        zone.lastUpdated = now;
      }

      if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);

      return {
        success: true,
        outcome: 'PASSED',
        event: result.event,
        audit: result.auditRecord!,
        reasons: ['All demonstration compliance parameters satisfied.'],
      };
    } else {
      // Verification FAILED -> Maintain or route to HOLD
      event.state = 'HOLD';
      event.updatedAt = now;
      event.verificationSubmission = {
        ...submission,
        timestamp: now,
      };

      const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const auditRecord: AuditEvent = {
        id: auditId,
        eventId: event.id,
        zoneId: event.zoneId,
        timestamp: now,
        actor: submission.submittedBy,
        actorRole: submission.role,
        action: 'VERIFICATION_FAILED_HOLD',
        previousState: event.state,
        newState: 'HOLD',
        decisionReason: `Field verification FAILED: ${reasons.join(' ')} System maintained on operational HOLD.`,
      };
      event.auditTrailIds.push(auditId);
      this.state.auditTrail.unshift(auditRecord);

      if (zone) {
        zone.operationalState = 'HOLD';
        zone.evidenceCompletenessPercent = 50;
        zone.currentTelemetry.chlorineMgL = submission.freeChlorineMgL;
        zone.lastUpdated = now;
      }

      return {
        success: false,
        outcome: 'FAILED',
        event,
        audit: auditRecord,
        reasons,
      };
    }
  }

  /**
   * 5. Supervisor review (Approve, Enforce HOLD, or Request Additional Verification)
   */
  public supervisorReview(
    decision: SupervisorDecision & { actionType?: 'APPROVE' | 'REJECT_HOLD' | 'REQUEST_MORE_VERIFICATION' }
  ): { event: RestartEvent; audit: AuditEvent } {
    const event = this.getRestartEvent(decision.eventId);
    if (!event) throw new Error(`Event ${decision.eventId} not found`);

    const zone = this.getZone(event.zoneId);
    const now = this.state.currentSimulatedTime || new Date().toISOString();

    if (decision.decision === 'APPROVE') {
      const result = transitionRestartEvent(event, {
        targetState: 'RESTORED',
        actor: decision.supervisorName,
        actorRole: decision.supervisorRole,
        reason: decision.rationale,
        supervisorDecision: decision,
      });

      if (!result.success) throw new Error(result.error);

      this.state.restartEvents[event.id] = result.event;
      if (zone) {
        zone.operationalState = 'RESTORED';
        zone.evidenceCompletenessPercent = 100;
        zone.currentTelemetry.pressurePsi = 36.0;
        zone.currentTelemetry.flowLps = 24.0;
        zone.currentTelemetry.chlorineMgL = event.verificationSubmission?.freeChlorineMgL ?? 0.50;
        zone.lastUpdated = now;

        // Reset network nodes back to normal operation
        zone.nodes.forEach((node) => {
          node.status = 'NORMAL';
          if (node.type === 'VALVE' && node.metadata) node.metadata.valveState = 'OPEN';
          if (node.type === 'JUNCTION' || node.type === 'HYDRANT') node.pressurePsi = 35.0;
        });
      }

      if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);
      return { event: result.event, audit: result.auditRecord! };
    } else if (decision.actionType === 'REQUEST_MORE_VERIFICATION') {
      // Supervisor requests additional verification
      const newTask: FieldTask = {
        id: `TSK-${Date.now()}-EXTRA`,
        zoneId: event.zoneId,
        restartEventId: event.id,
        taskType: 'SAMPLE_COLLECTION',
        title: 'Supervisor-ordered secondary sample verification',
        description: decision.rationale || 'Secondary bacteriological / residual test required by supervisor.',
        status: 'PENDING',
        assignedRole: 'WATER_QUALITY_SPECIALIST',
      };
      event.fieldTasks.push(newTask);

      const result = transitionRestartEvent(event, {
        targetState: 'VERIFICATION_REQUIRED',
        actor: decision.supervisorName,
        actorRole: decision.supervisorRole,
        reason: decision.rationale,
        supervisorDecision: decision,
      });

      this.state.restartEvents[event.id] = result.event;
      if (zone) {
        zone.operationalState = 'VERIFICATION_REQUIRED';
        zone.lastUpdated = now;
      }
      if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);
      return { event: result.event, audit: result.auditRecord! };
    } else {
      // Reject / Maintain HOLD
      const result = transitionRestartEvent(event, {
        targetState: 'HOLD',
        actor: decision.supervisorName,
        actorRole: decision.supervisorRole,
        reason: decision.rationale || 'Supervisor rejected restoration request; operational HOLD maintained.',
        supervisorDecision: decision,
      });

      this.state.restartEvents[event.id] = result.event;
      if (zone) {
        zone.operationalState = 'HOLD';
        zone.lastUpdated = now;
      }
      if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);
      return { event: result.event, audit: result.auditRecord! };
    }
  }

  /**
   * 6. Advance simulation clock and generate fresh telemetry for all zones
   */
  public advanceSimulation(hoursToAdvance = 1): SimulationState {
    const currentMs = new Date(this.state.currentSimulatedTime).getTime();
    const newMs = currentMs + hoursToAdvance * 3600 * 1000;
    const newIso = new Date(newMs).toISOString();
    this.state.currentSimulatedTime = newIso;

    // Advance and generate telemetry for each zone
    this.state.zones.forEach((zone) => {
      let pressure = zone.currentTelemetry.pressurePsi;
      let flow = zone.currentTelemetry.flowLps;
      let chlorine = zone.currentTelemetry.chlorineMgL;

      if (zone.operationalState === 'INTERRUPTED' || zone.operationalState === 'HOLD') {
        pressure = Math.max(2.0, +(pressure * 0.9).toFixed(1));
        flow = Math.max(0.0, +(flow * 0.8).toFixed(1));
        if (chlorine !== undefined) {
          chlorine = Math.max(0.01, +(chlorine * 0.7).toFixed(2));
        }
      } else if (zone.operationalState === 'RESTORED' || zone.operationalState === 'NORMAL') {
        pressure = +(34.0 + (Math.sin(newMs / 100000) * 2.0)).toFixed(1);
        flow = +(22.0 + (Math.cos(newMs / 100000) * 3.0)).toFixed(1);
        chlorine = 0.55;
      } else if (zone.operationalState === 'AWAITING_APPROVAL') {
        pressure = 30.0;
        flow = 15.0;
      }

      const freshReading: TelemetryReading = {
        timestamp: newIso,
        pressurePsi: pressure,
        flowLps: flow,
        chlorineMgL: chlorine,
        turbidityNtu: 0.38,
        isStale: false,
      };

      zone.currentTelemetry = freshReading;
      zone.telemetryHistory.push(freshReading);
      if (zone.telemetryHistory.length > 25) {
        zone.telemetryHistory.shift(); // Keep recent 25 points
      }
      zone.lastUpdated = newIso;
    });

    // Advance duration on all active restart events and re-evaluate risk
    Object.values(this.state.restartEvents).forEach((evt) => {
      if (evt.state !== 'RESTORED' && evt.state !== 'NORMAL') {
        evt.interruptionDurationHours += hoursToAdvance;

        const zone = this.getZone(evt.zoneId);
        if (zone) {
          evt.riskEvaluation = evaluateRestartRisk({
            interruptionDurationHours: evt.interruptionDurationHours,
            minimumObservedPressurePsi: evt.minimumObservedPressurePsi,
            currentTelemetry: zone.currentTelemetry,
            incidents: zone.incidents,
            currentTimeIso: newIso,
          });
        }
      }
    });

    // Log clock advance audit
    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.state.auditTrail.unshift({
      id: auditId,
      eventId: 'SIMULATION-CLOCK',
      zoneId: 'ALL',
      timestamp: newIso,
      actor: 'Simulation Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'ADVANCE_SIMULATION_CLOCK',
      previousState: 'NORMAL',
      newState: 'NORMAL',
      decisionReason: `Simulation clock advanced by +${hoursToAdvance} hour(s). Generated time-series telemetry across all 5 distribution zones.`,
    });

    return this.state;
  }
}

// Global singleton
declare global {
  // eslint-disable-next-line no-var
  var __safeRestartStore: SimulationStore | undefined;
}

export const store = globalThis.__safeRestartStore ?? new SimulationStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__safeRestartStore = store;
}
