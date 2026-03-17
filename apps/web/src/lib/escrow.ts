import type { EscrowLock } from '@planetloga/types';

import { adminSupabase, publicSupabase, type EscrowLockRow } from './supabase';
import { debit, creditReward } from './aim-ledger';
import { AppError } from './errors';

function toEscrowLock(row: EscrowLockRow): EscrowLock {
  return {
    id: row.id,
    taskId: row.task_id,
    agentId: row.agent_id,
    amount: Number(row.amount),
    status: row.status as EscrowLock['status'],
    createdAt: row.created_at,
    releasedAt: row.released_at ?? undefined,
  };
}

export async function lockEscrow(
  taskId: string,
  creatorAgentId: string,
  amount: number,
): Promise<EscrowLock> {
  if (amount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Escrow amount must be positive', 400);
  }

  await debit(creatorAgentId, amount, 'fee');

  const { data, error } = await adminSupabase
    .from('escrow_locks')
    .insert({
      task_id: taskId,
      agent_id: creatorAgentId,
      amount,
      status: 'locked',
    })
    .select('*')
    .single();

  if (error || !data) {
    await creditReward(creatorAgentId, amount, taskId);
    throw new AppError('ESCROW_LOCK_FAILED', error?.message ?? 'Failed to lock escrow', 500, { cause: error });
  }

  return toEscrowLock(data as EscrowLockRow);
}

export async function releaseEscrow(
  taskId: string,
  recipientAgentId: string,
): Promise<EscrowLock> {
  const lock = await getEscrowByTask(taskId);
  if (!lock) {
    throw new AppError('NO_ESCROW', 'No escrow lock found for this task', 404);
  }
  if (lock.status !== 'locked') {
    throw new AppError('ESCROW_NOT_LOCKED', `Escrow is ${lock.status}, cannot release`, 400);
  }

  await creditReward(recipientAgentId, lock.amount, taskId);

  const { data, error } = await adminSupabase
    .from('escrow_locks')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_RELEASE_FAILED', error?.message ?? 'Failed to release escrow', 500, { cause: error });
  }

  return toEscrowLock(data as EscrowLockRow);
}

export async function refundEscrow(taskId: string): Promise<EscrowLock> {
  const lock = await getEscrowByTask(taskId);
  if (!lock) {
    throw new AppError('NO_ESCROW', 'No escrow lock found for this task', 404);
  }
  if (lock.status !== 'locked' && lock.status !== 'disputed') {
    throw new AppError('ESCROW_NOT_REFUNDABLE', `Escrow is ${lock.status}, cannot refund`, 400);
  }

  await creditReward(lock.agentId, lock.amount, taskId);

  const { data, error } = await adminSupabase
    .from('escrow_locks')
    .update({ status: 'refunded', released_at: new Date().toISOString() })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_REFUND_FAILED', error?.message ?? 'Failed to refund escrow', 500, { cause: error });
  }

  return toEscrowLock(data as EscrowLockRow);
}

export async function disputeEscrow(taskId: string): Promise<EscrowLock> {
  const lock = await getEscrowByTask(taskId);
  if (!lock) {
    throw new AppError('NO_ESCROW', 'No escrow lock found for this task', 404);
  }
  if (lock.status !== 'locked') {
    throw new AppError('ESCROW_NOT_LOCKED', `Escrow is ${lock.status}, cannot dispute`, 400);
  }

  const { data, error } = await adminSupabase
    .from('escrow_locks')
    .update({ status: 'disputed' })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_DISPUTE_FAILED', error?.message ?? 'Failed to dispute escrow', 500, { cause: error });
  }

  return toEscrowLock(data as EscrowLockRow);
}

export async function getEscrowByTask(taskId: string): Promise<EscrowLock | null> {
  const { data, error } = await publicSupabase
    .from('escrow_locks')
    .select('*')
    .eq('task_id', taskId)
    .single();

  if (error || !data) return null;
  return toEscrowLock(data as EscrowLockRow);
}

export async function getEscrowStatus(taskId: string): Promise<EscrowLock['status'] | null> {
  const lock = await getEscrowByTask(taskId);
  return lock?.status ?? null;
}

export async function releaseEscrowPartial(
  taskId: string,
  recipientAgentId: string,
  amount: number,
): Promise<void> {
  const lock = await getEscrowByTask(taskId);
  if (!lock) {
    throw new AppError('NO_ESCROW', 'No escrow lock found for this task', 404);
  }
  if (lock.status !== 'locked') {
    throw new AppError('ESCROW_NOT_LOCKED', `Escrow is ${lock.status}, cannot release`, 400);
  }
  if (amount > lock.amount) {
    throw new AppError('AMOUNT_EXCEEDS_ESCROW', `Partial amount ${amount} exceeds locked ${lock.amount}`, 400);
  }

  await creditReward(recipientAgentId, amount, taskId);

  const remaining = lock.amount - amount;
  if (remaining <= 0) {
    await adminSupabase
      .from('escrow_locks')
      .update({ status: 'released', released_at: new Date().toISOString(), amount: 0 })
      .eq('id', lock.id);
  } else {
    await adminSupabase
      .from('escrow_locks')
      .update({ amount: remaining })
      .eq('id', lock.id);
  }
}
