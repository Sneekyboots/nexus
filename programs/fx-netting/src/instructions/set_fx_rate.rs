use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(source_currency: [u8; 3], target_currency: [u8; 3])]
pub struct SetFxRate<'info> {
    #[account(mut)]
    pub oracle_authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = oracle_authority,
        space = 8 + 32 + 8 + 3 + 3 + 8 + 8 + 32 + 4 + 1,
        seeds = [b"fxrate", source_currency.as_ref(), target_currency.as_ref()],
        bump
    )]
    pub fx_rate_oracle: Account<'info, FxRateOracle>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SetFxRate>,
    source_currency: [u8; 3],
    target_currency: [u8; 3],
    rate: u64,
    spread_bps: u32,
) -> Result<()> {
    require!(
        is_supported_currency(&source_currency),
        FxError::UnsupportedCurrency
    );
    require!(
        is_supported_currency(&target_currency),
        FxError::UnsupportedCurrency
    );
    require!(rate > 0, FxError::InvalidRate);
    require!(spread_bps < 1000, FxError::InvalidSpread); // Max 10% spread

    let oracle = &mut ctx.accounts.fx_rate_oracle;
    oracle.source_currency = source_currency;
    oracle.target_currency = target_currency;
    oracle.rate = rate;
    oracle.last_updated = Clock::get()?.unix_timestamp;
    oracle.oracle_authority = ctx.accounts.oracle_authority.key();
    oracle.spread_bps = spread_bps;
    oracle.bump = ctx.bumps.fx_rate_oracle;

    emit!(FxRateUpdated {
        source_currency,
        target_currency,
        rate,
        spread_bps,
        timestamp: oracle.last_updated,
    });

    Ok(())
}

#[event]
pub struct FxRateUpdated {
    pub source_currency: [u8; 3],
    pub target_currency: [u8; 3],
    pub rate: u64,
    pub spread_bps: u32,
    pub timestamp: i64,
}
