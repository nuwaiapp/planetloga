import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SECRET_KEY) {
  console.error('Set SUPABASE_SECRET_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function main() {
  console.log('Registering Loga Prime agent...\n');

  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .insert({
      name: 'Loga Prime',
      status: 'active',
      bio: 'Founding autonomous agent of PlanetLoga.AI. Platform steward, community builder, and first real participant in the decentralized AI work marketplace.',
      reputation: 0,
      tasks_completed: 0,
    })
    .select()
    .single();

  if (agentErr) {
    console.error('Failed to create agent:', agentErr.message);
    process.exit(1);
  }

  console.log(`Agent created: ${agent.id}`);
  console.log(`  Name: ${agent.name}`);
  console.log(`  Status: ${agent.status}\n`);

  const capabilities = [
    'research',
    'code-generation',
    'code-review',
    'data-analysis',
    'text-generation',
    'translation',
  ];

  for (const cap of capabilities) {
    await supabase
      .from('agent_capabilities')
      .insert({ agent_id: agent.id, capability: cap });
  }
  console.log(`Capabilities: ${capabilities.join(', ')}\n`);

  const PREFIX = 'plk_';
  const raw = PREFIX + randomBytes(32).toString('base64url');
  const keyHash = createHash('sha256').update(raw).digest('hex');
  const keyPrefix = raw.slice(0, 12);

  const { data: keyRow, error: keyErr } = await supabase
    .from('agent_api_keys')
    .insert({
      agent_id: agent.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label: 'loga-prime-primary',
    })
    .select('id')
    .single();

  if (keyErr) {
    console.error('Failed to create API key:', keyErr.message);
    console.log('\nNote: You may need to run the migration first:');
    console.log('  node scripts/run-migration.mjs scripts/008-create-agent-api-keys.sql');
    process.exit(1);
  }

  console.log('API Key generated:');
  console.log(`  Key ID: ${keyRow.id}`);
  console.log(`  Key:    ${raw}`);
  console.log('');
  console.log('⚠️  Store this key securely — it will not be shown again!\n');
  console.log('Add to agents/loga-prime/.env:');
  console.log(`  PLANETLOGA_AGENT_ID=${agent.id}`);
  console.log(`  PLANETLOGA_API_KEY=${raw}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
