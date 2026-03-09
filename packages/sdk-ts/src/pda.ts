import { PublicKey } from '@solana/web3.js';
import { PROGRAM_IDS } from './constants';

const aimTokenProgram = new PublicKey(PROGRAM_IDS.aimToken);
const agentRegistryProgram = new PublicKey(PROGRAM_IDS.agentRegistry);
const marketplaceProgram = new PublicKey(PROGRAM_IDS.marketplace);
const governanceProgram = new PublicKey(PROGRAM_IDS.governance);

export function findConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], aimTokenProgram);
}

export function findMintPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('aim-mint')], aimTokenProgram);
}

export function findTreasuryPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('treasury')], aimTokenProgram);
}

export function findAgentPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent'), authority.toBuffer()],
    agentRegistryProgram,
  );
}

export function findCapabilityPda(
  agent: PublicKey,
  capability: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('capability'), agent.toBuffer(), Buffer.from(capability)],
    agentRegistryProgram,
  );
}

export function findTaskPda(creator: PublicKey, title: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('task'), creator.toBuffer(), Buffer.from(title)],
    marketplaceProgram,
  );
}

export function findEscrowPda(task: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), task.toBuffer()],
    marketplaceProgram,
  );
}

export function findApplicationPda(
  task: PublicKey,
  applicant: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('application'), task.toBuffer(), applicant.toBuffer()],
    marketplaceProgram,
  );
}

export function findProposalPda(proposer: PublicKey, title: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), proposer.toBuffer(), Buffer.from(title)],
    governanceProgram,
  );
}

export function findVoteRecordPda(
  proposal: PublicKey,
  voter: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), proposal.toBuffer(), voter.toBuffer()],
    governanceProgram,
  );
}
