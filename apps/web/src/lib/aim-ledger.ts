import { adminSupabase, publicSupabase } from './supabase';
import { AppError } from './errors';

export interface AimBalance {
  agentId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface AimTransaction {
  id: string;
  agentId: string;
  amount: number;
  txType: 'task_reward' | 'withdrawal' | 'deposit' | 'fee';
  referenceId?: string;
  onChainSig?: string;
  createdAt: string;
}

export async function getBalance(agentId: string): Promise<AimBalance> {
  const { data } = await publicSupabase
    .from('aim_balances')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!data) {
    return {
      agentId,
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    agentId: data.agent_id,
    balance: Number(data.balance),
    totalEarned: Number(data.total_earned),
    totalWithdrawn: Number(data.total_withdrawn),
    updatedAt: data.updated_at,
  };
}

export async function creditReward(
  agentId: string,
  amount: number,
  taskId: string,
): Promise<AimTransaction> {
  if (amount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Credit amount must be positive', 400);
  }

  const amountInt = Math.round(amount);

  const { data: existing } = await adminSupabase
    .from('aim_balances')
    .select('balance, total_earned')
    .eq('agent_id', agentId)
    .single();

  if (existing) {
    const { error } = await adminSupabase
      .from('aim_balances')
      .update({
        balance: Number(existing.balance) + amountInt,
        total_earned: Number(existing.total_earned) + amountInt,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId);

    if (error) {
      throw new AppError('CREDIT_FAILED', error.message, 500, { cause: error });
    }
  } else {
    const { error } = await adminSupabase
      .from('aim_balances')
      .insert({
        agent_id: agentId,
        balance: amountInt,
        total_earned: amountInt,
        total_withdrawn: 0,
      });

    if (error) {
      throw new AppError('CREDIT_FAILED', error.message, 500, { cause: error });
    }
  }

  const { data: tx, error: txErr } = await adminSupabase
    .from('aim_transactions')
    .insert({
      agent_id: agentId,
      amount: amountInt,
      tx_type: 'task_reward',
      reference_id: taskId,
    })
    .select()
    .single();

  if (txErr || !tx) {
    throw new AppError('TX_LOG_FAILED', txErr?.message ?? 'Failed to log transaction', 500);
  }

  return {
    id: tx.id,
    agentId: tx.agent_id,
    amount: Number(tx.amount),
    txType: tx.tx_type,
    referenceId: tx.reference_id ?? undefined,
    createdAt: tx.created_at,
  };
}

export async function debit(
  agentId: string,
  amount: number,
  txType: 'withdrawal' | 'fee',
  onChainSig?: string,
): Promise<AimTransaction> {
  if (amount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Debit amount must be positive', 400);
  }

  const amountInt = Math.round(amount);
  const balance = await getBalance(agentId);

  if (balance.balance < amountInt) {
    throw new AppError('INSUFFICIENT_BALANCE', `Balance ${balance.balance} < requested ${amountInt}`, 400);
  }

  const newBalance = balance.balance - amountInt;
  const newWithdrawn = balance.totalWithdrawn + (txType === 'withdrawal' ? amountInt : 0);

  const { error } = await adminSupabase
    .from('aim_balances')
    .update({
      balance: newBalance,
      total_withdrawn: newWithdrawn,
      updated_at: new Date().toISOString(),
    })
    .eq('agent_id', agentId);

  if (error) {
    throw new AppError('DEBIT_FAILED', error.message, 500, { cause: error });
  }

  const { data: tx, error: txErr } = await adminSupabase
    .from('aim_transactions')
    .insert({
      agent_id: agentId,
      amount: -amountInt,
      tx_type: txType,
      on_chain_sig: onChainSig ?? null,
    })
    .select()
    .single();

  if (txErr || !tx) {
    throw new AppError('TX_LOG_FAILED', txErr?.message ?? 'Failed to log transaction', 500);
  }

  return {
    id: tx.id,
    agentId: tx.agent_id,
    amount: Number(tx.amount),
    txType: tx.tx_type,
    onChainSig: tx.on_chain_sig ?? undefined,
    createdAt: tx.created_at,
  };
}

export async function getTransactions(
  agentId: string,
  limit = 20,
): Promise<AimTransaction[]> {
  const { data } = await publicSupabase
    .from('aim_transactions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(row => ({
    id: row.id,
    agentId: row.agent_id,
    amount: Number(row.amount),
    txType: row.tx_type,
    referenceId: row.reference_id ?? undefined,
    onChainSig: row.on_chain_sig ?? undefined,
    createdAt: row.created_at,
  }));
}
