import { describe, expect, it } from 'vitest';
import {
  agentStatusSchema,
  taskStatusSchema,
  memoryCategorySchema,
  trimmedStringSchema,
  uuidSchema,
  createAgentBodySchema,
  createTaskBodySchema,
  applyForTaskBodySchema,
  createMemoryBodySchema,
  updateAgentBodySchema,
  parseUuidParam,
  parseIntegerParam,
  parseBooleanParam,
} from './request-validation';

describe('request-validation schemas', () => {
  describe('agentStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(agentStatusSchema.parse('active')).toBe('active');
      expect(agentStatusSchema.parse('inactive')).toBe('inactive');
      expect(agentStatusSchema.parse('suspended')).toBe('suspended');
    });

    it('rejects invalid status', () => {
      expect(() => agentStatusSchema.parse('deleted')).toThrow();
    });
  });

  describe('taskStatusSchema', () => {
    it('accepts all valid statuses', () => {
      for (const s of ['open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled']) {
        expect(taskStatusSchema.parse(s)).toBe(s);
      }
    });
  });

  describe('memoryCategorySchema', () => {
    it('accepts all valid categories', () => {
      for (const c of ['general', 'technical', 'economic', 'governance', 'security', 'pattern', 'error']) {
        expect(memoryCategorySchema.parse(c)).toBe(c);
      }
    });
  });

  describe('trimmedStringSchema', () => {
    it('trims whitespace', () => {
      expect(trimmedStringSchema.parse('  hello  ')).toBe('hello');
    });

    it('rejects empty strings', () => {
      expect(() => trimmedStringSchema.parse('')).toThrow();
      expect(() => trimmedStringSchema.parse('   ')).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('accepts valid UUIDs', () => {
      expect(uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).toBeTruthy();
    });

    it('rejects invalid UUIDs', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
    });
  });

  describe('createAgentBodySchema', () => {
    it('accepts valid agent', () => {
      const result = createAgentBodySchema.parse({
        name: 'CodeForge',
        capabilities: ['rust'],
        bio: 'A builder',
      });
      expect(result.name).toBe('CodeForge');
      expect(result.capabilities).toEqual(['rust']);
    });

    it('defaults capabilities to empty array', () => {
      const result = createAgentBodySchema.parse({ name: 'Agent' });
      expect(result.capabilities).toEqual([]);
    });

    it('rejects missing name', () => {
      expect(() => createAgentBodySchema.parse({ capabilities: [] })).toThrow();
    });

    it('rejects name exceeding 120 chars', () => {
      expect(() => createAgentBodySchema.parse({ name: 'x'.repeat(121) })).toThrow();
    });
  });

  describe('updateAgentBodySchema', () => {
    it('requires at least one field', () => {
      expect(() => updateAgentBodySchema.parse({})).toThrow();
    });

    it('accepts partial updates', () => {
      const result = updateAgentBodySchema.parse({ name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });

  describe('createTaskBodySchema', () => {
    it('accepts a valid task', () => {
      const result = createTaskBodySchema.parse({
        title: 'Audit',
        description: 'Review the contract',
        rewardAim: 5000,
        creatorId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.requiredCapabilities).toEqual([]);
    });

    it('rejects zero reward', () => {
      expect(() =>
        createTaskBodySchema.parse({
          title: 'X',
          description: 'Y',
          rewardAim: 0,
          creatorId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).toThrow();
    });

    it('rejects negative reward', () => {
      expect(() =>
        createTaskBodySchema.parse({
          title: 'X',
          description: 'Y',
          rewardAim: -100,
          creatorId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).toThrow();
    });
  });

  describe('applyForTaskBodySchema', () => {
    it('accepts valid application', () => {
      const result = applyForTaskBodySchema.parse({
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'I can help',
      });
      expect(result.agentId).toBeTruthy();
    });

    it('rejects invalid agentId', () => {
      expect(() => applyForTaskBodySchema.parse({ agentId: 'nope' })).toThrow();
    });
  });

  describe('createMemoryBodySchema', () => {
    it('accepts valid memory entry', () => {
      const result = createMemoryBodySchema.parse({
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Finding',
        content: 'CPI authorities must be validated',
      });
      expect(result.tags).toEqual([]);
    });

    it('rejects missing agentId', () => {
      expect(() =>
        createMemoryBodySchema.parse({ title: 'X', content: 'Y' }),
      ).toThrow();
    });
  });
});

describe('request-validation helpers', () => {
  describe('parseUuidParam', () => {
    it('returns a valid UUID', () => {
      expect(parseUuidParam('550e8400-e29b-41d4-a716-446655440000', 'ID')).toBeTruthy();
    });

    it('throws AppError for invalid UUID', () => {
      expect(() => parseUuidParam('bad', 'ID')).toThrow();
    });
  });

  describe('parseIntegerParam', () => {
    it('returns fallback for null', () => {
      expect(parseIntegerParam(null, 10, 1, 100)).toBe(10);
    });

    it('parses valid integer', () => {
      expect(parseIntegerParam('42', 1, 1, 100)).toBe(42);
    });

    it('clamps to min', () => {
      expect(parseIntegerParam('0', 1, 1, 100)).toBe(1);
    });

    it('clamps to max', () => {
      expect(parseIntegerParam('999', 1, 1, 100)).toBe(100);
    });

    it('throws for non-numeric input', () => {
      expect(() => parseIntegerParam('abc', 1, 1, 100)).toThrow();
    });
  });

  describe('parseBooleanParam', () => {
    it('returns fallback for null', () => {
      expect(parseBooleanParam(null)).toBe(false);
      expect(parseBooleanParam(null, true)).toBe(true);
    });

    it('parses true and false', () => {
      expect(parseBooleanParam('true')).toBe(true);
      expect(parseBooleanParam('false')).toBe(false);
    });

    it('throws for invalid values', () => {
      expect(() => parseBooleanParam('yes')).toThrow();
    });
  });
});
