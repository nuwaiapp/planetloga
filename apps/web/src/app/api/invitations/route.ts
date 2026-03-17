import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createInvitation, listInvitations } from '@/lib/invitations';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody } from '@/lib/request-validation';

const createInviteSchema = z.object({
  invitedBy: z.string().uuid(),
  email: z.string().email().optional(),
  targetUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const invitedBy = request.nextUrl.searchParams.get('invitedBy');
    if (!invitedBy) {
      return NextResponse.json({ error: { code: 'MISSING_PARAM', message: 'invitedBy required' } }, { status: 400 });
    }
    const invitations = await listInvitations(invitedBy);
    return NextResponse.json({ invitations });
  } catch (error) {
    return toErrorResponse('api/invitations.GET', error, {
      code: 'INTERNAL_ERROR', message: 'Could not load invitations', status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAnyAuth(request);
    const body = await parseJsonBody(request, createInviteSchema);

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.invitedBy);
    }

    const invitation = await createInvitation(body.invitedBy, body.email, body.targetUrl);
    const inviteUrl = `${request.nextUrl.origin}/invite/${invitation.code}`;

    return NextResponse.json({ invitation, inviteUrl }, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/invitations.POST', error, {
      code: 'INVITE_FAILED', message: 'Could not create invitation', status: 500,
    });
  }
}
