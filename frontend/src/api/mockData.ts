import type { 
  SourceOrder, 
  CanonicalOrder, 
  DuplicateCandidate, 
  CatalogItem, 
  AuditRecord, 
  BusinessSettings 
} from '../types';

export const MOCK_SOURCE_A_ZOMATO: SourceOrder = {
  id: 'SRC-9182',
  referenceId: 'ZOM-8921',
  channel: 'ZOMATO',
  tenantId: 'TEN-001',
  customerName: 'Priya Sharma',
  customerPhone: '+91 98765 ****10',
  deliveryAddress: 'Flat 402, Prestige Ozone, Indiranagar, Bangalore - 560038',
  subtotal: 720.0,
  tax: 36.0,
  totalAmount: 756.0,
  receivedAt: '2026-10-12T12:02:10Z',
  status: 'CONFLICT_REVIEW',
  notes: 'Less oil in food please',
  rawPayloadSnippet: '{"provider":"zomato","order_id":"ZOM-8921","items":[{"name":"Paneer Tikka Roll","qty":2,"price":240},{"name":"Butter Garlic Naan","qty":2,"price":80},{"name":"Masala Chaas","qty":2,"price":40}]}',
  items: [
    {
      id: 'ITM-01',
      sku: 'SKU-PAN-01',
      name: 'Paneer Tikka Roll',
      quantity: 2,
      unitPrice: 240,
      totalPrice: 480,
      dietary: 'VEG',
      customizations: ['Less oil']
    },
    {
      id: 'ITM-02',
      sku: 'SKU-BRD-02',
      name: 'Butter Garlic Naan',
      quantity: 2,
      unitPrice: 80,
      totalPrice: 160,
      dietary: 'VEG'
    },
    {
      id: 'ITM-03',
      sku: 'SKU-BEV-01',
      name: 'Masala Chaas',
      quantity: 2,
      unitPrice: 40,
      totalPrice: 80,
      dietary: 'VEG'
    }
  ]
};

export const MOCK_SOURCE_B_WHATSAPP: SourceOrder = {
  id: 'SRC-9201',
  referenceId: 'WAPP-104',
  channel: 'WHATSAPP',
  tenantId: 'TEN-001',
  customerName: 'Priya S',
  customerPhone: '+91 98765 ****10',
  deliveryAddress: 'Prestige Ozone, 100ft road indiranagar, Flat 402',
  subtotal: 960.0,
  tax: 48.0,
  totalAmount: 1008.0,
  receivedAt: '2026-10-12T12:03:45Z', // 95 seconds later
  status: 'CONFLICT_REVIEW',
  notes: 'bhai please add extra chutney with rolls and make them 3',
  rawPayloadSnippet: '{"channel":"whatsapp_cloud","text":"bhaiya rolls 3 kar do aur extra green chutney daal dena. prestige ozone 402","sender":"+919876543210"}',
  items: [
    {
      id: 'ITM-04',
      sku: 'SKU-PAN-01',
      name: 'Paneer Tikka Roll',
      quantity: 3, // CRITICAL CONFLICT: 3 vs 2
      unitPrice: 240,
      totalPrice: 720,
      dietary: 'VEG',
      customizations: ['Extra mint chutney', 'Customer increased quantity']
    },
    {
      id: 'ITM-05',
      sku: 'SKU-BRD-02',
      name: 'Butter Garlic Naan',
      quantity: 2,
      unitPrice: 80,
      totalPrice: 160,
      dietary: 'VEG'
    },
    {
      id: 'ITM-06',
      sku: 'SKU-BEV-01',
      name: 'Masala Chaas',
      quantity: 2,
      unitPrice: 40,
      totalPrice: 80,
      dietary: 'VEG'
    }
  ]
};

export const MOCK_CANDIDATE_CAN8841: DuplicateCandidate = {
  id: 'CAN-8841',
  candidatePairId: 'CAN-8841',
  tenantId: 'TEN-001',
  sourceA: MOCK_SOURCE_A_ZOMATO,
  sourceB: MOCK_SOURCE_B_WHATSAPP,
  heuristicScore: 94,
  scoreAlgorithmVersion: 'v2.1-deterministic-rule-engine',
  conflictType: 'QUANTITY_MISMATCH',
  severity: 'CRITICAL',
  conflictDescription: 'Material Conflict: Quantity Mismatch on Paneer Tikka Roll (2 vs 3). Zero Auto-Merge Policy enforced: quantities will NOT be summed or auto-merged.',
  slaExpiresAt: '2026-10-12T12:15:00Z',
  status: 'PENDING',
  assignedOperator: 'Pranav M. (Lead Ops)',
  scoreBreakdown: {
    phoneMatch: 100,
    addressMatch: 96,
    timestampProximity: 92,
    catalogOverlap: 90
  }
};

