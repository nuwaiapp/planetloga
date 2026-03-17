import type { AgentRelation } from '@planetloga/types';

import { adminSupabase, publicSupabase, type AgentRelationRow } from './supabase';
import { AppError } from './errors';

function toRelation(row: AgentRelationRow): AgentRelation {
  return {
    id: row.id,
    fromAgentId: row.from_agent_id,
    toAgentId: row.to_agent_id,
    relationType: row.relation_type as AgentRelation['relationType'],
    trustScore: Number(row.trust_score),
    tasksTogether: row.tasks_together,
    createdAt: row.created_at,
  };
}

export async function addPreferred(fromAgentId: string, toAgentId: string): Promise<AgentRelation> {
  return upsertRelation(fromAgentId, toAgentId, 'preferred');
}

export async function blockAgent(fromAgentId: string, toAgentId: string): Promise<AgentRelation> {
  return upsertRelation(fromAgentId, toAgentId, 'blocked');
}

export async function removeRelation(fromAgentId: string, toAgentId: string): Promise<void> {
  await adminSupabase
    .from('agent_relations')
    .delete()
    .eq('from_agent_id', fromAgentId)
    .eq('to_agent_id', toAgentId);
}

async function upsertRelation(
  fromAgentId: string,
  toAgentId: string,
  relationType: 'preferred' | 'blocked',
): Promise<AgentRelation> {
  if (fromAgentId === toAgentId) {
    throw new AppError('SELF_RELATION', 'Cannot create a relation with yourself', 400);
  }

  const { data: existing } = await adminSupabase
    .from('agent_relations')
    .select('*')
    .eq('from_agent_id', fromAgentId)
    .eq('to_agent_id', toAgentId)
    .single();

  if (existing) {
    const { data, error } = await adminSupabase
      .from('agent_relations')
      .update({ relation_type: relationType })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('RELATION_UPDATE_FAILED', error?.message ?? 'Update failed', 500, { cause: error });
    }
    return toRelation(data as AgentRelationRow);
  }

  const { data, error } = await adminSupabase
    .from('agent_relations')
    .insert({
      from_agent_id: fromAgentId,
      to_agent_id: toAgentId,
      relation_type: relationType,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('RELATION_CREATE_FAILED', error?.message ?? 'Create failed', 500, { cause: error });
  }
  return toRelation(data as AgentRelationRow);
}

export async function getRelations(agentId: string): Promise<AgentRelation[]> {
  const { data, error } = await publicSupabase
    .from('agent_relations')
    .select('*')
    .eq('from_agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('RELATIONS_FETCH_FAILED', error.message, 500, { cause: error });
  return (data ?? []).map(r => toRelation(r as AgentRelationRow));
}

export async function getPreferredBy(agentId: string): Promise<AgentRelation[]> {
  const { data, error } = await publicSupabase
    .from('agent_relations')
    .select('*')
    .eq('to_agent_id', agentId)
    .eq('relation_type', 'preferred');

  if (error) throw new AppError('RELATIONS_FETCH_FAILED', error.message, 500, { cause: error });
  return (data ?? []).map(r => toRelation(r as AgentRelationRow));
}

export async function getTrustScore(agentA: string, agentB: string): Promise<number> {
  const { data } = await publicSupabase
    .from('agent_relations')
    .select('trust_score')
    .eq('from_agent_id', agentA)
    .eq('to_agent_id', agentB)
    .single();

  return data ? Number(data.trust_score) : 0;
}

export async function incrementTrustAfterTask(agentA: string, agentB: string): Promise<void> {
  const pairs = [
    [agentA, agentB],
    [agentB, agentA],
  ];

  for (const [from, to] of pairs) {
    const { data: existing } = await adminSupabase
      .from('agent_relations')
      .select('*')
      .eq('from_agent_id', from)
      .eq('to_agent_id', to)
      .single();

    if (existing) {
      const newTrust = Math.min(100, Number(existing.trust_score) + 5);
      await adminSupabase
        .from('agent_relations')
        .update({
          trust_score: newTrust,
          tasks_together: existing.tasks_together + 1,
        })
        .eq('id', existing.id);
    }
  }
}

export async function isBlocked(fromAgentId: string, toAgentId: string): Promise<boolean> {
  const { data } = await publicSupabase
    .from('agent_relations')
    .select('id')
    .eq('from_agent_id', fromAgentId)
    .eq('to_agent_id', toAgentId)
    .eq('relation_type', 'blocked')
    .single();

  return !!data;
}
