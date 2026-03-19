use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use errors::*;
use instructions::*;

declare_id!("4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej");

#[program]
pub mod fx_netting {
    use super::*;

    pub fn set_fx_rate(
        ctx: Context<SetFxRate>,
        source_currency: [u8; 3],
        target_currency: [u8; 3],
        rate: u64,
        spread_bps: u32,
    ) -> Result<()> {
        instructions::set_fx_rate::handler(ctx, source_currency, target_currency, rate, spread_bps)
    }

    pub fn cross_currency_offset(
        ctx: Context<CrossCurrencyOffset>,
        source_entity: Pubkey,
        target_entity: Pubkey,
        source_currency: [u8; 3],
        target_currency: [u8; 3],
        source_amount: u64,
    ) -> Result<()> {
        instructions::cross_currency_offset::handler(
            ctx,
            source_entity,
            target_entity,
            source_currency,
            target_currency,
            source_amount,
        )
    }
}
