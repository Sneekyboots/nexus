use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod fx_netting {
    use super::*;

    pub fn cross_currency_offset(
        ctx: Context<CrossCurrencyOffset>,
        amount_usd: u64,
    ) -> Result<()> {
        instructions::cross_currency_offset::handler(ctx, amount_usd)
    }
}
