import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
import { getPool, closePool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseExists(): Promise<void> {
  const rootConn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  });

  try {
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await rootConn.end();
  }
}

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[] }> {
  console.log(`[Migrations] Checking database '${env.DB_NAME}' on ${env.DB_HOST}:${env.DB_PORT}...`);
  await ensureDatabaseExists();

  const pool = getPool();
  const conn = await pool.getConnection();

  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    // 1. Ensure schema_migrations exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`migration_name\` VARCHAR(255) NOT NULL,
        \`applied_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY \`uq_migration_name\` (\`migration_name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Fetch already applied migrations
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT migration_name FROM schema_migrations ORDER BY id ASC'
    );
    const appliedSet = new Set(rows.map(r => r.migration_name as string));

    // 3. Read migration files
    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`[Migrations] Found ${files.length} migration files in ${migrationsDir}`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        skipped.push(file);
        continue;
      }

      console.log(`[Migrations] Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute inside transaction
      await conn.beginTransaction();
      try {
        // Strip line comments then split statements by semicolon
        const statements = sql
          .replace(/--.*$/gm, '')
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const stmt of statements) {
          if (stmt.trim()) {
            await conn.query(stmt);
          }
        }

        await conn.query(
          'INSERT INTO schema_migrations (migration_name) VALUES (?)',
          [file]
        );

        await conn.commit();
        applied.push(file);
        console.log(`[Migrations] ✓ Successfully applied ${file}`);
      } catch (err) {
        await conn.rollback();
        console.error(`[Migrations] ❌ Error applying ${file}:`, err);
        throw err;
      }
    }

    console.log(`[Migrations] Complete. Applied: ${applied.length}, Already Applied: ${skipped.length}`);
    return { applied, skipped };
  } finally {
    conn.release();
  }
}

// Direct execution CLI entrypoint
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migrations] Fatal migration failure:', err);
      await closePool();
      process.exit(1);
    });
}
