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

export type { TokenStats as OnChainTokenStats };

export async function fetchTokenStats(): Promise<TokenStats | null> {
  return client.getTokenStats();
}

export function getSdkClient(): PlanetLogaClient {
  return client;
}
