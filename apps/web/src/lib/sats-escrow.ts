import { adminSupabase, publicSupabase } from './supabase';
import { debitSats, creditSats } from './sats-ledger';
import { sweepAfterCredit } from './auto-sweep';
import { AppError } from './errors';

interface SatsEscrowLock {
  id: string;
  taskId: string;
  agentId: string;
  amount: number;
  status: 'locked' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  releasedAt?: string;
}

function toEscrow(row: Record<string, unknown>): SatsEscrowLock {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    agentId: row.agent_id as string,
    amount: Number(row.amount),
    status: row.status as SatsEscrowLock['status'],
    createdAt: row.created_at as string,
    releasedAt: (row.released_at as string) ?? undefined,
  };
}

export async function lockSatsEscrow(
  taskId: string,
  creatorAgentId: string,
  amountSats: number,
): Promise<SatsEscrowLock> {
  if (amountSats <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Escrow amount must be positive', 400);
  }

  await debitSats(creatorAgentId, amountSats, 'escrow_lock', taskId);

  const { data, error } = await adminSupabase
    .from('sats_escrow_locks')
    .insert({
      task_id: taskId,
      agent_id: creatorAgentId,
      amount: amountSats,
      status: 'locked',
    })
    .select('*')
    .single();

  if (error || !data) {
    await creditSats(creatorAgentId, amountSats, 'escrow_refund', taskId);
    throw new AppError('ESCROW_LOCK_FAILED', error?.message ?? 'Failed to lock sats escrow', 500, { cause: error });
  }

  return toEscrow(data);
}

export async function releaseSatsEscrow(
  taskId: string,
  recipientAgentId: string,
): Promise<SatsEscrowLock> {
  const lock = await getSatsEscrowByTask(taskId);
  if (!lock) throw new AppError('NO_ESCROW', 'No sats escrow lock found for this task', 404);
  if (lock.status !== 'locked') throw new AppError('ESCROW_NOT_LOCKED', `Escrow is ${lock.status}`, 400);

  await creditSats(recipientAgentId, lock.amount, 'escrow_release', taskId);

  const { data, error } = await adminSupabase
    .from('sats_escrow_locks')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_RELEASE_FAILED', error?.message ?? 'Failed to release', 500, { cause: error });
  }

  void sweepAfterCredit(recipientAgentId);

  return toEscrow(data);
}

export async function refundSatsEscrow(taskId: string): Promise<SatsEscrowLock> {
  const lock = await getSatsEscrowByTask(taskId);
  if (!lock) throw new AppError('NO_ESCROW', 'No sats escrow lock found for this task', 404);
  if (lock.status !== 'locked' && lock.status !== 'disputed') {
    throw new AppError('ESCROW_NOT_REFUNDABLE', `Escrow is ${lock.status}`, 400);
  }

  await creditSats(lock.agentId, lock.amount, 'escrow_refund', taskId);

  const { data, error } = await adminSupabase
    .from('sats_escrow_locks')
    .update({ status: 'refunded', released_at: new Date().toISOString() })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_REFUND_FAILED', error?.message ?? 'Failed to refund', 500, { cause: error });
  }

  return toEscrow(data);
}

export async function disputeSatsEscrow(taskId: string): Promise<SatsEscrowLock> {
  const lock = await getSatsEscrowByTask(taskId);
  if (!lock) throw new AppError('NO_ESCROW', 'No sats escrow lock found for this task', 404);
  if (lock.status !== 'locked') throw new AppError('ESCROW_NOT_LOCKED', `Escrow is ${lock.status}`, 400);

  const { data, error } = await adminSupabase
    .from('sats_escrow_locks')
    .update({ status: 'disputed' })
    .eq('id', lock.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('ESCROW_DISPUTE_FAILED', error?.message ?? 'Failed to dispute', 500, { cause: error });
  }

  return toEscrow(data);
}

export async function getSatsEscrowByTask(taskId: string): Promise<SatsEscrowLock | null> {
  const { data, error } = await publicSupabase
    .from('sats_escrow_locks')
    .select('*')
    .eq('task_id', taskId)
    .single();

  if (error || !data) return null;
  return toEscrow(data);
}
