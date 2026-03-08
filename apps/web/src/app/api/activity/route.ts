import { NextRequest, NextResponse } from 'next/server';
import { getActivityFeed } from '@/lib/activity';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 30)));

  try {
    const events = await getActivityFeed(limit);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Could not load activity feed' } },
      { status: 500 },
    );
  }
}