export const MOCK_CANDIDATES: DuplicateCandidate[] = [
  MOCK_CANDIDATE_CAN8841,
  {
    id: 'CAN-8839',
    candidatePairId: 'CAN-8839',
    tenantId: 'TEN-001',
    sourceA: {
      id: 'SRC-9192',
      referenceId: 'WAPP-098',
      channel: 'WHATSAPP',
      tenantId: 'TEN-001',
      customerName: 'Rohan Verma',
      customerPhone: '+91 98450 ****44',
      deliveryAddress: '12th Main, Koramangala 4th Block',
      subtotal: 580,
      tax: 29,
      totalAmount: 609,
      receivedAt: '2026-10-12T11:58:12Z',
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-07', sku: 'SKU-DAL-01', name: 'Dal Makhani', quantity: 1, unitPrice: 280, totalPrice: 280, customizations: ['Extra Spicy', 'No Onions'] }]
    },
    sourceB: {
      id: 'SRC-9195',
      referenceId: 'SWG-8821',
      channel: 'SWIGGY',
      tenantId: 'TEN-001',
      customerName: 'Rohan V',
      customerPhone: '+91 98450 ****44',
      deliveryAddress: '12th Main, Koramangala 4th Block',
      subtotal: 580,
      tax: 29,
      totalAmount: 609,
      receivedAt: '2026-10-12T11:59:04Z',
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-08', sku: 'SKU-DAL-01', name: 'Dal Makhani', quantity: 1, unitPrice: 280, totalPrice: 280, customizations: ['Regular spice'] }]
    },
    heuristicScore: 91,
    scoreAlgorithmVersion: 'v2.1-deterministic-rule-engine',
    conflictType: 'MODIFIER_VARIANCE',
    severity: 'WARNING',
    conflictDescription: 'Modifier Discrepancy: "Extra Spicy & No Onions" vs "Regular Spice" on Dal Makhani.',
    slaExpiresAt: '2026-10-12T12:05:00Z',
    status: 'IN_REVIEW',
    assignedOperator: 'Pranav M.',
    scoreBreakdown: { phoneMatch: 100, addressMatch: 98, timestampProximity: 95, catalogOverlap: 85 }
  },
  {
    id: 'CAN-8835',
    candidatePairId: 'CAN-8835',
    tenantId: 'TEN-001',
    sourceA: {
      id: 'SRC-9177',
      referenceId: 'POS-8835',
      channel: 'POS',
      tenantId: 'TEN-001',
      customerName: 'Ananya Iyer',
      customerPhone: '+91 99001 ****82',
      deliveryAddress: '24th Cross, HSR Layout Sector 2',
      subtotal: 620,
      tax: 31,
      totalAmount: 651,
      receivedAt: '2026-10-12T11:42:10Z',
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-09', sku: 'SKU-BIR-02', name: 'Chicken Dum Biryani', quantity: 1, unitPrice: 320, totalPrice: 320 }]
    },
    sourceB: {
      id: 'SRC-9179',
      referenceId: 'ZOM-2291',
      channel: 'ZOMATO',
      tenantId: 'TEN-001',
      customerName: 'Ananya I',
      customerPhone: '+91 99001 ****82',
      deliveryAddress: '24th Cross, HSR Layout Sector 2',
      subtotal: 620,
      tax: 31,
      totalAmount: 651,
      receivedAt: '2026-10-12T11:42:48Z', // 38s apart
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-10', sku: 'SKU-BIR-02', name: 'Chicken Dum Biryani', quantity: 1, unitPrice: 320, totalPrice: 320 }]
    },
    heuristicScore: 98,
    scoreAlgorithmVersion: 'v2.1-deterministic-rule-engine',
    conflictType: 'DUPLICATE_TIMESTAMP',
    severity: 'INFO',
    conflictDescription: 'Timing Duplicate (<45s apart): Identical cart items submitted across POS and Zomato.',
    slaExpiresAt: '2026-10-12T11:55:00Z',
    status: 'PENDING',
    scoreBreakdown: { phoneMatch: 100, addressMatch: 100, timestampProximity: 98, catalogOverlap: 100 }
  },
  {
    id: 'CAN-8828',
    candidatePairId: 'CAN-8828',
    tenantId: 'TEN-001',
    sourceA: {
      id: 'SRC-9150',
      referenceId: 'MAN-1082',
      channel: 'MANUAL',
      tenantId: 'TEN-001',
      customerName: 'Vikram Rao',
      customerPhone: '+91 97412 ****99',
      deliveryAddress: 'Whitefield Inner Circle Road',
      subtotal: 450,
      tax: 22.5,
      totalAmount: 472.5,
      receivedAt: '2026-10-12T11:15:30Z',
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-11', sku: 'SKU-MC-04', name: 'Butter Chicken (Half)', quantity: 1, unitPrice: 240, totalPrice: 240 }]
    },
    sourceB: {
      id: 'SRC-9154',
      referenceId: 'WAPP-094',
      channel: 'WHATSAPP',
      tenantId: 'TEN-001',
      customerName: 'Vikram R',
      customerPhone: '+91 97412 ****99',
      deliveryAddress: 'Whitefield Inner Circle',
      subtotal: 520,
      tax: 26,
      totalAmount: 546,
      receivedAt: '2026-10-12T11:18:00Z',
      status: 'CONFLICT_REVIEW',
      items: [{ id: 'ITM-12', sku: 'SKU-MC-04', name: 'Butter Chicken (Full)', quantity: 1, unitPrice: 380, totalPrice: 380 }]
    },
    heuristicScore: 88,
    scoreAlgorithmVersion: 'v2.1-deterministic-rule-engine',
    conflictType: 'PRICE_DISCREPANCY',
    severity: 'WARNING',
    conflictDescription: 'Price/Portion Variance: Half Portion (₹240) vs Full Portion (₹380). Requires cashier verification.',
    slaExpiresAt: '2026-10-12T11:45:00Z',
    status: 'PENDING',
    scoreBreakdown: { phoneMatch: 100, addressMatch: 94, timestampProximity: 82, catalogOverlap: 80 }
  }
];

