-- Waitlist-Tabelle fuer PlanetLoga.AI
-- Ausfuehren im Supabase Dashboard: SQL Editor > New Query

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Erlaubt Inserts ueber die API (fuer Server Actions)
CREATE POLICY "Allow insert from server" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Erlaubt Select ueber die API (fuer Duplikat-Check)
CREATE POLICY "Allow select from server" ON waitlist
  FOR SELECT
  USING (true);
