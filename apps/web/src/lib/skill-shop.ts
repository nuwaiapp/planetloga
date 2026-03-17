import { adminSupabase, publicSupabase } from './supabase';
import { AppError } from './errors';
import { creditGeneric } from './aim-ledger';

export interface Skill {
  id: string;
  agentId: string;
  agentName?: string;
  title: string;
  description: string;
  category: string;
  priceAim: number;
  purchases: number;
  rating: number;
  status: string;
  createdAt: string;
}

export interface SkillWithContent extends Skill {
  content: string;
}

export async function listSkills(category?: string, page = 1, pageSize = 20): Promise<{ skills: Skill[]; total: number }> {
  let query = publicSupabase.from('skills').select('*', { count: 'exact' }).eq('status', 'active');
  if (category) query = query.eq('category', category);
  query = query.order('purchases', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new AppError('SKILLS_LIST_FAILED', error.message, 500, { cause: error });

  const rows = data ?? [];
  const agentIds = [...new Set(rows.map(r => r.agent_id))];
  const nameMap = await getAgentNames(agentIds);

  return {
    skills: rows.map(r => toSkill(r, nameMap[r.agent_id])),
    total: count ?? 0,
  };
}

export async function getSkill(id: string): Promise<Skill | null> {
  const { data } = await publicSupabase.from('skills').select('*').eq('id', id).single();
  if (!data) return null;
  const nameMap = await getAgentNames([data.agent_id]);
  return toSkill(data, nameMap[data.agent_id]);
}

export async function getSkillContent(skillId: string, buyerAgentId: string): Promise<string | null> {
  const { data: purchase } = await publicSupabase
    .from('skill_purchases')
    .select('id')
    .eq('skill_id', skillId)
    .eq('buyer_agent_id', buyerAgentId)
    .single();

  if (!purchase) return null;

  const { data: skill } = await publicSupabase.from('skills').select('content').eq('id', skillId).single();
  return skill?.content ?? null;
}

export async function purchaseSkill(skillId: string, buyerAgentId: string): Promise<void> {
  const skill = await getSkill(skillId);
  if (!skill) throw new AppError('SKILL_NOT_FOUND', 'Skill not found', 404);
  if (skill.agentId === buyerAgentId) throw new AppError('SELF_PURCHASE', 'Cannot buy your own skill', 400);

  const { data: existing } = await publicSupabase
    .from('skill_purchases')
    .select('id')
    .eq('skill_id', skillId)
    .eq('buyer_agent_id', buyerAgentId)
    .single();

  if (existing) throw new AppError('ALREADY_PURCHASED', 'Skill already purchased', 409);

  const price = skill.priceAim;
  const agentShare = Math.round(price * 0.7);
  const treasuryShare = price - agentShare;

  const { getBalance } = await import('./aim-ledger');
  const balance = await getBalance(buyerAgentId);
  if (balance.balance < price) {
    throw new AppError('INSUFFICIENT_BALANCE', `Balance ${balance.balance} < price ${price}`, 400);
  }

  const { debit } = await import('./aim-ledger');
  await debit(buyerAgentId, price, 'skill_purchase');

  await creditGeneric(skill.agentId, agentShare, 'skill_revenue', skillId);

  if (treasuryShare > 0) {
    const { data: treasuryAgent } = await publicSupabase
      .from('agents')
      .select('id')
      .eq('name', 'Treasury')
      .single();

    if (treasuryAgent) {
      await creditGeneric(treasuryAgent.id, treasuryShare, 'skill_revenue', skillId);
    }
  }

  await adminSupabase
    .from('skill_purchases')
    .insert({ skill_id: skillId, buyer_agent_id: buyerAgentId, amount_paid: price });

  await adminSupabase
    .from('skills')
    .update({ purchases: skill.purchases + 1 })
    .eq('id', skillId);
}

export async function createSkill(
  agentId: string,
  title: string,
  description: string,
  content: string,
  category: string,
  priceAim: number,
): Promise<Skill> {
  const { data, error } = await adminSupabase
    .from('skills')
    .insert({ agent_id: agentId, title, description, content, category, price_aim: priceAim })
    .select('*')
    .single();

  if (error || !data) throw new AppError('SKILL_CREATE_FAILED', error?.message ?? 'Failed', 500, { cause: error });
  return toSkill(data);
}

function toSkill(row: Record<string, unknown>, agentName?: string): Skill {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    agentName,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    priceAim: Number(row.price_aim),
    purchases: (row.purchases as number) ?? 0,
    rating: Number(row.rating ?? 0),
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await publicSupabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.id] = r.name;
  return map;
}
