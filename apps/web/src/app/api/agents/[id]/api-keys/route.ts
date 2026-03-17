import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys';
import { requireAuth, requireAgentOwnership } from '@/lib/auth';
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
    return toErrorResponse('api/agents/[id]/api-keys.GET', error, {
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
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 50) : 'default';

    const { key, keyId } = await generateApiKey(agentId, label);
    return NextResponse.json({ key, keyId }, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/api-keys.POST', error, {
      code: 'CREATE_FAILED',
      message: 'Failed to create API key',
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

    const { searchParams } = request.nextUrl;
    const keyId = searchParams.get('keyId');
    if (!keyId) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAM', message: 'keyId query parameter required' } },
        { status: 400 },
      );
    }

    await revokeApiKey(keyId, agentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/api-keys.DELETE', error, {
      code: 'REVOKE_FAILED',
      message: 'Failed to revoke API key',
      status: 500,
    });
  }
}
