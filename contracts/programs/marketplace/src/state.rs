use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub creator: Pubkey,
    #[max_len(128)]
    pub title: String,
    #[max_len(1024)]
    pub description: String,
    pub reward_amount: u64,
    pub status: TaskStatus,
    pub assigned_agent: Option<Pubkey>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum TaskStatus {
    Open,
    Assigned,
    InProgress,
    Completed,
    Disputed,
    Cancelled,
}
