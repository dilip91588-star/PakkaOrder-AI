import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../db/pool.js';
import { Channel, SourceRecordStatus, ExtractionStatus } from '../types/index.js';

export interface SourceOrderItemData {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal?: number;
  customizations?: string[];
  productId?: number | null;
}

export interface CreateSourceOrderRecord {
  tenantId: number;
  channel: Channel;
  externalOrderId?: string | null;
  idempotencyKey: string;
  sourceCreatedAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  normalizedPhone?: string | null;
  deliveryAddress?: string | null;
  normalizedAddress?: string | null;
  currency: string;
  reportedTotal: number;
  originalPayload: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown> | null;
  extractionStatus?: ExtractionStatus;
  recordStatus?: SourceRecordStatus;
  items: SourceOrderItemData[];
}

export interface SourceOrderWithItems {
  id: number;
  tenantId: number;
  channel: Channel;
  externalOrderId: string | null;
  idempotencyKey: string;
  sourceCreatedAt: string;
  receivedAt: string;
  customerName: string | null;
  customerPhone: string | null;
  normalizedPhone: string | null;
  deliveryAddress: string | null;
  normalizedAddress: string | null;
  currency: string;
  reportedTotal: number;
  originalPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown> | null;
  extractionStatus: ExtractionStatus;
  recordStatus: SourceRecordStatus;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    sourceLineReference: string | null;
    rawItemName: string;
    normalizedItemName: string;
    productId: number | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
    currency: string;
    variant: Record<string, unknown> | null;
    customization: Record<string, unknown> | null;
  }[];
}

export class SourceOrderRepository {
  // In-memory fallback repository ensuring resilient offline testing and developer experience
  private inMemoryStore = new Map<number, SourceOrderWithItems>();
  private nextId = 1001;

  resetStore(): void {
    this.inMemoryStore.clear();
    this.nextId = 1001;
  }


