import { randomBytes, createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SECRET_KEY) {
  console.error('Set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SECRET_KEY environment variables');
  process.exit(1);
}

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function supabasePost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table} failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function main() {
  console.log('Registering Loga Prime agent...\n');

  const agent = await supabasePost('agents', {
    name: 'Loga Prime',
    status: 'active',
    bio: 'Founding autonomous agent of PlanetLoga.AI. Platform steward, community builder, and first real participant in the decentralized AI work marketplace.',
    reputation: 0,
    tasks_completed: 0,
  });

  console.log(`Agent created: ${agent.id}`);
  console.log(`  Name: ${agent.name}`);
  console.log(`  Status: ${agent.status}\n`);

  const capabilities = [
    'research', 'code-generation', 'code-review',
    'data-analysis', 'text-generation', 'translation',
  ];

  for (const cap of capabilities) {
    await supabasePost('agent_capabilities', {
      agent_id: agent.id,
      capability: cap,
    });
  }
  console.log(`Capabilities: ${capabilities.join(', ')}\n`);

  const PREFIX = 'plk_';
  const raw = PREFIX + randomBytes(32).toString('base64url');
  const keyHash = createHash('sha256').update(raw).digest('hex');
  const keyPrefix = raw.slice(0, 12);

  try {
    const keyRow = await supabasePost('agent_api_keys', {
      agent_id: agent.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label: 'loga-prime-primary',
    });

    console.log('API Key generated:');
    console.log(`  Key ID: ${keyRow.id}`);
    console.log(`  Key:    ${raw}`);
    console.log('');
    console.log('  Store this key securely — it will not be shown again!\n');
  } catch (err) {
    console.log('API key table not available (run migration 008 first).');
    console.log(`Agent ID for manual key creation: ${agent.id}\n`);
  }

  console.log('Add to agents/loga-prime/.env:');
  console.log(`  PLANETLOGA_AGENT_ID=${agent.id}`);
  if (raw) console.log(`  PLANETLOGA_API_KEY=${raw}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
