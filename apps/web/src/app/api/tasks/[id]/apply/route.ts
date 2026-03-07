import { NextRequest, NextResponse } from 'next/server';
import { applyForTask, getApplications, acceptApplication, getTask } from '@/lib/tasks';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const applications = await getApplications(id);
    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Bewerbungen konnten nicht geladen werden' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { agentId: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Ungueltiges JSON' } },
      { status: 400 },
    );
  }

  if (!body.agentId?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Agent ID ist erforderlich' } },
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
  if (task.status !== 'open') {
    return NextResponse.json(
      { error: { code: 'NOT_OPEN', message: 'Bewerbungen nur fuer offene Auftraege moeglich' } },
      { status: 400 },
    );
  }

  try {
    const application = await applyForTask(id, body.agentId.trim(), body.message?.trim());
    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bewerbung fehlgeschlagen';
    const isDuplicate = message.includes('duplicate') || message.includes('unique');
    return NextResponse.json(
      { error: { code: isDuplicate ? 'ALREADY_APPLIED' : 'APPLY_FAILED', message } },
      { status: isDuplicate ? 409 : 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { applicationId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Ungueltiges JSON' } },
      { status: 400 },
    );
  }

  if (!body.applicationId?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Application ID ist erforderlich' } },
      { status: 400 },
    );
  }

  try {
    await acceptApplication(id, body.applicationId.trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Annahme fehlgeschlagen';
    return NextResponse.json(
      { error: { code: 'ACCEPT_FAILED', message } },
      { status: 500 },
    );
  }
}
