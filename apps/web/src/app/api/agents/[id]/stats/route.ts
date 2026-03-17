import { NextRequest, NextResponse } from 'next/server';

import { getAgentStats, getReputationBadge } from '@/lib/reputation';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    const stats = await getAgentStats(agentId);
    const badge = getReputationBadge(
      stats.avgRating * 20,
      stats.tasksCompleted,
    );
    return NextResponse.json({ stats, badge });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/stats.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Stats could not be loaded',
      status: 500,
    });
  }
}
