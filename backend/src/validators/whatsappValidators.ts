import { z } from 'zod';

/**
 * Meta WhatsApp Cloud API Webhook Subscription Handshake Query Validator (GET)
 */
export const whatsAppWebhookQuerySchema = z.object({
  'hub.mode': z.string().refine(val => val === 'subscribe', {
    message: "hub.mode must be 'subscribe'"
  }),
  'hub.verify_token': z.string().min(1, 'hub.verify_token is required'),
  'hub.challenge': z.string().min(1, 'hub.challenge is required')
});

export type WhatsAppWebhookQuery = z.infer<typeof whatsAppWebhookQuerySchema>;

/**
 * WhatsApp Message Item Schema
 */
export const whatsAppMessageItemSchema = z.object({
  from: z.string().min(1),
  id: z.string().min(1), // wamid.HBg...
  timestamp: z.string(),
  type: z.string(),
  text: z.object({
    body: z.string()
  }).optional(),
  context: z.object({
    id: z.string().optional(),
    from: z.string().optional()
  }).optional(),
  order: z.record(z.unknown()).optional()
}).passthrough();

export type WhatsAppMessageItem = z.infer<typeof whatsAppMessageItemSchema>;

/**
 * WhatsApp Message Status Update Schema (sent, delivered, read, failed)
 */
export const whatsAppStatusItemSchema = z.object({
  id: z.string().min(1), // wamid reference
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  timestamp: z.string(),
  recipient_id: z.string(),
  errors: z.array(z.record(z.unknown())).optional()
}).passthrough();

export type WhatsAppStatusItem = z.infer<typeof whatsAppStatusItemSchema>;

/**
 * Meta WhatsApp Cloud API Inbound Webhook Payload Schema (POST)
 */
export const whatsAppWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.literal('whatsapp').or(z.string()),
            metadata: z.object({
              display_phone_number: z.string().optional(),
              phone_number_id: z.string().optional()
            }).passthrough(),
            contacts: z.array(
              z.object({
                profile: z.object({
                  name: z.string().optional()
                }).passthrough(),
                wa_id: z.string()
              }).passthrough()
            ).optional(),
            messages: z.array(whatsAppMessageItemSchema).optional(),
            statuses: z.array(whatsAppStatusItemSchema).optional(),
            errors: z.array(z.record(z.unknown())).optional()
          }).passthrough(),
          field: z.string()
        }).passthrough()
      )
    }).passthrough()
  )
}).passthrough();

export type WhatsAppWebhookPayload = z.infer<typeof whatsAppWebhookPayloadSchema>;
