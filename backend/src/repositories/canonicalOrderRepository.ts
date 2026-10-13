import { getPool } from '../db/pool.js';
import type { CanonicalStatus } from '../types/index.js';
import type { SourceOrderWithItems } from './sourceOrderRepository.js';

export interface CanonicalOrderItem {
  id?: number;
  canonicalOrderId?: number;
  productId?: number | null;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CanonicalOrderWithItems {
  id: number;
  tenantId: number;
  orderRef: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  status: CanonicalStatus;
  currency: string;
  subtotal: number;
  tax: number;
  acceptedTotal: number;
  reconciliationRuleApplied: string | null;
  correlationHash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  items: CanonicalOrderItem[];
}

const inMemoryCanonicalOrders = new Map<number, CanonicalOrderWithItems>();
let canonicalAutoId = 1042;

export class CanonicalOrderRepository {
  /**
   * Creates a new canonical order and its items from a source order.
   */
  async createFromSourceOrder(
    tenantId: number,
    source: SourceOrderWithItems,
    ruleApplied: string = 'INITIAL_INGESTION'
  ): Promise<CanonicalOrderWithItems> {
    const orderRef = `CAN-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    const correlationHash = `hash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const subtotal = source.reportedTotal || source.items.reduce((sum, itm) => sum + itm.lineTotal, 0);
    const tax = subtotal * 0.05;
    const acceptedTotal = subtotal + tax;

    try {
      const pool = getPool();
      const [res] = await pool.execute<any>(
        `INSERT INTO canonical_orders (
           tenant_id, order_ref, customer_name, customer_phone, delivery_address,
           status, currency, subtotal, tax, accepted_total, reconciliation_rule_applied,
           correlation_hash, version, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [
          tenantId,
          orderRef,
          source.customerName,
          source.customerPhone,
          source.deliveryAddress,
          source.currency || 'INR',
          subtotal.toFixed(2),
          tax.toFixed(2),
          acceptedTotal.toFixed(2),
          ruleApplied,
          correlationHash
        ]
      );

      const canonicalId = res.insertId;

      for (const itm of source.items) {
        await pool.execute(
          `INSERT INTO canonical_order_items (
             canonical_order_id, product_id, item_name, quantity, unit,
             unit_price, line_total, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
          [
            canonicalId,
            itm.productId || null,
            itm.normalizedItemName || itm.rawItemName,
            itm.quantity,
            itm.unit || 'portion',
            itm.unitPrice.toFixed(2),
            itm.lineTotal.toFixed(2)
          ]
        );
      }

      return (await this.findById(tenantId, canonicalId))!;
    } catch (_err) {
      // In-Memory Fallback
      const canonicalId = ++canonicalAutoId;
      const now = new Date().toISOString();
      const items: CanonicalOrderItem[] = source.items.map((itm, idx) => ({
        id: idx + 1,
        canonicalOrderId: canonicalId,
        productId: itm.productId,
        itemName: itm.normalizedItemName || itm.rawItemName,
        quantity: itm.quantity,
        unit: itm.unit || 'portion',
        unitPrice: itm.unitPrice,
        lineTotal: itm.lineTotal
      }));

      const record: CanonicalOrderWithItems = {
        id: canonicalId,
        tenantId,
        orderRef,
        customerName: source.customerName,
        customerPhone: source.customerPhone,
        deliveryAddress: source.deliveryAddress,
        status: 'CONFIRMED',
        currency: source.currency || 'INR',
        subtotal,
        tax,
        acceptedTotal,
        reconciliationRuleApplied: ruleApplied,
        correlationHash,
        version: 1,
        createdAt: now,
        updatedAt: now,
        items
      };

      inMemoryCanonicalOrders.set(canonicalId, record);
      return record;
    }
  }

