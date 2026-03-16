use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitOracle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 400 + 8 + 1,
        seeds = [b"six_oracle"],
        bump
    )]
    pub oracle_state: Account<'info, SixOracleState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_state;
    let now = Clock::get()?.unix_timestamp;

    oracle.authority = ctx.accounts.payer.key();
    oracle.rates = Vec::new();
    oracle.last_updated = now;
    oracle.bump = ctx.bumps.oracle_state;

    emit!(OracleInitialized { timestamp: now });

    Ok(())
}

#[event]
pub struct OracleInitialized {
    pub timestamp: i64,
}