export const MOCK_CANONICAL_ORDERS: CanonicalOrder[] = [
  {
    id: 'CAN-ORD-1042',
    orderNumber: 'ORD-1042',
    tenantId: 'TEN-001',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 ****10',
    deliveryAddress: 'Flat 402, Prestige Ozone, Indiranagar',
    subtotal: 960.0,
    tax: 48.0,
    totalAmount: 1008.0,
    sourceOrderIds: ['SRC-9182', 'SRC-9201'],
    channels: ['ZOMATO', 'WHATSAPP'],
    createdAt: '2026-10-12T12:02:10Z',
    updatedAt: '2026-10-12T12:04:18Z',
    reconciliationRuleApplied: 'CONFIRM_AUTHORIZED_UPDATE (Quantity amended to 3)',
    correlationHash: '0x8841fd91ce09',
    status: 'CONFIRMED',
    items: [
      { id: 'CI-1', sku: 'SKU-PAN-01', name: 'Paneer Tikka Roll', quantity: 3, unitPrice: 240, totalPrice: 720, dietary: 'VEG' },
      { id: 'CI-2', sku: 'SKU-BRD-02', name: 'Butter Garlic Naan', quantity: 2, unitPrice: 80, totalPrice: 160, dietary: 'VEG' },
      { id: 'CI-3', sku: 'SKU-BEV-01', name: 'Masala Chaas', quantity: 2, unitPrice: 40, totalPrice: 80, dietary: 'VEG' }
    ]
  },
  {
    id: 'CAN-ORD-1041',
    orderNumber: 'ORD-1041',
    tenantId: 'TEN-001',
    customerName: 'Aditya Nair',
    customerPhone: '+91 98112 ****55',
    deliveryAddress: 'HAL 2nd Stage, Indiranagar',
    subtotal: 420.0,
    tax: 21.0,
    totalAmount: 441.0,
    sourceOrderIds: ['SRC-9170'],
    channels: ['SWIGGY'],
    createdAt: '2026-10-12T11:55:00Z',
    updatedAt: '2026-10-12T11:55:00Z',
    reconciliationRuleApplied: 'SINGLE_SOURCE_CLEAN',
    correlationHash: '0x9928bc10a12e',
    status: 'DISPATCHED',
    items: [
      { id: 'CI-4', sku: 'SKU-PAN-01', name: 'Paneer Tikka Roll', quantity: 1, unitPrice: 240, totalPrice: 240, dietary: 'VEG' },
      { id: 'CI-5', sku: 'SKU-BEV-01', name: 'Masala Chaas', quantity: 1, unitPrice: 40, totalPrice: 40, dietary: 'VEG' }
    ]
  },
  {
    id: 'CAN-ORD-1040',
    orderNumber: 'ORD-1040',
    tenantId: 'TEN-001',
    customerName: 'Kavita Menon',
    customerPhone: '+91 97401 ****33',
    deliveryAddress: 'Domlur Layout, Bangalore',
    subtotal: 840.0,
    tax: 42.0,
    totalAmount: 882.0,
    sourceOrderIds: ['SRC-9160', 'SRC-9161'],
    channels: ['POS', 'ZOMATO'],
    createdAt: '2026-10-12T11:45:00Z',
    updatedAt: '2026-10-12T11:46:10Z',
    reconciliationRuleApplied: 'CONFIRM_DUPLICATE_ENTRY (Voided POS ghost receipt)',
    correlationHash: '0x7711ab99812f',
    status: 'DISPATCHED',
    items: [
      { id: 'CI-6', sku: 'SKU-MC-04', name: 'Butter Chicken', quantity: 2, unitPrice: 380, totalPrice: 760, dietary: 'NON_VEG' },
      { id: 'CI-7', sku: 'SKU-BRD-02', name: 'Butter Garlic Naan', quantity: 1, unitPrice: 80, totalPrice: 80, dietary: 'VEG' }
    ]
  }
];

