import { adminSupabase, publicSupabase } from './supabase';
import { AppError } from './errors';

export interface Invitation {
  id: string;
  code: string;
  invitedBy: string;
  inviterName?: string;
  email?: string;
  targetUrl?: string;
  status: 'pending' | 'accepted' | 'expired';
  acceptedBy?: string;
  createdAt: string;
  expiresAt: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toInvitation(row: Record<string, unknown>, inviterName?: string): Invitation {
  return {
    id: row.id as string,
    code: row.code as string,
    invitedBy: row.invited_by as string,
    inviterName,
    email: (row.email as string) ?? undefined,
    targetUrl: (row.target_url as string) ?? undefined,
    status: row.status as Invitation['status'],
    acceptedBy: (row.accepted_by as string) ?? undefined,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  };
}

export async function createInvitation(
  invitedBy: string,
  email?: string,
  targetUrl?: string,
): Promise<Invitation> {
  const code = generateCode();

  const { data, error } = await adminSupabase
    .from('invitations')
    .insert({
      code,
      invited_by: invitedBy,
      email: email ?? null,
      target_url: targetUrl ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('INVITE_CREATE_FAILED', error?.message ?? 'Failed to create invitation', 500, { cause: error });
  }

  return toInvitation(data);
}

export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const { data, error } = await publicSupabase
    .from('invitations')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) return null;

  const { data: agent } = await publicSupabase
    .from('agents')
    .select('name')
    .eq('id', data.invited_by)
    .single();

  return toInvitation(data, agent?.name);
}

export async function listInvitations(invitedBy: string): Promise<Invitation[]> {
  const { data, error } = await publicSupabase
    .from('invitations')
    .select('*')
    .eq('invited_by', invitedBy)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('INVITE_LIST_FAILED', error.message, 500, { cause: error });
  return (data ?? []).map(r => toInvitation(r));
}

export async function acceptInvitation(code: string, acceptedByAgentId: string): Promise<Invitation> {
  const invite = await getInvitationByCode(code);
  if (!invite) throw new AppError('INVITE_NOT_FOUND', 'Invitation not found', 404);
  if (invite.status !== 'pending') throw new AppError('INVITE_NOT_PENDING', `Invitation is ${invite.status}`, 400);
  if (new Date(invite.expiresAt) < new Date()) {
    await adminSupabase.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
    throw new AppError('INVITE_EXPIRED', 'Invitation has expired', 400);
  }

  const { data, error } = await adminSupabase
    .from('invitations')
    .update({ status: 'accepted', accepted_by: acceptedByAgentId })
    .eq('id', invite.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('INVITE_ACCEPT_FAILED', error?.message ?? 'Failed', 500, { cause: error });
  }

  return toInvitation(data);
}
