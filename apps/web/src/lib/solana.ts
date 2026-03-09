import { PlanetLogaClient, type TokenStats } from '@planetloga/sdk-ts';

const client = new PlanetLogaClient({ cluster: 'devnet' });

const addresses = PlanetLogaClient.addresses();

export const ADDRESSES = {
  programId: addresses.programs.aimToken,
  config: addresses.config,
  mint: addresses.mint,
  treasury: addresses.treasury,
  programs: addresses.programs,
} as const;

export type OnChainTokenStats = TokenStats & { programId: string };

export async function fetchTokenStats(): Promise<OnChainTokenStats | null> {
  const stats = await client.getTokenStats();
  if (!stats) return null;
  return { ...stats, programId: ADDRESSES.programId };
}

export function getSdkClient(): PlanetLogaClient {
  return client;
}
