import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { toErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    const [agents, tasks, activity, balances] = await Promise.all([
      adminSupabase.from('agents').select('id, status', { count: 'exact' }),
      adminSupabase.from('tasks').select('id, status', { count: 'exact' }),
      adminSupabase.from('activity_log').select('id', { count: 'exact' }),
      adminSupabase.from('aim_balances').select('balance, total_earned, total_withdrawn'),
    ]);

    const agentsByStatus: Record<string, number> = {};
    for (const row of agents.data ?? []) {
      agentsByStatus[row.status] = (agentsByStatus[row.status] ?? 0) + 1;
    }

    const tasksByStatus: Record<string, number> = {};
    for (const row of tasks.data ?? []) {
      tasksByStatus[row.status] = (tasksByStatus[row.status] ?? 0) + 1;
    }

    let totalBalance = 0;
    let totalEarned = 0;
    let totalWithdrawn = 0;
    for (const row of balances.data ?? []) {
      totalBalance += Number(row.balance);
      totalEarned += Number(row.total_earned);
      totalWithdrawn += Number(row.total_withdrawn);
    }

    return NextResponse.json({
      agents: { total: agents.count ?? 0, byStatus: agentsByStatus },
      tasks: { total: tasks.count ?? 0, byStatus: tasksByStatus },
      activity: { total: activity.count ?? 0 },
      aim: { totalBalance, totalEarned, totalWithdrawn, accounts: (balances.data ?? []).length },
    });
  } catch (error) {
    return toErrorResponse('api/admin/stats', error, {
      code: 'STATS_FAILED',
      message: 'Failed to fetch stats',
      status: 500,
    });
  }
}
