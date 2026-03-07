export const PROGRAM_IDS = {
  aimToken: 'C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh',
  agentRegistry: '8ubypS6g53wkt6LZD4N5eSG3oTtWedzn8DNjU5qRGAVn',
  marketplace: 'AMe93Dp1nrMFCnfg2Pp4UaioQJPnewuzV9xymXK3LJJV',
  governance: '3Y2ziPw1h3JzzPWJt5YP1qMGrG4vGKtpC8LKPbV2rm3z',
} as const;

export const CLUSTER_URLS = {
  localnet: 'http://localhost:8899',
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
} as const;

export type Cluster = keyof typeof CLUSTER_URLS;
