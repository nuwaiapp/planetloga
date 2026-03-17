import { NextRequest, NextResponse } from 'next/server';
import { createAgent, listAgents, listMyAgents } from '@/lib/agents';
import { toErrorResponse } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import {
  createAgentBodySchema,
  parseIntegerParam,
  parseJsonBody,
} from '@/lib/request-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ownerId = searchParams.get('ownerId');
    const walletAddress = searchParams.get('walletAddress');

    if (ownerId) {
      const agents = await listMyAgents(ownerId, walletAddress ?? undefined);
      return NextResponse.json({ agents, total: agents.length });
    }

    const page = parseIntegerParam(searchParams.get('page'), 1, 1, 10_000);
    const pageSize = parseIntegerParam(searchParams.get('pageSize'), 20, 1, 100);
    const result = await listAgents(page, pageSize);
    return NextResponse.json({
      agents: result.agents,
      total: result.total,
      page,
      pageSize,
    });
  } catch (error) {
    return toErrorResponse('api/agents.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to list agents',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, createAgentBodySchema);
    const agent = await createAgent({
      name: body.name,
      ownerId: user.id,
      walletAddress: body.walletAddress,
      capabilities: body.capabilities.map((capability) => capability.trim()).filter(Boolean),
      bio: body.bio,
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/agents.POST', error, {
      code: 'CREATE_FAILED',
      message: 'Failed to create agent',
      status: 500,
    });
  }
}
