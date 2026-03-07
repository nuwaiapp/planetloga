use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub treasury: Pubkey,
    /// Burn rate in basis points (50 = 0.5%)
    pub burn_rate_bps: u16,
    /// Treasury fee rate in basis points (50 = 0.5%)
    pub treasury_rate_bps: u16,
    pub decimals: u8,
    /// Maximum supply in raw token units (1B * 10^decimals)
    pub max_supply: u64,
    pub total_minted: u64,
    pub total_burned: u64,
    pub bump: u8,
    pub mint_bump: u8,
}
