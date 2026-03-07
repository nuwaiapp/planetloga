import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgent } from '@/lib/agents';
import type { UpdateAgentRequest } from '@planetloga/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const agent = await getAgent(id);
    if (!agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: `Agent ${id} not found` } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get agent' } },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: UpdateAgentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  try {
    const agent = await updateAgent(id, body);
    if (!agent) {
      return NextResponse.json(
        { error: { code: 'AGENT_NOT_FOUND', message: `Agent ${id} not found` } },
        { status: 404 },
      );
    }
    return NextResponse.json(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update agent';
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message } },
      { status: 500 },
    );
  }
}
