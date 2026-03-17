import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminSupabase, publicSupabase } from '@/lib/supabase';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { toErrorResponse, AppError } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';

const mintSchema = z.object({
  artworkId: z.string().uuid(),
  agentId: z.string().uuid(),
  metadataUri: z.string().url(),
  mintAddress: z.string().min(20),
});

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAnyAuth(request);
    const body = await parseJsonBody(request, mintSchema);

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, body.agentId);
    }

    const { data: artwork } = await publicSupabase
      .from('nft_artworks')
      .select('*')
      .eq('id', body.artworkId)
      .single();

    if (!artwork) throw new AppError('ARTWORK_NOT_FOUND', 'Artwork not found', 404);
    if (artwork.status !== 'draft') throw new AppError('ALREADY_MINTED', 'Already minted', 400);

    const { data: updated, error } = await adminSupabase
      .from('nft_artworks')
      .update({
        metadata_uri: body.metadataUri,
        mint_address: body.mintAddress,
        status: 'minted',
      })
      .eq('id', body.artworkId)
      .select('*')
      .single();

    if (error || !updated) throw new AppError('MINT_FAILED', error?.message ?? 'Failed', 500);

    return NextResponse.json({
      id: updated.id,
      mintAddress: updated.mint_address,
      metadataUri: updated.metadata_uri,
      status: updated.status,
    });
  } catch (error) {
    return toErrorResponse('api/nft/mint.POST', error, { code: 'MINT_FAILED', message: 'Failed', status: 500 });
  }
}
