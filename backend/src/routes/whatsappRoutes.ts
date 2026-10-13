import { Router } from 'express';
import { whatsAppWebhookController } from '../controllers/whatsappWebhookController.js';

export const whatsappWebhookRouter = Router();

// Meta Graph API Webhook Handshake & Ingestion Endpoints
whatsappWebhookRouter.get('/', (req, res) => whatsAppWebhookController.verifyChallenge(req, res));
whatsappWebhookRouter.post('/', (req, res, next) => whatsAppWebhookController.handleIncomingEvent(req, res, next));

export const whatsappChannelRouter = Router();

// Channel Integration Health & Diagnostics
whatsappChannelRouter.get('/status', (req, res) => whatsAppWebhookController.getStatus(req, res));
