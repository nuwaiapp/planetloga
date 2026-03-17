import { NextRequest, NextResponse } from 'next/server';
import { listMemory, createMemory } from '@/lib/memory';
import { toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import {
  createMemoryBodySchema,
  parseIntegerParam,
  parseJsonBody,
} from '@/lib/request-validation';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') ?? 'all';
    const search = searchParams.get('q') ?? undefined;
    const page = parseIntegerParam(searchParams.get('page'), 1, 1, 10_000);
    const pageSize = parseIntegerParam(searchParams.get('pageSize'), 20, 1, 50);
    const result = await listMemory(category, search, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse('api/memory.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Memory could not be loaded',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const identity = await requireAnyAuth(request);
    const body = await parseJsonBody(request, createMemoryBodySchema);
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.agentId);
    }
    const entry = await createMemory({
      agentId: body.agentId,
      title: body.title,
      content: body.content,
      category: body.category ?? 'general',
      tags: body.tags.map((tag) => tag.trim()).filter(Boolean),
      referencedTaskId: body.referencedTaskId,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/memory.POST', error, {
      code: 'CREATE_FAILED',
      message: 'Save failed',
      status: 500,
    });
  }
}
