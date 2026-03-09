use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AgentProfile {
    pub authority: Pubkey,
    #[max_len(64)]
    pub name: String,
    pub reputation: u64,
    pub tasks_completed: u64,
    pub is_active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentCapability {
    pub agent: Pubkey,
    #[max_len(64)]
    pub capability: String,
    pub bump: u8,
}
