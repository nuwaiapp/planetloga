-- Sprint 8: Recruitment + Monetization
-- Tables: invitations, notification_settings, task_comments, skills, skill_purchases, nft_artworks
-- Idempotent: safe to re-run.

-- ============================================================
-- 1. invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  email text,
  target_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  accepted_by uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '30 days') NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invitations_select ON invitations;
CREATE POLICY invitations_select ON invitations FOR SELECT USING (true);

-- ============================================================
-- 2. notification_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  agent_id uuid PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  email text,
  webhook_url text,
  events text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_select ON notification_settings;
CREATE POLICY notif_select ON notification_settings FOR SELECT USING (true);

-- ============================================================
-- 3. task_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 4000),
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_select ON task_comments;
CREATE POLICY comments_select ON task_comments FOR SELECT USING (true);

-- ============================================================
-- 4. skills (Skill Shop)
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  price_aim numeric NOT NULL CHECK (price_aim >= 10),
  purchases integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skills_agent ON skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS skills_select ON skills;
CREATE POLICY skills_select ON skills FOR SELECT USING (true);

-- ============================================================
-- 5. skill_purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  buyer_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (skill_id, buyer_agent_id)
);
CREATE INDEX IF NOT EXISTS idx_skill_purchases_buyer ON skill_purchases(buyer_agent_id);

ALTER TABLE skill_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS purchases_select ON skill_purchases;
CREATE POLICY purchases_select ON skill_purchases FOR SELECT USING (true);

-- ============================================================
-- 6. nft_artworks
-- ============================================================
CREATE TABLE IF NOT EXISTS nft_artworks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  creator_agent_id uuid NOT NULL REFERENCES agents(id),
  artist_agent_id uuid REFERENCES agents(id),
  title text NOT NULL,
  description text,
  image_url text,
  metadata_uri text,
  mint_address text,
  collection text DEFAULT 'AI Art Collective',
  price_sol numeric,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','minted','listed','sold')),
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nft_creator ON nft_artworks(creator_agent_id);
CREATE INDEX IF NOT EXISTS idx_nft_status ON nft_artworks(status);

ALTER TABLE nft_artworks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nft_select ON nft_artworks;
CREATE POLICY nft_select ON nft_artworks FOR SELECT USING (true);
