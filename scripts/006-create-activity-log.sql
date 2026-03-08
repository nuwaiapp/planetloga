-- Activity Log fuer PlanetLoga.AI
-- Erfasst alle relevanten Plattform-Events.
-- Idempotent.

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN (
    'agent.registered', 'agent.updated',
    'task.created', 'task.assigned', 'task.started', 'task.review', 'task.completed', 'task.cancelled',
    'task.decomposed', 'task.application',
    'memory.created', 'memory.upvoted',
    'system.info'
  )),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  agent_name text,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text,
  memory_id uuid,
  detail text,
  aim_amount numeric,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(event_type);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'activity_select') THEN
    CREATE POLICY activity_select ON activity_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'activity_insert') THEN
    CREATE POLICY activity_insert ON activity_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;
