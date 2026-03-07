export const PROGRAM_IDS = {
  aimToken: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
  agentRegistry: 'HmbTLCmaGtYhSJaoxkmH1DGCAEKqBH1fDCPsEcUSBCoX',
  marketplace: '7a4WHsgXcUPZnQYGR5QMFdqhTEEGafQFRs4mQCrTTRHg',
  governance: '3bZMnfTQ5YAPWMkaREdsFjkvLhYfRPjVdW3EPicKmJAa',
} as const;

export const CLUSTER_URLS = {
  localnet: 'http://localhost:8899',
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
} as const;

export type Cluster = keyof typeof CLUSTER_URLS;
