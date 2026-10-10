import { describe, it, expect, vi } from 'vitest';
import { LocalSafeRestartAdapter } from '../src/lib/adapters/local-store-adapter';
import { DynamoDBSafeRestartAdapter } from '../src/lib/adapters/dynamodb-adapter';

describe('SafeRestart Persistence Adapters (Decoupled Persistence & Event Publisher)', () => {
  describe('LocalSafeRestartAdapter', () => {
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

  describe('DynamoDBSafeRestartAdapter', () => {
    it('initializes with cloud-connected contract and custom table configurations', () => {
      const adapter = new DynamoDBSafeRestartAdapter({
        region: 'ap-southeast-2',
        zonesTable: 'custom-zones-table',
        eventsTable: 'custom-events-table',
        auditTable: 'custom-audit-table',
      });

      expect(adapter.providerName).toBe('AWS_DYNAMODB_EVENTBRIDGE');
      expect(adapter.isCloudConnected).toBe(true);
      expect(adapter.zones).toBeDefined();
      expect(adapter.events).toBeDefined();
      expect(adapter.audits).toBeDefined();
      expect(adapter.publisher).toBeDefined();
    });

    it('publishes events with structured CloudWatch metric payload and unique message ID', async () => {
      const adapter = new DynamoDBSafeRestartAdapter();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await adapter.publisher.publish({
        source: 'saferestart.field',
        detailType: 'FieldReportConfirmed',
        detail: { zoneId: 'zone-1', eventId: 'EVT-2026-001' },
      });

      expect(result.messageId).toContain('aws-evt-');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

