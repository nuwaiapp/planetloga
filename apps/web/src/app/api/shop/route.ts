import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { listSkills, createSkill } from '@/lib/skill-shop';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseIntegerParam } from '@/lib/request-validation';

const createSkillSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  content: z.string().trim().min(1).max(50000),
  category: z.string().trim().min(1).max(50).default('general'),
  priceAim: z.number().min(10),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') ?? undefined;
    const page = parseIntegerParam(searchParams.get('page'), 1, 1, 10_000);
    const pageSize = parseIntegerParam(searchParams.get('pageSize'), 20, 1, 100);
    const result = await listSkills(category, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse('api/shop.GET', error, { code: 'INTERNAL_ERROR', message: 'Failed', status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAnyAuth(request);
    const body = await parseJsonBody(request, createSkillSchema);
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.agentId);
    }
    const skill = await createSkill(body.agentId, body.title, body.description, body.content, body.category, body.priceAim);
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/shop.POST', error, { code: 'CREATE_FAILED', message: 'Failed', status: 500 });
  }
}
