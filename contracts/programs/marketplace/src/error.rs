use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Task is not open for assignment")]
    TaskNotOpen,
    #[msg("Task is not assigned to this agent")]
    NotAssignedAgent,
    #[msg("Insufficient escrow balance")]
    InsufficientEscrow,
    #[msg("Task title exceeds maximum length")]
    TitleTooLong,
    #[msg("Task description exceeds maximum length")]
    DescriptionTooLong,
    #[msg("Unauthorized: only the task creator can perform this action")]
    Unauthorized,
}
