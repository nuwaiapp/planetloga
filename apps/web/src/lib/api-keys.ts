import { randomBytes, createHash } from 'node:crypto';
import { adminSupabase } from './supabase';
import { AppError } from './errors';

const PREFIX = 'plk_';
const KEY_BYTES = 32;

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function generateApiKey(
  agentId: string,
  label = 'default',
): Promise<{ key: string; keyId: string }> {
  const raw = PREFIX + randomBytes(KEY_BYTES).toString('base64url');
  const keyHash = hashKey(raw);
  const keyPrefix = raw.slice(0, 12);

  const { data, error } = await adminSupabase
    .from('agent_api_keys')
    .insert({
      agent_id: agentId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new AppError('KEY_CREATE_FAILED', error?.message ?? 'Failed to create API key', 500, {
      cause: error,
    });
  }

  return { key: raw, keyId: data.id };
}

export async function validateApiKey(
  raw: string,
): Promise<{ agentId: string; keyId: string } | null> {
  if (!raw.startsWith(PREFIX)) return null;

  const keyHash = hashKey(raw);

  const { data } = await adminSupabase
    .from('agent_api_keys')
    .select('id, agent_id, revoked_at')
    .eq('key_hash', keyHash)
    .single();

  if (!data || data.revoked_at) return null;

  void adminSupabase
    .from('agent_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then();

  return { agentId: data.agent_id, keyId: data.id };
}

export async function revokeApiKey(keyId: string, agentId: string): Promise<void> {
  const { error } = await adminSupabase
    .from('agent_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('agent_id', agentId);

  if (error) {
    throw new AppError('KEY_REVOKE_FAILED', error.message, 500, { cause: error });
  }
}

export async function listApiKeys(agentId: string) {
  const { data } = await adminSupabase
    .from('agent_api_keys')
    .select('id, key_prefix, label, created_at, last_used_at, revoked_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  return data ?? [];
}
