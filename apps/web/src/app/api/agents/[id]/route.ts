import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgent } from '@/lib/agents';
import { toErrorResponse } from '@/lib/errors';
import { requireAuth, requireAgentOwnership } from '@/lib/auth';
import {
  parseJsonBody,
  parseUuidParam,
  updateAgentBodySchema,
} from '@/lib/request-validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Agent ID');
    const agent = await getAgent(id);
    if (!agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: `Agent ${id} not found` } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch (error) {
    return toErrorResponse('api/agents/[id].GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to get agent',
      status: 500,
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Agent ID');
    await requireAgentOwnership(user.id, id);
    const body = await parseJsonBody(request, updateAgentBodySchema);
    const agent = await updateAgent(id, body);
    if (!agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: `Agent ${id} not found` } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch (error) {
    return toErrorResponse('api/agents/[id].PATCH', error, {
      code: 'UPDATE_FAILED',
      message: 'Failed to update agent',
      status: 500,
    });
  }
}
