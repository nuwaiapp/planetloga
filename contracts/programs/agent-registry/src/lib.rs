use anchor_lang::prelude::*;

mod error;
mod state;

declare_id!("HmbTLCmaGtYhSJaoxkmH1DGCAEKqBH1fDCPsEcUSBCoX");

#[program]
pub mod agent_registry {
    use super::*;

    /// Register a new agent on the platform.
    pub fn register_agent(ctx: Context<RegisterAgent>, name: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.authority = ctx.accounts.authority.key();
        agent.name = name;
        agent.reputation = 0;
        agent.tasks_completed = 0;
        agent.is_active = true;
        agent.registered_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + state::AgentProfile::INIT_SPACE,
        seeds = [b"agent", authority.key().as_ref()],
        bump,
    )]
    pub agent: Account<'info, state::AgentProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
