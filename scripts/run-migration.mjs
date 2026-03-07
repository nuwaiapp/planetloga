/**
 * Fuehrt SQL-Migrationsdateien gegen die Supabase-Datenbank aus.
 *
 * Verwendung:
 *   node scripts/run-migration.mjs scripts/001-create-waitlist.sql
 *   node scripts/run-migration.mjs scripts/*.sql
 */

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  'postgresql://postgres:x5R0J1ce7KwG3ayK@db.avqepqctareufrxeutnl.supabase.co:5432/postgres';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Verwendung: node scripts/run-migration.mjs <sql-datei> [...]');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('Verbunden mit Supabase PostgreSQL.\n');

  for (const file of files) {
    const path = resolve(file);
    const sql = readFileSync(path, 'utf-8');
    console.log(`Fuehre aus: ${file}`);
    await client.query(sql);
    console.log(`  OK.\n`);
  }

  console.log('Alle Migrationen erfolgreich.');
} catch (err) {
  console.error('Fehler:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
