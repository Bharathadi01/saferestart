import {
  WaterZone,
  RestartEvent,
  AuditEvent,
  SimulationState,
  VerificationSubmission,
  SupervisorDecision,
  ZoneOperationalState,
} from '@/types';
import { createInitialZones } from './synthetic-data';
import { evaluateRestartRisk } from './risk-engine';
import { transitionRestartEvent } from './state-machine';

// Singleton instance in memory (Node.js runtime or browser)
class SimulationStore {
  private state: SimulationState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SimulationState {
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

  public triggerInterruption(zoneId: string, actor = 'Operations Telemetry'): { zone: WaterZone; event: RestartEvent } {
    const zone = this.getZone(zoneId);
    if (!zone) throw new Error(`Zone ${zoneId} not found`);

    const now = new Date().toISOString();
    const eventId = `EVT-2026-${Date.now().toString().slice(-4)}`;

    // Depressurize zone
    zone.operationalState = 'INTERRUPTED';
    zone.currentTelemetry = {
      timestamp: now,
      pressurePsi: 4.2,
      flowLps: 0.8,
      chlorineMgL: undefined, // Disinfection depleted
      turbidityNtu: 0.95,
      isStale: false,
    };
    zone.telemetryHistory.push(zone.currentTelemetry);
    zone.activeRestartEventId = eventId;
    zone.evidenceCompletenessPercent = 10;
    zone.lastUpdated = now;

    // Evaluate risk immediately
    const risk = evaluateRestartRisk({
      interruptionDurationHours: 1.0,
      minimumObservedPressurePsi: 4.2,
      currentTelemetry: zone.currentTelemetry,
      incidents: zone.incidents,
      pipeVulnerabilityScore: 0.5,
    });

    const newEvent: RestartEvent = {
      id: eventId,
      zoneId: zone.id,
      state: 'INTERRUPTED',
      createdAt: now,
      updatedAt: now,
      interruptionStartedAt: now,
      interruptionDurationHours: 1.0,
      minimumObservedPressurePsi: 4.2,
      riskEvaluation: risk,
      fieldTasks: [
        {
          id: `TSK-${Date.now()}-1`,
          zoneId: zone.id,
          restartEventId: eventId,
          taskType: 'FLUSH_HYDRANT',
          title: `Scour flush terminal hydrant in ${zone.name}`,
          description: 'Purge stagnant water and particulate before water-quality sampling.',
          status: 'PENDING',
          assignedRole: 'FIELD_TECHNICIAN',
        },
        {
          id: `TSK-${Date.now()}-2`,
          zoneId: zone.id,
          restartEventId: eventId,
          taskType: 'MEASURE_CHLORINE',
          title: 'Field free chlorine residual test',
          description: 'Collect sample and measure free chlorine with DPD colorimeter.',
          status: 'PENDING',
          assignedRole: 'WATER_QUALITY_SPECIALIST',
        },
      ],
      auditTrailIds: [],
    };

    // Add audit log
    const auditId = `AUD-${Date.now()}`;
    const auditRecord: AuditEvent = {
      id: auditId,
      eventId,
      zoneId: zone.id,
      timestamp: now,
      actor,
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'TRIGGER_SUPPLY_INTERRUPTION',
      previousState: 'NORMAL',
      newState: 'INTERRUPTED',
      decisionReason: 'Supply isolation event initiated by system dispatcher.',
    };
    newEvent.auditTrailIds.push(auditId);

    this.state.restartEvents[eventId] = newEvent;
    this.state.auditTrail.unshift(auditRecord);

    return { zone, event: newEvent };
  }

  public requestRestart(zoneId: string, actor = 'Operator J. Vance'): { event: RestartEvent; audit: AuditEvent } {
    const zone = this.getZone(zoneId);
    if (!zone || !zone.activeRestartEventId) {
      throw new Error(`Zone ${zoneId} has no active restart event.`);
    }

    const event = this.getRestartEvent(zone.activeRestartEventId);
    if (!event) throw new Error('Restart event not found');

    const result = transitionRestartEvent(event, {
      targetState: 'RESTART_REQUESTED',
      actor,
      actorRole: 'SUPERVISOR',
      reason: 'Field restart requested. Evaluating telemetry and risk parameters.',
    });

    if (!result.success) throw new Error(result.error);

    // Update risk evaluation
    const updatedRisk = evaluateRestartRisk({
      interruptionDurationHours: event.interruptionDurationHours,
      minimumObservedPressurePsi: event.minimumObservedPressurePsi,
      currentTelemetry: zone.currentTelemetry,
      incidents: zone.incidents,
    });
    result.event.riskEvaluation = updatedRisk;

    // Follow-up immediate state determination (HOLD vs VERIFICATION_REQUIRED)
    const nextTargetState: ZoneOperationalState = updatedRisk.action === 'HOLD' ? 'HOLD' : 'VERIFICATION_REQUIRED';
    const nextResult = transitionRestartEvent(result.event, {
      targetState: nextTargetState,
      actor: 'Risk Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      reason:
        nextTargetState === 'HOLD'
          ? `Automatic HOLD enforced: ${updatedRisk.contributors.map((c) => c.explanation).join(' ')}`
          : 'Low preliminary risk. Verification checklist dispatched to field.',
    });

    this.state.restartEvents[event.id] = nextResult.event;
    zone.operationalState = nextResult.event.state;
    zone.lastUpdated = new Date().toISOString();

    if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);
    if (nextResult.auditRecord) this.state.auditTrail.unshift(nextResult.auditRecord);

    return { event: nextResult.event, audit: nextResult.auditRecord! };
  }

