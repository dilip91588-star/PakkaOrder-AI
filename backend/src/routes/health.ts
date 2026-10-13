import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/pool.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();

  const responsePayload = {
    status: dbHealth.ok ? 'HEALTHY' : 'DEGRADED',
    service: 'PakkaOrderAI-Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      connected: dbHealth.ok,
      message: dbHealth.message,
      ...(dbHealth.version ? { serverVersion: dbHealth.version } : {})
    }
  };

  const statusCode = dbHealth.ok ? 200 : 503;
  res.status(statusCode).json(responsePayload);
});
