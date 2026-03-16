use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

/// CrossCurrencyOffset instruction
/// Matches entities with different currency positions using FX rates
/// Extends Layer 2 (Pooling Engine) algorithm for multi-currency scenarios
#[derive(Accounts)]
#[instruction(
    source_entity: Pubkey,
    target_entity: Pubkey,
    source_currency: [u8; 3],
    target_currency: [u8; 3],
    source_amount: u64
)]
pub struct CrossCurrencyOffset<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    /// FX Rate Oracle for source -> target conversion
    #[account(
        seeds = [b"fxrate", source_currency.as_ref(), target_currency.as_ref()],
        bump
    )]
    pub fx_rate_oracle: Account<'info, FxRateOracle>,
}

pub fn handler(
    ctx: Context<CrossCurrencyOffset>,
    source_entity: Pubkey,
    target_entity: Pubkey,
    source_currency: [u8; 3],
    target_currency: [u8; 3],
    source_amount: u64,
) -> Result<()> {
    let oracle = &ctx.accounts.fx_rate_oracle;

    // Validate currencies match oracle
    require!(
        oracle.source_currency == source_currency,
        FxError::CurrencyMismatch
    );
    require!(
        oracle.target_currency == target_currency,
        FxError::CurrencyMismatch
    );

    // Check if rate is stale (max 1 hour = 3600 seconds)
    let now = Clock::get()?.unix_timestamp;
    require!(!oracle.is_stale(now, 3600), FxError::StaleFxRate);

    // Convert source amount to target currency
    let target_amount = oracle.convert_with_spread(source_amount);

    msg!(
        "Cross-currency offset: {} {} -> {} {} (rate: {}, spread: {} bps)",
        source_amount,
        String::from_utf8_lossy(&source_currency),
        target_amount,
        String::from_utf8_lossy(&target_currency),
        oracle.rate,
        oracle.spread_bps
    );

    // Emit conversion event
    emit!(FxConversionExecuted {
        source_entity,
        target_entity,
        source_currency,
        target_currency,
        source_amount,
        target_amount,
        rate_used: oracle.rate,
        spread_bps: oracle.spread_bps,
        timestamp: now,
    });

    Ok(())
}

/// Event emitted when cross-currency offset is executed
#[event]
pub struct FxConversionExecuted {
    pub source_entity: Pubkey,
    pub target_entity: Pubkey,
    pub source_currency: [u8; 3],
    pub target_currency: [u8; 3],
    pub source_amount: u64,
    pub target_amount: u64,
    pub rate_used: u64,
    pub spread_bps: u32,
    pub timestamp: i64,
}
