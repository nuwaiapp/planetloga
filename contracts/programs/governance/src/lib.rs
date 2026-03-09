use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

mod error;
mod state;

use error::GovernanceError;

declare_id!("3Y2ziPw1h3JzzPWJt5YP1qMGrG4vGKtpC8LKPbV2rm3z");

#[program]
pub mod governance {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        voting_period_seconds: i64,
        quorum: u64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.status = state::ProposalStatus::Active;
        proposal.quorum = quorum;
        let now = Clock::get()?.unix_timestamp;
        proposal.created_at = now;
        proposal.voting_ends_at = now
            .checked_add(voting_period_seconds)
            .ok_or(GovernanceError::Overflow)?;
        proposal.bump = ctx.bumps.proposal;
        Ok(())
    }

    pub fn vote(ctx: Context<CastVote>, support: bool) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        require!(
            proposal.status == state::ProposalStatus::Active,
            GovernanceError::ProposalNotActive,
        );

        let now = Clock::get()?.unix_timestamp;
        require!(now < proposal.voting_ends_at, GovernanceError::VotingEnded);

        let weight = ctx.accounts.voter_token.amount;
        require!(weight > 0, GovernanceError::InsufficientVotingPower);

        let record = &mut ctx.accounts.vote_record;
        record.proposal = ctx.accounts.proposal.key();
        record.voter = ctx.accounts.voter.key();
        record.support = support;
        record.weight = weight;
        record.voted_at = now;
        record.bump = ctx.bumps.vote_record;

        let proposal = &mut ctx.accounts.proposal;
        if support {
            proposal.votes_for = proposal
                .votes_for
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        } else {
            proposal.votes_against = proposal
                .votes_against
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }

        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(
            proposal.status == state::ProposalStatus::Active,
            GovernanceError::ProposalNotActive,
        );

        let now = Clock::get()?.unix_timestamp;
        require!(now >= proposal.voting_ends_at, GovernanceError::VotingNotEnded);

        let total_votes = proposal
            .votes_for
            .checked_add(proposal.votes_against)
            .ok_or(GovernanceError::Overflow)?;

        if total_votes >= proposal.quorum && proposal.votes_for > proposal.votes_against {
            proposal.status = state::ProposalStatus::Passed;
        } else {
            proposal.status = state::ProposalStatus::Rejected;
        }

        Ok(())
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(
            proposal.status == state::ProposalStatus::Active,
            GovernanceError::ProposalNotActive,
        );
        proposal.status = state::ProposalStatus::Cancelled;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = 8 + state::Proposal::INIT_SPACE,
        seeds = [b"proposal", proposer.key().as_ref(), title.as_bytes()],
        bump,
    )]
    pub proposal: Account<'info, state::Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        constraint = proposal.status == state::ProposalStatus::Active @ GovernanceError::ProposalNotActive,
    )]
    pub proposal: Account<'info, state::Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + state::VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, state::VoteRecord>,

    pub voter_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, state::Proposal>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        has_one = proposer,
    )]
    pub proposal: Account<'info, state::Proposal>,

    pub proposer: Signer<'info>,
}
