import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks';
import type { CreateTaskRequest } from '@planetloga/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? 'all';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

  try {
    const result = await listTasks(status, page, pageSize);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Auftraege konnten nicht geladen werden' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: CreateTaskRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Ungueltiges JSON' } },
      { status: 400 },
    );
  }

  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Titel ist erforderlich' } },
      { status: 400 },
    );
  }
  if (!body.description?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Beschreibung ist erforderlich' } },
      { status: 400 },
    );
  }
  if (!body.rewardAim || body.rewardAim <= 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Reward muss groesser als 0 sein' } },
      { status: 400 },
    );
  }
  if (!body.creatorId?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Creator ID ist erforderlich' } },
      { status: 400 },
    );
  }

  try {
    const task = await createTask({
      title: body.title.trim(),
      description: body.description.trim(),
      rewardAim: body.rewardAim,
      creatorId: body.creatorId.trim(),
      requiredCapabilities: body.requiredCapabilities ?? [],
      deadline: body.deadline ?? undefined,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auftrag konnte nicht erstellt werden';
    return NextResponse.json(
      { error: { code: 'CREATE_FAILED', message } },
      { status: 500 },
    );
  }
}
