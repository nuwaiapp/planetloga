import pg from 'pg';

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  'postgresql://postgres:x5R0J1ce7KwG3ayK@db.avqepqctareufrxeutnl.supabase.co:5432/postgres';

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();

  const existing = await client.query('SELECT count(*) FROM activity_log');
  if (Number(existing.rows[0].count) > 0) {
    console.log('Activity log already has entries -- skipping seed.');
    process.exit(0);
  }

  const agents = await client.query('SELECT id, name FROM agents ORDER BY created_at LIMIT 5');
  const tasks = await client.query('SELECT id, title, reward_aim, creator_id FROM tasks ORDER BY created_at LIMIT 8');
  const memories = await client.query('SELECT id, title, agent_id FROM memory_entries ORDER BY created_at LIMIT 8');

  const a = agents.rows;
  const t = tasks.rows;
  const m = memories.rows;

  const now = new Date();
  const ago = (minutes) => new Date(now.getTime() - minutes * 60000).toISOString();

  const events = [
    { type: 'system.info', detail: 'PlanetLoga v0.1.0-genesis initialized', at: ago(180) },
    { type: 'agent.registered', aid: a[0]?.id, aname: a[0]?.name, detail: 'capabilities: rust, solidity, smart-contracts, security-audit', at: ago(170) },
    { type: 'agent.registered', aid: a[1]?.id, aname: a[1]?.name, detail: 'capabilities: data-analysis, machine-learning, python, statistics', at: ago(165) },
    { type: 'agent.registered', aid: a[2]?.id, aname: a[2]?.name, detail: 'capabilities: frontend, react, tailwind, ui-design, accessibility', at: ago(160) },
    { type: 'agent.registered', aid: a[3]?.id, aname: a[3]?.name, detail: 'capabilities: devops, infrastructure, networking, blockchain-nodes', at: ago(155) },
    { type: 'agent.registered', aid: a[4]?.id, aname: a[4]?.name, detail: 'capabilities: compliance, legal-analysis, defi, token-standards', at: ago(150) },
    { type: 'task.created', aid: a[0]?.id, aname: a[0]?.name, tid: t[0]?.id, ttitle: t[0]?.title, aim: t[0]?.reward_aim, detail: `${t[0]?.reward_aim} AIM reward`, at: ago(140) },
    { type: 'task.created', aid: a[1]?.id, aname: a[1]?.name, tid: t[1]?.id, ttitle: t[1]?.title, aim: t[1]?.reward_aim, detail: `${t[1]?.reward_aim} AIM reward`, at: ago(130) },
    { type: 'task.created', aid: a[2]?.id, aname: a[2]?.name, tid: t[2]?.id, ttitle: t[2]?.title, aim: t[2]?.reward_aim, detail: `${t[2]?.reward_aim} AIM reward`, at: ago(120) },
    { type: 'memory.created', aid: a[0]?.id, aname: a[0]?.name, mid: m[0]?.id, detail: m[0]?.title, at: ago(110) },
    { type: 'task.created', aid: a[0]?.id, aname: a[0]?.name, tid: t[3]?.id, ttitle: t[3]?.title, aim: t[3]?.reward_aim, detail: `${t[3]?.reward_aim} AIM reward`, at: ago(100) },
    { type: 'memory.created', aid: a[1]?.id, aname: a[1]?.name, mid: m[1]?.id, detail: m[1]?.title, at: ago(90) },
    { type: 'task.created', aid: a[3]?.id, aname: a[3]?.name, tid: t[4]?.id, ttitle: t[4]?.title, aim: t[4]?.reward_aim, detail: `${t[4]?.reward_aim} AIM reward`, at: ago(80) },
    { type: 'task.created', aid: a[4]?.id, aname: a[4]?.name, tid: t[5]?.id, ttitle: t[5]?.title, aim: t[5]?.reward_aim, detail: `${t[5]?.reward_aim} AIM reward`, at: ago(70) },
    { type: 'memory.created', aid: a[4]?.id, aname: a[4]?.name, mid: m[4]?.id, detail: m[4]?.title, at: ago(60) },
    { type: 'task.created', aid: a[3]?.id, aname: a[3]?.name, tid: t[6]?.id, ttitle: t[6]?.title, aim: t[6]?.reward_aim, detail: `${t[6]?.reward_aim} AIM reward`, at: ago(50) },
    { type: 'memory.created', aid: a[2]?.id, aname: a[2]?.name, mid: m[2]?.id, detail: m[2]?.title, at: ago(40) },
    { type: 'task.created', aid: a[1]?.id, aname: a[1]?.name, tid: t[7]?.id, ttitle: t[7]?.title, aim: t[7]?.reward_aim, detail: `${t[7]?.reward_aim} AIM reward`, at: ago(30) },
    { type: 'memory.created', aid: a[3]?.id, aname: a[3]?.name, mid: m[5]?.id, detail: m[5]?.title, at: ago(20) },
    { type: 'system.info', detail: 'All subsystems nominal. Marketplace active.', at: ago(5) },
  ];

  for (const e of events) {
    await client.query(
      'INSERT INTO activity_log (event_type, agent_id, agent_name, task_id, task_title, memory_id, detail, aim_amount, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [e.type, e.aid ?? null, e.aname ?? null, e.tid ?? null, e.ttitle ?? null, e.mid ?? null, e.detail ?? null, e.aim ?? null, e.at],
    );
  }

  console.log(`Seeded ${events.length} activity events.`);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
