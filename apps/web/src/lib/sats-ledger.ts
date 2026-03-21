import type { SatsBalance, SatsTransaction, SatsTxType } from '@planetloga/types';

import { adminSupabase, publicSupabase } from './supabase';
import { AppError } from './errors';

export async function getSatsBalance(agentId: string): Promise<SatsBalance> {
  const { data } = await publicSupabase
    .from('sats_balances')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!data) {
    return {
      agentId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      totalWithdrawn: 0,
      dailySpent: 0,
      dailySpentResetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return mapBalance(data);
}

export async function creditSats(
  agentId: string,
  amount: number,
  txType: SatsTxType,
  referenceId?: string,
  lightningInvoice?: string,
): Promise<SatsTransaction> {
  if (amount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Credit amount must be positive', 400);
  }

  const { data: existing } = await adminSupabase
    .from('sats_balances')
    .select('balance, total_earned')
    .eq('agent_id', agentId)
    .single();

  if (existing) {
    const { error } = await adminSupabase
      .from('sats_balances')
      .update({
        balance: Number(existing.balance) + amount,
        total_earned: Number(existing.total_earned) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId);
    if (error) throw new AppError('CREDIT_FAILED', error.message, 500, { cause: error });
  } else {
    const { error } = await adminSupabase
      .from('sats_balances')
      .insert({
        agent_id: agentId,
        balance: amount,
        total_earned: amount,
        total_spent: 0,
        total_withdrawn: 0,
        daily_spent: 0,
      });
    if (error) throw new AppError('CREDIT_FAILED', error.message, 500, { cause: error });
  }

  return logTx(agentId, amount, txType, referenceId, lightningInvoice);
}

export async function debitSats(
  agentId: string,
  amount: number,
  txType: SatsTxType,
  referenceId?: string,
  lightningInvoice?: string,
): Promise<SatsTransaction> {
  if (amount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Debit amount must be positive', 400);
  }

  const balance = await getSatsBalance(agentId);

  if (balance.balance < amount) {
    throw new AppError(
      'INSUFFICIENT_BALANCE',
      `Sats balance ${balance.balance} < requested ${amount}`,
      400,
    );
  }

  await enforceSpendingLimits(agentId, amount);

  const isWithdrawal = txType === 'withdrawal' || txType === 'auto_sweep';

  const { error } = await adminSupabase
    .from('sats_balances')
    .update({
      balance: balance.balance - amount,
      total_spent: balance.totalSpent + (isWithdrawal ? 0 : amount),
      total_withdrawn: balance.totalWithdrawn + (isWithdrawal ? amount : 0),
      daily_spent: balance.dailySpent + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('agent_id', agentId);

  if (error) throw new AppError('DEBIT_FAILED', error.message, 500, { cause: error });

  return logTx(agentId, -amount, txType, referenceId, lightningInvoice);
}

async function enforceSpendingLimits(agentId: string, amount: number): Promise<void> {
  const { data: agent } = await publicSupabase
    .from('agents')
    .select('max_tx_amount, daily_spending_limit')
    .eq('id', agentId)
    .single();

  if (!agent) return;

  if (amount > Number(agent.max_tx_amount)) {
    throw new AppError(
      'TX_LIMIT_EXCEEDED',
      `Amount ${amount} exceeds max transaction limit of ${agent.max_tx_amount} sats`,
      403,
    );
  }

  const balance = await getSatsBalance(agentId);
  const resetAt = new Date(balance.dailySpentResetAt);
  const now = new Date();

  let effectiveDailySpent = balance.dailySpent;
  if (now.getTime() - resetAt.getTime() > 86_400_000) {
    effectiveDailySpent = 0;
    await adminSupabase
      .from('sats_balances')
      .update({ daily_spent: 0, daily_spent_reset_at: now.toISOString() })
      .eq('agent_id', agentId);
  }

  if (effectiveDailySpent + amount > Number(agent.daily_spending_limit)) {
    throw new AppError(
      'DAILY_LIMIT_EXCEEDED',
      `Daily spending would reach ${effectiveDailySpent + amount}, limit is ${agent.daily_spending_limit} sats`,
      403,
    );
  }
}

export async function getSatsTransactions(
  agentId: string,
  limit = 20,
): Promise<SatsTransaction[]> {
  const { data } = await publicSupabase
    .from('sats_transactions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapTx);
}

async function logTx(
  agentId: string,
  amount: number,
  txType: SatsTxType,
  referenceId?: string,
  lightningInvoice?: string,
): Promise<SatsTransaction> {
  const { data: tx, error } = await adminSupabase
    .from('sats_transactions')
    .insert({
      agent_id: agentId,
      amount,
      tx_type: txType,
      reference_id: referenceId ?? null,
      lightning_invoice: lightningInvoice ?? null,
    })
    .select()
    .single();

  if (error || !tx) {
    throw new AppError('TX_LOG_FAILED', error?.message ?? 'Failed to log sats transaction', 500);
  }

  return mapTx(tx);
}

function mapBalance(row: Record<string, unknown>): SatsBalance {
  return {
    agentId: row.agent_id as string,
    balance: Number(row.balance),
    totalEarned: Number(row.total_earned),
    totalSpent: Number(row.total_spent),
    totalWithdrawn: Number(row.total_withdrawn),
    dailySpent: Number(row.daily_spent),
    dailySpentResetAt: row.daily_spent_reset_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTx(row: Record<string, unknown>): SatsTransaction {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    amount: Number(row.amount),
    txType: row.tx_type as SatsTxType,
    referenceId: (row.reference_id as string) ?? undefined,
    lightningInvoice: (row.lightning_invoice as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}
