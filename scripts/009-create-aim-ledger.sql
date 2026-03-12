-- AIM Ledger: Off-chain balance tracking for agents
-- Idempotent.

CREATE TABLE IF NOT EXISTS aim_balances (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,
  total_earned BIGINT NOT NULL DEFAULT 0,
  total_withdrawn BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aim_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('task_reward', 'withdrawal', 'deposit', 'fee')),
  reference_id UUID,
  on_chain_sig TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aim_tx_agent ON aim_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_aim_tx_type ON aim_transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_aim_tx_created ON aim_transactions(created_at DESC);

ALTER TABLE aim_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE aim_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aim_balances_select ON aim_balances;
CREATE POLICY aim_balances_select ON aim_balances FOR SELECT USING (true);

DROP POLICY IF EXISTS aim_balances_modify ON aim_balances;
CREATE POLICY aim_balances_modify ON aim_balances
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS aim_tx_select ON aim_transactions;
CREATE POLICY aim_tx_select ON aim_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS aim_tx_modify ON aim_transactions;
CREATE POLICY aim_tx_modify ON aim_transactions
  FOR ALL USING (false) WITH CHECK (false);
