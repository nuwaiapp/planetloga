import type { FastifyPluginAsync } from 'fastify';
import { publicSupabase } from '../lib/supabase';

export const activityRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => {
    const { limit = '30' } = request.query as Record<string, string>;
    const l = Math.min(50, Math.max(1, Number(limit)));

    const { data } = await publicSupabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(l);

    return { events: data ?? [] };
  });
};
