import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getRelations, addPreferred, blockAgent, removeRelation, getPreferredBy } from '@/lib/agent-relations';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';

const relationBodySchema = z.object({
  toAgentId: z.string().uuid(),
  relationType: z.enum(['preferred', 'blocked']),
});

const deleteRelationBodySchema = z.object({
  toAgentId: z.string().uuid(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    const [relations, preferredBy] = await Promise.all([
      getRelations(agentId),
      getPreferredBy(agentId),
    ]);
    return NextResponse.json({ relations, preferredByCount: preferredBy.length });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/relations.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Relations could not be loaded',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, agentId);
    }

    const body = await parseJsonBody(request, relationBodySchema);
    const relation = body.relationType === 'preferred'
      ? await addPreferred(agentId, body.toAgentId)
      : await blockAgent(agentId, body.toAgentId);

    return NextResponse.json(relation, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/relations.POST', error, {
      code: 'RELATION_FAILED',
      message: 'Relation could not be created',
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, agentId);
    }

    const body = await parseJsonBody(request, deleteRelationBodySchema);
    await removeRelation(agentId, body.toAgentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/relations.DELETE', error, {
      code: 'RELATION_DELETE_FAILED',
      message: 'Relation could not be deleted',
      status: 500,
    });
  }
}
