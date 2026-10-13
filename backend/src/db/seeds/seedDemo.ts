import { fileURLToPath } from 'url';
import mysql, { ResultSetHeader } from 'mysql2/promise';
import { getPool, closePool } from '../pool.js';

export async function seedDemoData(): Promise<void> {
  const pool = getPool();
  const conn = await pool.getConnection();

  console.log('[Seed] Beginning demo data seeding for PakkaOrderAI...');

  try {
    await conn.beginTransaction();

    // 1. Seed Demo Tenant: Spice Garden - Indiranagar and Tenant 2: Royal Curry House
    await conn.query(`
      INSERT INTO tenants (id, tenant_code, name, timezone, currency, gstin)
      VALUES 
        (1, 'TEN-001', 'Spice Garden - Indiranagar', 'Asia/Kolkata', 'INR', '29ABCDE1234F1Z5'),
        (2, 'TEN-002', 'Royal Curry House - Koramangala', 'Asia/Kolkata', 'INR', '29XYZDE9876F1Z2')
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        timezone = VALUES(timezone),
        currency = VALUES(currency),
        gstin = VALUES(gstin);
    `);

    const tenantId = 1;
    console.log(`[Seed] Tenants configured with IDs: 1 (TEN-001) and 2 (TEN-002)`);

    // 2. Seed Users
    await conn.query(`
      INSERT INTO users (tenant_id, name, email, role, status)
      VALUES 
        (?, 'Aarav Mehta', 'aarav.mehta@spicegarden.in', 'LEAD_OPS', 'ACTIVE'),
        (?, 'Pooja Sharma', 'pooja.s@spicegarden.in', 'CASHIER', 'ACTIVE')
      ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), status = VALUES(status);
    `, [tenantId, tenantId]);

    const [userRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE tenant_id = ? AND email = ?',
      [tenantId, 'aarav.mehta@spicegarden.in']
    );
    const leadOpsUserId = userRows[0].id as number;

    // 3. Seed Canonical Product Catalog
    const products = [
      { sku: 'SKU-PAN-01', name: 'Paneer Tikka Roll', norm: 'paneer tikka roll', price: 240.00, veg: 'VEG', unit: 'roll' },
      { sku: 'SKU-MC-04', name: 'Butter Chicken (Boneless)', norm: 'butter chicken boneless', price: 380.00, veg: 'NON_VEG', unit: 'portion' },
      { sku: 'SKU-DAL-01', name: 'Dal Makhani', norm: 'dal makhani', price: 260.00, veg: 'VEG', unit: 'portion' },
      { sku: 'SKU-ROTI-01', name: 'Garlic Naan', norm: 'garlic naan', price: 50.00, veg: 'VEG', unit: 'piece' },
      { sku: 'SKU-BEV-01', name: 'Masala Chaas', norm: 'masala chaas', price: 40.00, veg: 'VEG', unit: 'glass' },
      { sku: 'SKU-BRY-01', name: 'Dum Biryani (Chicken)', norm: 'dum biryani chicken', price: 340.00, veg: 'NON_VEG', unit: 'portion' }
    ];

    for (const p of products) {
      await conn.query(`
        INSERT INTO products (tenant_id, sku, name, normalized_name, base_price, dietary, unit, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          normalized_name = VALUES(normalized_name),
          base_price = VALUES(base_price),
          dietary = VALUES(dietary);
      `, [tenantId, p.sku, p.name, p.norm, p.price, p.veg, p.unit]);
    }
    console.log(`[Seed] Seeded ${products.length} canonical catalog items.`);

    // Fetch product ID for Paneer Tikka Roll
    const [paneerRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM products WHERE tenant_id = ? AND sku = ?',
      [tenantId, 'SKU-PAN-01']
    );
    const paneerRollProductId = paneerRows[0].id as number;

    // 4. Seed Source Orders (Zomato 2 rolls vs WhatsApp 3 rolls conflict scenario)
    // Source Order A (Zomato: Qty 2)
    const rawPayloadA = JSON.stringify({
      order_id: 'ZOM-8921',
      partner: 'ZOMATO',
      items: [{ item_name: 'Paneer Tikka Roll', qty: 2, price: 240.00 }],
      customer: { name: 'Priya Sharma', phone: '+91 98765 43210', address: 'Prestige Ozone Flat 402, Indiranagar' },
      timestamp: '2026-10-12T12:02:10Z'
    });

    const [srcA] = await conn.query<ResultSetHeader>(`
      INSERT INTO source_orders (
        tenant_id, channel, external_order_id, idempotency_key, source_created_at,
        customer_name, customer_phone, normalized_phone, delivery_address, normalized_address,
        currency, reported_total, original_payload, extraction_status, record_status
      ) VALUES (
        ?, 'ZOMATO', 'ZOM-8921', 'IDEM-ZOM-8921-20261012', '2026-10-12 12:02:10.000',
        'Priya Sharma', '+91 98765 43210', '+919876543210', 'Flat 402, Prestige Ozone, Indiranagar, Bangalore', 'prestige ozone 402 indiranagar bangalore',
        'INR', 504.00, ?, 'SUCCESS', 'LINKED_CANONICAL'
      )
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
    `, [tenantId, rawPayloadA]);
    const sourceAId = srcA.insertId;

    // Source Order A items
    await conn.query(`
      DELETE FROM source_order_items WHERE source_order_id = ?;
    `, [sourceAId]);
    await conn.query(`
      INSERT INTO source_order_items (
        source_order_id, source_line_reference, raw_item_name, normalized_item_name,
        product_id, quantity, unit, unit_price, line_total, extraction_confidence
      ) VALUES (
        ?, 'LINE-01', 'Paneer Tikka Roll', 'paneer tikka roll',
        ?, 2.000, 'roll', 240.00, 480.00, 0.9900
      );
    `, [sourceAId, paneerRollProductId]);

    // Source Order B (WhatsApp: Qty 3 update)
    const rawPayloadB = JSON.stringify({
      channel: 'WHATSAPP',
      message: 'bhaiya paneer roll 2 nahi 3 kardo please. address same prestige ozone flat 402',
      sender_phone: '+919876543210',
      received_at: '2026-10-12T12:03:45Z'
    });

    const [srcB] = await conn.query<ResultSetHeader>(`
      INSERT INTO source_orders (
        tenant_id, channel, external_order_id, idempotency_key, source_created_at,
        customer_name, customer_phone, normalized_phone, delivery_address, normalized_address,
        currency, reported_total, original_payload, extraction_status, record_status
      ) VALUES (
        ?, 'WHATSAPP', 'WA-9912', 'IDEM-WA-9912-20261012', '2026-10-12 12:03:45.000',
        'Priya Sharma', '+91 98765 43210', '+919876543210', 'Prestige Ozone Flat 402, Indiranagar', 'prestige ozone 402 indiranagar bangalore',
        'INR', 756.00, ?, 'SUCCESS', 'CANDIDATE_SEARCHED'
      )
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
    `, [tenantId, rawPayloadB]);
    const sourceBId = srcB.insertId;

    // Source Order B items
    await conn.query(`
      DELETE FROM source_order_items WHERE source_order_id = ?;
    `, [sourceBId]);
    await conn.query(`
      INSERT INTO source_order_items (
        source_order_id, source_line_reference, raw_item_name, normalized_item_name,
        product_id, quantity, unit, unit_price, line_total, extraction_confidence
      ) VALUES (
        ?, 'WA-LINE-01', 'Paneer Tikka Roll', 'paneer tikka roll',
        ?, 3.000, 'roll', 240.00, 720.00, 0.9600
      );
    `, [sourceBId, paneerRollProductId]);

    console.log(`[Seed] Seeded source orders: Source A=${sourceAId}, Source B=${sourceBId}`);

    // 5. Seed Canonical Order ORD-1042
    const [canOrder] = await conn.query<ResultSetHeader>(`
      INSERT INTO canonical_orders (
        tenant_id, order_ref, customer_name, customer_phone, delivery_address,
        status, currency, subtotal, tax, accepted_total, reconciliation_rule_applied, correlation_hash, version
      ) VALUES (
        ?, 'ORD-1042', 'Priya Sharma', '+91 98765 43210', 'Flat 402, Prestige Ozone, Indiranagar, Bangalore',
        'HELD_FOR_REVIEW', 'INR', 480.00, 24.00, 504.00, 'PENDING_OPERATOR_SIGN_OFF', '0x8921WA9912', 1
      )
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
    `, [tenantId]);
    const canonicalId = canOrder.insertId;

    // Canonical items
    await conn.query(`
      DELETE FROM canonical_order_items WHERE canonical_order_id = ?;
    `, [canonicalId]);
    await conn.query(`
      INSERT INTO canonical_order_items (
        canonical_order_id, product_id, item_name, quantity, unit, unit_price, line_total
      ) VALUES (
        ?, ?, 'Paneer Tikka Roll', 2.000, 'roll', 240.00, 480.00
      );
    `, [canonicalId, paneerRollProductId]);

    // 6. Seed Order Link (Source A actively linked to Canonical ORD-1042)
    await conn.query(`
      INSERT INTO order_links (
        tenant_id, source_order_id, canonical_order_id, link_type, linked_by, linked_at
      ) VALUES (
        ?, ?, ?, 'INITIAL_CANONICAL', 'SYSTEM', '2026-10-12 12:02:15.000'
      )
      ON DUPLICATE KEY UPDATE id=id;
    `, [tenantId, sourceAId, canonicalId]);

    // 7. Seed Duplicate Candidate Pair (Ensuring source_a_id < source_b_id)
    const lowerId = Math.min(sourceAId, sourceBId);
    const higherId = Math.max(sourceAId, sourceBId);

    const matchFeatures = JSON.stringify({
      phoneMatch: 1.0,
      nameJaroWinkler: 0.98,
      addressLevenshtein: 0.92,
      timeDeltaMinutes: 1.58,
      itemOverlap: ['SKU-PAN-01'],
      quantityVariance: { sourceA: 2, sourceB: 3, delta: 1 },
      heuristicVerdict: 'SUSPECTED_UPDATE'
    });

    const [candidateResult] = await conn.query<ResultSetHeader>(`
      INSERT INTO duplicate_candidates (
        tenant_id, source_a_id, source_b_id, match_score, match_features,
        algorithm_version, relationship_type, review_status
      ) VALUES (
        ?, ?, ?, 0.9420, ?,
        'v2.1-heuristic', 'SUSPECTED_UPDATE', 'PENDING'
      )
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
    `, [tenantId, lowerId, higherId, matchFeatures]);
    const candidateId = candidateResult.insertId;

    // 8. Seed Material Conflict (Quantity Mismatch 2 vs 3)
    await conn.query(`
      DELETE FROM order_conflicts WHERE candidate_id = ?;
    `, [candidateId]);
    await conn.query(`
      INSERT INTO order_conflicts (
        tenant_id, candidate_id, conflict_type, field_path,
        value_a, value_b, severity, resolution_status, resolution_notes
      ) VALUES (
        ?, ?, 'QUANTITY_MISMATCH', 'items[sku:SKU-PAN-01].quantity',
        JSON_OBJECT('quantity', 2, 'unitPrice', 240, 'subtotal', 480),
        JSON_OBJECT('quantity', 3, 'unitPrice', 240, 'subtotal', 720),
        'CRITICAL', 'UNRESOLVED',
        'Quantity Mismatch: Source A has 2 Paneer Tikka Rolls, Source B requests 3 rolls. Rule #QNT-04 prohibits auto-merge. Human approval required.'
      );
    `, [tenantId, candidateId]);

    // 9. Seed Audit Events
    await conn.query(`
      INSERT INTO audit_events (
        tenant_id, actor_type, actor_user_id, actor_name, actor_role,
        entity_type, entity_id, action, justification, correlation_id, signature
      ) VALUES 
      (
        ?, 'SYSTEM', NULL, 'Ingestion Engine', 'PIPELINE',
        'SOURCE_ORDER', CAST(? AS CHAR), 'INGEST_CREATED',
        'Zomato webhook received and verified. Idempotency key checked.',
        'CORR-ZOM-8921', 'HMAC-SHA256: 0x9b1c7a82...verified'
      ),
      (
        ?, 'SYSTEM', NULL, 'OrderTruth AI Matcher', 'ENGINE',
        'DUPLICATE_CANDIDATE', CAST(? AS CHAR), 'CONFLICT_FLAGGED',
        'Match score 94.20/100 flagged critical quantity contradiction (+1 roll variance). Auto-merge blocked by Rule #QNT-04.',
        'CORR-CAN-8841', 'HMAC-SHA256: 0x4f2e99d1...verified'
      ),
      (
        ?, 'USER', ?, 'Aarav Mehta', 'LEAD_OPS',
        'SETTINGS', 'TEN-001', 'SETTINGS_UPDATED',
        'Configured auto-merge threshold to 95 and locked Rule #QNT-04.',
        'CORR-SET-001', 'HMAC-SHA256: 0x88c2...verified'
      );
    `, [tenantId, sourceAId, tenantId, candidateId, tenantId, leadOpsUserId]);

    await conn.commit();
    console.log('[Seed] ✓ Demo data successfully seeded for Spice Garden - Indiranagar!');
  } catch (error) {
    await conn.rollback();
    console.error('[Seed] ❌ Failed to seed demo data:', error);
    throw error;
  } finally {
    conn.release();
  }
}

// Direct execution CLI entrypoint
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDemoData()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Fatal seed failure:', err);
      await closePool();
      process.exit(1);
    });
}