export const MOCK_CATALOG_ITEMS: CatalogItem[] = [
  {
    sku: 'SKU-PAN-01',
    name: 'Paneer Tikka Roll',
    category: 'Rolls & Wraps',
    dietary: 'VEG',
    basePrice: 240,
    variants: ['Regular (1 pc)', 'Jumbo (Double Paneer)'],
    active: true,
    mappings: {
      zomatoName: 'Paneer Tikka Kathi Roll',
      zomatoPrice: 260,
      swiggyName: 'Special Paneer Roll',
      swiggyPrice: 260,
      posCode: 'PTR-REG-01',
      posPrice: 240,
      aliases: ['paneer roll', 'paneer tikka roll', 'p roll', 'paneer kathi']
    }
  },
  {
    sku: 'SKU-MC-04',
    name: 'Butter Chicken (Murgh Makhani)',
    category: 'Main Course',
    dietary: 'NON_VEG',
    basePrice: 380,
    variants: ['Half (2 pcs)', 'Full (4 pcs)'],
    active: true,
    mappings: {
      zomatoName: 'Butter Chicken Boneless',
      zomatoPrice: 410,
      swiggyName: 'Delhi Style Butter Chicken',
      swiggyPrice: 410,
      posCode: 'BC-BNL-04',
      posPrice: 380,
      aliases: ['butter chicken', 'makhani chicken', 'bc half', 'bc full']
    }
  },
  {
    sku: 'SKU-BRD-02',
    name: 'Butter Garlic Naan',
    category: 'Breads',
    dietary: 'VEG',
    basePrice: 80,
    variants: ['Single Piece'],
    active: true,
    mappings: {
      zomatoName: 'Garlic Butter Naan',
      zomatoPrice: 90,
      swiggyName: 'Garlic Naan with Butter',
      swiggyPrice: 90,
      posCode: 'NAAN-BTR-02',
      posPrice: 80,
      aliases: ['garlic naan', 'butter naan', 'bgn']
    }
  },
  {
    sku: 'SKU-BEV-01',
    name: 'Masala Chaas',
    category: 'Beverages',
    dietary: 'VEG',
    basePrice: 40,
    variants: ['300ml Bottle'],
    active: true,
    mappings: {
      zomatoName: 'Spiced Buttermilk',
      zomatoPrice: 50,
      swiggyName: 'Masala Buttermilk 300ml',
      swiggyPrice: 50,
      posCode: 'BEV-CHAAS-01',
      posPrice: 40,
      aliases: ['chaas', 'buttermilk', 'mattha']
    }
  },
  {
    sku: 'SKU-BIR-09',
    name: 'Dum Gosht Mutton Biryani',
    category: 'Main Course',
    dietary: 'NON_VEG',
    basePrice: 540,
    variants: ['1kg Handi (Serves 2-3)'],
    active: false, // 86-ed
    mappings: {
      zomatoName: 'Hyderabadi Mutton Biryani Handi',
      zomatoPrice: 590,
      swiggyName: 'Dum Gosht Mutton Biryani',
      swiggyPrice: 590,
      posCode: 'BIR-GOSHT-09',
      posPrice: 540,
      aliases: ['mutton biryani', 'gosht biryani']
    }
  }
];

