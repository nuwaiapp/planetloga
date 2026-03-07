import { Connection, PublicKey } from '@solana/web3.js';

const DEVNET_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh');

const CONFIG_SEED = Buffer.from('config');
const MINT_SEED = Buffer.from('aim-mint');

const [CONFIG_PDA] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
const [MINT_PDA] = PublicKey.findProgramAddressSync([MINT_SEED], PROGRAM_ID);

export const ADDRESSES = {
  programId: PROGRAM_ID.toBase58(),
  config: CONFIG_PDA.toBase58(),
  mint: MINT_PDA.toBase58(),
} as const;

export interface OnChainTokenStats {
  maxSupply: number;
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  burnRateBps: number;
  treasuryRateBps: number;
  decimals: number;
  mintAddress: string;
  programId: string;
}

/**
 * Reads the TokenConfig PDA account and parses it manually.
 * Layout (after 8-byte discriminator):
 *   authority:         32 bytes (Pubkey)
 *   mint:              32 bytes (Pubkey)
 *   treasury:          32 bytes (Pubkey)
 *   burn_rate_bps:      2 bytes (u16 LE)
 *   treasury_rate_bps:  2 bytes (u16 LE)
 *   decimals:           1 byte  (u8)
 *   max_supply:         8 bytes (u64 LE)
 *   total_minted:       8 bytes (u64 LE)
 *   total_burned:       8 bytes (u64 LE)
 */
export async function fetchTokenStats(): Promise<OnChainTokenStats | null> {
  try {
    const connection = new Connection(DEVNET_URL, 'confirmed');
    const accountInfo = await connection.getAccountInfo(CONFIG_PDA);

    if (!accountInfo?.data) return null;

    const data = accountInfo.data;
    const offset = 8; // skip discriminator

    const burnRateBps = data.readUInt16LE(offset + 96);
    const treasuryRateBps = data.readUInt16LE(offset + 98);
    const decimals = data.readUInt8(offset + 100);
    const maxSupplyRaw = data.readBigUInt64LE(offset + 101);
    const totalMintedRaw = data.readBigUInt64LE(offset + 109);
    const totalBurnedRaw = data.readBigUInt64LE(offset + 117);

    const divisor = BigInt(10 ** decimals);
    const maxSupply = Number(maxSupplyRaw / divisor);
    const totalMinted = Number(totalMintedRaw / divisor);
    const totalBurned = Number(totalBurnedRaw / divisor);

    return {
      maxSupply,
      totalMinted,
      totalBurned,
      circulatingSupply: totalMinted - totalBurned,
      burnRateBps,
      treasuryRateBps,
      decimals,
      mintAddress: MINT_PDA.toBase58(),
      programId: PROGRAM_ID.toBase58(),
    };
  } catch (e) {
    console.error('Failed to fetch token stats:', e);
    return null;
  }
}
