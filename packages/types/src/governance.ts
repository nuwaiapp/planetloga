export interface Proposal {
  address: string;
  proposer: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: ProposalStatus;
  createdAt: Date;
  votingEndsAt: Date;
}

export type ProposalStatus =
  | 'active'
  | 'passed'
  | 'rejected'
  | 'executed'
  | 'cancelled';

export interface Vote {
  voter: string;
  proposalAddress: string;
  support: boolean;
  weight: number;
  timestamp: Date;
}
