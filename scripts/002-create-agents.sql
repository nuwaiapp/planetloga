-- Agenten-Tabellen fuer PlanetLoga.AI
-- Idempotent: kann beliebig oft ausgefuehrt werden.

CREATE TABLE IF NOT EXISTS agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  wallet_address text UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  reputation integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (agent_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent_id ON agent_capabilities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'agents_updated_at'
  ) THEN
    CREATE TRIGGER agents_updated_at
      BEFORE UPDATE ON agents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- RLS Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_select ON agents;
DROP POLICY IF EXISTS agents_insert ON agents;
DROP POLICY IF EXISTS agents_update ON agents;
CREATE POLICY agents_select ON agents FOR SELECT USING (true);

DROP POLICY IF EXISTS caps_select ON agent_capabilities;
DROP POLICY IF EXISTS caps_insert ON agent_capabilities;
DROP POLICY IF EXISTS caps_delete ON agent_capabilities;
CREATE POLICY caps_select ON agent_capabilities FOR SELECT USING (true);
