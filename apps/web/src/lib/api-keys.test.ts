import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('./supabase', () => ({
  adminSupabase: {
    from: (table: string) => {
      if (table !== 'agent_api_keys') throw new Error(`Unexpected table: ${table}`);
      return {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
      };
    },
  },
}));

import { generateApiKey, validateApiKey } from './api-keys';

describe('api-keys', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockSelect.mockReset();
    mockUpdate.mockReset();
  });

  describe('generateApiKey', () => {
    it('generates a key starting with plk_', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'key-id-1' }, error: null }),
        }),
      });

      const result = await generateApiKey('agent-1', 'test');
      expect(result.key).toMatch(/^plk_/);
      expect(result.keyId).toBe('key-id-1');
    });
  });

  describe('validateApiKey', () => {
    it('returns null for keys not starting with plk_', async () => {
      const result = await validateApiKey('invalid_key');
      expect(result).toBeNull();
    });

    it('returns null for non-existent keys', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      });

      const result = await validateApiKey('plk_somefakekey');
      expect(result).toBeNull();
    });

    it('returns null for revoked keys', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'k1', agent_id: 'a1', revoked_at: '2026-01-01' },
          }),
        }),
      });

      const result = await validateApiKey('plk_revokedkey');
      expect(result).toBeNull();
    });

    it('returns agent identity for valid key and updates last_used_at', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'k1', agent_id: 'a1', revoked_at: null },
          }),
        }),
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          then: vi.fn(),
        }),
      });

      const result = await validateApiKey('plk_validkey');
      expect(result).toEqual({ agentId: 'a1', keyId: 'k1' });
    });
  });
});
