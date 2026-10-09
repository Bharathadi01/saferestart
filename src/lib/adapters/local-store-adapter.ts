import {
  IZoneRepository,
  IRestartEventRepository,
  IAuditRepository,
  IEventPublisher,
  ISafeRestartAdapter,
} from '../contracts/interfaces';
import { WaterZone, RestartEvent, AuditEvent } from '@/types';
import { createInitialZones } from '../synthetic-data';

export class LocalZoneRepository implements IZoneRepository {
  constructor(private zones: Map<string, WaterZone>) {}

  public findAll(): WaterZone[] {
    return Array.from(this.zones.values());
  }

  public findById(id: string): WaterZone | undefined {
    return this.zones.get(id);
  }

  public save(zone: WaterZone): WaterZone {
    this.zones.set(zone.id, { ...zone });
    return this.zones.get(zone.id)!;
  }
}

export class LocalRestartEventRepository implements IRestartEventRepository {
  constructor(private events: Map<string, RestartEvent>) {}

  public findAll(): RestartEvent[] {
    return Array.from(this.events.values());
  }

  public findById(id: string): RestartEvent | undefined {
    return this.events.get(id);
  }

  public findByZoneId(zoneId: string): RestartEvent[] {
    return Array.from(this.events.values()).filter((e) => e.zoneId === zoneId);
  }

  public save(event: RestartEvent): RestartEvent {
    this.events.set(event.id, { ...event });
    return this.events.get(event.id)!;
  }
}

export class LocalAuditRepository implements IAuditRepository {
  constructor(private auditTrail: AuditEvent[]) {}

  public append(event: AuditEvent): AuditEvent {
    this.auditTrail.unshift({ ...event });
    return event;
  }

  public findAll(zoneId?: string, eventId?: string): AuditEvent[] {
    let logs = [...this.auditTrail];
    if (zoneId) logs = logs.filter((l) => l.zoneId === zoneId);
    if (eventId) logs = logs.filter((l) => l.eventId === eventId);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export class LocalEventPublisher implements IEventPublisher {
  public async publish(event: {
    source: 'saferestart.scada' | 'saferestart.workflow' | 'saferestart.field' | 'saferestart.supervisor';
    detailType: string;
    detail: Record<string, unknown>;
  }): Promise<{ messageId: string }> {
    const messageId = `local-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    // In local development, events are processed in-process
    return { messageId };
  }
}

/**
 * Concrete Local Persistence and Event Adapter
 * Requires zero AWS credentials and operates 100% locally.
 */
export class LocalSafeRestartAdapter implements ISafeRestartAdapter {
  public readonly providerName = 'LOCAL_DEVELOPMENT_ADAPTER' as const;
  public readonly isCloudConnected = false;

  public zones: LocalZoneRepository;
  public events: LocalRestartEventRepository;
  public audits: LocalAuditRepository;
  public publisher: LocalEventPublisher;

  constructor() {
    const { zones, events, audits } = createInitialZones();
    const zoneMap = new Map<string, WaterZone>();
    zones.forEach((z) => zoneMap.set(z.id, z));

    const eventMap = new Map<string, RestartEvent>();
    Object.values(events).forEach((e) => eventMap.set(e.id, e));

    this.zones = new LocalZoneRepository(zoneMap);
    this.events = new LocalRestartEventRepository(eventMap);
    this.audits = new LocalAuditRepository(audits);
    this.publisher = new LocalEventPublisher();
  }
}
