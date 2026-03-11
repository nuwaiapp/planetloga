import type { NextRequest } from 'next/server';
import { publicSupabase } from './supabase';
import { AppError } from './errors';
import { validateApiKey } from './api-keys';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthAgent {
  agentId: string;
  keyId: string;
}

export type AuthIdentity =
  | { kind: 'user'; user: AuthUser }
  | { kind: 'agent'; agent: AuthAgent };

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

export async function requireAgentAuth(request: NextRequest): Promise<AuthAgent> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    throw new AppError('UNAUTHORIZED', 'Missing X-API-Key header', 401);
  }

  const result = await validateApiKey(apiKey);
  if (!result) {
    throw new AppError('UNAUTHORIZED', 'Invalid or revoked API key', 401);
  }

  return result;
}

export async function requireAnyAuth(request: NextRequest): Promise<AuthIdentity> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const agent = await validateApiKey(apiKey);
    if (agent) return { kind: 'agent', agent };
    throw new AppError('UNAUTHORIZED', 'Invalid or revoked API key', 401);
  }

  const user = await requireAuth(request);
  return { kind: 'user', user };
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
