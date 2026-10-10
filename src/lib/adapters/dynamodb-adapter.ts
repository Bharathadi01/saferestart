import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  IZoneRepository,
  IRestartEventRepository,
  IAuditRepository,
  IEventPublisher,
  ISafeRestartAdapter,
} from '../contracts/interfaces';
import { WaterZone, RestartEvent, AuditEvent } from '@/types';

export interface DynamoDBAdapterConfig {
  region?: string;
  zonesTable?: string;
  eventsTable?: string;
  auditTable?: string;
}

export class DynamoDBZoneRepository implements IZoneRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string
  ) {}

  public async findAll(): Promise<WaterZone[]> {
    try {
      const response = await this.docClient.send(
        new ScanCommand({ TableName: this.tableName })
      );
      return (response.Items as WaterZone[]) || [];
    } catch (err) {
      console.error('[DynamoDBZoneRepository.findAll] Error:', err);
      return [];
    }
  }

  public async findById(id: string): Promise<WaterZone | undefined> {
    try {
      const response = await this.docClient.send(
        new GetCommand({ TableName: this.tableName, Key: { id } })
      );
      return response.Item as WaterZone | undefined;
    } catch (err) {
      console.error(`[DynamoDBZoneRepository.findById] Error fetching ${id}:`, err);
      return undefined;
    }
  }

  public async save(zone: WaterZone): Promise<WaterZone> {
    await this.docClient.send(
      new PutCommand({ TableName: this.tableName, Item: zone })
    );
    return zone;
  }
}

export class DynamoDBRestartEventRepository implements IRestartEventRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
    private zoneIndexName = 'ZoneIdIndex'
  ) {}

  public async findAll(): Promise<RestartEvent[]> {
    try {
      const response = await this.docClient.send(
        new ScanCommand({ TableName: this.tableName })
      );
      return (response.Items as RestartEvent[]) || [];
    } catch (err) {
      console.error('[DynamoDBRestartEventRepository.findAll] Error:', err);
      return [];
    }
  }

  public async findById(id: string): Promise<RestartEvent | undefined> {
    try {
      const response = await this.docClient.send(
        new GetCommand({ TableName: this.tableName, Key: { id } })
      );
      return response.Item as RestartEvent | undefined;
    } catch (err) {
      console.error(`[DynamoDBRestartEventRepository.findById] Error fetching ${id}:`, err);
      return undefined;
    }
  }

  public async findByZoneId(zoneId: string): Promise<RestartEvent[]> {
    try {
      const response = await this.docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: this.zoneIndexName,
          KeyConditionExpression: 'zoneId = :zid',
          ExpressionAttributeValues: { ':zid': zoneId },
        })
      );
      return (response.Items as RestartEvent[]) || [];
    } catch (err) {
      console.error(`[DynamoDBRestartEventRepository.findByZoneId] Error:`, err);
      return [];
    }
  }

  public async save(event: RestartEvent): Promise<RestartEvent> {
    await this.docClient.send(
      new PutCommand({ TableName: this.tableName, Item: event })
    );
    return event;
  }
}

export class DynamoDBAuditRepository implements IAuditRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
    private zoneTimestampIndex = 'ZoneTimestampIndex'
  ) {}

  public async append(event: AuditEvent): Promise<AuditEvent> {
    await this.docClient.send(
      new PutCommand({ TableName: this.tableName, Item: event })
    );
    return event;
  }

  public async findAll(zoneId?: string, eventId?: string): Promise<AuditEvent[]> {
    try {
      let items: AuditEvent[] = [];
      if (zoneId) {
        const response = await this.docClient.send(
          new QueryCommand({
            TableName: this.tableName,
            IndexName: this.zoneTimestampIndex,
            KeyConditionExpression: 'zoneId = :zid',
            ExpressionAttributeValues: { ':zid': zoneId },
            ScanIndexForward: false, // Descending by timestamp
          })
        );
        items = (response.Items as AuditEvent[]) || [];
      } else {
        const response = await this.docClient.send(
          new ScanCommand({ TableName: this.tableName })
        );
        items = (response.Items as AuditEvent[]) || [];
      }

      if (eventId) {
        items = items.filter((a) => a.eventId === eventId);
      }

      return items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (err) {
      console.error('[DynamoDBAuditRepository.findAll] Error:', err);
      return [];
    }
  }
}

export class DynamoDBEventPublisher implements IEventPublisher {
  public async publish(event: {
    source: 'saferestart.scada' | 'saferestart.workflow' | 'saferestart.field' | 'saferestart.supervisor';
    detailType: string;
    detail: Record<string, unknown>;
  }): Promise<{ messageId: string }> {
    const messageId = `aws-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    // Logs structured event for CloudWatch Metrics and EventBridge routing
    console.log(
      JSON.stringify({
        _metric: 'SafeRestartEventPublished',
        messageId,
        source: event.source,
        detailType: event.detailType,
        timestamp: new Date().toISOString(),
      })
    );
    return { messageId };
  }
}

export class DynamoDBSafeRestartAdapter implements ISafeRestartAdapter {
  public readonly providerName = 'AWS_DYNAMODB_EVENTBRIDGE' as const;
  public readonly isCloudConnected = true;

  public zones: DynamoDBZoneRepository;
  public events: DynamoDBRestartEventRepository;
  public audits: DynamoDBAuditRepository;
  public publisher: DynamoDBEventPublisher;

  constructor(config: DynamoDBAdapterConfig = {}) {
    const region = config.region || process.env.AWS_REGION || 'ap-southeast-2';
    const client = new DynamoDBClient({ region });
    const docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });

    const stage = process.env.ENVIRONMENT_STAGE || 'dev';
    const zonesTable = config.zonesTable || process.env.ZONES_TABLE || `saferestart-zones-${stage}`;
    const eventsTable = config.eventsTable || process.env.RESTART_EVENTS_TABLE || `saferestart-events-${stage}`;
    const auditTable = config.auditTable || process.env.AUDIT_TRAIL_TABLE || `saferestart-audit-${stage}`;

    this.zones = new DynamoDBZoneRepository(docClient, zonesTable);
    this.events = new DynamoDBRestartEventRepository(docClient, eventsTable);
    this.audits = new DynamoDBAuditRepository(docClient, auditTable);
    this.publisher = new DynamoDBEventPublisher();
  }
}
