-- Sprint 7: Job Economy
-- New tables: escrow_locks, agent_relations, agent_stats, reviews
-- New columns on tasks + task_applications
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. New columns on tasks
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='pricing_mode') THEN
    ALTER TABLE tasks ADD COLUMN pricing_mode text NOT NULL DEFAULT 'fixed' CHECK (pricing_mode IN ('fixed','bidding'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='budget_max') THEN
    ALTER TABLE tasks ADD COLUMN budget_max numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority') THEN
    ALTER TABLE tasks ADD COLUMN priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','priority','urgent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='max_agents') THEN
    ALTER TABLE tasks ADD COLUMN max_agents integer NOT NULL DEFAULT 1 CHECK (max_agents BETWEEN 1 AND 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='reward_per_agent') THEN
    ALTER TABLE tasks ADD COLUMN reward_per_agent numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='invited_agents') THEN
    ALTER TABLE tasks ADD COLUMN invited_agents uuid[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='dispute_reason') THEN
    ALTER TABLE tasks ADD COLUMN dispute_reason text;
  END IF;
END $$;

-- Update status check to include 'disputed'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('open','assigned','in_progress','review','completed','cancelled','disputed'));

-- ============================================================
-- 2. New columns on task_applications
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_applications' AND column_name='bid_amount') THEN
    ALTER TABLE task_applications ADD COLUMN bid_amount numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_applications' AND column_name='agent_status') THEN
    ALTER TABLE task_applications ADD COLUMN agent_status text NOT NULL DEFAULT 'pending'
      CHECK (agent_status IN ('pending','working','review','completed','rejected'));
  END IF;
END $$;

-- ============================================================
-- 3. escrow_locks
-- ============================================================
CREATE TABLE IF NOT EXISTS escrow_locks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','released','refunded','disputed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  released_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_task ON escrow_locks(task_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agent ON escrow_locks(agent_id);

ALTER TABLE escrow_locks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS escrow_select ON escrow_locks;
CREATE POLICY escrow_select ON escrow_locks FOR SELECT USING (true);

-- ============================================================
-- 4. agent_relations
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_relations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('preferred','blocked')),
  trust_score numeric NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  tasks_together integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (from_agent_id, to_agent_id),
  CHECK (from_agent_id <> to_agent_id)
);
CREATE INDEX IF NOT EXISTS idx_relations_from ON agent_relations(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON agent_relations(to_agent_id);

ALTER TABLE agent_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS relations_select ON agent_relations;
CREATE POLICY relations_select ON agent_relations FOR SELECT USING (true);

-- ============================================================
-- 5. agent_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_stats (
  agent_id uuid PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_cancelled integer NOT NULL DEFAULT 0,
  avg_rating numeric NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  total_aim_earned numeric NOT NULL DEFAULT 0,
  on_time_rate numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stats_select ON agent_stats;
CREATE POLICY stats_select ON agent_stats FOR SELECT USING (true);

-- ============================================================
-- 6. reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (task_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_task ON reviews(task_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_select ON reviews;
CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
