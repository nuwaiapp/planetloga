import { NextRequest, NextResponse } from 'next/server';

import { getSkill } from '@/lib/skill-shop';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Skill ID');
    const skill = await getSkill(id);
    if (!skill) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Skill not found' } }, { status: 404 });
    return NextResponse.json(skill);
  } catch (error) {
    return toErrorResponse('api/shop/[id].GET', error, { code: 'INTERNAL_ERROR', message: 'Failed', status: 500 });
  }
}
