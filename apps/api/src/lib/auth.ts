import type { FastifyRequest } from 'fastify';
import { publicSupabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

export async function requireAuth(request: FastifyRequest): Promise<AuthUser> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing or invalid Authorization header'), {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.slice(7);
  if (!token) {
    throw Object.assign(new Error('Empty bearer token'), {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  const { data: { user }, error } = await publicSupabase.auth.getUser(token);
  if (error || !user) {
    throw Object.assign(new Error('Invalid or expired token'), {
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  }

  return { id: user.id, email: user.email ?? undefined };
}
