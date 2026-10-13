import { z } from 'zod';

export const sourceOrderItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty'),
  quantity: z.number().positive('Quantity must be greater than zero').max(999, 'Quantity exceeds maximum allowable single order limit'),
  unit: z.string().trim().default('portion'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative').default(0),
  lineTotal: z.number().nonnegative('Line total cannot be negative').optional(),
  customizations: z.array(z.string()).optional()
});

export const createSourceOrderSchema = z.object({
  channel: z.enum(['WHATSAPP', 'POS', 'ZOMATO', 'SWIGGY', 'MANUAL'], {
    errorMap: () => ({ message: 'Channel must be WHATSAPP, POS, ZOMATO, SWIGGY, or MANUAL' })
  }),
  idempotencyKey: z.string().trim().min(1, 'Idempotency key is required').max(128, 'Idempotency key too long'),
  externalOrderId: z.string().trim().max(128).optional(),
  sourceCreatedAt: z.string().datetime({ offset: true }).optional().or(z.string().datetime()).default(() => new Date().toISOString()),
  customer: z.object({
    name: z.string().trim().max(255).optional(),
    phone: z.string().trim().max(64).optional(),
    address: z.string().trim().max(1000).optional()
  }).optional(),
  deliveryAddress: z.string().trim().max(1000).optional(),
  items: z.array(sourceOrderItemSchema).min(1, 'At least one order item is required'),
  currency: z.string().trim().default('INR'),
  reportedTotal: z.number().nonnegative('Reported total cannot be negative').optional(),
  notes: z.string().trim().max(1000).optional(),
  rawPayload: z.record(z.unknown()).optional()
});

export const extractOrderTextSchema = z.object({
  messageText: z.string().trim()
    .min(3, 'Message text must be at least 3 characters long')
    .max(10000, 'Message text exceeds 10,000 characters limit'),
  channel: z.enum(['WHATSAPP', 'POS', 'ZOMATO', 'SWIGGY', 'MANUAL']).default('WHATSAPP'),
  customerPhone: z.string().trim().max(64).optional().default('+91 98765 00000'),
  knownCustomerName: z.string().trim().max(255).optional()
});

export const listSourceOrdersQuerySchema = z.object({
  channel: z.enum(['WHATSAPP', 'POS', 'ZOMATO', 'SWIGGY', 'MANUAL']).optional(),
  status: z.enum(['UNPROCESSED', 'CANDIDATE_SEARCHED', 'LINKED_CANONICAL', 'CONFIRMED_SEPARATE', 'REJECTED']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateSourceOrderInput = z.infer<typeof createSourceOrderSchema>;
export type ExtractOrderTextInput = z.infer<typeof extractOrderTextSchema>;
export type ListSourceOrdersQuery = z.infer<typeof listSourceOrdersQuerySchema>;
