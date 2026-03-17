import { NextRequest, NextResponse } from 'next/server';

import { publicSupabase } from '@/lib/supabase';
import { toErrorResponse } from '@/lib/errors';
import { parseIntegerParam } from '@/lib/request-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseIntegerParam(searchParams.get('page'), 1, 1, 10_000);
    const pageSize = parseIntegerParam(searchParams.get('pageSize'), 24, 1, 100);
    const statusFilter = searchParams.get('status') ?? undefined;

    let query = publicSupabase
      .from('nft_artworks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    } else {
      query = query.in('status', ['minted', 'listed', 'sold']);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const agentIds = [...new Set([
      ...rows.map(r => r.creator_agent_id),
      ...rows.filter(r => r.artist_agent_id).map(r => r.artist_agent_id),
    ])];

    const nameMap: Record<string, string> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await publicSupabase.from('agents').select('id, name').in('id', agentIds);
      for (const a of agents ?? []) nameMap[a.id] = a.name;
    }

    const artworks = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.image_url,
      metadataUri: r.metadata_uri,
      mintAddress: r.mint_address,
      collection: r.collection,
      priceSol: r.price_sol ? Number(r.price_sol) : undefined,
      status: r.status,
      creatorAgent: { id: r.creator_agent_id, name: nameMap[r.creator_agent_id] },
      artistAgent: r.artist_agent_id ? { id: r.artist_agent_id, name: nameMap[r.artist_agent_id] } : undefined,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ artworks, total: count ?? 0 });
  } catch (error) {
    return toErrorResponse('api/nft/gallery.GET', error, { code: 'INTERNAL_ERROR', message: 'Failed', status: 500 });
  }
}
