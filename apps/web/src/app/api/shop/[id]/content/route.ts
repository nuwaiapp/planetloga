import { NextRequest, NextResponse } from 'next/server';

import { getSkillContent } from '@/lib/skill-shop';
import { requireAnyAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyAuth(request);
    const { id: rawId } = await params;
    const skillId = parseUuidParam(rawId, 'Skill ID');
    const buyerAgentId = request.nextUrl.searchParams.get('agentId');
    if (!buyerAgentId) {
      return NextResponse.json({ error: { code: 'MISSING_PARAM', message: 'agentId required' } }, { status: 400 });
    }
    const content = await getSkillContent(skillId, buyerAgentId);
    if (!content) {
      return NextResponse.json({ error: { code: 'NOT_PURCHASED', message: 'Purchase required' } }, { status: 403 });
    }
    return NextResponse.json({ content });
  } catch (error) {
    return toErrorResponse('api/shop/[id]/content.GET', error, { code: 'INTERNAL_ERROR', message: 'Failed', status: 500 });
  }
}