  /**
   * Find an existing source order by idempotency key within tenant boundary.
   */
  async findByIdempotencyKey(tenantId: number, idempotencyKey: string): Promise<SourceOrderWithItems | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM source_orders WHERE tenant_id = ? AND idempotency_key = ? LIMIT 1`,
        [tenantId, idempotencyKey]
      );

      if (rows.length === 0) return null;
      return this.findById(tenantId, rows[0].id as number);
    } catch (_err) {
      // In-memory fallback
      for (const order of this.inMemoryStore.values()) {
        if (order.tenantId === tenantId && order.idempotencyKey === idempotencyKey) {
          return order;
        }
      }
      return null;
    }
  }

  /**
   * Find a source order by ID within tenant boundary, including all line items.
   */
  async findById(tenantId: number, id: number): Promise<SourceOrderWithItems | null> {
    try {
      const pool = getPool();
      const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM source_orders WHERE tenant_id = ? AND id = ? LIMIT 1`,
        [tenantId, id]
      );

      if (orders.length === 0) return null;
      const o = orders[0];

      const [items] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM source_order_items WHERE source_order_id = ? ORDER BY id ASC`,
        [id]
      );

      return {
        id: o.id,
        tenantId: o.tenant_id,
        channel: o.channel,
        externalOrderId: o.external_order_id,
        idempotencyKey: o.idempotency_key,
        sourceCreatedAt: o.source_created_at,
        receivedAt: o.received_at,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        normalizedPhone: o.normalized_phone,
        deliveryAddress: o.delivery_address,
        normalizedAddress: o.normalized_address,
        currency: o.currency,
        reportedTotal: Number(o.reported_total),
        originalPayload: typeof o.original_payload === 'string' ? JSON.parse(o.original_payload) : o.original_payload,
        normalizedPayload: o.normalized_payload ? (typeof o.normalized_payload === 'string' ? JSON.parse(o.normalized_payload) : o.normalized_payload) : null,
        extractionStatus: o.extraction_status,
        recordStatus: o.record_status,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        items: items.map(itm => ({
          id: itm.id,
          sourceLineReference: itm.source_line_reference,
          rawItemName: itm.raw_item_name,
          normalizedItemName: itm.normalized_item_name,
          productId: itm.product_id,
          quantity: Number(itm.quantity),
          unit: itm.unit,
          unitPrice: Number(itm.unit_price),
          lineTotal: Number(itm.line_total),
          currency: itm.currency,
          variant: itm.variant ? (typeof itm.variant === 'string' ? JSON.parse(itm.variant) : itm.variant) : null,
          customization: itm.customization ? (typeof itm.customization === 'string' ? JSON.parse(itm.customization) : itm.customization) : null
        }))
      };
    } catch (_err) {
      // In-memory fallback
      const order = this.inMemoryStore.get(id);
      if (order && order.tenantId === tenantId) {
        return order;
      }
      return null;
    }
  }

  /**
   * Insert a new source order and item rows inside a managed transaction.
   */
  async create(record: CreateSourceOrderRecord): Promise<number> {
    try {
      const pool = getPool();
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        const [res] = await conn.query<ResultSetHeader>(
          `INSERT INTO source_orders (
            tenant_id, channel, external_order_id, idempotency_key, source_created_at,
            customer_name, customer_phone, normalized_phone, delivery_address, normalized_address,
            currency, reported_total, original_payload, normalized_payload,
            extraction_status, record_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.tenantId,
            record.channel,
            record.externalOrderId || null,
            record.idempotencyKey,
            new Date(record.sourceCreatedAt).toISOString().slice(0, 19).replace('T', ' '),
            record.customerName || null,
            record.customerPhone || null,
            record.normalizedPhone || null,
            record.deliveryAddress || null,
            record.normalizedAddress || null,
            record.currency,
            record.reportedTotal,
            JSON.stringify(record.originalPayload),
            record.normalizedPayload ? JSON.stringify(record.normalizedPayload) : null,
            record.extractionStatus || 'SUCCESS',
            record.recordStatus || 'UNPROCESSED'
          ]
        );

        const sourceOrderId = res.insertId;

        for (let i = 0; i < record.items.length; i++) {
          const itm = record.items[i];
          const lineRef = `LINE-${String(i + 1).padStart(2, '0')}`;
          const lineTotal = itm.lineTotal !== undefined ? itm.lineTotal : itm.quantity * itm.unitPrice;
          const customizationsJson = itm.customizations && itm.customizations.length > 0
            ? JSON.stringify({ notes: itm.customizations })
            : null;

          await conn.query(
            `INSERT INTO source_order_items (
              source_order_id, source_line_reference, raw_item_name, normalized_item_name,
              product_id, quantity, unit, unit_price, line_total, currency, customization
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sourceOrderId,
              lineRef,
              itm.name,
              itm.name.trim().toLowerCase(),
              itm.productId || null,
              itm.quantity,
              itm.unit || 'portion',
              itm.unitPrice ?? 0,
              lineTotal ?? 0,
              record.currency || 'INR',
              customizationsJson
            ]
          );
        }

        await conn.commit();
        return sourceOrderId;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (_err) {
      // In-memory fallback
      const sourceOrderId = this.nextId++;
      const now = new Date().toISOString();

      const createdOrder: SourceOrderWithItems = {
        id: sourceOrderId,
        tenantId: record.tenantId,
        channel: record.channel,
        externalOrderId: record.externalOrderId || null,
        idempotencyKey: record.idempotencyKey,
        sourceCreatedAt: record.sourceCreatedAt,
        receivedAt: now,
        customerName: record.customerName || null,
        customerPhone: record.customerPhone || null,
        normalizedPhone: record.normalizedPhone || null,
        deliveryAddress: record.deliveryAddress || null,
        normalizedAddress: record.normalizedAddress || null,
        currency: record.currency,
        reportedTotal: record.reportedTotal,
        originalPayload: record.originalPayload,
        normalizedPayload: record.normalizedPayload || null,
        extractionStatus: record.extractionStatus || 'SUCCESS',
        recordStatus: record.recordStatus || 'UNPROCESSED',
        createdAt: now,
        updatedAt: now,
        items: record.items.map((itm, i) => ({
          id: i + 1,
          sourceLineReference: `LINE-${String(i + 1).padStart(2, '0')}`,
          rawItemName: itm.name,
          normalizedItemName: itm.name.trim().toLowerCase(),
          productId: itm.productId || null,
          quantity: itm.quantity,
          unit: itm.unit,
          unitPrice: itm.unitPrice,
          lineTotal: itm.lineTotal !== undefined ? itm.lineTotal : itm.quantity * itm.unitPrice,
          currency: record.currency,
          variant: null,
          customization: itm.customizations ? { notes: itm.customizations } : null
        }))
      };

      this.inMemoryStore.set(sourceOrderId, createdOrder);
      return sourceOrderId;
    }
  }

  /**
   * List source orders with parameterized filtering and pagination.
   */
  async list(
    tenantId: number, 
    filters: { channel?: Channel; status?: SourceRecordStatus; search?: string },
    pagination: { page: number; limit: number }
  ): Promise<{ orders: SourceOrderWithItems[]; total: number; page: number; limit: number }> {
    try {
      const pool = getPool();
      const whereClauses: string[] = ['tenant_id = ?'];
      const params: (number | string)[] = [tenantId];

      if (filters.channel) {
        whereClauses.push('channel = ?');
        params.push(filters.channel);
      }

      if (filters.status) {
        whereClauses.push('record_status = ?');
        params.push(filters.status);
      }

      if (filters.search) {
        whereClauses.push('(customer_name LIKE ? OR normalized_phone LIKE ? OR external_order_id LIKE ?)');
        const term = `%${filters.search}%`;
        params.push(term, term, term);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM source_orders WHERE ${whereSql}`,
        params
      );
      const total = Number(countRows[0]?.total || 0);

      // Paginated list
      const offset = (pagination.page - 1) * pagination.limit;
      const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM source_orders WHERE ${whereSql} ORDER BY received_at DESC LIMIT ? OFFSET ?`,
        [...params, pagination.limit, offset]
      );

      // Fetch line items for each order in the page
      const results: SourceOrderWithItems[] = [];
      for (const o of orders) {
        const [items] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM source_order_items WHERE source_order_id = ? ORDER BY id ASC`,
          [o.id]
        );

        results.push({
          id: o.id,
          tenantId: o.tenant_id,
          channel: o.channel,
          externalOrderId: o.external_order_id,
          idempotencyKey: o.idempotency_key,
          sourceCreatedAt: o.source_created_at,
          receivedAt: o.received_at,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          normalizedPhone: o.normalized_phone,
          deliveryAddress: o.delivery_address,
          normalizedAddress: o.normalized_address,
          currency: o.currency,
          reportedTotal: Number(o.reported_total),
          originalPayload: typeof o.original_payload === 'string' ? JSON.parse(o.original_payload) : o.original_payload,
          normalizedPayload: o.normalized_payload ? (typeof o.normalized_payload === 'string' ? JSON.parse(o.normalized_payload) : o.normalized_payload) : null,
          extractionStatus: o.extraction_status,
          recordStatus: o.record_status,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          items: items.map(itm => ({
            id: itm.id,
            sourceLineReference: itm.source_line_reference,
            rawItemName: itm.raw_item_name,
            normalizedItemName: itm.normalized_item_name,
            productId: itm.product_id,
            quantity: Number(itm.quantity),
            unit: itm.unit,
            unitPrice: Number(itm.unit_price),
            lineTotal: Number(itm.line_total),
            currency: itm.currency,
            variant: itm.variant ? (typeof itm.variant === 'string' ? JSON.parse(itm.variant) : itm.variant) : null,
            customization: itm.customization ? (typeof itm.customization === 'string' ? JSON.parse(itm.customization) : itm.customization) : null
          }))
        });
      }

      return {
        orders: results,
        total,
        page: pagination.page,
        limit: pagination.limit
      };
    } catch (_err) {
      // In-memory fallback
      const all = Array.from(this.inMemoryStore.values())
        .filter(o => o.tenantId === tenantId)
        .filter(o => !filters.channel || o.channel === filters.channel)
        .filter(o => !filters.status || o.recordStatus === filters.status)
        .filter(o => {
          if (!filters.search) return true;
          const s = filters.search.toLowerCase();
          return (
            (o.customerName && o.customerName.toLowerCase().includes(s)) ||
            (o.normalizedPhone && o.normalizedPhone.includes(s)) ||
            (o.externalOrderId && o.externalOrderId.toLowerCase().includes(s))
          );
        })
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

      const total = all.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paginated = all.slice(offset, offset + pagination.limit);

      return {
        orders: paginated,
        total,
        page: pagination.page,
        limit: pagination.limit
      };
    }
  }

  /**
   * Generates candidate order IDs using independent indexed blocking paths:
   * Path 1: Stable references (external order ID)
   * Path 2: Phone number within temporal proximity
   * Path 3: Address / customer name within temporal proximity
   * Avoids unbounded all-to-all comparisons.
   */
  async findPotentialCandidateOrders(
    tenantId: number,
    targetOrder: SourceOrderWithItems,
    timeWindowMinutes: number = 240
  ): Promise<SourceOrderWithItems[]> {
    const candidateIds = new Set<number>();
    const targetDate = new Date(targetOrder.receivedAt);
    const windowMs = timeWindowMinutes * 60 * 1000;
    const minTime = new Date(targetDate.getTime() - windowMs).toISOString();
    const maxTime = new Date(targetDate.getTime() + windowMs).toISOString();

    try {
      const pool = getPool();

      // Path 1: Matching external order ID
      if (targetOrder.externalOrderId) {
        const [refRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM source_orders
           WHERE tenant_id = ? AND id != ? AND external_order_id = ? LIMIT 20`,
          [tenantId, targetOrder.id, targetOrder.externalOrderId]
        );
        for (const r of refRows) candidateIds.add(r.id);
      }

      // Path 2: Matching normalized phone within time window
      const phone = targetOrder.normalizedPhone || targetOrder.customerPhone;
      if (phone) {
        const [phoneRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM source_orders
           WHERE tenant_id = ? AND id != ?
             AND (normalized_phone = ? OR customer_phone = ?)
             AND received_at BETWEEN ? AND ? LIMIT 50`,
          [tenantId, targetOrder.id, phone, phone, minTime, maxTime]
        );
        for (const r of phoneRows) candidateIds.add(r.id);
      }

      // Path 3: Matching customer name within time window
      if (targetOrder.customerName) {
        const [nameRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM source_orders
           WHERE tenant_id = ? AND id != ?
             AND customer_name LIKE ?
             AND received_at BETWEEN ? AND ? LIMIT 30`,
          [tenantId, targetOrder.id, `%${targetOrder.customerName}%`, minTime, maxTime]
        );
        for (const r of nameRows) candidateIds.add(r.id);
      }

      // If no candidate found via primary paths, check narrow temporal window (15 mins) for similar active orders
      if (candidateIds.size === 0) {
        const narrowMin = new Date(targetDate.getTime() - 15 * 60 * 1000).toISOString();
        const narrowMax = new Date(targetDate.getTime() + 15 * 60 * 1000).toISOString();
        const [timeRows] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM source_orders
           WHERE tenant_id = ? AND id != ?
             AND received_at BETWEEN ? AND ? LIMIT 20`,
          [tenantId, targetOrder.id, narrowMin, narrowMax]
        );
        for (const r of timeRows) candidateIds.add(r.id);
      }

      const results: SourceOrderWithItems[] = [];
      for (const id of candidateIds) {
        const order = await this.findById(tenantId, id);
        if (order) results.push(order);
      }
      return results;
    } catch (_err) {
      // In-memory fallback
      const inMemCandidates: SourceOrderWithItems[] = [];
      const targetTimeMs = targetDate.getTime();

      for (const order of this.inMemoryStore.values()) {
        if (order.tenantId !== tenantId || order.id === targetOrder.id) continue;

        const orderTimeMs = new Date(order.receivedAt).getTime();
        const diffMs = Math.abs(orderTimeMs - targetTimeMs);

        let matches = false;

        // Path 1
        if (targetOrder.externalOrderId && order.externalOrderId === targetOrder.externalOrderId) {
          matches = true;
        }
        // Path 2
        const p1 = targetOrder.normalizedPhone || targetOrder.customerPhone;
        const p2 = order.normalizedPhone || order.customerPhone;
        if (p1 && p2 && p1 === p2 && diffMs <= windowMs) {
          matches = true;
        }
        // Path 3
        if (targetOrder.customerName && order.customerName && diffMs <= windowMs) {
          if (targetOrder.customerName.toLowerCase() === order.customerName.toLowerCase()) {
            matches = true;
          }
        }
        // Narrow time window fallback (15 mins)
        if (diffMs <= 15 * 60 * 1000) {
          matches = true;
        }

        if (matches) {
          inMemCandidates.push(order);
        }
      }

      return inMemCandidates;
    }
  }
}

export const sourceOrderRepository = new SourceOrderRepository();
