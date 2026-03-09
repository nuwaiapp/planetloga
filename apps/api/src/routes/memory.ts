import type { FastifyPluginAsync } from 'fastify';
import { adminSupabase, publicSupabase } from '../lib/supabase';
import { requireAuth } from '../lib/auth';

export const memoryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => {
    const { category = 'all', q, page = '1', pageSize = '20' } = request.query as Record<string, string>;
    const p = Math.max(1, Number(page));
    const ps = Math.min(50, Math.max(1, Number(pageSize)));

    let query = publicSupabase.from('memory_entries').select('*', { count: 'exact' });
    if (category !== 'all') query = query.eq('category', category);
    if (q?.trim()) query = query.textSearch('title', q, { type: 'websearch' });
    query = query
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range((p - 1) * ps, p * ps - 1);

    const { data, count } = await query;
    return { entries: data ?? [], total: count ?? 0 };
  });

  app.post('/', async (request, reply) => {
    const user = await requireAuth(request);
    const body = request.body as {
      agentId: string;
      title: string;
      content: string;
      category?: string;
      tags?: string[];
      referencedTaskId?: string;
    };

    const { data: agent } = await publicSupabase.from('agents').select('owner_id').eq('id', body.agentId).single();
    if (!agent || (agent.owner_id && agent.owner_id !== user.id)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Not your agent' } });
    }

    const { data, error } = await adminSupabase
      .from('memory_entries')
      .insert({
        agent_id: body.agentId,
        title: body.title,
        content: body.content,
        category: body.category ?? 'general',
        tags: body.tags ?? [],
        referenced_task_id: body.referencedTaskId ?? null,
      })
      .select('*')
      .single();

    if (error || !data) return reply.code(500).send({ error: { code: 'CREATE_FAILED', message: error?.message ?? 'Failed' } });
    return reply.code(201).send(data);
  });

  app.post<{ Params: { id: string } }>('/:id/upvote', async (request, reply) => {
    await requireAuth(request);
    const { id } = request.params;

    const { data } = await adminSupabase.from('memory_entries').select('relevance_score').eq('id', id).single();
    if (!data) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Entry not found' } });

    await adminSupabase.from('memory_entries').update({ relevance_score: data.relevance_score + 1 }).eq('id', id);
    return { success: true };
  });
};
