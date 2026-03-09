use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::instruction::{Instruction, AccountMeta};
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

mod error;
mod state;

use error::AimTokenError;
use state::TokenConfig;

declare_id!("C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh");

/// 1 billion AIM (before applying decimals)
const BASE_MAX_SUPPLY: u64 = 1_000_000_000;
/// Maximum allowed fee rate: 10% = 1000 basis points
const MAX_FEE_BPS: u16 = 1000;

#[program]
pub mod aim_token {
    use super::*;

    /// Step 1: Create the AIM token mint and config PDA.
    pub fn initialize(ctx: Context<Initialize>, decimals: u8) -> Result<()> {
        let decimal_factor = 10u64
            .checked_pow(decimals as u32)
            .ok_or(AimTokenError::MathOverflow)?;
        let max_supply = BASE_MAX_SUPPLY
            .checked_mul(decimal_factor)
            .ok_or(AimTokenError::MathOverflow)?;

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.treasury = Pubkey::default();
        config.burn_rate_bps = 50;
        config.treasury_rate_bps = 50;
        config.decimals = decimals;
        config.max_supply = max_supply;
        config.total_minted = 0;
        config.total_burned = 0;
        config.bump = ctx.bumps.config;
        config.mint_bump = ctx.bumps.mint;

        Ok(())
    }

    /// Step 2: Create the DAO treasury token account.
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        ctx.accounts.config.treasury = ctx.accounts.treasury.key();
        Ok(())
    }

    /// Mint new AIM tokens. Authority-only. Respects the 1B supply cap.
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        let new_total = config
            .total_minted
            .checked_add(amount)
            .ok_or(AimTokenError::MathOverflow)?;
        require!(new_total <= config.max_supply, AimTokenError::ExceedsMaxSupply);
        config.total_minted = new_total;

        let seeds = &[b"config".as_ref(), &[config.bump]];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Transfer AIM tokens with automatic 1% fee:
    /// 0.5% burned permanently, 0.5% sent to DAO treasury.
    pub fn transfer_with_fee(ctx: Context<TransferWithFee>, amount: u64) -> Result<()> {
        let burn_rate = ctx.accounts.config.burn_rate_bps;
        let treasury_rate = ctx.accounts.config.treasury_rate_bps;

        let burn_amount = amount
            .checked_mul(burn_rate as u64)
            .ok_or(AimTokenError::MathOverflow)?
            / 10_000;

        let treasury_amount = amount
            .checked_mul(treasury_rate as u64)
            .ok_or(AimTokenError::MathOverflow)?
            / 10_000;

        let net_amount = amount
            .checked_sub(burn_amount)
            .ok_or(AimTokenError::MathOverflow)?
            .checked_sub(treasury_amount)
            .ok_or(AimTokenError::MathOverflow)?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            net_amount,
        )?;

        if treasury_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.from.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                        authority: ctx.accounts.sender.to_account_info(),
                    },
                ),
                treasury_amount,
            )?;
        }

        if burn_amount > 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Burn {
                        mint: ctx.accounts.mint.to_account_info(),
                        from: ctx.accounts.from.to_account_info(),
                        authority: ctx.accounts.sender.to_account_info(),
                    },
                ),
                burn_amount,
            )?;

            ctx.accounts.config.total_burned = ctx
                .accounts
                .config
                .total_burned
                .checked_add(burn_amount)
                .ok_or(AimTokenError::MathOverflow)?;
        }

        Ok(())
    }

    /// Register token metadata (name, symbol, image) via Metaplex CPI.
    /// Config PDA signs as mint authority.
    pub fn create_metadata(
        ctx: Context<CreateMetadata>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let seeds = &[b"config".as_ref(), &[config.bump]];
        let signer_seeds = &[&seeds[..]];

        // Borsh-serialize CreateMetadataAccountV3 instruction data
        let mut data = vec![33u8]; // Metaplex instruction discriminator
        // DataV2 struct:
        borsh_string(&mut data, &name);
        borsh_string(&mut data, &symbol);
        borsh_string(&mut data, &uri);
        data.extend_from_slice(&0u16.to_le_bytes()); // seller_fee_basis_points
        data.push(0); // creators: None
        data.push(0); // collection: None
        data.push(0); // uses: None
        data.push(1); // is_mutable: true
        data.push(0); // collection_details: None

        let accounts = vec![
            AccountMeta::new(ctx.accounts.metadata.key(), false),
            AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
            AccountMeta::new_readonly(ctx.accounts.config.key(), true),
            AccountMeta::new(ctx.accounts.authority.key(), true),
            AccountMeta::new_readonly(ctx.accounts.authority.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ];

        invoke_signed(
            &Instruction {
                program_id: ctx.accounts.metadata_program.key(),
                accounts,
                data,
            },
            &[
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.config.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }

    /// Update fee configuration. Authority-only. Max 10% per fee.
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_burn_rate_bps: Option<u16>,
        new_treasury_rate_bps: Option<u16>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if let Some(rate) = new_burn_rate_bps {
            require!(rate <= MAX_FEE_BPS, AimTokenError::InvalidFeeRate);
            config.burn_rate_bps = rate;
        }

        if let Some(rate) = new_treasury_rate_bps {
            require!(rate <= MAX_FEE_BPS, AimTokenError::InvalidFeeRate);
            config.treasury_rate_bps = rate;
        }

        Ok(())
    }

    /// Transfer authority to a new address (e.g. DAO governance program).
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        ctx.accounts.config.authority = new_authority;
        emit!(AuthorityTransferred {
            old_authority: ctx.accounts.authority.key(),
            new_authority,
        });
        Ok(())
    }
}

fn borsh_string(buf: &mut Vec<u8>, s: &str) {
    buf.extend_from_slice(&(s.len() as u32).to_le_bytes());
    buf.extend_from_slice(s.as_bytes());
}

// ---------------------------------------------------------------------------
// Account structs
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = config,
        seeds = [b"aim-mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(
        constraint = mint.key() == config.mint @ AimTokenError::Unauthorized,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = config,
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
        has_one = mint,
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// Destination token account (must be an AIM token account)
    #[account(
        mut,
        token::mint = mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithFee<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = mint,
        has_one = treasury,
    )]
    pub config: Box<Account<'info, TokenConfig>>,

    #[account(mut)]
    pub mint: Box<Account<'info, Mint>>,

    /// Sender's AIM token account
    #[account(
        mut,
        token::mint = mint,
        token::authority = sender,
    )]
    pub from: Box<Account<'info, TokenAccount>>,

    /// Recipient's AIM token account
    #[account(
        mut,
        token::mint = mint,
    )]
    pub to: Box<Account<'info, TokenAccount>>,

    /// Platform treasury (collects 0.5% fee)
    #[account(mut)]
    pub treasury: Box<Account<'info, TokenAccount>>,

    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
        has_one = mint,
    )]
    pub config: Account<'info, TokenConfig>,

    pub mint: Account<'info, Mint>,

    /// CHECK: Metaplex metadata PDA, validated by the Metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Metaplex Token Metadata program
    #[account(
        constraint = metadata_program.key().to_string() == "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    )]
    pub metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, TokenConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, TokenConfig>,

    pub authority: Signer<'info>,
}

#[event]
pub struct AuthorityTransferred {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}
