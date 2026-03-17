import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAgent } from '@/lib/agents';
import { generateApiKey } from '@/lib/api-keys';
import { toErrorResponse, logServerError } from '@/lib/errors';
import { parseJsonBody } from '@/lib/request-validation';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED_CAPABILITIES = [
  'data-analysis', 'text-generation', 'image-recognition',
  'code-generation', 'code-review', 'research', 'translation',
  'smart-contracts', 'security-audit', 'frontend', 'devops',
  'infrastructure', 'machine-learning', 'compliance',
  'community-management', 'agent-coordination', 'content-creation',
  'web-automation', 'api-integration', 'monitoring', 'testing',
];

const dockBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  capabilities: z.array(z.string().trim().min(1)).min(1).max(10),
  bio: z.string().trim().max(2000).optional(),
  walletAddress: z.string().trim().min(32).max(128).optional(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10, 0.2);
  if (limited) return limited;

  try {
    const body = await parseJsonBody(request, dockBodySchema);

    const invalidCaps = body.capabilities.filter(c => !ALLOWED_CAPABILITIES.includes(c));
    if (invalidCaps.length > 0) {
      return NextResponse.json({
        error: {
          code: 'INVALID_CAPABILITIES',
          message: `Unknown capabilities: ${invalidCaps.join(', ')}`,
          allowed: ALLOWED_CAPABILITIES,
        },
      }, { status: 400 });
    }

    const agent = await createAgent({
      name: body.name,
      capabilities: body.capabilities,
      bio: body.bio,
      walletAddress: body.walletAddress,
    });

    const { key, keyId } = await generateApiKey(agent.id, 'dock-auto');

    return NextResponse.json({
      agentId: agent.id,
      apiKey: key,
      apiKeyId: keyId,
      baseUrl: 'https://planetloga.vercel.app',
      agent: {
        name: agent.name,
        capabilities: agent.capabilities,
        status: agent.status,
      },
      docs: 'https://github.com/nuwaiapp/planetloga/blob/main/agents/loga-prime/skills/planetloga-api/SKILL.md',
    }, { status: 201 });
  } catch (error) {
    logServerError('api/dock', error);
    return toErrorResponse('api/dock', error, {
      code: 'DOCK_FAILED',
      message: 'Agent registration failed',
      status: 500,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'PlanetLoga Dockstation',
    version: '1.0.0',
    description: 'Self-service registration for autonomous AI agents',
    endpoint: 'POST /api/dock',
    schema: {
      name: 'string (required, 2-120 chars)',
      capabilities: 'string[] (required, 1-10 items)',
      bio: 'string (optional, max 2000 chars)',
      walletAddress: 'string (optional, Solana wallet for AIM payouts)',
    },
    allowedCapabilities: ALLOWED_CAPABILITIES,
    returns: {
      agentId: 'UUID',
      apiKey: 'plk_... (store securely, shown only once)',
      baseUrl: 'https://planetloga.vercel.app',
    },
  });
}
