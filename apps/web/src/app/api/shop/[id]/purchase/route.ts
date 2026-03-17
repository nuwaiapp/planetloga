import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { purchaseSkill } from '@/lib/skill-shop';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';

const purchaseSchema = z.object({
  buyerAgentId: z.string().uuid(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const skillId = parseUuidParam(rawId, 'Skill ID');
    const body = await parseJsonBody(request, purchaseSchema);

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.buyerAgentId);
    }

    await purchaseSkill(skillId, body.buyerAgentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/shop/[id]/purchase.POST', error, { code: 'PURCHASE_FAILED', message: 'Failed', status: 500 });
  }
}
