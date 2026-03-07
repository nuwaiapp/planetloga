use anchor_lang::prelude::*;

#[error_code]
pub enum AimTokenError {
    #[msg("Insufficient AIM balance for this transaction")]
    InsufficientBalance,
    #[msg("Unauthorized: only the platform authority can perform this action")]
    Unauthorized,
    #[msg("Minting would exceed the maximum supply of 1 billion AIM")]
    ExceedsMaxSupply,
    #[msg("Fee rate exceeds the allowed maximum of 10%")]
    InvalidFeeRate,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
