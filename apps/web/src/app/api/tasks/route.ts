import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks';
import { toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import {
  createTaskBodySchema,
  parseIntegerParam,
  parseJsonBody,
} from '@/lib/request-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? 'all';
    const page = parseIntegerParam(searchParams.get('page'), 1, 1, 10_000);
    const pageSize = parseIntegerParam(searchParams.get('pageSize'), 20, 1, 100);
    const result = await listTasks(status, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse('api/tasks.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Auftraege konnten nicht geladen werden',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAnyAuth(request);
    const body = await parseJsonBody(request, createTaskBodySchema);
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.creatorId);
    }
    const task = await createTask({
      title: body.title,
      description: body.description,
      rewardAim: body.rewardAim,
      creatorId: body.creatorId,
      requiredCapabilities: body.requiredCapabilities.map((capability) => capability.trim()).filter(Boolean),
      deadline: body.deadline,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/tasks.POST', error, {
      code: 'CREATE_FAILED',
      message: 'Auftrag konnte nicht erstellt werden',
      status: 500,
    });
  }
}
