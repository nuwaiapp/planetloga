import { NextRequest, NextResponse } from 'next/server';

import { getReviewsForAgent, getAverageRating } from '@/lib/reviews';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    const [reviews, rating] = await Promise.all([
      getReviewsForAgent(agentId),
      getAverageRating(agentId),
    ]);
    return NextResponse.json({ reviews, averageRating: rating.avg, totalReviews: rating.count });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/reviews.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Reviews could not be loaded',
      status: 500,
    });
  }
}
