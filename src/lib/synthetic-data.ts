import {
  WaterZone,
  NetworkNode,
  NetworkPipe,
  TelemetryReading,
  SeededIncident,
  RestartEvent,
  FieldTask,
  AuditEvent,
} from '@/types';
import { evaluateRestartRisk } from './risk-engine';

// Helper to generate deterministic historical telemetry points leading up to reference time
export function generateDeterministicTelemetryHistory(
  basePressure: number,
  baseFlow: number,
  baseChlorine: number | undefined,
  state: string,
  hours = 12
): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const now = Date.now();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000).toISOString();
    let pressure = basePressure;
    let flow = baseFlow;
    let chlorine = baseChlorine;
    let isStale = false;

    if (state === 'INTERRUPTED' || state === 'HOLD') {
      // Depressurizing curve
      const decayFactor = Math.max(0, 1 - (hours - i) / 4);
      pressure = Math.max(2.5, +(basePressure * decayFactor).toFixed(1));
      flow = Math.max(0, +(baseFlow * decayFactor).toFixed(1));
      if (chlorine !== undefined) {
        chlorine = Math.max(0.02, +(chlorine * decayFactor).toFixed(2));
      }
    } else if (state === 'AWAITING_APPROVAL' || state === 'RESTORED') {
      // Recharging curve
      const recovery = Math.min(1, (hours - i) / 6);
      pressure = +(basePressure * 0.4 + basePressure * 0.6 * recovery).toFixed(1);
      flow = +(baseFlow * 0.5 + baseFlow * 0.5 * recovery).toFixed(1);
    }

    readings.push({
      timestamp,
      pressurePsi: pressure,
      flowLps: flow,
      chlorineMgL: chlorine,
      turbidityNtu: +(0.35 + (i % 3) * 0.1).toFixed(2),
      isStale,
    });
  }

  return readings;
}

