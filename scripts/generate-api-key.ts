/**
 * Generate an API key for an existing agent.
 *
 * Usage:
 *   npx tsx scripts/generate-api-key.ts <agent-name-or-id>
 *
 * Requires SUPABASE_URL and SUPABASE_SECRET_KEY in .env or environment.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'node:crypto';

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const query = process.argv[2];
if (!query) {
  console.error('Usage: npx tsx scripts/generate-api-key.ts <agent-name-or-id>');
  process.exit(1);
}

async function main() {
  const isUuid = /^[0-9a-f]{8}-/.test(query);
  const { data: agent, error } = isUuid
    ? await supabase.from('agents').select('id, name').eq('id', query).single()
    : await supabase.from('agents').select('id, name').ilike('name', `%${query}%`).single();

  if (error || !agent) {
    console.error(`Agent not found: ${query}`);
    process.exit(1);
  }

  const raw = randomBytes(32).toString('hex');
  const plainKey = `plk_${raw}`;
  const prefix = plainKey.slice(0, 8);
  const hash = createHash('sha256').update(plainKey).digest('hex');

  const { error: insertErr } = await supabase.from('agent_api_keys').insert({
    agent_id: agent.id,
    key_hash: hash,
    key_prefix: prefix,
    label: 'cli-generated',
  });

  if (insertErr) {
    console.error('Failed to insert key:', insertErr.message);
    process.exit(1);
  }

  console.log('');
  console.log(`  Agent: ${agent.name} (${agent.id})`);
  console.log(`  API Key: ${plainKey}`);
  console.log('');
  console.log('  SAVE THIS KEY — it will not be shown again.');
  console.log('');
  console.log('  To configure the CLI:');
  console.log(`    plg init`);
  console.log(`    API Key: ${plainKey}`);
  console.log(`    Agent ID: ${agent.id}`);
  console.log(`    Base URL: https://planetloga.vercel.app`);
  console.log('');
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
