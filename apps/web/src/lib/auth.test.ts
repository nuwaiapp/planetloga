import { beforeEach, describe, expect, it, vi } from 'vitest';

const { publicFrom, mockGetUser, mockValidateApiKey } = vi.hoisted(() => ({
  publicFrom: vi.fn(),
  mockGetUser: vi.fn(),
  mockValidateApiKey: vi.fn(),
}));

vi.mock('./supabase', () => ({
  publicSupabase: {
    from: publicFrom,
    auth: { getUser: mockGetUser },
  },
}));

vi.mock('./api-keys', () => ({
  validateApiKey: (...args: unknown[]) => mockValidateApiKey(...args),
}));

import { requireAuth, optionalAuth, requireAgentOwnership, requireAgentAuth, requireAnyAuth } from './auth';

function fakeRequest(authHeader?: string, apiKey?: string) {
  return {
    headers: {
      get: (name: string) => {
        if (name === 'authorization') return authHeader ?? null;
        if (name === 'x-api-key') return apiKey ?? null;
        return null;
      },
    },
  } as unknown as import('next/server').NextRequest;
}

describe('auth', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    publicFrom.mockReset();
    mockValidateApiKey.mockReset();
  });

  describe('requireAuth', () => {
    it('rejects requests without Authorization header', async () => {
      await expect(requireAuth(fakeRequest())).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('rejects requests with non-Bearer scheme', async () => {
      await expect(requireAuth(fakeRequest('Basic abc'))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('rejects requests with empty Bearer token', async () => {
      await expect(requireAuth(fakeRequest('Bearer '))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('rejects invalid tokens', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
      await expect(requireAuth(fakeRequest('Bearer bad-token'))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('returns user for valid token', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const user = await requireAuth(fakeRequest('Bearer valid-token'));
      expect(user).toEqual({ id: 'user-1', email: 'test@example.com' });
      expect(mockGetUser).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('optionalAuth', () => {
    it('returns null when no Authorization header', async () => {
      const user = await optionalAuth(fakeRequest());
      expect(user).toBeNull();
    });

    it('returns null for invalid token', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
      const user = await optionalAuth(fakeRequest('Bearer bad'));
      expect(user).toBeNull();
    });

    it('returns user for valid token', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'a@b.com' } },
        error: null,
      });
      const user = await optionalAuth(fakeRequest('Bearer ok'));
      expect(user).toEqual({ id: 'user-1', email: 'a@b.com' });
    });
  });

  describe('requireAgentOwnership', () => {
    it('throws AGENT_NOT_FOUND when agent does not exist', async () => {
      publicFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      });

      await expect(requireAgentOwnership('user-1', 'agent-x')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
        status: 404,
      });
    });

    it('throws FORBIDDEN when user does not own the agent', async () => {
      publicFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { owner_id: 'other-user' } }),
          }),
        }),
      });

      await expect(requireAgentOwnership('user-1', 'agent-1')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        status: 403,
      });
    });

    it('passes when user owns the agent', async () => {
      publicFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { owner_id: 'user-1' } }),
          }),
        }),
      });

      await expect(requireAgentOwnership('user-1', 'agent-1')).resolves.toBeUndefined();
    });

    it('passes for legacy agents without owner_id', async () => {
      publicFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { owner_id: null } }),
          }),
        }),
      });

      await expect(requireAgentOwnership('user-1', 'legacy-agent')).resolves.toBeUndefined();
    });
  });

  describe('requireAgentAuth', () => {
    it('rejects requests without X-API-Key header', async () => {
      await expect(requireAgentAuth(fakeRequest())).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('rejects invalid API keys', async () => {
      mockValidateApiKey.mockResolvedValue(null);
      await expect(requireAgentAuth(fakeRequest(undefined, 'plk_bad'))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('returns agent identity for valid API key', async () => {
      mockValidateApiKey.mockResolvedValue({ agentId: 'agent-1', keyId: 'key-1' });
      const result = await requireAgentAuth(fakeRequest(undefined, 'plk_valid'));
      expect(result).toEqual({ agentId: 'agent-1', keyId: 'key-1' });
    });
  });

  describe('requireAnyAuth', () => {
    it('prefers API key over bearer token', async () => {
      mockValidateApiKey.mockResolvedValue({ agentId: 'agent-1', keyId: 'key-1' });
      const result = await requireAnyAuth(fakeRequest('Bearer token', 'plk_key'));
      expect(result).toEqual({ kind: 'agent', agent: { agentId: 'agent-1', keyId: 'key-1' } });
    });

    it('falls back to bearer token when no API key', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'a@b.com' } },
        error: null,
      });
      const result = await requireAnyAuth(fakeRequest('Bearer valid'));
      expect(result).toEqual({ kind: 'user', user: { id: 'user-1', email: 'a@b.com' } });
    });
  });
});
