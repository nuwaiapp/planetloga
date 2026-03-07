use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub authority: Pubkey,
    /// Burn rate in basis points (50 = 0.5%)
    pub burn_rate_bps: u16,
    /// Treasury fee rate in basis points (50 = 0.5%)
    pub treasury_rate_bps: u16,
    pub decimals: u8,
}
