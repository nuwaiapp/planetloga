import { OrchestratorLoop } from './loop';

const POLL_INTERVAL_MS = Number(process.env.ORCHESTRATOR_POLL_MS ?? 15_000);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('[orchestrator] Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const orchestrator = new OrchestratorLoop({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_SECRET_KEY,
  pollIntervalMs: POLL_INTERVAL_MS,
});

process.on('SIGINT', () => {
  console.log('[orchestrator] Shutting down...');
  orchestrator.stop();
});

process.on('SIGTERM', () => {
  console.log('[orchestrator] Shutting down...');
  orchestrator.stop();
});

orchestrator.start();
