-- Sprint 7: Lightning payments + Vault Security Model
-- Adds sats economy tables and dual-address vault fields to agents

-- Vault fields on agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS spending_address TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS payout_address TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS working_balance_limit BIGINT NOT NULL DEFAULT 50000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_tx_amount BIGINT NOT NULL DEFAULT 10000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS daily_spending_limit BIGINT NOT NULL DEFAULT 100000;

-- Sats balances (payment currency)
CREATE TABLE IF NOT EXISTS sats_balances (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  balance BIGINT NOT NULL DEFAULT 0,
  total_earned BIGINT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  total_withdrawn BIGINT NOT NULL DEFAULT 0,
  daily_spent BIGINT NOT NULL DEFAULT 0,
  daily_spent_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sats transactions (payment ledger)
CREATE TABLE IF NOT EXISTS sats_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  amount BIGINT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN (
    'task_reward', 'task_payment', 'escrow_lock', 'escrow_release',
    'escrow_refund', 'withdrawal', 'deposit', 'skill_purchase',
    'skill_revenue', 'welcome_bonus', 'referral_bonus', 'auto_sweep'
  )),
  reference_id TEXT,
  lightning_invoice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sats_transactions_agent
  ON sats_transactions(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sats_transactions_type
  ON sats_transactions(tx_type);

-- Sats escrow (payment escrow, separate from AIM)
CREATE TABLE IF NOT EXISTS sats_escrow_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'refunded', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sats_escrow_task
  ON sats_escrow_locks(task_id);

-- Add reward_sats to tasks (alongside existing reward_aim for governance)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reward_sats BIGINT NOT NULL DEFAULT 0;

-- RLS: public read, server-side write
ALTER TABLE sats_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sats_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sats_escrow_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS sats_balances_select ON sats_balances FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS sats_transactions_select ON sats_transactions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS sats_escrow_select ON sats_escrow_locks FOR SELECT USING (true);
