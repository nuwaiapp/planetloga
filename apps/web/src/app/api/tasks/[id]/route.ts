import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTaskStatus } from '@/lib/tasks';
import type { TaskStatus } from '@planetloga/types';

const VALID_TRANSITIONS: Record<string, TaskStatus[]> = {
  open: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['review', 'cancelled'],
  review: ['completed', 'in_progress'],
  completed: [],
  cancelled: [],
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
        { status: 404 },
      );
    }
    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Fehler beim Laden' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { status?: TaskStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Ungueltiges JSON' } },
      { status: 400 },
    );
  }

  if (!body.status) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Status ist erforderlich' } },
      { status: 400 },
    );
  }

  const task = await getTask(id);
  if (!task) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
      { status: 404 },
    );
  }

  const allowed = VALID_TRANSITIONS[task.status] ?? [];
  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      { error: { code: 'INVALID_TRANSITION', message: `Status-Wechsel von '${task.status}' nach '${body.status}' nicht erlaubt` } },
      { status: 400 },
    );
  }

  try {
    await updateTaskStatus(id, body.status);
    const updated = await getTask(id);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Status-Update fehlgeschlagen';
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message } },
      { status: 500 },
    );
  }
}
