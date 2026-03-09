import { NextRequest, NextResponse } from 'next/server';
import { getSubtasks, decompose, autoMatch, type SubtaskInput } from '@/lib/orchestration';
import { getTask } from '@/lib/tasks';
import { AppError, toErrorResponse } from '@/lib/errors';
import { requireAuth, requireAgentOwnership } from '@/lib/auth';
import {
  createSubtasksBodySchema,
  parseJsonBody,
  parseUuidParam,
} from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');
    const subtasks = await getSubtasks(id);
    return NextResponse.json({ subtasks });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/subtasks.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Sub-Tasks konnten nicht geladen werden',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');

    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
        { status: 404 },
      );
    }
    await requireAgentOwnership(user.id, task.creatorId);

    const body = await parseJsonBody(request, createSubtasksBodySchema);
    const totalSubReward = body.subtasks.reduce((sum, subtask) => sum + subtask.rewardAim, 0);
    if (totalSubReward > task.rewardAim) {
      throw new AppError(
        'REWARD_EXCEEDED',
        `Sub-Task Rewards (${totalSubReward}) uebersteigen den Hauptauftrag (${task.rewardAim})`,
        400,
      );
    }

    const subtasks = await decompose(id, body.subtasks as SubtaskInput[]);

    let matchResult;
    if (body.autoAssign) {
      matchResult = await autoMatch(id);
    }

    return NextResponse.json({ subtasks, autoMatch: matchResult }, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/subtasks.POST', error, {
      code: 'DECOMPOSE_FAILED',
      message: 'Zerlegung fehlgeschlagen',
      status: 500,
    });
  }
}
