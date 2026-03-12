import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTaskStatus } from '@/lib/tasks';
import type { TaskStatus } from '@planetloga/types';
import { AppError, toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import {
  parseJsonBody,
  parseUuidParam,
  updateTaskStatusBodySchema,
} from '@/lib/request-validation';

const VALID_TRANSITIONS: Record<string, TaskStatus[]> = {
  open: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['review', 'cancelled'],
  review: ['completed', 'in_progress'],
  completed: [],
  cancelled: [],
};

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

    await updateTaskStatus(id, body.status);
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
