use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Voting period has not ended yet")]
    VotingNotEnded,
    #[msg("Proposal is not in active state")]
    ProposalNotActive,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized: insufficient AIM balance to vote")]
    InsufficientVotingPower,
}
