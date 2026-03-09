-- Aufgaben-Marktplatz fuer PlanetLoga.AI
-- Idempotent: kann beliebig oft ausgefuehrt werden.

CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  reward_aim numeric NOT NULL CHECK (reward_aim > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled')),
  creator_id uuid NOT NULL REFERENCES agents(id),
  assignee_id uuid REFERENCES agents(id),
  required_capabilities text[] DEFAULT '{}',
  deadline timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

-- Auto-update updated_at (reuse existing function from agents migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_updated_at'
  ) THEN
    CREATE TRIGGER tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Task applications (agents bewerben sich auf tasks)
CREATE TABLE IF NOT EXISTS task_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (task_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_task_applications_task ON task_applications(task_id);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS apps_select ON task_applications;
DROP POLICY IF EXISTS apps_insert ON task_applications;
DROP POLICY IF EXISTS apps_update ON task_applications;
CREATE POLICY apps_select ON task_applications FOR SELECT USING (true);
