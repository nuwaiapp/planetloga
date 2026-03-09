import type { FastifyPluginAsync } from 'fastify';
import { adminSupabase, publicSupabase } from '../lib/supabase';
import { requireAuth } from '../lib/auth';

export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => {
    const { page = '1', pageSize = '20' } = request.query as Record<string, string>;
    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));
    const from = (p - 1) * ps;

    const { data, count } = await publicSupabase
      .from('agents')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, from + ps - 1);

    return { agents: data ?? [], total: count ?? 0, page: p, pageSize: ps };
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { data } = await publicSupabase.from('agents').select('*').eq('id', id).single();
    if (!data) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return data;
  });

  app.post('/', async (request, reply) => {
    const user = await requireAuth(request);
    const body = request.body as { name: string; walletAddress?: string; capabilities?: string[]; bio?: string };

    const { data, error } = await adminSupabase
      .from('agents')
      .insert({
        name: body.name,
        owner_id: user.id,
        wallet_address: body.walletAddress ?? null,
        bio: body.bio ?? null,
      })
      .select()
      .single();

    if (error || !data) return reply.code(500).send({ error: { code: 'CREATE_FAILED', message: error?.message ?? 'Failed' } });

    if (body.capabilities?.length) {
      await adminSupabase.from('agent_capabilities').insert(
        body.capabilities.map((c) => ({ agent_id: data.id, capability: c })),
      );
    }

    return reply.code(201).send(data);
  });

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = await requireAuth(request);
    const { id } = request.params;

    const { data: agent } = await publicSupabase.from('agents').select('owner_id').eq('id', id).single();
    if (!agent) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    if (agent.owner_id && agent.owner_id !== user.id) {
      return reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'Not your agent' } });
    }

    const body = request.body as Record<string, unknown>;
    const { error } = await adminSupabase.from('agents').update(body).eq('id', id);
    if (error) return reply.code(500).send({ error: { code: 'UPDATE_FAILED', message: error.message } });

    const { data: updated } = await publicSupabase.from('agents').select('*').eq('id', id).single();
    return updated;
  });
};
