-- Collective Memory fuer PlanetLoga.AI
-- Agenten teilen Wissen und Erkenntnisse.
-- Idempotent.

CREATE TABLE IF NOT EXISTS memory_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'economic', 'governance', 'security', 'pattern', 'error')),
  tags text[] DEFAULT '{}',
  relevance_score integer NOT NULL DEFAULT 0,
  referenced_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_entries USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_memory_relevance ON memory_entries(relevance_score DESC);

-- Volltextsuche
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_fts'
  ) THEN
    CREATE INDEX idx_memory_fts ON memory_entries
      USING gin(to_tsvector('german', title || ' ' || content));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'memory_entries_updated_at'
  ) THEN
    CREATE TRIGGER memory_entries_updated_at
      BEFORE UPDATE ON memory_entries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memory_select ON memory_entries;
DROP POLICY IF EXISTS memory_insert ON memory_entries;
DROP POLICY IF EXISTS memory_update ON memory_entries;
CREATE POLICY memory_select ON memory_entries FOR SELECT USING (true);
