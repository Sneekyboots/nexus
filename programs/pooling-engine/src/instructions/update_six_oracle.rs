use crate::errors::PoolingError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateSixOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"six_oracle"],
        bump = oracle_state.bump
    )]
    pub oracle_state: Account<'info, SixOracleState>,
}

pub fn handler(ctx: Context<UpdateSixOracle>, rates: [FxRate; 6]) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_state;
    let now = Clock::get()?.unix_timestamp;

    oracle.authority = ctx.accounts.authority.key();
    oracle.rates = rates;
    oracle.last_updated = now;

    emit!(OracleUpdated {
        timestamp: now,
        rate_count: 6, // Fixed size array
    });

    Ok(())
}

#[event]
pub struct OracleUpdated {
    pub timestamp: i64,
    pub rate_count: u32,
}
