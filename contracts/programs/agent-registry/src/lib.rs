use anchor_lang::prelude::*;

mod error;
mod state;

use error::AgentRegistryError;

declare_id!("8ubypS6g53wkt6LZD4N5eSG3oTtWedzn8DNjU5qRGAVn");

#[program]
pub mod agent_registry {
    use super::*;

    pub fn register_agent(ctx: Context<RegisterAgent>, name: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.authority = ctx.accounts.authority.key();
        agent.name = name;
        agent.reputation = 0;
        agent.tasks_completed = 0;
        agent.is_active = true;
        agent.registered_at = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.agent;
        Ok(())
    }

    pub fn update_agent(ctx: Context<UpdateAgent>, name: Option<String>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        if let Some(new_name) = name {
            require!(new_name.len() <= 64, AgentRegistryError::NameTooLong);
            agent.name = new_name;
        }
        Ok(())
    }

    pub fn deactivate_agent(ctx: Context<UpdateAgent>) -> Result<()> {
        ctx.accounts.agent.is_active = false;
        Ok(())
    }

    pub fn reactivate_agent(ctx: Context<UpdateAgent>) -> Result<()> {
        ctx.accounts.agent.is_active = true;
        Ok(())
    }

    pub fn increment_reputation(ctx: Context<IncrementReputation>, amount: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.reputation = agent
            .reputation
            .checked_add(amount)
            .ok_or(AgentRegistryError::MathOverflow)?;
        Ok(())
    }

    pub fn increment_tasks_completed(ctx: Context<IncrementReputation>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.tasks_completed = agent
            .tasks_completed
            .checked_add(1)
            .ok_or(AgentRegistryError::MathOverflow)?;
        Ok(())
    }

    pub fn add_capability(
        ctx: Context<AddCapability>,
        capability: String,
    ) -> Result<()> {
        require!(capability.len() <= 64, AgentRegistryError::CapabilityTooLong);
        let cap = &mut ctx.accounts.capability;
        cap.agent = ctx.accounts.agent.key();
        cap.capability = capability;
        cap.bump = ctx.bumps.capability;
        Ok(())
    }

    pub fn remove_capability(_ctx: Context<RemoveCapability>) -> Result<()> {
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

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentRegistryError::Unauthorized,
    )]
    pub agent: Account<'info, state::AgentProfile>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct IncrementReputation<'info> {
    #[account(
        mut,
        constraint = agent.is_active @ AgentRegistryError::AgentInactive,
    )]
    pub agent: Account<'info, state::AgentProfile>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(capability: String)]
pub struct AddCapability<'info> {
    #[account(
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentRegistryError::Unauthorized,
        constraint = agent.is_active @ AgentRegistryError::AgentInactive,
    )]
    pub agent: Account<'info, state::AgentProfile>,

    #[account(
        init,
        payer = authority,
        space = 8 + state::AgentCapability::INIT_SPACE,
        seeds = [b"capability", agent.key().as_ref(), capability.as_bytes()],
        bump,
    )]
    pub capability: Account<'info, state::AgentCapability>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveCapability<'info> {
    #[account(
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
        has_one = authority @ AgentRegistryError::Unauthorized,
    )]
    pub agent: Account<'info, state::AgentProfile>,

    #[account(
        mut,
        close = authority,
        constraint = capability.agent == agent.key() @ AgentRegistryError::Unauthorized,
    )]
    pub capability: Account<'info, state::AgentCapability>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
