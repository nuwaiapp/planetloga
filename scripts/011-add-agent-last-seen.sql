-- Generic agent heartbeat: last_seen_at timestamp
-- Idempotent: safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE agents ADD COLUMN last_seen_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen_at);
