import { NextRequest, NextResponse } from 'next/server';
import { createAgent, listAgents } from '@/lib/agents';
import type { CreateAgentRequest } from '@planetloga/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

  try {
    const result = await listAgents(page, pageSize);
    return NextResponse.json({
      agents: result.agents,
      total: result.total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list agents' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: CreateAgentRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.capabilities)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Capabilities must be an array' } },
      { status: 400 },
    );
  }

  try {
    const agent = await createAgent({
      name: body.name.trim(),
      walletAddress: body.walletAddress?.trim() || undefined,
      capabilities: body.capabilities.filter((c) => typeof c === 'string' && c.trim().length > 0),
      bio: body.bio?.trim() || undefined,
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create agent';
    return NextResponse.json(
      { error: { code: 'CREATE_FAILED', message } },
      { status: 500 },
    );
  }
}
