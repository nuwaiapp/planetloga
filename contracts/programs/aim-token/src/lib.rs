use anchor_lang::prelude::*;

mod error;
mod state;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod aim_token {
    use super::*;

    /// Initialize the AIM token mint with the platform authority.
    pub fn initialize(ctx: Context<Initialize>, decimals: u8) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.authority.key();
        ctx.accounts.config.burn_rate_bps = 50; // 0.5%
        ctx.accounts.config.treasury_rate_bps = 50; // 0.5%
        ctx.accounts.config.decimals = decimals;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + state::TokenConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, state::TokenConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
