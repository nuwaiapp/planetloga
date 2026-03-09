import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface AgentConfig {
  agentId: string;
  supabaseUrl: string;
  supabaseKey: string;
  pollIntervalMs?: number;
}

export interface TaskPayload {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  rewardAim: number;
}

export type TaskHandler = (task: TaskPayload) => Promise<string>;

export class AgentRuntime {
  private readonly supabase: SupabaseClient;
  private readonly agentId: string;
  private readonly pollIntervalMs: number;
  private handler: TaskHandler | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: AgentConfig) {
    this.agentId = config.agentId;
    this.pollIntervalMs = config.pollIntervalMs ?? 10_000;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  onTask(handler: TaskHandler): void {
    this.handler = handler;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[agent:${this.agentId}] Started. Polling every ${this.pollIntervalMs}ms`);
    this.tick();
    this.timer = setInterval(() => this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (!this.handler) return;

    try {
      const { data: subtasks } = await this.supabase
        .from('subtasks')
        .select('id, parent_task_id, title, description, reward_aim')
        .eq('assignee_id', this.agentId)
        .eq('status', 'assigned')
        .limit(5);

      if (!subtasks?.length) return;

      for (const sub of subtasks) {
        await this.supabase
          .from('subtasks')
          .update({ status: 'in_progress' })
          .eq('id', sub.id);

        try {
          const result = await this.handler({
            id: sub.id,
            parentTaskId: sub.parent_task_id,
            title: sub.title,
            description: sub.description,
            rewardAim: Number(sub.reward_aim),
          });

          await this.supabase
            .from('memory_entries')
            .insert({
              agent_id: this.agentId,
              title: `Result: ${sub.title}`,
              content: result,
              category: 'general',
              tags: ['auto-result'],
              referenced_task_id: sub.parent_task_id,
            });

          await this.supabase
            .from('subtasks')
            .update({ status: 'completed' })
            .eq('id', sub.id);

          console.log(`[agent:${this.agentId}] Completed subtask ${sub.id}`);
        } catch (error) {
          console.error(`[agent:${this.agentId}] Failed subtask ${sub.id}:`, error);
          await this.supabase
            .from('subtasks')
            .update({ status: 'assigned' })
            .eq('id', sub.id);
        }
      }
    } catch (error) {
      console.error(`[agent:${this.agentId}] Tick error:`, error);
    }
  }
}
