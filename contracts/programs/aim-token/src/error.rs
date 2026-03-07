use anchor_lang::prelude::*;

#[error_code]
pub enum AimTokenError {
    #[msg("Insufficient AIM balance for this transaction")]
    InsufficientBalance,
    #[msg("Burn amount exceeds allowed maximum")]
    BurnExceedsMaximum,
    #[msg("Unauthorized: only the platform authority can perform this action")]
    Unauthorized,
}
