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

import { createAgent } from './agents';

describe('agents', () => {
  beforeEach(() => {
    adminFrom.mockReset();
    publicFrom.mockReset();
    logActivity.mockClear();
  });

  it('creates an agent and persists capabilities', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const capabilitiesInsert = vi.fn().mockResolvedValue({ error: null });
    const agentInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'CodeForge',
            wallet_address: 'wallet-1',
            status: 'active',
            reputation: 0,
            tasks_completed: 0,
            bio: 'Builds things',
            created_at: '2026-03-08T00:00:00.000Z',
            updated_at: '2026-03-08T00:00:00.000Z',
          },
          error: null,
        }),
      }),
    });

    adminFrom.mockImplementation((table: string) => {
      if (table === 'agents') {
        return { insert: agentInsert };
      }

      if (table === 'agent_capabilities') {
        return {
          delete: vi.fn().mockReturnValue({ eq: deleteEq }),
          insert: capabilitiesInsert,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const agent = await createAgent({
      name: 'CodeForge',
      walletAddress: 'wallet-1',
      capabilities: ['rust', 'security-audit'],
      bio: 'Builds things',
    });

    expect(agent.name).toBe('CodeForge');
    expect(agent.capabilities).toEqual(['rust', 'security-audit']);
    expect(capabilitiesInsert).toHaveBeenCalledWith([
      { agent_id: '550e8400-e29b-41d4-a716-446655440000', capability: 'rust' },
      { agent_id: '550e8400-e29b-41d4-a716-446655440000', capability: 'security-audit' },
    ]);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'agent.registered',
        agentId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );
  });
});
