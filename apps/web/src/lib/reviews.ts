import type { Review } from '@planetloga/types';

import { adminSupabase, publicSupabase, type ReviewRow } from './supabase';
import { AppError, logServerError } from './errors';
import { recalculateReputation } from './reputation';

function toReview(row: ReviewRow, reviewerName?: string): Review {
  return {
    id: row.id,
    taskId: row.task_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    reviewerName,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

export async function createReview(
  taskId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  if (rating < 1 || rating > 5) {
    throw new AppError('INVALID_RATING', 'Rating must be between 1 and 5', 400);
  }
  if (reviewerId === revieweeId) {
    throw new AppError('SELF_REVIEW', 'Cannot review yourself', 400);
  }

  const task = await getTaskForReview(taskId);
  if (!task) {
    throw new AppError('TASK_NOT_FOUND', 'Task not found', 404);
  }
  if (task.status !== 'completed') {
    throw new AppError('TASK_NOT_COMPLETED', 'Reviews only for completed tasks', 400);
  }

  const completedAt = new Date(task.completed_at ?? task.updated_at);
  const reviewWindow = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - completedAt.getTime() > reviewWindow) {
    throw new AppError('REVIEW_WINDOW_CLOSED', 'Review window (7 days) has expired', 400);
  }

  const isCreator = reviewerId === task.creator_id;
  const isAssignee = reviewerId === task.assignee_id;
  if (!isCreator && !isAssignee) {
    throw new AppError('NOT_PARTICIPANT', 'Only task creator or assignee can submit reviews', 403);
  }

  const { data, error } = await adminSupabase
    .from('reviews')
    .insert({
      task_id: taskId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment: comment ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message ?? 'Review failed';
    const duplicate = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique');
    throw new AppError(
      duplicate ? 'ALREADY_REVIEWED' : 'REVIEW_FAILED',
      msg,
      duplicate ? 409 : 500,
      { cause: error },
    );
  }

  void recalculateReputation(revieweeId).catch((err: unknown) => {
    logServerError('reviews.createReview.recalculate', err, { revieweeId });
  });

  return toReview(data as ReviewRow);
}

export async function getReviewsForAgent(agentId: string): Promise<Review[]> {
  const { data, error } = await publicSupabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('REVIEWS_FETCH_FAILED', error.message, 500, { cause: error });

  const rows = (data ?? []) as ReviewRow[];
  const reviewerIds = [...new Set(rows.map(r => r.reviewer_id))];
  const nameMap = await getAgentNames(reviewerIds);

  return rows.map(r => toReview(r, nameMap[r.reviewer_id]));
}

export async function getReviewsForTask(taskId: string): Promise<Review[]> {
  const { data, error } = await publicSupabase
    .from('reviews')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('REVIEWS_FETCH_FAILED', error.message, 500, { cause: error });

  const rows = (data ?? []) as ReviewRow[];
  const reviewerIds = [...new Set(rows.map(r => r.reviewer_id))];
  const nameMap = await getAgentNames(reviewerIds);

  return rows.map(r => toReview(r, nameMap[r.reviewer_id]));
}

export async function getAverageRating(agentId: string): Promise<{ avg: number; count: number }> {
  const { data, error } = await publicSupabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', agentId);

  if (error || !data || data.length === 0) return { avg: 0, count: 0 };

  const ratings = data.map(r => r.rating);
  const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
  return { avg: Math.round(avg * 10) / 10, count: ratings.length };
}

async function getTaskForReview(taskId: string) {
  const { data } = await publicSupabase
    .from('tasks')
    .select('status, creator_id, assignee_id, completed_at, updated_at')
    .eq('id', taskId)
    .single();
  return data;
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await publicSupabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.name;
  return map;
}
