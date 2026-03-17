import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTaskStatus } from '@/lib/tasks';
import type { Task, TaskStatus } from '@planetloga/types';
import { AppError, toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership, type AuthIdentity } from '@/lib/auth';
import {
  parseJsonBody,
  parseUuidParam,
  updateTaskStatusBodySchema,
} from '@/lib/request-validation';

const VALID_TRANSITIONS: Record<string, TaskStatus[]> = {
  open: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled', 'disputed'],
  in_progress: ['review', 'cancelled', 'disputed'],
  review: ['completed', 'in_progress', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['cancelled'],
};

const CREATOR_ONLY: TaskStatus[] = ['assigned', 'cancelled'];
const ASSIGNEE_STATUSES: TaskStatus[] = ['in_progress', 'review', 'completed'];

function assertTransitionPermission(identity: AuthIdentity, task: Task, targetStatus: TaskStatus): void {
  if (CREATOR_ONLY.includes(targetStatus) && targetStatus === 'assigned') {
    if (identity.kind === 'agent' && identity.agent.agentId !== task.creatorId) {
      throw new AppError('FORBIDDEN', 'Only the task creator can assign agents', 403);
    }
  }

  if (ASSIGNEE_STATUSES.includes(targetStatus)) {
    if (!task.assigneeId) {
      throw new AppError('BAD_REQUEST', 'Task has no assignee yet', 400);
    }
    if (identity.kind === 'agent' && identity.agent.agentId !== task.assigneeId) {
      throw new AppError('FORBIDDEN', 'Only the assigned agent can update task progress', 403);
    }
  }

  if (targetStatus === 'cancelled') {
    if (identity.kind === 'agent' &&
        identity.agent.agentId !== task.creatorId &&
        identity.agent.agentId !== task.assigneeId) {
      throw new AppError('FORBIDDEN', 'Only the creator or assignee can cancel a task', 403);
    }
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
        { status: 404 },
      );
    }
    return NextResponse.json(task);
  } catch (error) {
    return toErrorResponse('api/tasks/[id].GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Fehler beim Laden',
      status: 500,
    });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');
    const body = await parseJsonBody(request, updateTaskStatusBodySchema);

    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
        { status: 404 },
      );
    }

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, task.creatorId);
    }

    const allowed = VALID_TRANSITIONS[task.status] ?? [];
    if (!allowed.includes(body.status as TaskStatus)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `Status-Wechsel von '${task.status}' nach '${body.status}' nicht erlaubt`,
        400,
      );
    }

    assertTransitionPermission(identity, task, body.status as TaskStatus);

    await updateTaskStatus(id, body.status, body.deliverable, body.disputeReason);
    const updated = await getTask(id);
    return NextResponse.json(updated);
  } catch (error) {
    return toErrorResponse('api/tasks/[id].PATCH', error, {
      code: 'UPDATE_FAILED',
      message: 'Status-Update fehlgeschlagen',
      status: 500,
    });
  }
}
