use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CrossCurrencyOffset<'info> {
    pub pool_admin: Signer<'info>,
}

pub fn handler(ctx: Context<CrossCurrencyOffset>, amount_usd: u64) -> Result<()> {
    msg!("Cross currency offset: {} USD", amount_usd);

    emit!(FxConversionExecuted {
        amount_usd,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct FxConversionExecuted {
    pub amount_usd: u64,
    pub timestamp: i64,
}
