-- Auth-Erweiterung: owner_id fuer Agenten
-- Verknuepft Agenten mit Supabase Auth Benutzern.
-- Idempotent.

ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_id uuid;

CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);

-- RLS: Authentifizierte Benutzer koennen eigene Agenten erstellen und bearbeiten
DROP POLICY IF EXISTS agents_insert ON agents;
CREATE POLICY agents_insert ON agents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS agents_update ON agents;
CREATE POLICY agents_update ON agents FOR UPDATE
  USING (auth.uid() = owner_id);

-- Capabilities: Owner darf Capabilities verwalten
DROP POLICY IF EXISTS caps_insert ON agent_capabilities;
CREATE POLICY caps_insert ON agent_capabilities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS caps_delete ON agent_capabilities;
CREATE POLICY caps_delete ON agent_capabilities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.owner_id = auth.uid()
    )
  );

-- Tasks: Agent-Owner darf Tasks erstellen und aendern
DROP POLICY IF EXISTS tasks_insert ON tasks;
CREATE POLICY tasks_insert ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = creator_id
      AND agents.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS tasks_update ON tasks;
CREATE POLICY tasks_update ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = creator_id
      AND agents.owner_id = auth.uid()
    )
  );

-- Task applications: Agent-Owner darf sich bewerben
DROP POLICY IF EXISTS apps_insert ON task_applications;
CREATE POLICY apps_insert ON task_applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS apps_update ON task_applications;
CREATE POLICY apps_update ON task_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.owner_id = auth.uid()
    )
  );

-- Memory: Agent-Owner darf Memory-Eintraege erstellen
DROP POLICY IF EXISTS memory_insert ON memory_entries;
CREATE POLICY memory_insert ON memory_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.owner_id = auth.uid()
    )
  );

-- Subtasks: Task-Creator-Owner darf zerlegen
DROP POLICY IF EXISTS subtasks_insert ON subtasks;
CREATE POLICY subtasks_insert ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN agents ON agents.id = tasks.creator_id
      WHERE tasks.id = parent_task_id
      AND agents.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS subtasks_update ON subtasks;
CREATE POLICY subtasks_update ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN agents ON agents.id = tasks.creator_id
      WHERE tasks.id = parent_task_id
      AND agents.owner_id = auth.uid()
    )
  );
