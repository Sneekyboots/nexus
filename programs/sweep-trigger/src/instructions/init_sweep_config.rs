use crate::state::*;
use anchor_lang::prelude::*;

/// InitSweepConfig instruction
/// Initializes the SweepConfig PDA for a pool — must be called before detect/execute
#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct InitSweepConfig<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(
        init,
        payer = pool_admin,
        space = 8 + 32 + 32 + 8 + 8 + 4 + 4 + 4 + 8 + 8 + 1,
        seeds = [b"sweep_config", pool_id.as_ref()],
        bump
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitSweepConfig>,
    pool_id: [u8; 32],
    sweep_threshold_usd: u64,
    max_intercompany_loan_usd: u64,
    base_interest_rate_bps: u32,
) -> Result<()> {
    let config = &mut ctx.accounts.sweep_config;

    config.pool_id = pool_id;
    config.admin = ctx.accounts.pool_admin.key();
    config.sweep_threshold_usd = sweep_threshold_usd;
    config.max_intercompany_loan_usd = max_intercompany_loan_usd;
    config.min_loan_term_days = MIN_LOAN_TERM_DAYS;
    config.max_loan_term_days = MAX_LOAN_TERM_DAYS;
    config.base_interest_rate_bps = base_interest_rate_bps;
    config.last_sweep_timestamp = 0;
    config.total_loans_issued = 0;
    config.bump = ctx.bumps.sweep_config;

    msg!(
        "SweepConfig initialized for pool {:?}: threshold={} USD, max_loan={} USD, rate={} bps",
        &pool_id[..4],
        sweep_threshold_usd,
        max_intercompany_loan_usd,
        base_interest_rate_bps,
    );

    Ok(())
}
