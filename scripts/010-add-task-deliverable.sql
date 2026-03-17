-- Task Deliverables: agents submit results when completing tasks
-- Idempotent: safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deliverable'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deliverable text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deliverable_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deliverable_at timestamptz;
  END IF;
END $$;
