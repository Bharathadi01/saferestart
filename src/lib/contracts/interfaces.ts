// SafeRestart Data Access & Event Processing Interfaces
// Designed for seamless transition from Local Development Adapter to Amazon DynamoDB and EventBridge

import {
  WaterZone,
  RestartEvent,
  AuditEvent,
  FieldTask,
  VerificationSubmission,
  SupervisorDecision,
} from '@/types';

/**
 * Repository interface for Water Distribution Zones
 * Abstracted for in-memory local persistence or Amazon DynamoDB (ZonesTable)
 */
export interface IZoneRepository {
  findAll(): Promise<WaterZone[]> | WaterZone[];
  findById(id: string): Promise<WaterZone | undefined> | WaterZone | undefined;
  save(zone: WaterZone): Promise<WaterZone> | WaterZone;
}

/**
 * Repository interface for Restart Lifecycle Events
 * Abstracted for in-memory local persistence or Amazon DynamoDB (RestartEventsTable with GSI)
 */
export interface IRestartEventRepository {
  findAll(): Promise<RestartEvent[]> | RestartEvent[];
  findById(id: string): Promise<RestartEvent | undefined> | RestartEvent | undefined;
  findByZoneId(zoneId: string): Promise<RestartEvent[]> | RestartEvent[];
  save(event: RestartEvent): Promise<RestartEvent> | RestartEvent;
}

/**
 * Repository interface for Immutable Audit Records
 * Abstracted for local append-only ledger or Amazon DynamoDB (AuditTrailTable)
 */
export interface IAuditRepository {
  append(event: AuditEvent): Promise<AuditEvent> | AuditEvent;
  findAll(zoneId?: string, eventId?: string): Promise<AuditEvent[]> | AuditEvent[];
}

/**
 * Asynchronous Event Publisher Interface
 * Abstracted for local in-memory pub-sub or Amazon EventBridge custom event bus
 */
export interface IEventPublisher {
  publish(event: {
    source: 'saferestart.scada' | 'saferestart.workflow' | 'saferestart.field' | 'saferestart.supervisor';
    detailType: string;
    detail: Record<string, unknown>;
  }): Promise<{ messageId: string }>;
}

/**
 * Complete Storage and Event Adapter Contract
 */
export interface ISafeRestartAdapter {
  readonly providerName: 'LOCAL_DEVELOPMENT_ADAPTER' | 'AWS_DYNAMODB_EVENTBRIDGE';
  readonly isCloudConnected: boolean;
  zones: IZoneRepository;
  events: IRestartEventRepository;
  audits: IAuditRepository;
  publisher: IEventPublisher;
}
