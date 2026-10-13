import { RowDataPacket } from 'mysql2/promise';
import { getPool } from '../db/pool.js';

export interface ProductRecord {
  id: number;
  tenantId: number;
  sku: string;
  name: string;
  normalizedName: string;
  variant: string | null;
  unit: string;
  basePrice: number;
  dietary: 'VEG' | 'NON_VEG';
  active: boolean;
}

export class ProductRepository {
  /**
   * Find all active products for a specific tenant
   */
  async findActiveByTenant(tenantId: number): Promise<ProductRecord[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, tenant_id, sku, name, normalized_name, variant, unit, base_price, dietary, active
       FROM products
       WHERE tenant_id = ? AND active = 1
       ORDER BY name ASC`,
      [tenantId]
    );

    return rows.map(r => ({
      id: Number(r.id),
      tenantId: Number(r.tenant_id),
      sku: String(r.sku),
      name: String(r.name),
      normalizedName: String(r.normalized_name),
      variant: r.variant ? String(r.variant) : null,
      unit: String(r.unit),
      basePrice: Number(r.base_price),
      dietary: r.dietary as 'VEG' | 'NON_VEG',
      active: Boolean(r.active)
    }));
  }

  /**
   * Find a product by tenant and SKU
   */
  async findBySku(tenantId: number, sku: string): Promise<ProductRecord | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, tenant_id, sku, name, normalized_name, variant, unit, base_price, dietary, active
       FROM products
       WHERE tenant_id = ? AND sku = ?`,
      [tenantId, sku]
    );

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: Number(r.id),
      tenantId: Number(r.tenant_id),
      sku: String(r.sku),
      name: String(r.name),
      normalizedName: String(r.normalized_name),
      variant: r.variant ? String(r.variant) : null,
      unit: String(r.unit),
      basePrice: Number(r.base_price),
      dietary: r.dietary as 'VEG' | 'NON_VEG',
      active: Boolean(r.active)
    };
  }
}

export const productRepository = new ProductRepository();
