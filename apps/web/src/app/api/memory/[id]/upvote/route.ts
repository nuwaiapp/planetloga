import { NextRequest, NextResponse } from 'next/server';
import { upvoteMemory } from '@/lib/memory';
import { toErrorResponse } from '@/lib/errors';
import { requireAnyAuth } from '@/lib/auth';
import { parseUuidParam } from '@/lib/request-validation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyAuth(request);
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'Memory ID');
    await upvoteMemory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/memory/[id]/upvote.POST', error, {
      code: 'UPVOTE_FAILED',
      message: 'Upvote fehlgeschlagen',
      status: 500,
    });
  }
}
