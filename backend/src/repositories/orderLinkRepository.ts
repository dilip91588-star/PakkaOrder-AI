import { getPool } from '../db/pool.js';
import type { LinkType } from '../types/index.js';

export interface OrderLink {
  id: number;
  tenantId: number;
  sourceOrderId: number;
  canonicalOrderId: number;
  linkType: LinkType;
  linkedBy: string;
  linkedAt: string;
  unlinkedAt: string | null;
  unlinkedReason: string | null;
  isActive: boolean;
}

const inMemoryOrderLinks = new Map<number, OrderLink>();
let linkAutoId = 8000;

export class OrderLinkRepository {
  /**
   * Links a source order to a canonical order.
   * Enforces invariant: at most ONE active canonical link per source order.
   */
  async linkSourceToCanonical(
    tenantId: number,
    sourceOrderId: number,
    canonicalOrderId: number,
    linkType: LinkType,
    linkedBy: string = 'OPERATOR'
  ): Promise<OrderLink> {
    try {
      const pool = getPool();

      // Check existing active link for this source order
      const [existing] = await pool.execute<any[]>(
        `SELECT id, canonical_order_id FROM order_links
         WHERE tenant_id = ? AND source_order_id = ? AND unlinked_at IS NULL`,
        [tenantId, sourceOrderId]
      );

      if (existing.length > 0) {
        if (existing[0].canonical_order_id === canonicalOrderId) {
          // Already linked to this canonical order; return existing
          return (await this.findById(tenantId, existing[0].id))!;
        }

        // Unlink from prior canonical order before establishing new active link
        await pool.execute(
          `UPDATE order_links
           SET unlinked_at = CURRENT_TIMESTAMP(3),
               unlinked_reason = ?
           WHERE id = ?`,
          [`Re-linked to Canonical Order ${canonicalOrderId} via ${linkType}`, existing[0].id]
        );
      }

      // Insert new active link
      const [res] = await pool.execute<any>(
        `INSERT INTO order_links (
           tenant_id, source_order_id, canonical_order_id, link_type,
           linked_by, linked_at
         ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
        [tenantId, sourceOrderId, canonicalOrderId, linkType, linkedBy]
      );

      return (await this.findById(tenantId, res.insertId))!;
    } catch (_err) {
      console.error('[OrderLinkRepository] linkSourceToCanonical error:', _err);
      // In-Memory Fallback
      for (const l of inMemoryOrderLinks.values()) {
        if (l.tenantId === tenantId && l.sourceOrderId === sourceOrderId && l.isActive) {
          if (l.canonicalOrderId === canonicalOrderId) return l;
          l.isActive = false;
          l.unlinkedAt = new Date().toISOString();
          l.unlinkedReason = `Re-linked to Canonical Order ${canonicalOrderId}`;
        }
      }

      const id = ++linkAutoId;
      const record: OrderLink = {
        id,
        tenantId,
        sourceOrderId,
        canonicalOrderId,
        linkType,
        linkedBy,
        linkedAt: new Date().toISOString(),
        unlinkedAt: null,
        unlinkedReason: null,
        isActive: true
      };

      inMemoryOrderLinks.set(id, record);
      return record;
    }
  }

  async findById(tenantId: number, id: number): Promise<OrderLink | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute<any[]>(
        `SELECT * FROM order_links WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        sourceOrderId: r.source_order_id,
        canonicalOrderId: r.canonical_order_id,
        linkType: r.link_type,
        linkedBy: r.linked_by,
        linkedAt: new Date(r.linked_at).toISOString(),
        unlinkedAt: r.unlinked_at ? new Date(r.unlinked_at).toISOString() : null,
        unlinkedReason: r.unlinked_reason,
        isActive: r.unlinked_at === null
      };
    } catch (_err) {
      const r = inMemoryOrderLinks.get(id);
      if (r && r.tenantId === tenantId) return r;
      return null;
    }
  }

  async findActiveLinksForCanonical(tenantId: number, canonicalOrderId: number): Promise<OrderLink[]> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute<any[]>(
        `SELECT * FROM order_links WHERE tenant_id = ? AND canonical_order_id = ? AND unlinked_at IS NULL`,
        [tenantId, canonicalOrderId]
      );
      return rows.map(r => ({
        id: r.id,
        tenantId: r.tenant_id,
        sourceOrderId: r.source_order_id,
        canonicalOrderId: r.canonical_order_id,
        linkType: r.link_type,
        linkedBy: r.linked_by,
        linkedAt: new Date(r.linked_at).toISOString(),
        unlinkedAt: null,
        unlinkedReason: null,
        isActive: true
      }));
    } catch (_err) {
      return Array.from(inMemoryOrderLinks.values()).filter(
        l => l.tenantId === tenantId && l.canonicalOrderId === canonicalOrderId && l.isActive
      );
    }
  }

  async findActiveLinkForSource(tenantId: number, sourceOrderId: number): Promise<OrderLink | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute<any[]>(
        `SELECT * FROM order_links WHERE tenant_id = ? AND source_order_id = ? AND unlinked_at IS NULL LIMIT 1`,
        [tenantId, sourceOrderId]
      );
      if (!rows.length) return null;
      const r = rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        sourceOrderId: r.source_order_id,
        canonicalOrderId: r.canonical_order_id,
        linkType: r.link_type,
        linkedBy: r.linked_by,
        linkedAt: new Date(r.linked_at).toISOString(),
        unlinkedAt: null,
        unlinkedReason: null,
        isActive: true
      };
    } catch (_err) {
      for (const l of inMemoryOrderLinks.values()) {
        if (l.tenantId === tenantId && l.sourceOrderId === sourceOrderId && l.isActive) {
          return l;
        }
      }
      return null;
    }
  }

  resetStore(): void {
    inMemoryOrderLinks.clear();
    linkAutoId = 8000;
  }
}

export const orderLinkRepository = new OrderLinkRepository();
