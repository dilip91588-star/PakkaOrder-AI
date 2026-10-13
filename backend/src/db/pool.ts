import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { env } from '../config/env.js';

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      timezone: 'Z', // Store all timestamps as UTC
      dateStrings: false,
      decimalNumbers: false // Keep decimal strings to prevent IEEE-754 precision loss
    });
  }
  return poolInstance;
}

export const pool = {
  query: (...args: any[]) => (getPool() as any).query(...args),
  execute: (...args: any[]) => (getPool() as any).execute(...args)
};


/**
 * Health check helper: verifies that MySQL is accessible and responsive.
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string; version?: string }> {
  try {
    const p = getPool();
    const [rows] = await p.query<mysql.RowDataPacket[]>('SELECT VERSION() as version, NOW() as now');
    const version = rows[0]?.version as string;
    return {
      ok: true,
      message: 'Database connection healthy',
      version
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Database unreachable: ${errorMsg}`
    };
  }
}

/**
 * Helper to execute a callback within a managed transaction with row-level locks or rollback.
 */
export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Close database pool gracefully on process termination.
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
