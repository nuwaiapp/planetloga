import { adminSupabase, publicSupabase, type MemoryEntryRow } from './supabase';
import { logActivity } from './activity';
import { AppError, logServerError } from './errors';

export interface MemoryEntry {
  id: string;
  agentId: string;
  agentName?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  referencedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryRequest {
  agentId: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  referencedTaskId?: string;
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  total: number;
}

function toMemoryEntry(row: MemoryEntryRow, agentName?: string): MemoryEntry {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentName,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags ?? [],
    relevanceScore: row.relevance_score,
    referencedTaskId: row.referenced_task_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMemory(
  category?: string,
  search?: string,
  page = 1,
  pageSize = 20,
): Promise<MemorySearchResult> {
  let query = publicSupabase.from('memory_entries').select('*', { count: 'exact' });

  if (category && category !== 'all') query = query.eq('category', category);
  if (search?.trim()) query = query.textSearch('title', search, { type: 'websearch' });

  query = query
    .order('relevance_score', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    throw new AppError('LIST_FAILED', error.message, 500, { cause: error });
  }

  const rows = (data ?? []) as MemoryEntryRow[];
  const agentIds = [...new Set(rows.map(r => r.agent_id))];
  const nameMap = await getAgentNames(agentIds);

  return {
    entries: rows.map(r => toMemoryEntry(r, nameMap[r.agent_id])),
    total: count ?? 0,
  };
}

export async function getMemoryEntry(id: string): Promise<MemoryEntry | null> {
  const { data, error } = await publicSupabase.from('memory_entries').select('*').eq('id', id).single();
  if (error || !data) return null;
  const row = data as MemoryEntryRow;
  const nameMap = await getAgentNames([row.agent_id]);
  return toMemoryEntry(row, nameMap[row.agent_id]);
}

export async function createMemory(req: CreateMemoryRequest): Promise<MemoryEntry> {
  const { data, error } = await adminSupabase
    .from('memory_entries')
    .insert({
      agent_id: req.agentId,
      title: req.title,
      content: req.content,
      category: req.category ?? 'general',
      tags: req.tags ?? [],
      referenced_task_id: req.referencedTaskId ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('CREATE_FAILED', error?.message ?? 'Speichern fehlgeschlagen', 500, {
      cause: error,
    });
  }
  const entry = toMemoryEntry(data as MemoryEntryRow);
  const nameMap = await getAgentNames([entry.agentId]);
  void logActivity({
    eventType: 'memory.created',
    agentId: entry.agentId,
    agentName: nameMap[entry.agentId],
    memoryId: entry.id,
    detail: entry.title,
  }).catch((error: unknown) => {
    logServerError('memory.createMemory.logActivity', error, { memoryId: entry.id });
  });
  return entry;
}

export async function upvoteMemory(id: string): Promise<void> {
  const { data } = await adminSupabase.from('memory_entries').select('relevance_score').eq('id', id).single();
  if (!data) {
    throw new AppError('NOT_FOUND', 'Eintrag nicht gefunden', 404);
  }

  const { error } = await adminSupabase
    .from('memory_entries')
    .update({ relevance_score: data.relevance_score + 1 })
    .eq('id', id);
  if (error) {
    throw new AppError('UPVOTE_FAILED', error.message, 500, { cause: error });
  }
}

export async function getAgentMemory(agentId: string, limit = 5): Promise<MemoryEntry[]> {
  const { data } = await publicSupabase
    .from('memory_entries')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as MemoryEntryRow[]).map(r => toMemoryEntry(r));
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await publicSupabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.name;
  return map;
}
