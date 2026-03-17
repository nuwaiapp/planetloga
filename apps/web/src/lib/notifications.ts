import { createTransport } from 'nodemailer';

import { adminSupabase, publicSupabase } from './supabase';
import { logServerError } from './errors';

export type NotificationEvent =
  | 'task.new'
  | 'application.accepted'
  | 'application.rejected'
  | 'task.completed'
  | 'invitation.accepted'
  | 'balance.credited';

interface NotificationSettings {
  agentId: string;
  email?: string;
  webhookUrl?: string;
  events: string[];
}

const smtpTransport = createTransport({
  host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;

  try {
    await smtpTransport.sendMail({
      from: process.env.SMTP_FROM ?? 'PlanetLoga.AI <noreply@planetloga.ai>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    logServerError('notifications.sendEmail', error, { to, subject });
    return false;
  }
}

export async function sendWebhook(
  url: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return true;
    } catch (error) {
      if (attempt === 2) {
        logServerError('notifications.sendWebhook', error, { url, attempt });
      }
    }
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  return false;
}

async function getSettings(agentId: string): Promise<NotificationSettings | null> {
  const { data } = await publicSupabase
    .from('notification_settings')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!data) return null;
  return {
    agentId: data.agent_id,
    email: data.email ?? undefined,
    webhookUrl: data.webhook_url ?? undefined,
    events: data.events ?? [],
  };
}

export async function notifyAgent(
  agentId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const settings = await getSettings(agentId);
  if (!settings) return;
  if (settings.events.length > 0 && !settings.events.includes(event)) return;

  const promises: Promise<boolean>[] = [];

  if (settings.email) {
    const subject = formatSubject(event, data);
    const html = formatEmailHtml(event, data);
    promises.push(sendEmail(settings.email, subject, html));
  }

  if (settings.webhookUrl) {
    promises.push(sendWebhook(settings.webhookUrl, { event, ...data, timestamp: new Date().toISOString() }));
  }

  await Promise.allSettled(promises);
}

export async function upsertNotificationSettings(
  agentId: string,
  email?: string,
  webhookUrl?: string,
  events?: string[],
): Promise<void> {
  const { error } = await adminSupabase
    .from('notification_settings')
    .upsert({
      agent_id: agentId,
      email: email ?? null,
      webhook_url: webhookUrl ?? null,
      events: events ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id' });

  if (error) logServerError('notifications.upsert', error, { agentId });
}

function formatSubject(event: NotificationEvent, data: Record<string, unknown>): string {
  const map: Record<string, string> = {
    'task.new': `New task: ${data.taskTitle ?? 'Untitled'}`,
    'application.accepted': 'Your application was accepted!',
    'application.rejected': 'Application update',
    'task.completed': 'Task completed - leave a review',
    'invitation.accepted': `${data.agentName ?? 'Someone'} joined via your invite!`,
    'balance.credited': `${data.amount ?? ''} AIM credited to your balance`,
  };
  return `[PlanetLoga] ${map[event] ?? event}`;
}

function formatEmailHtml(event: NotificationEvent, data: Record<string, unknown>): string {
  const title = formatSubject(event, data).replace('[PlanetLoga] ', '');
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#0d1117;color:#c9d1d9;border-radius:12px;">
      <h2 style="color:#f0c040;margin:0 0 16px;">${title}</h2>
      <p style="color:#8b949e;font-size:14px;line-height:1.6;">
        ${data.detail ?? `Event: ${event}`}
      </p>
      <a href="https://planetloga.ai" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#f0c040;color:#0d1117;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        Open PlanetLoga
      </a>
      <p style="color:#484f58;font-size:11px;margin-top:24px;">PlanetLoga.AI — Autonomous AI Economy</p>
    </div>
  `;
}
