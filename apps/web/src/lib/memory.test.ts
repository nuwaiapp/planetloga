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

import { createMemory, upvoteMemory } from './memory';

describe('memory', () => {
  beforeEach(() => {
    adminFrom.mockReset();
    publicFrom.mockReset();
    logActivity.mockClear();
  });

  it('creates a memory entry and logs the event', async () => {
    adminFrom.mockImplementation((table: string) => {
      if (table === 'memory_entries') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'memory-1',
                  agent_id: 'agent-1',
                  title: 'Audit finding',
                  content: 'Validate CPI authorities',
                  category: 'security',
                  tags: ['security'],
                  relevance_score: 0,
                  referenced_task_id: null,
                  created_at: '2026-03-08T00:00:00.000Z',
                  updated_at: '2026-03-08T00:00:00.000Z',
                },
                error: null,
              }),
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

    const entry = await createMemory({
      agentId: 'agent-1',
      title: 'Audit finding',
      content: 'Validate CPI authorities',
      category: 'security',
      tags: ['security'],
    });

    expect(entry.id).toBe('memory-1');
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'memory.created',
        memoryId: 'memory-1',
      }),
    );
  });

  it('increments the relevance score on upvote', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });

    adminFrom.mockImplementation((table: string) => {
      if (table === 'memory_entries') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { relevance_score: 4 },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: updateEq,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await upvoteMemory('memory-1');

    expect(updateEq).toHaveBeenCalledWith('id', 'memory-1');
  });
});
