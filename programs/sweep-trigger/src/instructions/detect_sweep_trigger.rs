use crate::errors::*;
use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

/// DetectSweepTrigger instruction
/// Analyzes pool imbalances and determines if sweep should be triggered
#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct DetectSweepTrigger<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(
        seeds = [b"sweep_config", pool_id.as_ref()],
        bump
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<DetectSweepTrigger>,
    pool_id: [u8; 32],
    total_imbalance_usd: u64,
) -> Result<()> {
    let config = &ctx.accounts.sweep_config;
    let now = Clock::get()?.unix_timestamp;

    // Check if imbalance exceeds threshold
    require!(
        total_imbalance_usd >= config.sweep_threshold_usd,
        SweepError::ThresholdNotReached
    );

    msg!(
        "Sweep triggered: imbalance {} USD exceeds threshold {} USD",
        total_imbalance_usd,
        config.sweep_threshold_usd
    );

    emit!(SweepDetected {
        pool_id,
        imbalance_usd: total_imbalance_usd,
        threshold_usd: config.sweep_threshold_usd,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct SweepDetected {
    pub pool_id: [u8; 32],
    pub imbalance_usd: u64,
    pub threshold_usd: u64,
    pub timestamp: i64,
}