// 5 Complete Water Zones with ~28 Nodes and ~32 Pipes
export function createInitialZones(): {
  zones: WaterZone[];
  events: Record<string, RestartEvent>;
  audits: AuditEvent[];
} {
  const now = new Date();
  const isoNow = now.toISOString();
  const fourHoursAgo = new Date(now.getTime() - 4.5 * 3600 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2.0 * 3600 * 1000).toISOString();
  const twelveHoursAgo = new Date(now.getTime() - 14 * 3600 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();

  // ZONE 1: Central Business & Historic District
  const zone1Nodes: NetworkNode[] = [
    { id: 'Z1-RES-01', label: 'Central Elevated Reservoir', type: 'RESERVOIR', status: 'INTERRUPTED', elevationMeters: 145, coordinates: { x: 50, y: 150 }, pressurePsi: 45.0, metadata: { installationYear: 1985 } },
    { id: 'Z1-VLV-01', label: 'Inlet PRV Valve #1', type: 'VALVE', status: 'INTERRUPTED', elevationMeters: 120, coordinates: { x: 200, y: 150 }, pressurePsi: 12.0, metadata: { valveState: 'THROTTLED' } },
    { id: 'Z1-JNC-01', label: 'Market St Junction', type: 'JUNCTION', status: 'HOLD', elevationMeters: 110, coordinates: { x: 350, y: 80 }, pressurePsi: 3.8, metadata: { isCriticalJunction: true } },
    { id: 'Z1-JNC-02', label: 'Grand Ave Junction', type: 'JUNCTION', status: 'HOLD', elevationMeters: 105, coordinates: { x: 350, y: 220 }, pressurePsi: 4.2 },
    { id: 'Z1-HYD-01', label: 'Hydrant H-401 (Historic Sq)', type: 'HYDRANT', status: 'VULNERABLE', elevationMeters: 104, coordinates: { x: 500, y: 80 }, pressurePsi: 3.5 },
    { id: 'Z1-HYD-02', label: 'Hydrant H-402 (Station St)', type: 'HYDRANT', status: 'VULNERABLE', elevationMeters: 102, coordinates: { x: 500, y: 220 }, pressurePsi: 3.9 },
  ];

  const zone1Pipes: NetworkPipe[] = [
    { id: 'Z1-P-101', sourceNodeId: 'Z1-RES-01', targetNodeId: 'Z1-VLV-01', diameterMm: 300, lengthMeters: 450, material: 'DUCTILE_IRON', status: 'ACTIVE', flowLps: 8.5 },
    { id: 'Z1-P-102', sourceNodeId: 'Z1-VLV-01', targetNodeId: 'Z1-JNC-01', diameterMm: 200, lengthMeters: 320, material: 'PVC', status: 'ACTIVE', flowLps: 4.2 },
    { id: 'Z1-P-103', sourceNodeId: 'Z1-VLV-01', targetNodeId: 'Z1-JNC-02', diameterMm: 200, lengthMeters: 380, material: 'CAST_IRON', status: 'ACTIVE', flowLps: 4.3 },
    { id: 'Z1-P-104', sourceNodeId: 'Z1-JNC-01', targetNodeId: 'Z1-HYD-01', diameterMm: 150, lengthMeters: 220, material: 'CAST_IRON', status: 'LEAK_SUSPECTED', flowLps: 0.5 },
    { id: 'Z1-P-105', sourceNodeId: 'Z1-JNC-02', targetNodeId: 'Z1-HYD-02', diameterMm: 150, lengthMeters: 260, material: 'PVC', status: 'ACTIVE', flowLps: 0.4 },
    { id: 'Z1-P-106', sourceNodeId: 'Z1-JNC-01', targetNodeId: 'Z1-JNC-02', diameterMm: 150, lengthMeters: 180, material: 'DUCTILE_IRON', status: 'ACTIVE', flowLps: 0.2 },
  ];

  const zone1Incidents: SeededIncident[] = [
    {
      id: 'INC-101',
      zoneId: 'zone-1',
      type: 'UNRESOLVED_LEAK',
      severity: 'HIGH',
      description: 'Reported collar crack on cast-iron main P-104 near Market St. Evidence of soil dampness.',
      reportedAt: fourHoursAgo,
      isResolved: false,
    },
  ];

  const zone1Telemetry = generateDeterministicTelemetryHistory(32.0, 48.0, undefined, 'HOLD', 12);
  const zone1Current = zone1Telemetry[zone1Telemetry.length - 1];

  // Evaluate risk for zone 1
  const zone1Risk = evaluateRestartRisk({
    interruptionDurationHours: 4.5,
    minimumObservedPressurePsi: 3.8,
    currentTelemetry: zone1Current,
    incidents: zone1Incidents,
    pipeVulnerabilityScore: 0.75,
  });

  const zone1EventId = 'EVT-2026-001';
  const zone1Event: RestartEvent = {
    id: zone1EventId,
    zoneId: 'zone-1',
    state: 'HOLD',
    createdAt: fourHoursAgo,
    updatedAt: isoNow,
    interruptionStartedAt: fourHoursAgo,
    interruptionDurationHours: 4.5,
    minimumObservedPressurePsi: 3.8,
    restartRequestedBy: 'Auto-SCADA / Operator J. Vance',
    restartRequestedAt: twoHoursAgo,
    riskEvaluation: zone1Risk,
    fieldTasks: [
      {
        id: 'TSK-101',
        zoneId: 'zone-1',
        restartEventId: zone1EventId,
        taskType: 'INSPECT_LEAK',
        title: 'Inspect suspected collar leak on Pipe P-104',
        description: 'Verify soil displacement near Market St. Isolate repair clamp or secure perimeter before pressure recharge.',
        status: 'PENDING',
        assignedRole: 'FIELD_TECHNICIAN',
      },
      {
        id: 'TSK-102',
        zoneId: 'zone-1',
        restartEventId: zone1EventId,
        taskType: 'FLUSH_HYDRANT',
        title: 'Execute authorized flushing on Hydrant H-401',
        description: 'Flush until water clarifies (minimum 15 minutes demonstration protocol) to purge accumulated stagnant deposits.',
        status: 'PENDING',
        assignedRole: 'FIELD_TECHNICIAN',
      },
      {
        id: 'TSK-103',
        zoneId: 'zone-1',
        restartEventId: zone1EventId,
        taskType: 'MEASURE_CHLORINE',
        title: 'Measure free chlorine residual at Terminal Hydrant H-402',
        description: 'Field DPD colorimeter measurement. Mandatory requirement: >= 0.20 mg/L free chlorine.',
        status: 'PENDING',
        assignedRole: 'WATER_QUALITY_SPECIALIST',
      },
    ],
    auditTrailIds: ['AUD-001', 'AUD-002'],
  };

  // ZONE 2: North Ridge Heights
  const zone2Nodes: NetworkNode[] = [
    { id: 'Z2-RES-01', label: 'North Ridge Booster', type: 'PUMP_STATION', status: 'VULNERABLE', elevationMeters: 180, coordinates: { x: 50, y: 150 }, pressurePsi: 28.0 },
    { id: 'Z2-VLV-01', label: 'Isolation Valve V-201', type: 'VALVE', status: 'NORMAL', elevationMeters: 170, coordinates: { x: 220, y: 150 }, pressurePsi: 26.5 },
    { id: 'Z2-JNC-01', label: 'Ridge Crest Cross', type: 'JUNCTION', status: 'VULNERABLE', elevationMeters: 168, coordinates: { x: 380, y: 150 }, pressurePsi: 22.0 },
    { id: 'Z2-HYD-01', label: 'Hydrant H-204 (Ridge Summit)', type: 'HYDRANT', status: 'VULNERABLE', elevationMeters: 172, coordinates: { x: 520, y: 150 }, pressurePsi: 20.5 },
  ];
  const zone2Pipes: NetworkPipe[] = [
    { id: 'Z2-P-201', sourceNodeId: 'Z2-RES-01', targetNodeId: 'Z2-VLV-01', diameterMm: 250, lengthMeters: 300, material: 'HDPE', status: 'ACTIVE', flowLps: 12.0 },
    { id: 'Z2-P-202', sourceNodeId: 'Z2-VLV-01', targetNodeId: 'Z2-JNC-01', diameterMm: 200, lengthMeters: 400, material: 'HDPE', status: 'ACTIVE', flowLps: 11.8 },
    { id: 'Z2-P-203', sourceNodeId: 'Z2-JNC-01', targetNodeId: 'Z2-HYD-01', diameterMm: 150, lengthMeters: 180, material: 'PVC', status: 'ACTIVE', flowLps: 0.0 },
  ];
  const zone2Telemetry = generateDeterministicTelemetryHistory(28.0, 24.0, 0.12, 'VERIFICATION_REQUIRED', 12);
  const zone2Current = zone2Telemetry[zone2Telemetry.length - 1];
  const zone2Risk = evaluateRestartRisk({
    interruptionDurationHours: 3.2,
    minimumObservedPressurePsi: 14.5,
    currentTelemetry: zone2Current,
    incidents: [],
    pipeVulnerabilityScore: 0.2,
  });
  const zone2EventId = 'EVT-2026-002';
  const zone2Event: RestartEvent = {
    id: zone2EventId,
    zoneId: 'zone-2',
    state: 'VERIFICATION_REQUIRED',
    createdAt: twoHoursAgo,
    updatedAt: isoNow,
    interruptionStartedAt: twoHoursAgo,
    interruptionDurationHours: 3.2,
    minimumObservedPressurePsi: 14.5,
    restartRequestedBy: 'Field Supervisor Miller',
    restartRequestedAt: oneHourAgo,
    riskEvaluation: zone2Risk,
    fieldTasks: [
      {
        id: 'TSK-201',
        zoneId: 'zone-2',
        restartEventId: zone2EventId,
        taskType: 'FLUSH_HYDRANT',
        title: 'Flush terminal hydrant H-204',
        description: 'Flush branch line to purge stagnant water before taking residual test.',
        status: 'IN_PROGRESS',
        assignedRole: 'FIELD_TECHNICIAN',
      },
      {
        id: 'TSK-202',
        zoneId: 'zone-2',
        restartEventId: zone2EventId,
        taskType: 'MEASURE_CHLORINE',
        title: 'Verify chlorine residual at H-204',
        description: 'Confirm free chlorine >= 0.20 mg/L post-flush.',
        status: 'PENDING',
        assignedRole: 'WATER_QUALITY_SPECIALIST',
      },
    ],
    auditTrailIds: ['AUD-003'],
  };

  // ZONE 3: Industrial Harbor Sector
  const zone3Nodes: NetworkNode[] = [
    { id: 'Z3-RES-01', label: 'Harbor Transfer Pump', type: 'PUMP_STATION', status: 'HOLD', elevationMeters: 30, coordinates: { x: 50, y: 150 }, pressurePsi: 5.0 },
    { id: 'Z3-JNC-01', label: 'Pier 4 Junction', type: 'JUNCTION', status: 'HOLD', elevationMeters: 12, coordinates: { x: 250, y: 150 }, pressurePsi: 1.2 },
    { id: 'Z3-HYD-01', label: 'Dock Hydrant D-12', type: 'HYDRANT', status: 'HOLD', elevationMeters: 10, coordinates: { x: 450, y: 150 }, pressurePsi: 0.8 },
  ];
  const zone3Pipes: NetworkPipe[] = [
    { id: 'Z3-P-301', sourceNodeId: 'Z3-RES-01', targetNodeId: 'Z3-JNC-01', diameterMm: 350, lengthMeters: 550, material: 'CAST_IRON', status: 'LEAK_SUSPECTED', flowLps: 0.0 },
    { id: 'Z3-P-302', sourceNodeId: 'Z3-JNC-01', targetNodeId: 'Z3-HYD-01', diameterMm: 200, lengthMeters: 300, material: 'CAST_IRON', status: 'ACTIVE', flowLps: 0.0 },
  ];
  const zone3Incidents: SeededIncident[] = [
    {
      id: 'INC-301',
      zoneId: 'zone-3',
      type: 'UNRESOLVED_LEAK',
      severity: 'HIGH',
      description: 'Major circumferential shear on 350mm unlined cast iron main near Pier 4 dock approach.',
      reportedAt: twelveHoursAgo,
      isResolved: false,
    },
  ];
  const zone3Telemetry = generateDeterministicTelemetryHistory(15.0, 55.0, undefined, 'HOLD', 14);
  const zone3Current = zone3Telemetry[zone3Telemetry.length - 1];
  const zone3Risk = evaluateRestartRisk({
    interruptionDurationHours: 14.0,
    minimumObservedPressurePsi: 0.8,
    currentTelemetry: zone3Current,
    incidents: zone3Incidents,
    pipeVulnerabilityScore: 0.95,
  });
  const zone3EventId = 'EVT-2026-003';
  const zone3Event: RestartEvent = {
    id: zone3EventId,
    zoneId: 'zone-3',
    state: 'HOLD',
    createdAt: twelveHoursAgo,
    updatedAt: isoNow,
    interruptionStartedAt: twelveHoursAgo,
    interruptionDurationHours: 14.0,
    minimumObservedPressurePsi: 0.8,
    restartRequestedBy: 'Regional Dispatcher',
    restartRequestedAt: twoHoursAgo,
    riskEvaluation: zone3Risk,
    fieldTasks: [
      {
        id: 'TSK-301',
        zoneId: 'zone-3',
        restartEventId: zone3EventId,
        taskType: 'INSPECT_LEAK',
        title: 'Emergency repair inspection on Pier 4 main',
        description: 'Contractor crew repair sleeve verification required prior to any line recharge.',
        status: 'PENDING',
        assignedRole: 'FIELD_TECHNICIAN',
      },
    ],
    auditTrailIds: ['AUD-004'],
  };

  // ZONE 4: Valley Park Residential (Ready for Supervisor Approval!)
  const zone4Nodes: NetworkNode[] = [
    { id: 'Z4-RES-01', label: 'Valley Gravity Tank', type: 'RESERVOIR', status: 'NORMAL', elevationMeters: 130, coordinates: { x: 50, y: 150 }, pressurePsi: 40.0 },
    { id: 'Z4-VLV-01', label: 'Pressure Regulating Valve', type: 'VALVE', status: 'NORMAL', elevationMeters: 90, coordinates: { x: 220, y: 150 }, pressurePsi: 34.0 },
    { id: 'Z4-JNC-01', label: 'School Crossing Junction', type: 'JUNCTION', status: 'NORMAL', elevationMeters: 85, coordinates: { x: 380, y: 150 }, pressurePsi: 32.5 },
    { id: 'Z4-HYD-01', label: 'Hydrant H-301 (Park Gate)', type: 'HYDRANT', status: 'NORMAL', elevationMeters: 84, coordinates: { x: 520, y: 150 }, pressurePsi: 32.0 },
  ];
  const zone4Pipes: NetworkPipe[] = [
    { id: 'Z4-P-401', sourceNodeId: 'Z4-RES-01', targetNodeId: 'Z4-VLV-01', diameterMm: 300, lengthMeters: 400, material: 'DUCTILE_IRON', status: 'ACTIVE', flowLps: 22.0 },
    { id: 'Z4-P-402', sourceNodeId: 'Z4-VLV-01', targetNodeId: 'Z4-JNC-01', diameterMm: 250, lengthMeters: 350, material: 'PVC', status: 'ACTIVE', flowLps: 21.5 },
    { id: 'Z4-P-403', sourceNodeId: 'Z4-JNC-01', targetNodeId: 'Z4-HYD-01', diameterMm: 150, lengthMeters: 150, material: 'PVC', status: 'ACTIVE', flowLps: 0.0 },
  ];
  const zone4Telemetry = generateDeterministicTelemetryHistory(32.0, 35.0, 0.44, 'AWAITING_APPROVAL', 12);
  const zone4Current = zone4Telemetry[zone4Telemetry.length - 1];
  const zone4Risk = evaluateRestartRisk({
    interruptionDurationHours: 2.1,
    minimumObservedPressurePsi: 21.0,
    currentTelemetry: zone4Current,
    incidents: [],
    recentVerificationChlorine: 0.44,
  });
  const zone4EventId = 'EVT-2026-004';
  const zone4Event: RestartEvent = {
    id: zone4EventId,
    zoneId: 'zone-4',
    state: 'AWAITING_APPROVAL',
    createdAt: fourHoursAgo,
    updatedAt: isoNow,
    interruptionStartedAt: fourHoursAgo,
    interruptionDurationHours: 2.1,
    minimumObservedPressurePsi: 21.0,
    restartRequestedBy: 'District Operator Lee',
    restartRequestedAt: twoHoursAgo,
    riskEvaluation: zone4Risk,
    fieldTasks: [
      {
        id: 'TSK-401',
        zoneId: 'zone-4',
        restartEventId: zone4EventId,
        taskType: 'FLUSH_HYDRANT',
        title: 'Flush terminal hydrant H-301',
        description: 'Complete 20-minute line scouring flush.',
        status: 'COMPLETED',
        assignedRole: 'FIELD_TECHNICIAN',
        completedAt: oneHourAgo,
        measurementsRecorded: { flushingDurationMinutes: 20 },
      },
      {
        id: 'TSK-402',
        zoneId: 'zone-4',
        restartEventId: zone4EventId,
        taskType: 'MEASURE_CHLORINE',
        title: 'Measure post-flush free chlorine',
        description: 'Field spectrophotometer test.',
        status: 'COMPLETED',
        assignedRole: 'WATER_QUALITY_SPECIALIST',
        completedAt: oneHourAgo,
        measurementsRecorded: { chlorineMgL: 0.44, turbidityNtu: 0.45, pressurePsi: 32.0 },
      },
    ],
    verificationSubmission: {
      eventId: zone4EventId,
      submittedBy: 'Tech Sarah Jenkins (Cert #4491)',
      role: 'WATER_QUALITY_SPECIALIST',
      timestamp: oneHourAgo,
      freeChlorineMgL: 0.44,
      turbidityNtu: 0.45,
      observedPressurePsi: 32.0,
      flushingCompleted: true,
      leakInspectedAndSecured: true,
      photoProofAttached: true,
      notes: 'Main flushed clear. Chlorine residual verified stable at 0.44 mg/L. Ready for supervisor authorization.',
    },
    auditTrailIds: ['AUD-005', 'AUD-006'],
  };

  // ZONE 5: Eastern Green Foothills (Normal Supply)
  const zone5Nodes: NetworkNode[] = [
    { id: 'Z5-RES-01', label: 'Foothill Reservoir', type: 'RESERVOIR', status: 'NORMAL', elevationMeters: 160, coordinates: { x: 50, y: 150 }, pressurePsi: 48.0 },
    { id: 'Z5-VLV-01', label: 'East Gate Valve', type: 'VALVE', status: 'NORMAL', elevationMeters: 140, coordinates: { x: 250, y: 150 }, pressurePsi: 42.0 },
    { id: 'Z5-JNC-01', label: 'Greenway Circle', type: 'JUNCTION', status: 'NORMAL', elevationMeters: 135, coordinates: { x: 420, y: 150 }, pressurePsi: 38.0 },
  ];
  const zone5Pipes: NetworkPipe[] = [
    { id: 'Z5-P-501', sourceNodeId: 'Z5-RES-01', targetNodeId: 'Z5-VLV-01', diameterMm: 300, lengthMeters: 450, material: 'DUCTILE_IRON', status: 'ACTIVE', flowLps: 30.0 },
    { id: 'Z5-P-502', sourceNodeId: 'Z5-VLV-01', targetNodeId: 'Z5-JNC-01', diameterMm: 200, lengthMeters: 380, material: 'PVC', status: 'ACTIVE', flowLps: 29.5 },
  ];
  const zone5Telemetry = generateDeterministicTelemetryHistory(38.0, 30.0, 0.65, 'NORMAL', 12);
  const zone5Current = zone5Telemetry[zone5Telemetry.length - 1];

  const zones: WaterZone[] = [
    {
      id: 'zone-1',
      name: 'Central Business & Historic District',
      code: 'ZONE-CENTRAL',
      description: 'Mixed-use downtown commercial corridor with unlined cast-iron feeder mains.',
      populationServed: 14200,
      connectionsCount: 3850,
      operationalState: 'HOLD',
      currentTelemetry: zone1Current,
      telemetryHistory: zone1Telemetry,
      nodes: zone1Nodes,
      pipes: zone1Pipes,
      incidents: zone1Incidents,
      activeRestartEventId: zone1EventId,
      evidenceCompletenessPercent: 20,
      lastUpdated: isoNow,
    },
    {
      id: 'zone-2',
      name: 'North Ridge Heights',
      code: 'ZONE-NORTH',
      description: 'High-elevation residential zone subject to rapid depressurization during supply cuts.',
      populationServed: 9800,
      connectionsCount: 2400,
      operationalState: 'VERIFICATION_REQUIRED',
      currentTelemetry: zone2Current,
      telemetryHistory: zone2Telemetry,
      nodes: zone2Nodes,
      pipes: zone2Pipes,
      incidents: [],
      activeRestartEventId: zone2EventId,
      evidenceCompletenessPercent: 40,
      lastUpdated: isoNow,
    },
    {
      id: 'zone-3',
      name: 'Industrial Harbor Sector',
      code: 'ZONE-HARBOR',
      description: 'Heavy industrial and maritime shipping terminal with severe legacy pipe age.',
      populationServed: 6500,
      connectionsCount: 420,
      operationalState: 'HOLD',
      currentTelemetry: zone3Current,
      telemetryHistory: zone3Telemetry,
      nodes: zone3Nodes,
      pipes: zone3Pipes,
      incidents: zone3Incidents,
      activeRestartEventId: zone3EventId,
      evidenceCompletenessPercent: 0,
      lastUpdated: isoNow,
    },
    {
      id: 'zone-4',
      name: 'Valley Park Residential',
      code: 'ZONE-VALLEY',
      description: 'Dense residential basin with school campuses and high daytime vulnerability.',
      populationServed: 22000,
      connectionsCount: 5600,
      operationalState: 'AWAITING_APPROVAL',
      currentTelemetry: zone4Current,
      telemetryHistory: zone4Telemetry,
      nodes: zone4Nodes,
      pipes: zone4Pipes,
      incidents: [],
      activeRestartEventId: zone4EventId,
      evidenceCompletenessPercent: 100,
      lastUpdated: isoNow,
    },
    {
      id: 'zone-5',
      name: 'Eastern Green Foothills',
      code: 'ZONE-EAST',
      description: 'Modern residential expansion zone with continuous loop topology and HDPE piping.',
      populationServed: 11300,
      connectionsCount: 2900,
      operationalState: 'NORMAL',
      currentTelemetry: zone5Current,
      telemetryHistory: zone5Telemetry,
      nodes: zone5Nodes,
      pipes: zone5Pipes,
      incidents: [],
      evidenceCompletenessPercent: 100,
      lastUpdated: isoNow,
    },
  ];

  const events: Record<string, RestartEvent> = {
    [zone1EventId]: zone1Event,
    [zone2EventId]: zone2Event,
    [zone3EventId]: zone3Event,
    [zone4EventId]: zone4Event,
  };

  const audits: AuditEvent[] = [
    {
      id: 'AUD-001',
      eventId: zone1EventId,
      zoneId: 'zone-1',
      timestamp: fourHoursAgo,
      actor: 'SCADA Telemetry Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'TRANSITION_NORMAL_TO_INTERRUPTED',
      previousState: 'NORMAL',
      newState: 'INTERRUPTED',
      decisionReason: 'Observed pressure dropped below 15 psi across Market St transducer.',
    },
    {
      id: 'AUD-002',
      eventId: zone1EventId,
      zoneId: 'zone-1',
      timestamp: twoHoursAgo,
      actor: 'Risk Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'TRANSITION_INTERRUPTED_TO_HOLD',
      previousState: 'INTERRUPTED',
      newState: 'HOLD',
      decisionReason: 'Risk evaluation flagged unresolved collar leak (INC-101) and missing chlorine residual.',
      evidenceReference: 'INC-101',
    },
    {
      id: 'AUD-003',
      eventId: zone2EventId,
      zoneId: 'zone-2',
      timestamp: twoHoursAgo,
      actor: 'Operator J. Vance',
      actorRole: 'SUPERVISOR',
      action: 'TRANSITION_INTERRUPTED_TO_VERIFICATION_REQUIRED',
      previousState: 'INTERRUPTED',
      newState: 'VERIFICATION_REQUIRED',
      decisionReason: 'Depressurization duration 3.2 hrs. Dispatched technician for hydrant flushing.',
    },
    {
      id: 'AUD-004',
      eventId: zone3EventId,
      zoneId: 'zone-3',
      timestamp: twelveHoursAgo,
      actor: 'SCADA Telemetry Engine',
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'TRANSITION_NORMAL_TO_HOLD',
      previousState: 'NORMAL',
      newState: 'HOLD',
      decisionReason: 'Catastrophic shear reported on Pier 4 main. Supply isolated.',
      evidenceReference: 'INC-301',
    },
    {
      id: 'AUD-005',
      eventId: zone4EventId,
      zoneId: 'zone-4',
      timestamp: twoHoursAgo,
      actor: 'Operator Lee',
      actorRole: 'SUPERVISOR',
      action: 'TRANSITION_INTERRUPTED_TO_VERIFICATION_REQUIRED',
      previousState: 'INTERRUPTED',
      newState: 'VERIFICATION_REQUIRED',
      decisionReason: 'Routine supply resumption. Field sampling required.',
    },
    {
      id: 'AUD-006',
      eventId: zone4EventId,
      zoneId: 'zone-4',
      timestamp: oneHourAgo,
      actor: 'Tech Sarah Jenkins',
      actorRole: 'WATER_QUALITY_SPECIALIST',
      action: 'TRANSITION_VERIFICATION_REQUIRED_TO_AWAITING_APPROVAL',
      previousState: 'VERIFICATION_REQUIRED',
      newState: 'AWAITING_APPROVAL',
      decisionReason: 'Flushing completed. Free chlorine 0.44 mg/L verified. Ready for sign-off.',
      evidenceReference: 'SAMPLE-VALLEY-044',
    },
  ];

  return { zones, events, audits };
}
