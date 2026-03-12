-- Agent API Keys for programmatic access by autonomous agents
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON agent_api_keys(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON agent_api_keys(key_hash);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write API keys
CREATE POLICY api_keys_service_all ON agent_api_keys
  FOR ALL USING (false) WITH CHECK (false);
