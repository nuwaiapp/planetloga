import type { FastifyPluginAsync } from 'fastify';
import { adminSupabase, publicSupabase } from '../lib/supabase';
import { requireAuth } from '../lib/auth';

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => {
    const { status = 'all', page = '1', pageSize = '20' } = request.query as Record<string, string>;
    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));

    let query = publicSupabase.from('tasks').select('*', { count: 'exact' });
    if (status !== 'all') query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range((p - 1) * ps, p * ps - 1);

    const { data, count } = await query;
    return { tasks: data ?? [], total: count ?? 0, page: p, pageSize: ps };
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data } = await publicSupabase.from('tasks').select('*').eq('id', id).single();
    if (!data) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return data;
  });

  app.post('/', async (request, reply) => {
    const user = await requireAuth(request);
    const body = request.body as {
      title: string;
      description: string;
      rewardAim: number;
      creatorId: string;
      requiredCapabilities?: string[];
      deadline?: string;
    };

    const { data: agent } = await publicSupabase.from('agents').select('owner_id').eq('id', body.creatorId).single();
    if (!agent || (agent.owner_id && agent.owner_id !== user.id)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Not your agent' } });
    }

    const { data, error } = await adminSupabase
      .from('tasks')
      .insert({
        title: body.title,
        description: body.description,
        reward_aim: body.rewardAim,
        creator_id: body.creatorId,
        required_capabilities: body.requiredCapabilities ?? [],
        deadline: body.deadline ?? null,
      })
      .select('*')
      .single();

    if (error || !data) return reply.code(500).send({ error: { code: 'CREATE_FAILED', message: error?.message ?? 'Failed' } });
    return reply.code(201).send(data);
  });

  app.post<{ Params: { id: string } }>('/:id/apply', async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = request.params;
    const body = request.body as { agentId: string; message?: string };

    const { data: agent } = await publicSupabase.from('agents').select('owner_id').eq('id', body.agentId).single();
    if (!agent || (agent.owner_id && agent.owner_id !== user.id)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Not your agent' } });
    }

    const { data, error } = await adminSupabase
      .from('task_applications')
      .insert({ task_id: id, agent_id: body.agentId, message: body.message ?? null })
      .select('*')
      .single();

    if (error || !data) {
      const isDuplicate = error?.message?.includes('duplicate') || error?.message?.includes('unique');
      const code = isDuplicate ? 'ALREADY_APPLIED' : 'APPLY_FAILED';
      return reply.code(isDuplicate ? 409 : 500).send({ error: { code, message: error?.message ?? 'Failed' } });
    }

    return reply.code(201).send(data);
  });

  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = request.params;
    const body = request.body as { status: string };

    const { data: task } = await publicSupabase.from('tasks').select('*').eq('id', id).single();
    if (!task) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Task not found' } });

    const { data: agent } = await publicSupabase.from('agents').select('owner_id').eq('id', task.creator_id).single();
    if (!agent || (agent.owner_id && agent.owner_id !== user.id)) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Not your task' } });
    }

    const { error } = await adminSupabase.from('tasks').update({ status: body.status }).eq('id', id);
    if (error) return reply.code(500).send({ error: { code: 'UPDATE_FAILED', message: error.message } });

    const { data: updated } = await publicSupabase.from('tasks').select('*').eq('id', id).single();
    return updated;
  });
};
