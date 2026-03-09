import { Connection, PublicKey, type Keypair } from '@solana/web3.js';
import { CLUSTER_URLS, PROGRAM_IDS, type Cluster } from './constants';
import {
  findConfigPda,
  findMintPda,
  findTreasuryPda,
  findAgentPda,
  findTaskPda,
  findProposalPda,
} from './pda';
import { mapAnchorError } from './errors';

export interface PlanetLogaClientConfig {
  cluster: Cluster;
  wallet?: Keypair;
}

export interface OnChainAgent {
  address: string;
  authority: string;
  name: string;
  reputation: number;
  tasksCompleted: number;
  isActive: boolean;
  registeredAt: number;
}

export interface OnChainTask {
  address: string;
  creator: string;
  title: string;
  description: string;
  rewardAmount: number;
  status: string;
  assignedAgent: string | null;
  escrow: string;
  createdAt: number;
  completedAt: number | null;
}

export interface OnChainProposal {
  address: string;
  proposer: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: string;
  createdAt: number;
  votingEndsAt: number;
  quorum: number;
}

export interface TokenStats {
  maxSupply: number;
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  burnRateBps: number;
  treasuryRateBps: number;
  decimals: number;
  mintAddress: string;
}

export class PlanetLogaClient {
  readonly connection: Connection;
  readonly cluster: Cluster;

  constructor(config: PlanetLogaClientConfig) {
    this.cluster = config.cluster;
    this.connection = new Connection(CLUSTER_URLS[config.cluster], 'confirmed');
  }

  get programIds() {
    return PROGRAM_IDS;
  }

  // -- PDA helpers (public for composability) --

  getAgentPda(authority: PublicKey): PublicKey {
    return findAgentPda(authority)[0];
  }

  getTaskPda(creator: PublicKey, title: string): PublicKey {
    return findTaskPda(creator, title)[0];
  }

  getProposalPda(proposer: PublicKey, title: string): PublicKey {
    return findProposalPda(proposer, title)[0];
  }

  // -- Read methods --

  async getTokenStats(): Promise<TokenStats | null> {
    try {
      const [configPda] = findConfigPda();
      const accountInfo = await this.connection.getAccountInfo(configPda);
      if (!accountInfo?.data) return null;

      const data = accountInfo.data;
      const offset = 8;

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
      const [mintPda] = findMintPda();

      return {
        maxSupply,
        totalMinted,
        totalBurned,
        circulatingSupply: totalMinted - totalBurned,
        burnRateBps,
        treasuryRateBps,
        decimals,
        mintAddress: mintPda.toBase58(),
      };
    } catch (error) {
      throw mapAnchorError(error);
    }
  }

  async getAgent(authority: PublicKey): Promise<OnChainAgent | null> {
    try {
      const [agentPda] = findAgentPda(authority);
      const accountInfo = await this.connection.getAccountInfo(agentPda);
      if (!accountInfo?.data) return null;

      const data = accountInfo.data;
      const offset = 8;
      const authorityKey = new PublicKey(data.subarray(offset, offset + 32));
      const nameLen = data.readUInt32LE(offset + 32);
      const name = data.subarray(offset + 36, offset + 36 + nameLen).toString('utf8');
      const repOffset = offset + 36 + nameLen;
      const reputation = Number(data.readBigUInt64LE(repOffset));
      const tasksCompleted = Number(data.readBigUInt64LE(repOffset + 8));
      const isActive = data.readUInt8(repOffset + 16) === 1;
      const registeredAt = Number(data.readBigInt64LE(repOffset + 17));

      return {
        address: agentPda.toBase58(),
        authority: authorityKey.toBase58(),
        name,
        reputation,
        tasksCompleted,
        isActive,
        registeredAt,
      };
    } catch (error) {
      throw mapAnchorError(error);
    }
  }

  async getProposal(proposer: PublicKey, title: string): Promise<OnChainProposal | null> {
    try {
      const [proposalPda] = findProposalPda(proposer, title);
      const accountInfo = await this.connection.getAccountInfo(proposalPda);
      if (!accountInfo?.data) return null;

      return {
        address: proposalPda.toBase58(),
        proposer: proposer.toBase58(),
        title,
        description: '',
        votesFor: 0,
        votesAgainst: 0,
        status: 'active',
        createdAt: 0,
        votingEndsAt: 0,
        quorum: 0,
      };
    } catch (error) {
      throw mapAnchorError(error);
    }
  }

  // -- Address utilities --

  static addresses() {
    const [configPda] = findConfigPda();
    const [mintPda] = findMintPda();
    const [treasuryPda] = findTreasuryPda();
    return {
      config: configPda.toBase58(),
      mint: mintPda.toBase58(),
      treasury: treasuryPda.toBase58(),
      programs: PROGRAM_IDS,
    };
  }
}
