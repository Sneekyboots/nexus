use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod netting_algorithm;
pub mod state;

use instructions::*;

declare_id!("CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk");

#[program]
pub mod pooling_engine {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: [u8; 32],
        sweep_threshold: u64,
        netting_frequency: u8,
    ) -> Result<()> {
        instructions::create_pool::handler(ctx, pool_id, sweep_threshold, netting_frequency)
    }

    pub fn add_entity_to_pool(
        ctx: Context<AddEntityToPool>,
        pool_id: [u8; 32],
        entity_id: Pubkey,
        currency_mint: Pubkey,
        six_currency_code: [u8; 3],
    ) -> Result<()> {
        instructions::add_entity_to_pool::handler(
            ctx,
            pool_id,
            entity_id,
            currency_mint,
            six_currency_code,
        )
    }

    pub fn init_oracle(ctx: Context<InitOracle>) -> Result<()> {
        instructions::init_oracle::handler(ctx)
    }

    pub fn update_six_oracle(
        ctx: Context<UpdateSixOracle>,
        rates: Vec<state::FxRate>,
    ) -> Result<()> {
        // Convert Vec to fixed array, padding with zeros if needed
        let mut rate_array: [state::FxRate; 6] = [state::FxRate {
            currency_pair: [0; 6],
            rate: 0,
            timestamp: 0,
        }; 6];
        for (i, rate) in rates.iter().enumerate().take(6) {
            rate_array[i] = *rate;
        }
        instructions::update_six_oracle::handler(ctx, rate_array)
    }

    pub fn run_netting_cycle<'info>(
        ctx: Context<'_, '_, '_, 'info, RunNettingCycle<'info>>,
    ) -> Result<()> {
        instructions::run_netting_cycle::handler(ctx)
    }
}
