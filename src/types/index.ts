// SafeRestart Domain Data Model & Types

export type ZoneOperationalState =
  | 'NORMAL'
  | 'INTERRUPTED'
  | 'RESTART_REQUESTED'
  | 'ASSESSMENT_REQUIRED'
  | 'HOLD'
  | 'MITIGATION_REQUIRED'
  | 'VERIFICATION_REQUIRED'
  | 'AWAITING_APPROVAL'
  | 'RESTORED';

export type NodeType = 'RESERVOIR' | 'VALVE' | 'JUNCTION' | 'HYDRANT' | 'PUMP_STATION';

export type NodeStatus = 'NORMAL' | 'INTERRUPTED' | 'VULNERABLE' | 'HOLD';

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  elevationMeters: number;
  coordinates: { x: number; y: number };
  pressurePsi?: number;
  metadata?: {
    installationYear?: number;
    material?: string;
    isCriticalJunction?: boolean;
    valveState?: 'OPEN' | 'CLOSED' | 'THROTTLED';
  };
}

export interface NetworkPipe {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  diameterMm: number;
  lengthMeters: number;
  material: 'DUCTILE_IRON' | 'PVC' | 'CAST_IRON' | 'HDPE';
  status: 'ACTIVE' | 'ISOLATED' | 'LEAK_SUSPECTED';
  flowLps?: number;
}

export interface TelemetryReading {
  timestamp: string; // ISO 8601
  pressurePsi: number;
  flowLps: number;
  chlorineMgL?: number;
  turbidityNtu?: number;
  isStale?: boolean;
}

export interface SeededIncident {
  id: string;
  zoneId: string;
  type: 'UNRESOLVED_LEAK' | 'REPORTED_CONTAMINATION_SURGE' | 'PRESSURE_TRANSIENT' | 'VALVE_MALFUNCTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  reportedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
}

export interface RiskContributor {
  factor: 'interruption_duration' | 'min_pressure' | 'stale_telemetry' | 'unresolved_leak' | 'chlorine_residual' | 'pipe_vulnerability';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface RiskEvaluation {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  action: 'PROCEED' | 'HOLD';
  contributors: RiskContributor[];
  missingEvidence: string[];
  requiresVerification: boolean;
  score: number; // 0 - 100 illustrative calculation
  calculatedAt: string;
}

export type FieldTaskType = 
  | 'INSPECT_LEAK' 
  | 'FLUSH_HYDRANT' 
  | 'MEASURE_CHLORINE' 
  | 'MEASURE_PRESSURE'
  | 'SAMPLE_COLLECTION';

export type FieldTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface FieldTask {
  id: string;
  zoneId: string;
  restartEventId: string;
  taskType: FieldTaskType;
  title: string;
  description: string;
  status: FieldTaskStatus;
  assignedRole: 'FIELD_TECHNICIAN' | 'WATER_QUALITY_SPECIALIST';
  assignedTo?: string;
  completedAt?: string;
  measurementsRecorded?: {
    chlorineMgL?: number;
    turbidityNtu?: number;
    pressurePsi?: number;
    flushingDurationMinutes?: number;
  };
  fieldNotes?: string;
  photoUrl?: string; // Simulated S3 upload key/URI
}

export interface VerificationSubmission {
  eventId: string;
  submittedBy: string;
  role: 'FIELD_TECHNICIAN' | 'WATER_QUALITY_SPECIALIST';
  timestamp: string;
  freeChlorineMgL: number;
  turbidityNtu: number;
  observedPressurePsi: number;
  flushingCompleted: boolean;
  leakInspectedAndSecured: boolean;
  photoProofAttached: boolean;
  notes: string;
}

export interface SupervisorDecision {
  eventId: string;
  supervisorName: string;
  supervisorRole: 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER';
  decision: 'APPROVE' | 'HOLD';
  rationale: string;
  timestamp: string;
  complianceChecksVerified: boolean;
}

export interface RestartEvent {
  id: string;
  zoneId: string;
  state: ZoneOperationalState;
  createdAt: string;
  updatedAt: string;
  interruptionStartedAt: string;
  interruptionDurationHours: number;
  minimumObservedPressurePsi: number;
  restartRequestedBy?: string;
  restartRequestedAt?: string;
  riskEvaluation: RiskEvaluation;
  fieldTasks: FieldTask[];
  verificationSubmission?: VerificationSubmission;
  supervisorDecision?: SupervisorDecision;
  auditTrailIds: string[];
}

export interface AuditEvent {
  id: string;
  eventId: string;
  zoneId: string;
  timestamp: string;
  actor: string;
  actorRole: 'SYSTEM_SIMULATOR' | 'FIELD_TECHNICIAN' | 'WATER_QUALITY_SPECIALIST' | 'SUPERVISOR' | 'CHIEF_WATER_ENGINEER';
  action: string;
  previousState: ZoneOperationalState;
  newState: ZoneOperationalState;
  decisionReason: string;
  evidenceReference?: string;
}

export interface WaterZone {
  id: string;
  name: string;
  code: string;
  description: string;
  populationServed: number;
  connectionsCount: number;
  operationalState: ZoneOperationalState;
  currentTelemetry: TelemetryReading;
  telemetryHistory: TelemetryReading[];
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
  incidents: SeededIncident[];
  activeRestartEventId?: string;
  evidenceCompletenessPercent: number;
  lastUpdated: string;
}

export interface SimulationState {
  currentSimulatedTime: string; // ISO timestamp
  isAutoAdvancing: boolean;
  zones: WaterZone[];
  restartEvents: Record<string, RestartEvent>;
  auditTrail: AuditEvent[];
}
