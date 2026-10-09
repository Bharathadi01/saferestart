import { describe, it, expect } from 'vitest';
import { LocalSafeRestartAdapter } from '../src/lib/adapters/local-store-adapter';

describe('LocalSafeRestartAdapter (Decoupled Persistence & Event Publisher)', () => {
  it('operates 100% locally with zero AWS credentials required', () => {
    const adapter = new LocalSafeRestartAdapter();

    expect(adapter.providerName).toBe('LOCAL_DEVELOPMENT_ADAPTER');
    expect(adapter.isCloudConnected).toBe(false);

    // Verify Zone Repository
    const zones = adapter.zones.findAll();
    expect(zones.length).toBe(5);

    const zone1 = adapter.zones.findById('zone-1');
    expect(zone1).toBeDefined();
    expect(zone1?.code).toBe('ZONE-CENTRAL');

    // Verify Restart Event Repository
    const events = adapter.events.findAll();
    expect(events.length).toBeGreaterThan(0);

    // Verify Audit Repository
    const audits = adapter.audits.findAll();
    expect(audits.length).toBeGreaterThan(0);

    const initialAuditCount = audits.length;
    adapter.audits.append({
      id: 'AUD-ADAPTER-TEST',
      eventId: 'EVT-TEST',
      zoneId: 'zone-1',
      timestamp: new Date().toISOString(),
      actor: 'Unit Test',
      actorRole: 'SYSTEM_SIMULATOR',
      action: 'ADAPTER_TEST',
      previousState: 'NORMAL',
      newState: 'NORMAL',
      decisionReason: 'Testing decoupled adapter persistence',
    });

    expect(adapter.audits.findAll().length).toBe(initialAuditCount + 1);
  });

  it('publishes events in-memory via IEventPublisher without cloud dependencies', async () => {
    const adapter = new LocalSafeRestartAdapter();

    const publishResult = await adapter.publisher.publish({
      source: 'saferestart.workflow',
      detailType: 'RestartRequested',
      detail: { zoneId: 'zone-5', eventId: 'EVT-123' },
    });

    expect(publishResult.messageId).toBeDefined();
    expect(publishResult.messageId).toContain('local-evt-');
  });
});
