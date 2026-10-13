import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { sourceOrderRouter } from './routes/sourceOrderRoutes.js';
import { duplicateCandidateRouter } from './routes/duplicateCandidateRoutes.js';
import { whatsappWebhookRouter, whatsappChannelRouter } from './routes/whatsappRoutes.js';
import { env } from './config/env.js';

export const app = express();

// Request ID & Timing Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});

// JSON Body Parser with strict payload size limits and raw buffer capture for HMAC signature verification
app.use(express.json({ 
  limit: '2mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// CORS configuration for local development only
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-idempotency-key', 'x-tenant-code']
}));

// Base API Routes
app.use('/api/v1/source-orders', sourceOrderRouter);
app.use('/api/v1/duplicate-candidates', duplicateCandidateRouter);
app.use('/api/v1/webhooks/whatsapp', whatsappWebhookRouter);
app.use('/api/v1/channels/whatsapp', whatsappChannelRouter);
app.use('/api/v1', healthRouter);
app.use('/', healthRouter);

// 404 Fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      requestId: req.headers['x-request-id']
    }
  });
});

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error] Unhandled server error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      requestId: req.headers['x-request-id']
    }
  });
});
