import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminFrom, publicFrom, logActivity } = vi.hoisted(() => ({
  adminFrom: vi.fn(),
  publicFrom: vi.fn(),
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./supabase', () => ({
  adminSupabase: { from: adminFrom },
  publicSupabase: { from: publicFrom },
}));

vi.mock('./activity', () => ({
  logActivity,
}));

import { acceptApplication, applyForTask, createTask } from './tasks';

describe('tasks', () => {
  beforeEach(() => {
    adminFrom.mockReset();
    publicFrom.mockReset();
    logActivity.mockClear();
  });

  it('creates a task and resolves creator metadata', async () => {
    const taskRow = {
      id: 'task-1',
      title: 'Audit contract',
      description: 'Review the AIM token contract',
      reward_aim: 5000,
      status: 'open',
      creator_id: 'agent-1',
      assignee_id: null,
      required_capabilities: ['rust'],
      deadline: null,
      completed_at: null,
      created_at: '2026-03-08T00:00:00.000Z',
      updated_at: '2026-03-08T00:00:00.000Z',
    };

    adminFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: taskRow, error: null }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    publicFrom.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'agent-1', name: 'CodeForge' }],
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const task = await createTask({
      title: 'Audit contract',
      description: 'Review the AIM token contract',
      rewardAim: 5000,
      creatorId: 'agent-1',
      requiredCapabilities: ['rust'],
    });

    expect(task.creatorName).toBe('CodeForge');
    expect(task.rewardAim).toBe(5000);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'task.created',
        taskId: 'task-1',
      }),
    );
  });

  it('creates an application for an open task', async () => {
    adminFrom.mockImplementation((table: string) => {
      if (table === 'task_applications') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'application-1',
                  task_id: 'task-1',
                  agent_id: 'agent-2',
                  message: 'I can help',
                  status: 'pending',
                  created_at: '2026-03-08T00:00:00.000Z',
                },
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const application = await applyForTask('task-1', 'agent-2', 'I can help');

    expect(application.agentId).toBe('agent-2');
    expect(application.status).toBe('pending');
  });

  it('maps duplicate applications to a conflict app error', async () => {
    adminFrom.mockImplementation((table: string) => {
      if (table === 'task_applications') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'duplicate key value violates unique constraint' },
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(applyForTask('task-1', 'agent-2')).rejects.toMatchObject({
      code: 'ALREADY_APPLIED',
      status: 409,
    });
  });

  it('accepts an application and assigns the task', async () => {
    const acceptedEq = vi.fn().mockResolvedValue({ error: null });
    const rejectedNeq = vi.fn().mockResolvedValue({ error: null });
    const rejectedEq = vi.fn().mockReturnValue({ neq: rejectedNeq });
    const applicationSelectEq = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { agent_id: 'agent-2' } }),
    });
    const taskAssignEq = vi.fn().mockResolvedValue({ error: null });
    const taskApplicationsUpdate = vi
      .fn()
      .mockReturnValueOnce({ eq: acceptedEq })
      .mockReturnValueOnce({ eq: rejectedEq });

    adminFrom.mockImplementation((table: string) => {
      if (table === 'task_applications') {
        return {
          select: vi.fn().mockReturnValue({ eq: applicationSelectEq }),
          update: taskApplicationsUpdate,
        };
      }

      if (table === 'tasks') {
        return {
          update: vi.fn().mockReturnValue({ eq: taskAssignEq }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    publicFrom.mockImplementation((table: string) => {
      if (table === 'tasks') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'task-1',
                  title: 'Audit contract',
                  description: 'Review the AIM token contract',
                  reward_aim: 5000,
                  status: 'assigned',
                  creator_id: 'agent-1',
                  assignee_id: 'agent-2',
                  required_capabilities: ['rust'],
                  deadline: null,
                  completed_at: null,
                  created_at: '2026-03-08T00:00:00.000Z',
                  updated_at: '2026-03-08T00:00:00.000Z',
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'agents') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'agent-2', name: 'DataMind' }],
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await acceptApplication('task-1', 'application-1');

    expect(acceptedEq).toHaveBeenCalledWith('id', 'application-1');
    expect(taskAssignEq).toHaveBeenCalledWith('id', 'task-1');
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'task.assigned',
        agentId: 'agent-2',
      }),
    );
  });
});
