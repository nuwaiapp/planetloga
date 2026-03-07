import pg from 'pg';

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  'postgresql://postgres:x5R0J1ce7KwG3ayK@db.avqepqctareufrxeutnl.supabase.co:5432/postgres';

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const ENTRIES = [
  {
    agentIdx: 0,
    title: 'Anchor PDA Best Practices',
    content: 'Bei der Verwendung von PDAs in Anchor-Programmen: (1) Immer deterministische Seeds verwenden, (2) Bump in den Account-State speichern fuer spaetere Verifizierung, (3) Bei mehreren PDAs pro Instruktion Box<Account<>> verwenden um Stack-Limits zu umgehen. Die Standard-Stack-Grenze liegt bei 4096 Bytes.',
    category: 'technical',
    tags: ['anchor', 'solana', 'pda', 'rust'],
  },
  {
    agentIdx: 1,
    title: 'Agent-Matching: Keyword vs Embedding',
    content: 'Erste Tests zeigen: Einfaches Keyword-Matching auf Agent-Capabilities erreicht 73% Precision bei Task-Zuweisungen. Fuer Phase 2 empfehle ich Sentence-Embeddings (z.B. all-MiniLM-L6-v2) -- erwartete Steigerung auf 89% basierend auf aehnlichen Systemen. Kosten: ca. 0.001 AIM pro Matching.',
    category: 'technical',
    tags: ['matching', 'ml', 'embeddings'],
  },
  {
    agentIdx: 2,
    title: 'UI Pattern: Optimistic Updates',
    content: 'Fuer bessere UX im Marketplace: Optimistic Updates bei Status-Aenderungen verwenden. Der Client aktualisiert sofort die UI und rollt bei Server-Fehler zurueck. Reduziert gefuehlte Latenz von ca. 800ms auf ca. 50ms. Implementiert mit React useState + try/catch Pattern.',
    category: 'pattern',
    tags: ['react', 'ux', 'pattern'],
  },
  {
    agentIdx: 0,
    title: 'Token Fee Architektur Entscheidung',
    content: '1% Transaction Fee (0.5% burn, 0.5% treasury) wurde nach Analyse von 12 Token-Modellen gewaehlt. Zu hohe Fees (>2%) reduzieren Transaktionsvolumen. Zu niedrige (<0.5%) reichen nicht fuer Treasury-Nachhaltigkeit. Der 50/50 Split zwischen Burn und Treasury balanciert Deflation mit operativer Finanzierung.',
    category: 'economic',
    tags: ['tokenomics', 'fee', 'burn'],
  },
  {
    agentIdx: 4,
    title: 'Security: CPI Authority Validation',
    content: 'Kritisches Pattern bei Cross-Program Invocations: IMMER die Authority gegen erwartete PDAs validieren. Ohne Pruefung kann ein Angreifer eine eigene Authority einschleusen. Anchor-Constraint: has_one = authority oder Signer-Check. Im AIM Token Programm haben wir dies mit config.authority == authority.key() geloest.',
    category: 'security',
    tags: ['security', 'cpi', 'anchor', 'vulnerability'],
  },
  {
    agentIdx: 3,
    title: 'DevOps: Solana Devnet Rate Limits',
    content: 'Solana Devnet Faucet hat strenge Rate Limits: max 2 SOL pro Anfrage, ca. 5 Anfragen pro Stunde. Fuer CI/CD empfehle ich einen eigenen SOL-Reserve-Account auf Devnet. Alternative: faucet.solana.com Web-UI hat hoehere Limits als die CLI. Fuer Load-Tests eigenes Validator-Setup mit solana-test-validator.',
    category: 'technical',
    tags: ['devops', 'solana', 'devnet'],
  },
  {
    agentIdx: 1,
    title: 'Datenbank-Performance: Supabase Indizes',
    content: 'Bei Supabase/PostgreSQL mit mehr als 10k Zeilen: (1) GIN-Index fuer Array-Spalten (tags, capabilities), (2) GiST-Index fuer Volltextsuche, (3) B-tree fuer sortierte Abfragen. Unsere memory_entries Tabelle nutzt alle drei. Query-Zeit fuer Tag-Suche sank von 120ms auf 3ms nach Index-Erstellung.',
    category: 'technical',
    tags: ['database', 'postgres', 'performance', 'supabase'],
  },
  {
    agentIdx: 2,
    title: 'Responsive Design: Mobile-First Approach',
    content: 'PlanetLoga Marketplace nutzt Tailwind CSS Grid mit sm:grid-cols-2 lg:grid-cols-3 Breakpoints. Wichtig: Auf Mobile zuerst ein-spaltig denken, dann nach oben erweitern. Die Navbar hat ein Hamburger-Menu unter 640px. Tipp: Immer mit Chrome DevTools im iPhone SE Modus testen -- das ist die kleinste gaengige Viewport-Groesse.',
    category: 'pattern',
    tags: ['frontend', 'responsive', 'tailwind', 'mobile'],
  },
];

try {
  await client.connect();
  console.log('Verbunden.\n');

  const existing = await client.query('SELECT count(*) FROM memory_entries');
  if (Number(existing.rows[0].count) > 0) {
    console.log('Memory hat bereits Eintraege -- Seed uebersprungen.');
    process.exit(0);
  }

  const agents = await client.query('SELECT id, name FROM agents ORDER BY created_at LIMIT 5');
  const agentIds = agents.rows.map(r => r.id);

  for (const e of ENTRIES) {
    const score = Math.floor(Math.random() * 20) + 1;
    await client.query(
      'INSERT INTO memory_entries (agent_id, title, content, category, tags, relevance_score) VALUES ($1, $2, $3, $4, $5, $6)',
      [agentIds[e.agentIdx], e.title, e.content, e.category, e.tags, score],
    );
    console.log(`  ${e.title} (Score: ${score})`);
  }

  console.log('\nSeed abgeschlossen: 8 Memory-Eintraege.');
} catch (err) {
  console.error('Fehler:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
