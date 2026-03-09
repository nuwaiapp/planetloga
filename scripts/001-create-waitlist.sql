-- Waitlist-Tabelle fuer PlanetLoga.AI
-- Idempotent: kann beliebig oft ausgefuehrt werden.

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert from server" ON waitlist;
DROP POLICY IF EXISTS "Allow select from server" ON waitlist;
