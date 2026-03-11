import { NextResponse, type NextRequest } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { adminSupabase } from '@/lib/supabase';
import { toErrorResponse, logServerError } from '@/lib/errors';

const MAX_AGE_MS = 5 * 60 * 1000;

function walletEmail(address: string): string {
  return `${address}@wallet.planetloga.ai`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey: pubKeyStr, signature: sigStr, message } = body;

    if (!pubKeyStr || !sigStr || !message) {
      return NextResponse.json(
        { error: 'Missing publicKey, signature, or message' },
        { status: 400 },
      );
    }

    let pubKeyBytes: Uint8Array;
    try {
      pubKeyBytes = new PublicKey(pubKeyStr).toBytes();
    } catch {
      return NextResponse.json({ error: 'Invalid public key' }, { status: 400 });
    }

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(sigStr);

    const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (timestampMatch) {
      const ts = parseInt(timestampMatch[1], 10);
      if (Date.now() - ts > MAX_AGE_MS) {
        return NextResponse.json({ error: 'Signature expired' }, { status: 401 });
      }
    }

    const email = walletEmail(pubKeyStr);

    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      u => u.email === email || u.user_metadata?.wallet_address === pubKeyStr,
    );

    let userId: string;

    if (existing) {
      userId = existing.id;
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: { wallet_address: pubKeyStr },
      });
    } else {
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { wallet_address: pubKeyStr },
      });
      if (createErr || !newUser.user) {
        return NextResponse.json(
          { error: createErr?.message ?? 'Failed to create user' },
          { status: 500 },
        );
      }
      userId = newUser.user.id;
    }

    const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: linkErr?.message ?? 'Failed to generate session' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      token_hash: linkData.properties.hashed_token,
      user_id: userId,
    });
  } catch (error) {
    logServerError('api/auth/wallet-verify', error);
    return toErrorResponse('api/auth/wallet-verify', error, {
      code: 'WALLET_VERIFY_FAILED',
      message: 'Wallet verification failed',
      status: 500,
    });
  }
}