  /**
   * Find canonical order by ID.
   */
  async findById(tenantId: number, id: number): Promise<CanonicalOrderWithItems | null> {
    try {
      const pool = getPool();
      const [rows] = await pool.execute<any[]>(
        `SELECT * FROM canonical_orders WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      if (!rows.length) return null;
      const o = rows[0];

      const [itemRows] = await pool.execute<any[]>(
        `SELECT * FROM canonical_order_items WHERE canonical_order_id = ? ORDER BY id ASC`,
        [id]
      );

      return {
        id: o.id,
        tenantId: o.tenant_id,
        orderRef: o.order_ref,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        deliveryAddress: o.delivery_address,
        status: o.status,
        currency: o.currency,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        acceptedTotal: Number(o.accepted_total),
        reconciliationRuleApplied: o.reconciliation_rule_applied,
        correlationHash: o.correlation_hash,
        version: o.version,
        createdAt: new Date(o.created_at).toISOString(),
        updatedAt: new Date(o.updated_at).toISOString(),
        items: itemRows.map(itm => ({
          id: itm.id,
          canonicalOrderId: itm.canonical_order_id,
          productId: itm.product_id,
          itemName: itm.item_name,
          quantity: Number(itm.quantity),
          unit: itm.unit,
          unitPrice: Number(itm.unit_price),
          lineTotal: Number(itm.line_total)
        }))
      };
    } catch (_err) {
      // In-Memory Fallback
      const record = inMemoryCanonicalOrders.get(id);
      if (record && record.tenantId === tenantId) return record;
      return null;
    }
  }

  /**
   * Mutates item quantity with optimistic concurrency control on expected canonical version.
   * Throws Error with code 'ERR_STALE_VERSION' if version mismatch occurs.
   */
  async updateItemQuantityWithVersionCheck(
    tenantId: number,
    canonicalOrderId: number,
    itemNameOrField: string,
    newQuantity: number,
    expectedVersion?: number,
    ruleApplied?: string
  ): Promise<CanonicalOrderWithItems> {
    const existing = await this.findById(tenantId, canonicalOrderId);
    if (!existing) {
      throw new Error(`Canonical order ${canonicalOrderId} not found.`);
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      const err = new Error(`Stale canonical order version: expected ${expectedVersion}, but current is ${existing.version}.`);
      (err as any).code = 'ERR_STALE_VERSION';
      (err as any).currentVersion = existing.version;
      throw err;
    }

    try {
      const pool = getPool();

      // Clean field path e.g. "items[Paneer Tikka Roll].quantity" -> "Paneer Tikka Roll"
      const cleanName = itemNameOrField.replace(/^items\[(.*?)\]\.quantity$/, '$1').trim();

      // Find item
      const itemToUpdate = existing.items.find(i => 
        i.itemName.toLowerCase().includes(cleanName.toLowerCase()) || 
        cleanName.toLowerCase().includes(i.itemName.toLowerCase())
      ) || existing.items[0];

      if (!itemToUpdate) {
        throw new Error(`Item ${cleanName} not found in canonical order.`);
      }

      const newLineTotal = newQuantity * itemToUpdate.unitPrice;

      // Update line item
      await pool.execute(
        `UPDATE canonical_order_items
         SET quantity = ?, line_total = ?
         WHERE id = ? AND canonical_order_id = ?`,
        [newQuantity, newLineTotal.toFixed(2), itemToUpdate.id ?? 0, canonicalOrderId]
      );

      // Recompute totals
      const updatedItems = existing.items.map(i => {
        if (i.id === itemToUpdate.id) {
          return { ...i, quantity: newQuantity, lineTotal: newLineTotal };
        }
        return i;
      });

      const newSubtotal = updatedItems.reduce((sum, i) => sum + i.lineTotal, 0);
      const newTax = newSubtotal * 0.05;
      const newTotal = newSubtotal + newTax;

      // Update order with version increment
      const [updateRes] = await pool.execute<any>(
        `UPDATE canonical_orders
         SET subtotal = ?, tax = ?, accepted_total = ?,
             reconciliation_rule_applied = ?, version = version + 1,
             updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ? AND tenant_id = ? AND version = ?`,
        [
          newSubtotal.toFixed(2),
          newTax.toFixed(2),
          newTotal.toFixed(2),
          ruleApplied || existing.reconciliationRuleApplied,
          canonicalOrderId,
          tenantId,
          existing.version
        ]
      );

      if (updateRes.affectedRows === 0) {
        const err = new Error(`Concurrent modification detected on canonical order ${canonicalOrderId}.`);
        (err as any).code = 'ERR_STALE_VERSION';
        throw err;
      }

      return (await this.findById(tenantId, canonicalOrderId))!;
    } catch (err: any) {
      if (err.code === 'ERR_STALE_VERSION') throw err;

      // In-Memory Fallback
      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        const err = new Error(`Stale canonical order version: expected ${expectedVersion}, but current is ${existing.version}.`);
        (err as any).code = 'ERR_STALE_VERSION';
        (err as any).currentVersion = existing.version;
        throw err;
      }

      const cleanName = itemNameOrField.replace(/^items\[(.*?)\]\.quantity$/, '$1').trim();
      const itemToUpdate = existing.items.find(i => 
        i.itemName.toLowerCase().includes(cleanName.toLowerCase()) || 
        cleanName.toLowerCase().includes(i.itemName.toLowerCase())
      ) || existing.items[0];

      if (itemToUpdate) {
        itemToUpdate.quantity = newQuantity;
        itemToUpdate.lineTotal = newQuantity * itemToUpdate.unitPrice;
      }

      existing.subtotal = existing.items.reduce((sum, i) => sum + i.lineTotal, 0);
      existing.tax = existing.subtotal * 0.05;
      existing.acceptedTotal = existing.subtotal + existing.tax;
      existing.reconciliationRuleApplied = ruleApplied || existing.reconciliationRuleApplied;
      existing.version += 1;
      existing.updatedAt = new Date().toISOString();

      return existing;
    }
  }

  resetStore(): void {
    inMemoryCanonicalOrders.clear();
    canonicalAutoId = 1042;
  }
}

export const canonicalOrderRepository = new CanonicalOrderRepository();
