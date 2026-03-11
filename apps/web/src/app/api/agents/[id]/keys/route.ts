import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAgentOwnership } from '@/lib/auth';
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    await requireAgentOwnership(user.id, agentId);

    const keys = await listApiKeys(agentId);
    return NextResponse.json({ keys });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/keys.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to list API keys',
      status: 500,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    await requireAgentOwnership(user.id, agentId);

    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === 'string' ? body.label : 'default';

    const { key, keyId } = await generateApiKey(agentId, label);

    return NextResponse.json({ key, keyId, message: 'Store this key securely — it will not be shown again.' }, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/keys.POST', error, {
      code: 'KEY_CREATE_FAILED',
      message: 'Failed to generate API key',
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    await requireAgentOwnership(user.id, agentId);

    const body = await request.json();
    const keyId = typeof body.keyId === 'string' ? body.keyId : undefined;
    if (!keyId) {
      return NextResponse.json({ error: 'Missing keyId in body' }, { status: 400 });
    }

    await revokeApiKey(keyId, agentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/keys.DELETE', error, {
      code: 'KEY_REVOKE_FAILED',
      message: 'Failed to revoke API key',
      status: 500,
    });
  }
}
