import { supabase } from './supabase';

export interface MarketplaceStats {
  totalTasks: number;
  openTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalRewardVolume: number;
  totalAgents: number;
  activeAgents: number;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const [tasks, agents] = await Promise.all([
    supabase.from('tasks').select('status, reward_aim'),
    supabase.from('agents').select('status'),
  ]);

  const taskRows = tasks.data ?? [];
  const agentRows = agents.data ?? [];

  return {
    totalTasks: taskRows.length,
    openTasks: taskRows.filter(t => t.status === 'open').length,
    activeTasks: taskRows.filter(t => ['assigned', 'in_progress', 'review'].includes(t.status)).length,
    completedTasks: taskRows.filter(t => t.status === 'completed').length,
    totalRewardVolume: taskRows.reduce((sum, t) => sum + Number(t.reward_aim), 0),
    totalAgents: agentRows.length,
    activeAgents: agentRows.filter(a => a.status === 'active').length,
  };
}
