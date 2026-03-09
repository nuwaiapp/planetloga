import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Agent } from '@planetloga/types';
import { match } from '@planetloga/protocol';
import type { SubtaskProposal } from '@planetloga/protocol';

export interface OrchestratorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  pollIntervalMs: number;
}

export class OrchestratorLoop {
  private readonly supabase: SupabaseClient;
  private readonly pollIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: OrchestratorConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.pollIntervalMs = config.pollIntervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[orchestrator] Started. Polling every ${this.pollIntervalMs}ms`);
    this.tick();
    this.timer = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[orchestrator] Stopped.');
  }

  private async tick(): Promise<void> {
    try {
      await this.processOpenSubtasks();
    } catch (error) {
      console.error('[orchestrator] Tick error:', error);
    }
  }

  private async processOpenSubtasks(): Promise<void> {
    const { data: openSubtasks } = await this.supabase
      .from('subtasks')
      .select('id, parent_task_id, title, description, reward_aim, assignee_id')
      .eq('status', 'open')
      .is('assignee_id', null)
      .limit(20);

    if (!openSubtasks || openSubtasks.length === 0) return;

    const { data: agents } = await this.supabase
      .from('agents')
      .select('id, name, reputation, status, tasks_completed, created_at, updated_at')
      .eq('status', 'active')
      .order('reputation', { ascending: false });

    if (!agents || agents.length === 0) return;

    const { data: caps } = await this.supabase
      .from('agent_capabilities')
      .select('agent_id, capability');

    const agentCaps: Record<string, string[]> = {};
    for (const c of caps ?? []) {
      if (!agentCaps[c.agent_id]) agentCaps[c.agent_id] = [];
      agentCaps[c.agent_id].push(c.capability);
    }

    const agentList: Agent[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      reputation: a.reputation,
      tasksCompleted: a.tasks_completed,
      status: a.status as Agent['status'],
      capabilities: agentCaps[a.id] ?? [],
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    const proposals: Array<{ subtaskId: string; proposal: SubtaskProposal }> = openSubtasks.map(
      (sub, i) => ({
        subtaskId: sub.id,
        proposal: {
          title: sub.title,
          description: sub.description,
          rewardAim: Number(sub.reward_aim),
          sequenceOrder: i,
        },
      }),
    );

    const results = await match(proposals, agentList);

    let matched = 0;
    for (const result of results) {
      if (!result.selectedAgent?.agent) continue;

      const { error } = await this.supabase
        .from('subtasks')
        .update({
          assignee_id: result.selectedAgent.agent.id,
          status: 'assigned',
        })
        .eq('id', result.subtaskId)
        .eq('status', 'open');

      if (!error) matched++;
    }

    if (matched > 0) {
      console.log(`[orchestrator] Matched ${matched}/${openSubtasks.length} subtasks`);
    }
  }
}
