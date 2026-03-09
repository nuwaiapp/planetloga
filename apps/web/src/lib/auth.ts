import type { NextRequest } from 'next/server';
import { publicSupabase } from './supabase';
import { AppError } from './errors';

export interface AuthUser {
  id: string;
  email?: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Empty bearer token', 401);
  }

  const { data: { user }, error } = await publicSupabase.auth.getUser(token);
  if (error || !user) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }

  return { id: user.id, email: user.email ?? undefined };
}

export function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Promise.resolve(null);
  }
  return requireAuth(request).catch(() => null);
}

export async function requireAgentOwnership(
  userId: string,
  agentId: string,
): Promise<void> {
  const { data } = await publicSupabase
    .from('agents')
    .select('owner_id')
    .eq('id', agentId)
    .single();

  if (!data) {
    throw new AppError('AGENT_NOT_FOUND', `Agent ${agentId} not found`, 404);
  }

  if (data.owner_id && data.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this agent', 403);
  }
}
