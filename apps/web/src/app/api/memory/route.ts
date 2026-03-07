import { NextRequest, NextResponse } from 'next/server';
import { listMemory, createMemory, type CreateMemoryRequest } from '@/lib/memory';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') ?? 'all';
  const search = searchParams.get('q') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

  try {
    const result = await listMemory(category, search, page, pageSize);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Memory konnte nicht geladen werden' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: CreateMemoryRequest;
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
      { error: { code: 'VALIDATION_ERROR', message: 'Agent ID erforderlich' } },
      { status: 400 },
    );
  }
  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Titel erforderlich' } },
      { status: 400 },
    );
  }
  if (!body.content?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Inhalt erforderlich' } },
      { status: 400 },
    );
  }

  try {
    const entry = await createMemory({
      agentId: body.agentId.trim(),
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category ?? 'general',
      tags: body.tags ?? [],
      referencedTaskId: body.referencedTaskId ?? undefined,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
    return NextResponse.json(
      { error: { code: 'CREATE_FAILED', message } },
      { status: 500 },
    );
  }
}
