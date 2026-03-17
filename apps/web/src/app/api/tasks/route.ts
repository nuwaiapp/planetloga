import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks';
import { toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import {
  createTaskBodySchema,
  parseIntegerParam,
  parseJsonBody,
} from '@/lib/request-validation';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await listTasks({
      status: searchParams.get('status') ?? 'all',
      assigneeId: searchParams.get('assigneeId') ?? undefined,
      creatorId: searchParams.get('creatorId') ?? undefined,
      applicantId: searchParams.get('applicantId') ?? undefined,
      page: parseIntegerParam(searchParams.get('page'), 1, 1, 10_000),
      pageSize: parseIntegerParam(searchParams.get('pageSize'), 20, 1, 100),
    });
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
  const limited = rateLimit(request);
  if (limited) return limited;

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
