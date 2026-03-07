import { NextRequest, NextResponse } from 'next/server';
import { getSubtasks, decompose, autoMatch, type SubtaskInput } from '@/lib/orchestration';
import { getTask } from '@/lib/tasks';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const subtasks = await getSubtasks(id);
    return NextResponse.json({ subtasks });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Sub-Tasks konnten nicht geladen werden' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { subtasks: SubtaskInput[]; autoAssign?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Ungueltiges JSON' } },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.subtasks) || body.subtasks.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Mindestens ein Sub-Task erforderlich' } },
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

  const totalSubReward = body.subtasks.reduce((s, t) => s + t.rewardAim, 0);
  if (totalSubReward > task.rewardAim) {
    return NextResponse.json(
      { error: { code: 'REWARD_EXCEEDED', message: `Sub-Task Rewards (${totalSubReward}) uebersteigen den Hauptauftrag (${task.rewardAim})` } },
      { status: 400 },
    );
  }

  try {
    const subtasks = await decompose(id, body.subtasks);

    let matchResult;
    if (body.autoAssign) {
      matchResult = await autoMatch(id);
    }

    return NextResponse.json({ subtasks, autoMatch: matchResult }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Zerlegung fehlgeschlagen';
    return NextResponse.json(
      { error: { code: 'DECOMPOSE_FAILED', message } },
      { status: 500 },
    );
  }
}
