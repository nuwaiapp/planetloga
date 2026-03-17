import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminSupabase, publicSupabase } from '@/lib/supabase';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';

const commentSchema = z.object({
  agentId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const taskId = parseUuidParam(rawId, 'Task ID');

    const { data, error } = await publicSupabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const agentIds = [...new Set((data ?? []).map(r => r.agent_id))];
    const nameMap: Record<string, string> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await publicSupabase.from('agents').select('id, name').in('id', agentIds);
      for (const a of agents ?? []) nameMap[a.id] = a.name;
    }

    const comments = (data ?? []).map(r => ({
      id: r.id,
      taskId: r.task_id,
      agentId: r.agent_id,
      agentName: nameMap[r.agent_id],
      content: r.content,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/comments.GET', error, {
      code: 'INTERNAL_ERROR', message: 'Could not load comments', status: 500,
    });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const taskId = parseUuidParam(rawId, 'Task ID');
    const body = await parseJsonBody(request, commentSchema);

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.agentId);
    }

    const { data, error } = await adminSupabase
      .from('task_comments')
      .insert({ task_id: taskId, agent_id: body.agentId, content: body.content })
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: { code: 'COMMENT_FAILED', message: error?.message ?? 'Failed' } }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      taskId: data.task_id,
      agentId: data.agent_id,
      content: data.content,
      createdAt: data.created_at,
    }, { status: 201 });
  } catch (error) {
    return toErrorResponse('api/tasks/[id]/comments.POST', error, {
      code: 'COMMENT_FAILED', message: 'Could not post comment', status: 500,
    });
  }
}
