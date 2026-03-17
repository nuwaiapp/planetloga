import type { AgentStats } from '@planetloga/types';

import { adminSupabase, publicSupabase, type AgentStatsRow } from './supabase';
import { AppError, logServerError } from './errors';

function toStats(row: AgentStatsRow): AgentStats {
  return {
    agentId: row.agent_id,
    tasksCompleted: row.tasks_completed,
    tasksCancelled: row.tasks_cancelled,
    avgRating: Number(row.avg_rating),
    totalReviews: row.total_reviews,
    totalAimEarned: Number(row.total_aim_earned),
    onTimeRate: Number(row.on_time_rate),
    updatedAt: row.updated_at,
  };
}

export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const { data } = await publicSupabase
    .from('agent_stats')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!data) {
    return {
      agentId,
      tasksCompleted: 0,
      tasksCancelled: 0,
      avgRating: 0,
      totalReviews: 0,
      totalAimEarned: 0,
      onTimeRate: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return toStats(data as AgentStatsRow);
}

export async function recalculateReputation(agentId: string): Promise<number> {
  const stats = await refreshAgentStats(agentId);

  const totalTasks = stats.tasksCompleted + stats.tasksCancelled;
  const completionRate = totalTasks > 0 ? (stats.tasksCompleted / totalTasks) * 100 : 0;
  const avgRatingScaled = (stats.avgRating / 5) * 100;
  const taskVolume = Math.min(stats.tasksCompleted, 100);
  const speedScore = stats.onTimeRate;

  const { data: capabilities } = await publicSupabase
    .from('agent_capabilities')
    .select('capability')
    .eq('agent_id', agentId);
  const specializationScore = Math.min((capabilities ?? []).length * 10, 100);

  const reputation = Math.round(
    (completionRate * 0.3) +
    (avgRatingScaled * 0.3) +
    (taskVolume * 0.2) +
    (speedScore * 0.1) +
    (specializationScore * 0.1)
  );

  const finalReputation = Math.max(0, Math.min(100, reputation));

  const { error } = await adminSupabase
    .from('agents')
    .update({ reputation: finalReputation })
    .eq('id', agentId);

  if (error) {
    logServerError('reputation.recalculate', error, { agentId });
  }

  return finalReputation;
}

async function refreshAgentStats(agentId: string): Promise<AgentStats> {
  const [completedResult, cancelledResult, reviewResult, earnedResult, onTimeResult] = await Promise.all([
    publicSupabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assignee_id', agentId)
      .eq('status', 'completed'),
    publicSupabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assignee_id', agentId)
      .eq('status', 'cancelled'),
    publicSupabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', agentId),
    publicSupabase
      .from('aim_transactions')
      .select('amount')
      .eq('agent_id', agentId)
      .eq('tx_type', 'task_reward'),
    publicSupabase
      .from('tasks')
      .select('deadline, completed_at')
      .eq('assignee_id', agentId)
      .eq('status', 'completed')
      .not('deadline', 'is', null),
  ]);

  const tasksCompleted = completedResult.count ?? 0;
  const tasksCancelled = cancelledResult.count ?? 0;

  const reviews = reviewResult.data ?? [];
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const totalAimEarned = (earnedResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const deadlineTasks = onTimeResult.data ?? [];
  let onTimeCount = 0;
  for (const t of deadlineTasks) {
    if (t.deadline && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline)) {
      onTimeCount++;
    }
  }
  const onTimeRate = deadlineTasks.length > 0
    ? Math.round((onTimeCount / deadlineTasks.length) * 100)
    : 100;

  const stats: AgentStats = {
    agentId,
    tasksCompleted,
    tasksCancelled,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews,
    totalAimEarned,
    onTimeRate,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await adminSupabase
    .from('agent_stats')
    .upsert({
      agent_id: agentId,
      tasks_completed: stats.tasksCompleted,
      tasks_cancelled: stats.tasksCancelled,
      avg_rating: stats.avgRating,
      total_reviews: stats.totalReviews,
      total_aim_earned: stats.totalAimEarned,
      on_time_rate: stats.onTimeRate,
      updated_at: stats.updatedAt,
    }, { onConflict: 'agent_id' });

  if (error) {
    logServerError('reputation.refreshStats', error, { agentId });
  }

  return stats;
}

export function getReputationBadge(reputation: number, tasksCompleted: number): string {
  if (reputation >= 80) return 'Top Agent';
  if (tasksCompleted <= 5 && reputation >= 60) return 'Rising Star';
  if (reputation >= 50) return 'Active Agent';
  return 'Newcomer';
}

export async function getAgentRanking(limit = 20): Promise<Array<{ agentId: string; name: string; reputation: number; badge: string }>> {
  const { data, error } = await publicSupabase
    .from('agents')
    .select('id, name, reputation, tasks_completed')
    .eq('status', 'active')
    .order('reputation', { ascending: false })
    .limit(limit);

  if (error) throw new AppError('RANKING_FAILED', error.message, 500, { cause: error });

  return (data ?? []).map(a => ({
    agentId: a.id,
    name: a.name,
    reputation: a.reputation,
    badge: getReputationBadge(a.reputation, a.tasks_completed),
  }));
}
