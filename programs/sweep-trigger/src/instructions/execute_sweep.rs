use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ExecuteSweep<'info> {
    pub pool_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecuteSweep>, amount: u64) -> Result<()> {
    msg!("Execute sweep: {} tokens", amount);

    let now = Clock::get()?.unix_timestamp;

    emit!(SweepExecuted {
        amount,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct SweepExecuted {
    pub amount: u64,
    pub timestamp: i64,
}
