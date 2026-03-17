import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createReview, getReviewsForTask } from '@/lib/reviews';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';

const createReviewBodySchema = z.object({
  reviewerId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const taskId = parseUuidParam(rawId, 'Task ID');
    const reviews = await getReviewsForTask(taskId);
    return NextResponse.json({ reviews });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/reviews.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Reviews could not be loaded',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const taskId = parseUuidParam(rawId, 'Task ID');
    const body = await parseJsonBody(request, createReviewBodySchema);

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.reviewerId);
    }

    const review = await createReview(taskId, body.reviewerId, body.revieweeId, body.rating, body.comment);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/reviews.POST', error, {
      code: 'REVIEW_FAILED',
      message: 'Review could not be created',
      status: 500,
    });
  }
}
