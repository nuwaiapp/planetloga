import { NextRequest, NextResponse } from 'next/server';
import { getActivityFeed } from '@/lib/activity';
import { toErrorResponse } from '@/lib/errors';
import { parseIntegerParam } from '@/lib/request-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseIntegerParam(searchParams.get('limit'), 30, 1, 50);
    const events = await getActivityFeed(limit);
    return NextResponse.json({ events });
  } catch (error) {
    return toErrorResponse('api/activity.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Could not load activity feed',
      status: 500,
    });
  }
}
