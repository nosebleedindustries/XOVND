// Run scripts/init-supabase.sql against the Supabase Postgres pooler.
// Usage: node scripts/run-sql.mjs [path/to/file.sql]
//   reads PG_URI from env (or falls back to a hard-coded pooler URI)

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'scripts/init-supabase.sql';
const sql = fs.readFileSync(file, 'utf8');
const connectionString = process.env.PG_URI;
if (!connectionString) {
  console.error('PG_URI env var not set');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
console.log(`Running ${path.basename(file)} (${sql.length} chars) ...`);
const res = await client.query(sql);
if (Array.isArray(res)) {
  res.forEach((r, i) => console.log(`statement ${i + 1}:`, r.rows));
} else {
  console.log('result:', res.rows);
}
await client.end();
console.log('done');