  public submitVerification(submission: VerificationSubmission): { event: RestartEvent; audit: AuditEvent } {
    const event = this.getRestartEvent(submission.eventId);
    if (!event) throw new Error(`Event ${submission.eventId} not found`);

    const zone = this.getZone(event.zoneId);

    // Complete associated field tasks
    event.fieldTasks.forEach((t) => {
      t.status = 'COMPLETED';
      t.completedAt = submission.timestamp;
      if (t.taskType === 'MEASURE_CHLORINE') {
        t.measurementsRecorded = {
          chlorineMgL: submission.freeChlorineMgL,
          turbidityNtu: submission.turbidityNtu,
          pressurePsi: submission.observedPressurePsi,
        };
      }
    });

    // Re-evaluate risk with submitted chlorine
    const updatedRisk = evaluateRestartRisk({
      interruptionDurationHours: event.interruptionDurationHours,
      minimumObservedPressurePsi: event.minimumObservedPressurePsi,
      currentTelemetry: {
        timestamp: submission.timestamp,
        pressurePsi: submission.observedPressurePsi,
        flowLps: 18.0,
        chlorineMgL: submission.freeChlorineMgL,
        turbidityNtu: submission.turbidityNtu,
      },
      incidents: zone?.incidents.filter((i) => !submission.leakInspectedAndSecured || i.type !== 'UNRESOLVED_LEAK') || [],
      recentVerificationChlorine: submission.freeChlorineMgL,
    });
    event.riskEvaluation = updatedRisk;

    const result = transitionRestartEvent(event, {
      targetState: 'AWAITING_APPROVAL',
      actor: submission.submittedBy,
      actorRole: submission.role,
      reason: `Field verification submitted. Free chlorine: ${submission.freeChlorineMgL} mg/L, Pressure: ${submission.observedPressurePsi} psi, Flushing: Done.`,
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
      zone.lastUpdated = new Date().toISOString();
    }

    if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);

    return { event: result.event, audit: result.auditRecord! };
  }

  public authorizeRestoration(decision: SupervisorDecision): { event: RestartEvent; audit: AuditEvent } {
    const event = this.getRestartEvent(decision.eventId);
    if (!event) throw new Error(`Event ${decision.eventId} not found`);

    const zone = this.getZone(event.zoneId);

    const targetState: ZoneOperationalState = decision.decision === 'APPROVE' ? 'RESTORED' : 'HOLD';
    const result = transitionRestartEvent(event, {
      targetState,
      actor: decision.supervisorName,
      actorRole: decision.supervisorRole,
      reason: decision.rationale,
      supervisorDecision: decision,
    });

    if (!result.success) throw new Error(result.error);

    this.state.restartEvents[event.id] = result.event;
    if (zone) {
      zone.operationalState = result.event.state;
      zone.evidenceCompletenessPercent = decision.decision === 'APPROVE' ? 100 : zone.evidenceCompletenessPercent;
      if (decision.decision === 'APPROVE') {
        zone.currentTelemetry.pressurePsi = 35.0; // Restored normal pressure
        zone.currentTelemetry.flowLps = 24.0;
      }
      zone.lastUpdated = new Date().toISOString();
    }

    if (result.auditRecord) this.state.auditTrail.unshift(result.auditRecord);

    return { event: result.event, audit: result.auditRecord! };
  }

  public advanceSimulation(hoursToAdvance = 1): SimulationState {
    const now = new Date(Date.now() + hoursToAdvance * 3600 * 1000).toISOString();
    this.state.currentSimulatedTime = now;

    // Advance all active events
    Object.values(this.state.restartEvents).forEach((evt) => {
      if (evt.state !== 'RESTORED' && evt.state !== 'NORMAL') {
        evt.interruptionDurationHours += hoursToAdvance;
      }
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
