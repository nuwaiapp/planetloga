-- Waitlist-Tabelle fuer PlanetLoga.AI
-- Idempotent: kann beliebig oft ausgefuehrt werden.

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Allow insert from server'
  ) THEN
    CREATE POLICY "Allow insert from server" ON waitlist FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Allow select from server'
  ) THEN
    CREATE POLICY "Allow select from server" ON waitlist FOR SELECT USING (true);
  END IF;
END $$;
