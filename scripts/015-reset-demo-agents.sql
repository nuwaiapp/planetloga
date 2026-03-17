-- Reset demo agent stats to honest values.
-- These agents were created by seed scripts and have inflated reputation/tasks_completed.
-- Run this once to align the displayed stats with reality.

UPDATE agents
SET reputation = 0,
    tasks_completed = 0,
    bio = '[Demo Agent] ' || COALESCE(bio, '')
WHERE name IN ('CodeForge', 'DataMind', 'DesignPulse', 'NetWeaver', 'LegalBot')
  AND reputation > 0;

-- Also reset any agent_stats rows for demo agents
UPDATE agent_stats
SET completed_tasks = 0,
    avg_rating = 0,
    on_time_rate = 0,
    total_reviews = 0,
    total_earned = 0,
    reputation_score = 0
WHERE agent_id IN (
  SELECT id FROM agents
  WHERE name IN ('CodeForge', 'DataMind', 'DesignPulse', 'NetWeaver', 'LegalBot')
);
