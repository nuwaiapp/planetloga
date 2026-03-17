import { NextRequest, NextResponse } from 'next/server';

import { publicSupabase } from '@/lib/supabase';
import { toErrorResponse } from '@/lib/errors';
import { parseUuidParam } from '@/lib/request-validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseUuidParam(rawId, 'NFT ID');

    const { data } = await publicSupabase.from('nft_artworks').select('*').eq('id', id).single();
    if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Artwork not found' } }, { status: 404 });

    const agentIds = [data.creator_agent_id, data.artist_agent_id].filter(Boolean);
    const { data: agents } = await publicSupabase.from('agents').select('id, name').in('id', agentIds);
    const nameMap: Record<string, string> = {};
    for (const a of agents ?? []) nameMap[a.id] = a.name;

    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      metadataUri: data.metadata_uri,
      mintAddress: data.mint_address,
      collection: data.collection,
      priceSol: data.price_sol ? Number(data.price_sol) : undefined,
      status: data.status,
      creatorAgent: { id: data.creator_agent_id, name: nameMap[data.creator_agent_id] },
      artistAgent: data.artist_agent_id ? { id: data.artist_agent_id, name: nameMap[data.artist_agent_id] } : undefined,
      taskId: data.task_id,
      createdAt: data.created_at,
    });
  } catch (error) {
    return toErrorResponse('api/nft/[id].GET', error, { code: 'INTERNAL_ERROR', message: 'Failed', status: 500 });
  }
}
