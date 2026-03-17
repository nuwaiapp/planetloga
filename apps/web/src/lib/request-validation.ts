import type { NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';
import { AppError } from './errors';

export const agentStatusSchema = z.enum(['active', 'inactive', 'suspended']);
export const taskStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'review',
  'completed',
  'cancelled',
  'disputed',
]);
export const pricingModeSchema = z.enum(['fixed', 'bidding']);
export const taskPrioritySchema = z.enum(['normal', 'priority', 'urgent']);
export const memoryCategorySchema = z.enum([
  'general',
  'technical',
  'economic',
  'governance',
  'security',
  'pattern',
  'error',
]);

export const trimmedStringSchema = z.string().trim().min(1);
export const stringArraySchema = z.array(z.string().trim().min(1));
export const uuidSchema = z.string().uuid();

export const createAgentBodySchema = z.object({
  name: trimmedStringSchema.max(120),
  walletAddress: trimmedStringSchema.max(128).optional(),
  capabilities: z.array(z.string()).default([]),
  bio: z.string().trim().max(2000).optional(),
});

export const updateAgentBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    walletAddress: z.string().trim().min(1).max(128).optional(),
    bio: z.string().trim().max(2000).optional(),
    status: agentStatusSchema.optional(),
    capabilities: z.array(z.string()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field to update is required',
  });

export const createTaskBodySchema = z.object({
  title: trimmedStringSchema.max(200),
  description: trimmedStringSchema.max(10_000),
  rewardAim: z.number().positive(),
  creatorId: uuidSchema,
  pricingMode: pricingModeSchema.default('fixed'),
  budgetMax: z.number().positive().optional(),
  priority: taskPrioritySchema.default('normal'),
  maxAgents: z.number().int().min(1).max(20).default(1),
  invitedAgents: z.array(uuidSchema).default([]),
  requiredCapabilities: z.array(z.string()).default([]),
  deadline: trimmedStringSchema.optional(),
});

export const updateTaskStatusBodySchema = z.object({
  status: taskStatusSchema,
  deliverable: z.string().trim().max(50_000).optional(),
  disputeReason: z.string().trim().max(4000).optional(),
});

export const applyForTaskBodySchema = z.object({
  agentId: uuidSchema,
  message: z.string().trim().max(4000).optional(),
  bidAmount: z.number().positive().optional(),
});

export const acceptApplicationBodySchema = z.object({
  applicationId: uuidSchema,
});

export const subtaskInputSchema = z.object({
  title: trimmedStringSchema.max(200),
  description: trimmedStringSchema.max(4000),
  rewardAim: z.number().positive(),
  requiredCapability: trimmedStringSchema.max(120).optional(),
});

export const createSubtasksBodySchema = z.object({
  subtasks: z.array(subtaskInputSchema).min(1),
  autoAssign: z.boolean().optional(),
});

export const createMemoryBodySchema = z.object({
  agentId: uuidSchema,
  title: trimmedStringSchema.max(200),
  content: trimmedStringSchema.max(10_000),
  category: memoryCategorySchema.optional(),
  tags: z.array(z.string()).default([]),
  referencedTaskId: uuidSchema.optional(),
});

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    throw new AppError('INVALID_JSON', 'Invalid JSON body', 400, { cause: error });
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Validation failed',
      400,
      { cause: result.error },
    );
  }

  return result.data;
}

export function parseUuidParam(value: string, label: string): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', `${label} must be a valid UUID`, 400, {
      cause: result.error,
    });
  }

  return result.data;
}

export function parseIntegerParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError('VALIDATION_ERROR', 'Expected a numeric query parameter', 400);
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function parseBooleanParam(value: string | null, fallback = false): boolean {
  if (value === null) {
    return fallback;
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new AppError('VALIDATION_ERROR', 'Expected a boolean query parameter', 400);
}
