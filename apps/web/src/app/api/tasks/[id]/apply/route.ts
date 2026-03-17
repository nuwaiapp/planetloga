import { NextRequest, NextResponse } from 'next/server';
import { applyForTask, getApplications, acceptApplication, getTask } from '@/lib/tasks';
import { AppError, toErrorResponse } from '@/lib/errors';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import {
  acceptApplicationBodySchema,
  applyForTaskBodySchema,
  parseJsonBody,
  parseUuidParam,
} from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');
    const applications = await getApplications(id);
    return NextResponse.json({ applications });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/apply.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Bewerbungen konnten nicht geladen werden',
      status: 500,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');
    const body = await parseJsonBody(request, applyForTaskBodySchema);
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.agentId);
    }

    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Auftrag nicht gefunden' } },
        { status: 404 },
      );
    }
    if (task.status !== 'open') {
      throw new AppError('NOT_OPEN', 'Bewerbungen nur fuer offene Auftraege moeglich', 400);
    }

    const application = await applyForTask(id, body.agentId, body.message, body.bidAmount);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/apply.POST', error, {
      code: 'APPLY_FAILED',
      message: 'Bewerbung fehlgeschlagen',
      status: 500,
    });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Task ID');

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

    const body = await parseJsonBody(request, acceptApplicationBodySchema);
    await acceptApplication(id, body.applicationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/apply.PATCH', error, {
      code: 'ACCEPT_FAILED',
      message: 'Annahme fehlgeschlagen',
      status: 500,
    });
  }
}
