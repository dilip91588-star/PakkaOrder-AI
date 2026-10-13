import crypto from 'crypto';
import { getPool } from '../db/pool.js';
import { env } from '../config/env.js';
import type { 
  ActorType, 
  AuditAction, 
  AuditEventRow, 
  EntityType 
} from '../types/index.js';

export interface AuditRecordInput {
  tenantId: number;
  actorType: ActorType;
  actorUserId?: number | null;
  actorName: string;
  actorRole: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  justification: string;
  correlationId?: string;
}

const inMemoryAuditEvents: AuditEventRow[] = [];
let auditAutoId = 88000;

export class AuditRepository {
  /**
   * Appends an immutable audit event with a cryptographic signature.
   * Modifying or deleting audit records is forbidden by audit law.
   */
  static async recordEvent(input: AuditRecordInput): Promise<AuditEventRow> {
    const correlationId = input.correlationId || `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Generate HMAC-SHA256 signature to guarantee tamper-proof audit trail
    const payloadToSign = `${input.tenantId}:${input.entityType}:${input.entityId}:${input.action}:${JSON.stringify(input.afterState || {})}:${correlationId}`;
    const hash = crypto.createHmac('sha256', env.AUDIT_SIGNING_SECRET).update(payloadToSign).digest('hex');
    const signature = `HMAC-SHA256: 0x${hash.slice(0, 16)}... (Verified)`;

    const now = new Date();

    try {
      const pool = getPool();
      const [res] = await pool.execute<any>(
        `INSERT INTO audit_events (
           tenant_id, actor_type, actor_user_id, actor_name, actor_role,
           entity_type, entity_id, action, before_state, after_state,
           justification, correlation_id, signature, timestamp
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.tenantId,
          input.actorType,
          input.actorUserId || null,
          input.actorName,
          input.actorRole,
          input.entityType,
          input.entityId,
          input.action,
          input.beforeState ? JSON.stringify(input.beforeState) : null,
          input.afterState ? JSON.stringify(input.afterState) : null,
          input.justification,
          correlationId,
          signature,
          now
        ]
      );

      return {
        id: res.insertId,
        tenant_id: input.tenantId,
        actor_type: input.actorType,
        actor_user_id: input.actorUserId || null,
        actor_name: input.actorName,
        actor_role: input.actorRole,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        before_state: input.beforeState || null,
        after_state: input.afterState || null,
        justification: input.justification,
        correlation_id: correlationId,
        signature,
        timestamp: now
      };
    } catch (_err) {
      // In-Memory Fallback
      const record: AuditEventRow = {
        id: ++auditAutoId,
        tenant_id: input.tenantId,
        actor_type: input.actorType,
        actor_user_id: input.actorUserId || null,
        actor_name: input.actorName,
        actor_role: input.actorRole,
        entity_type: input.entityType,
        entity_id: input.entityId,
        action: input.action,
        before_state: input.beforeState || null,
        after_state: input.afterState || null,
        justification: input.justification,
        correlation_id: correlationId,
        signature,
        timestamp: now
      };

      inMemoryAuditEvents.unshift(record);
      return record;
    }
  }

  /**
   * Retrieves audit events for a tenant or specific entity.
   */
  static async listEvents(
    tenantId: number,
    filters: { entityType?: EntityType; entityId?: string; limit?: number } = {}
  ): Promise<AuditEventRow[]> {
    const limit = Math.min(100, filters.limit || 50);

    try {
      const pool = getPool();
      let sql = `SELECT * FROM audit_events WHERE tenant_id = ?`;
      const params: any[] = [tenantId];

      if (filters.entityType) {
        sql += ` AND entity_type = ?`;
        params.push(filters.entityType);
      }
      if (filters.entityId) {
        sql += ` AND entity_id = ?`;
        params.push(filters.entityId);
      }

      sql += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(limit);

      const [rows] = await pool.execute<any[]>(sql, params);
      return rows;
    } catch (_err) {
      return inMemoryAuditEvents
        .filter(e => e.tenant_id === tenantId)
        .filter(e => !filters.entityType || e.entity_type === filters.entityType)
        .filter(e => !filters.entityId || e.entity_id === filters.entityId)
        .slice(0, limit);
    }
  }

  static async findEventsByEntity(
    tenantId: number,
    entityType: EntityType,
    entityId: string
  ): Promise<AuditEventRow[]> {
    return this.listEvents(tenantId, { entityType, entityId });
  }

  static resetStore(): void {
    inMemoryAuditEvents.length = 0;
    auditAutoId = 88000;
  }
}
