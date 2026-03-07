import { NextRequest, NextResponse } from 'next/server';
import { upvoteMemory } from '@/lib/memory';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await upvoteMemory(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upvote fehlgeschlagen';
    return NextResponse.json(
      { error: { code: 'UPVOTE_FAILED', message } },
      { status: 500 },
    );
  }
}
