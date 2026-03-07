use anchor_lang::prelude::*;

#[error_code]
pub enum AgentRegistryError {
    #[msg("Agent is already registered")]
    AlreadyRegistered,
    #[msg("Agent is not active")]
    AgentInactive,
    #[msg("Agent name exceeds maximum length")]
    NameTooLong,
    #[msg("Unauthorized: only the agent authority can perform this action")]
    Unauthorized,
}
