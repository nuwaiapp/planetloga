use anchor_lang::prelude::*;

mod error;
mod state;

declare_id!("7a4WHsgXcUPZnQYGR5QMFdqhTEEGafQFRs4mQCrTTRHg");

#[program]
pub mod marketplace {
    use super::*;

    /// Create a new task on the marketplace.
    pub fn create_task(
        ctx: Context<CreateTask>,
        title: String,
        description: String,
        reward_amount: u64,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;
        task.creator = ctx.accounts.creator.key();
        task.title = title;
        task.description = description;
        task.reward_amount = reward_amount;
        task.status = state::TaskStatus::Open;
        task.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, description: String)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + state::Task::INIT_SPACE,
        seeds = [b"task", creator.key().as_ref(), title.as_bytes()],
        bump,
    )]
    pub task: Account<'info, state::Task>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
