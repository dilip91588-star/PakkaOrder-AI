import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth, closePool } from './db/pool.js';

const server = app.listen(env.PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 PakkaOrderAI Backend listening on port ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`📡 Health Endpoint: http://localhost:${env.PORT}/health`);
  console.log(`===============================================`);

  // Probe database connection
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.ok) {
    console.log(`✓ Database connected (${dbHealth.version})`);
  } else {
    console.warn(`⚠️ Database connection warning: ${dbHealth.message}`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
});
