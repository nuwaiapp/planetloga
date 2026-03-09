use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

mod error;
mod state;

use error::MarketplaceError;

declare_id!("AMe93Dp1nrMFCnfg2Pp4UaioQJPnewuzV9xymXK3LJJV");

#[program]
pub mod marketplace {
    use super::*;

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
        task.escrow = ctx.accounts.escrow.key();
        task.created_at = Clock::get()?.unix_timestamp;
        task.bump = ctx.bumps.task;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.creator_token.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            reward_amount,
        )?;

        Ok(())
    }

    pub fn apply_for_task(
        ctx: Context<ApplyForTask>,
        message: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.task.status == state::TaskStatus::Open,
            MarketplaceError::TaskNotOpen,
        );
        let app = &mut ctx.accounts.application;
        app.task = ctx.accounts.task.key();
        app.applicant = ctx.accounts.applicant.key();
        app.message = message;
        app.applied_at = Clock::get()?.unix_timestamp;
        app.bump = ctx.bumps.application;
        Ok(())
    }

    pub fn assign_agent(ctx: Context<AssignAgent>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(
            task.status == state::TaskStatus::Open,
            MarketplaceError::TaskNotOpen,
        );
        task.assigned_agent = Some(ctx.accounts.application.applicant);
        task.status = state::TaskStatus::Assigned;
        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(
            task.status == state::TaskStatus::Assigned
                || task.status == state::TaskStatus::InProgress,
            MarketplaceError::TaskNotOpen,
        );

        let seeds = &[
            b"task".as_ref(),
            task.creator.as_ref(),
            task.title.as_bytes(),
            &[task.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.agent_token.to_account_info(),
                    authority: ctx.accounts.task.to_account_info(),
                },
                signer_seeds,
            ),
            task.reward_amount,
        )?;

        task.status = state::TaskStatus::Completed;
        task.completed_at = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(
            task.status == state::TaskStatus::Open,
            MarketplaceError::TaskNotOpen,
        );

        let seeds = &[
            b"task".as_ref(),
            task.creator.as_ref(),
            task.title.as_bytes(),
            &[task.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.creator_token.to_account_info(),
                    authority: ctx.accounts.task.to_account_info(),
                },
                signer_seeds,
            ),
            task.reward_amount,
        )?;

        task.status = state::TaskStatus::Cancelled;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, description: String, reward_amount: u64)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + state::Task::INIT_SPACE,
        seeds = [b"task", creator.key().as_ref(), title.as_bytes()],
        bump,
    )]
    pub task: Account<'info, state::Task>,

    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = task,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    /// CHECK: AIM token mint
    pub mint: UncheckedAccount<'info>,

    #[account(
        mut,
        token::authority = creator,
    )]
    pub creator_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(message: String)]
pub struct ApplyForTask<'info> {
    #[account(
        constraint = task.status == state::TaskStatus::Open @ MarketplaceError::TaskNotOpen,
    )]
    pub task: Account<'info, state::Task>,

    #[account(
        init,
        payer = applicant,
        space = 8 + state::TaskApplication::INIT_SPACE,
        seeds = [b"application", task.key().as_ref(), applicant.key().as_ref()],
        bump,
    )]
    pub application: Account<'info, state::TaskApplication>,

    #[account(mut)]
    pub applicant: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignAgent<'info> {
    #[account(
        mut,
        has_one = creator @ MarketplaceError::Unauthorized,
    )]
    pub task: Account<'info, state::Task>,

    #[account(
        constraint = application.task == task.key() @ MarketplaceError::Unauthorized,
    )]
    pub application: Account<'info, state::TaskApplication>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(
        mut,
        has_one = creator @ MarketplaceError::Unauthorized,
    )]
    pub task: Account<'info, state::Task>,

    #[account(
        mut,
        constraint = escrow.key() == task.escrow @ MarketplaceError::InsufficientEscrow,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub agent_token: Account<'info, TokenAccount>,

    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(
        mut,
        has_one = creator @ MarketplaceError::Unauthorized,
    )]
    pub task: Account<'info, state::Task>,

    #[account(
        mut,
        constraint = escrow.key() == task.escrow @ MarketplaceError::InsufficientEscrow,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_token: Account<'info, TokenAccount>,

    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
