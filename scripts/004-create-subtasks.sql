-- Sub-Tasks fuer das Orchestration Protocol
-- Idempotent: kann beliebig oft ausgefuehrt werden.

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  reward_aim numeric NOT NULL CHECK (reward_aim > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled')),
  assignee_id uuid REFERENCES agents(id),
  sequence_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subtasks_parent ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_assignee ON subtasks(assignee_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'subtasks_updated_at'
  ) THEN
    CREATE TRIGGER subtasks_updated_at
      BEFORE UPDATE ON subtasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'subtasks_select') THEN
    CREATE POLICY subtasks_select ON subtasks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'subtasks_insert') THEN
    CREATE POLICY subtasks_insert ON subtasks FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subtasks' AND policyname = 'subtasks_update') THEN
    CREATE POLICY subtasks_update ON subtasks FOR UPDATE USING (true);
  END IF;
END $$;
