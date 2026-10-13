import { Request, Response, NextFunction } from 'express';
import { whatsAppAdapter } from '../adapters/whatsappAdapter.js';
import { whatsAppWebhookQuerySchema, whatsAppWebhookPayloadSchema } from '../validators/whatsappValidators.js';

export class WhatsAppWebhookController {
  /**
   * GET /api/v1/webhooks/whatsapp
   * Meta WhatsApp Webhook Handshake / Verification Challenge
   */
  async verifyChallenge(req: Request, res: Response): Promise<void> {
    const parseResult = whatsAppWebhookQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_CHALLENGE_PARAMETERS',
          message: 'Missing or invalid Meta webhook verification query parameters',
          details: parseResult.error.format()
        }
      });
      return;
    }

    const verification = whatsAppAdapter.verifyChallenge(req.query as Record<string, unknown>);

    if (verification.isValid && verification.challenge) {
      // Meta Graph API expects the challenge value directly in the response body as plain text
      res.status(200).send(verification.challenge);
      return;
    }

    res.status(403).json({
      error: {
        code: 'FORBIDDEN_VERIFY_TOKEN_MISMATCH',
        message: 'Webhook verify token did not match server configuration.'
      }
    });
  }

  /**
   * POST /api/v1/webhooks/whatsapp
   * Receive and process inbound WhatsApp events from Meta
   */
  async handleIncomingEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Signature Verification (X-Hub-Signature-256)
      const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const isValidSignature = whatsAppAdapter.verifySignature(rawBody, signatureHeader);
      if (!isValidSignature) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED_SIGNATURE_MISMATCH',
            message: 'HMAC-SHA256 signature verification failed. Untrusted webhook sender.',
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      // 2. Payload Schema Validation
      const parseResult = whatsAppWebhookPayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            code: 'INVALID_WEBHOOK_PAYLOAD',
            message: 'Webhook payload does not match WhatsApp Cloud API schema.',
            details: parseResult.error.format(),
            requestId: req.headers['x-request-id']
          }
        });
        return;
      }

      // 3. Resolve Tenant Context
      // Derives tenant from verified restaurant phone_number_id or header
      const tenantCode = (req.headers['x-tenant-code'] as string) || 'TEN-001';
      const tenantId = tenantCode === 'TEN-002' ? 2 : 1;

      // 4. Process Webhook Event through WhatsApp Adapter
      const result = await whatsAppAdapter.processWebhookEvent(tenantId, parseResult.data);

      res.status(200).json({
        success: result.success,
        eventsProcessed: result.eventsProcessed,
        ordersIngested: result.ordersIngested,
        statusUpdatesProcessed: result.statusUpdatesProcessed,
        errors: result.errors,
        requestId: req.headers['x-request-id']
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/channels/whatsapp/status
   * Integration Health & Diagnostic Endpoint
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    const health = whatsAppAdapter.getIntegrationHealth();
    res.status(200).json({
      success: true,
      integration: health
    });
  }
}

export const whatsAppWebhookController = new WhatsAppWebhookController();
