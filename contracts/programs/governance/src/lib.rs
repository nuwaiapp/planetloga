use anchor_lang::prelude::*;

mod error;
mod state;

declare_id!("3Y2ziPw1h3JzzPWJt5YP1qMGrG4vGKtpC8LKPbV2rm3z");

#[program]
pub mod governance {
    use super::*;

    /// Create a new governance proposal.
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        voting_period_seconds: i64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.status = state::ProposalStatus::Active;
        let now = Clock::get()?.unix_timestamp;
        proposal.created_at = now;
        proposal.voting_ends_at = now
            .checked_add(voting_period_seconds)
            .ok_or(error::GovernanceError::Overflow)?;
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
