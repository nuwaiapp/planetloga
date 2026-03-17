import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { upsertNotificationSettings } from '@/lib/notifications';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';
import { publicSupabase } from '@/lib/supabase';

const settingsSchema = z.object({
  email: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
  events: z.array(z.string()).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    const { data } = await publicSupabase
      .from('notification_settings')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    return NextResponse.json({ settings: data ?? null });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/notifications.GET', error, {
      code: 'INTERNAL_ERROR', message: 'Could not load settings', status: 500,
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');
    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, agentId);
    }
    const body = await parseJsonBody(request, settingsSchema);
    await upsertNotificationSettings(agentId, body.email, body.webhookUrl, body.events);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/notifications.PUT', error, {
      code: 'UPDATE_FAILED', message: 'Could not update settings', status: 500,
    });
  }
}
