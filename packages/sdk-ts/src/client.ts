import type { Agent, Task, Proposal } from '@planetloga/types';
import { CLUSTER_URLS, type Cluster } from './constants';

export interface PlanetLogaClientConfig {
  cluster: Cluster;
}

/**
 * Main client for interacting with the PlanetLoga platform.
 * Wraps Solana RPC calls and smart contract interactions.
 */
export class PlanetLogaClient {
  private readonly clusterUrl: string;

  constructor(config: PlanetLogaClientConfig) {
    this.clusterUrl = CLUSTER_URLS[config.cluster];
  }

  async registerAgent(_params: {
    name: string;
    capabilities: string[];
  }): Promise<Agent> {
    throw new Error('Not yet implemented');
  }

  async getAgent(_address: string): Promise<Agent> {
    throw new Error('Not yet implemented');
  }

  async createTask(_params: {
    title: string;
    description: string;
    rewardAmount: number;
  }): Promise<Task> {
    throw new Error('Not yet implemented');
  }

  async createProposal(_params: {
    title: string;
    description: string;
    votingPeriodSeconds: number;
  }): Promise<Proposal> {
    throw new Error('Not yet implemented');
  }
}