export const MOCK_AUDIT_RECORDS: AuditRecord[] = [
  {
    id: 'AUD-88219',
    timestamp: '2026-10-12T12:04:18Z',
    action: 'OPERATOR_OVERRIDE_CONFIRMED',
    targetRecord: 'Candidate CAN-8841 → Order ORD-1042',
    actor: {
      name: 'Aarav Mehta',
      role: 'Operations Lead',
      ip: '10.42.18.94',
      isSystem: false
    },
    justification: 'Customer confirmed quantity increase to 3 rolls via WhatsApp chat verification ticket #CS-9912. Delta +₹240 routed to POS.',
    priorStateSnippet: { quantity: 2, subtotal: 480.0, status: 'PENDING_CONFIRMATION' },
    mutatedStateSnippet: { quantity: 3, subtotal: 720.0, status: 'RECONCILED_CONFIRMED' },
    signature: 'HMAC-SHA256: 0x48f1... verified (Merkle Leaf #4,912)'
  },
  {
    id: 'AUD-88215',
    timestamp: '2026-10-12T11:48:02Z',
    action: 'DUPLICATE_MERGE',
    targetRecord: 'Candidate CAN-8835 → Order ORD-1040',
    actor: {
      name: 'Aarav Mehta',
      role: 'Operations Lead',
      isSystem: false
    },
    justification: 'Identical cart submitted within 38 seconds across POS and Zomato; voided duplicate cart without double counting.',
    priorStateSnippet: { sourceCount: 2, duplicateFlag: true },
    mutatedStateSnippet: { canonicalId: 'ORD-1040', duplicateResolved: true },
    signature: 'HMAC-SHA256: 0x93b7... verified'
  },
  {
    id: 'AUD-88208',
    timestamp: '2026-10-12T11:22:45Z',
    action: 'AUTO_RECONCILED',
    targetRecord: 'Source SRC-9170 → Order ORD-1041',
    actor: {
      name: 'OrderTruth AI Engine',
      role: 'Deterministic Engine v2.4',
      isSystem: true
    },
    justification: 'Deterministic match: 100% phone, 100% address, clean single source Swiggy order.',
    priorStateSnippet: { sourceId: 'SRC-9170', raw: true },
    mutatedStateSnippet: { canonicalId: 'ORD-1041', dispatched: true },
    signature: 'HMAC-SHA256: 0x11a4... verified'
  },
  {
    id: 'AUD-88180',
    timestamp: '2026-10-12T10:14:02Z',
    action: 'QUANTITY_CONFLICT_FLAGGED',
    targetRecord: 'Candidate CAN-8841 (ZOM-8921 vs WAPP-104)',
    actor: {
      name: 'OrderTruth AI Engine',
      role: 'Rule Guardrail #QNT-04',
      isSystem: true
    },
    justification: 'Zero Auto-Merge Policy triggered: Quantity mismatch detected (2 vs 3 Paneer Tikka Rolls). Dispatch held.',
    priorStateSnippet: { quantityDelta: 1, matchScore: 94 },
    mutatedStateSnippet: { status: 'HELD_FOR_REVIEW', candidateId: 'CAN-8841' },
    signature: 'HMAC-SHA256: 0xef22... verified'
  }
];

export const MOCK_SETTINGS: BusinessSettings = {
  tenantId: 'TEN-001',
  legalName: 'Spice Kitchen Bangalore Pvt Ltd',
  displayName: 'Spice Garden - Indiranagar',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  gstin: '29AABCS1429B1Z8',
  phone: '+91 80 4123 4567',
  integrations: {
    whatsapp: {
      status: 'SANDBOX_ACTIVE',
      phone: '+91 98765 00000',
      webhookVerified: false
    },
    petpooja: {
      status: 'CONNECTED',
      terminalId: 'BLR-INDI-POS-01',
      syncIntervalSec: 30
    },
    zomato: {
      status: 'CONNECTED',
      merchantId: 'RES-184920'
    },
    swiggy: {
      status: 'PENDING_SETUP',
      outletId: undefined
    },
    manualCsv: {
      status: 'ALWAYS_ACTIVE'
    }
  },
  reconciliationRules: {
    autoMergeThreshold: 95,
    strictQuantityMismatchZeroMerge: true, // locked
    temporalWindowSeconds: 60,
    geoRadiusMeters: 100
  }
};
