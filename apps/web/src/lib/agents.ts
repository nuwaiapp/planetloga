import { adminSupabase, publicSupabase, type AgentRow } from './supabase';
import type { Agent, CreateAgentRequest, UpdateAgentRequest, UpdateVaultConfigRequest } from '@planetloga/types';
import { DEFAULT_VAULT_CONFIG } from '@planetloga/types';
import { logActivity } from './activity';
import { AppError, logServerError } from './errors';

function toAgent(row: AgentRow, capabilities: string[]): Agent {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    walletAddress: row.wallet_address ?? undefined,
    spendingAddress: (row as Record<string, unknown>).spending_address as string | undefined,
    payoutAddress: (row as Record<string, unknown>).payout_address as string | undefined,
    workingBalanceLimit: Number((row as Record<string, unknown>).working_balance_limit ?? DEFAULT_VAULT_CONFIG.workingBalanceLimit),
    maxTxAmount: Number((row as Record<string, unknown>).max_tx_amount ?? DEFAULT_VAULT_CONFIG.maxTxAmount),
    dailySpendingLimit: Number((row as Record<string, unknown>).daily_spending_limit ?? DEFAULT_VAULT_CONFIG.dailySpendingLimit),
    status: row.status as Agent['status'],
    reputation: row.reputation,
    tasksCompleted: row.tasks_completed,
    bio: row.bio ?? undefined,
    capabilities,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCapabilities(agentId: string): Promise<string[]> {
  const { data } = await publicSupabase
    .from('agent_capabilities')
    .select('capability')
    .eq('agent_id', agentId);
  return (data ?? []).map((r) => r.capability);
}

async function setCapabilities(agentId: string, capabilities: string[]): Promise<void> {
  await adminSupabase.from('agent_capabilities').delete().eq('agent_id', agentId);
  if (capabilities.length > 0) {
    await adminSupabase.from('agent_capabilities').insert(
      capabilities.map((capability) => ({ agent_id: agentId, capability })),
    );
  }
}

export async function createAgent(req: CreateAgentRequest): Promise<Agent> {
  const { data, error } = await adminSupabase
    .from('agents')
    .insert({
      name: req.name,
      owner_id: req.ownerId ?? null,
      wallet_address: req.walletAddress ?? null,
      spending_address: req.spendingAddress ?? null,
      payout_address: req.payoutAddress ?? null,
      bio: req.bio ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('CREATE_FAILED', error?.message ?? 'Failed to create agent', 500, {
      cause: error,
    });
  }

  await setCapabilities(data.id, req.capabilities);
  const agent = toAgent(data as AgentRow, req.capabilities);
  void logActivity({
    eventType: 'agent.registered',
    agentId: agent.id,
    agentName: agent.name,
    detail: `capabilities: ${req.capabilities.join(', ')}`,
  }).catch((error: unknown) => {
    logServerError('agents.createAgent.logActivity', error, { agentId: agent.id });
  });
  return agent;
}

export async function getAgent(id: string): Promise<Agent | null> {
  const { data, error } = await publicSupabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const capabilities = await getCapabilities(id);
  return toAgent(data as AgentRow, capabilities);
}

export async function listAgents(page = 1, pageSize = 20): Promise<{ agents: Agent[]; total: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await publicSupabase
    .from('agents')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) return { agents: [], total: 0 };

  const agents = await Promise.all(
    (data as AgentRow[]).map(async (row) => {
      const caps = await getCapabilities(row.id);
      return toAgent(row, caps);
    }),
  );

  return { agents, total: count ?? 0 };
}

export async function listAgentsByOwner(userId: string): Promise<Agent[]> {
  const { data, error } = await publicSupabase
    .from('agents')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return Promise.all(
    (data as AgentRow[]).map(async (row) => {
      const caps = await getCapabilities(row.id);
      return toAgent(row, caps);
    }),
  );
}

export async function listMyAgents(userId: string, walletAddress?: string): Promise<Agent[]> {
  const byOwner = await listAgentsByOwner(userId);
  if (byOwner.length > 0) return byOwner;

  if (walletAddress) {
    const { data, error } = await publicSupabase
      .from('agents')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return Promise.all(
        (data as AgentRow[]).map(async (row) => {
          const caps = await getCapabilities(row.id);
          return toAgent(row, caps);
        }),
      );
    }
  }

  return [];
}

export async function updateAgent(id: string, req: UpdateAgentRequest): Promise<Agent | null> {
  const updates: Record<string, unknown> = {};
  if (req.name !== undefined) updates.name = req.name;
  if (req.walletAddress !== undefined) updates.wallet_address = req.walletAddress;
  if (req.spendingAddress !== undefined) updates.spending_address = req.spendingAddress;
  if (req.bio !== undefined) updates.bio = req.bio;
  if (req.status !== undefined) updates.status = req.status;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminSupabase.from('agents').update(updates).eq('id', id);
    if (error) {
      throw new AppError('UPDATE_FAILED', error.message, 500, { cause: error });
    }
  }

  if (req.capabilities !== undefined) {
    await setCapabilities(id, req.capabilities);
  }

  return getAgent(id);
}

export async function updatePayoutAddress(id: string, payoutAddress: string): Promise<Agent | null> {
  const { error } = await adminSupabase
    .from('agents')
    .update({ payout_address: payoutAddress })
    .eq('id', id);

  if (error) {
    throw new AppError('UPDATE_FAILED', error.message, 500, { cause: error });
  }

  return getAgent(id);
}

export async function updateVaultConfig(id: string, config: UpdateVaultConfigRequest): Promise<Agent | null> {
  const updates: Record<string, unknown> = {};
  if (config.workingBalanceLimit !== undefined) updates.working_balance_limit = config.workingBalanceLimit;
  if (config.maxTxAmount !== undefined) updates.max_tx_amount = config.maxTxAmount;
  if (config.dailySpendingLimit !== undefined) updates.daily_spending_limit = config.dailySpendingLimit;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminSupabase.from('agents').update(updates).eq('id', id);
    if (error) {
      throw new AppError('UPDATE_FAILED', error.message, 500, { cause: error });
    }
  }

  return getAgent(id);
}
