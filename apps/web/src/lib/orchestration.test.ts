import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminFrom, publicFrom } = vi.hoisted(() => ({
  adminFrom: vi.fn(),
  publicFrom: vi.fn(),
}));

vi.mock('./supabase', () => ({
  adminSupabase: { from: adminFrom },
  publicSupabase: { from: publicFrom },
}));

import { autoMatch, decompose } from './orchestration';

describe('orchestration', () => {
  beforeEach(() => {
    adminFrom.mockReset();
    publicFrom.mockReset();
  });

  it('decomposes a task into subtasks and marks the parent as assigned', async () => {
    const taskUpdateStatusEq = vi.fn().mockResolvedValue({ error: null });
    const taskUpdateIdEq = vi.fn().mockReturnValue({
      eq: taskUpdateStatusEq,
    });

    adminFrom.mockImplementation((table: string) => {
      if (table === 'subtasks') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'subtask-1',
                  parent_task_id: 'task-1',
                  title: 'Prepare audit notes',
                  description: 'Summarize the critical paths',
                  reward_aim: 500,
                  status: 'open',
                  assignee_id: null,
                  sequence_order: 0,
                  created_at: '2026-03-08T00:00:00.000Z',
                  updated_at: '2026-03-08T00:00:00.000Z',
                },
              ],
              error: null,
            }),
          }),
        };
      }

      if (table === 'tasks') {
        return {
          update: vi.fn().mockReturnValue({ eq: taskUpdateIdEq }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const subtasks = await decompose('task-1', [
      {
        title: 'Prepare audit notes',
        description: 'Summarize the critical paths',
        rewardAim: 500,
      },
    ]);

    expect(subtasks).toHaveLength(1);
    expect(subtasks[0]?.parentTaskId).toBe('task-1');
    expect(taskUpdateIdEq).toHaveBeenCalledWith('id', 'task-1');
    expect(taskUpdateStatusEq).toHaveBeenCalledWith('status', 'open');
  });

  it('auto matches open subtasks against active agents', async () => {
    const subtasksUpdateEq = vi.fn().mockResolvedValue({ error: null });

    publicFrom.mockImplementation((table: string) => {
      if (table === 'subtasks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'subtask-1',
                    parent_task_id: 'task-1',
                    title: 'Rust review',
                    description: 'Review the Solana program',
                    reward_aim: 500,
                    status: 'open',
                    assignee_id: null,
                    sequence_order: 0,
                    created_at: '2026-03-08T00:00:00.000Z',
                    updated_at: '2026-03-08T00:00:00.000Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    adminFrom.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'agent-2', name: 'CodeForge', reputation: 90 },
                ],
              }),
            }),
          }),
        };
      }

      if (table === 'agent_capabilities') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ agent_id: 'agent-2', capability: 'rust' }],
          }),
        };
      }

      if (table === 'tasks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { creator_id: 'agent-1' },
              }),
            }),
          }),
        };
      }

      if (table === 'subtasks') {
        return {
          update: vi.fn().mockReturnValue({
            eq: subtasksUpdateEq,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await autoMatch('task-1');

    expect(result).toEqual({ matched: 1, total: 1 });
    expect(subtasksUpdateEq).toHaveBeenCalledWith('id', 'subtask-1');
  });
});
