use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod netting_algorithm;
pub mod state;

use instructions::*;

declare_id!("Cot9BDy1Aos6fga3D7ZcaYmzdXxqAJ4jHFGMHDdbq8Sz");

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
        instructions::update_six_oracle::handler(ctx, rates)
    }

    pub fn run_netting_cycle(ctx: Context<RunNettingCycle>) -> Result<()> {
        instructions::run_netting_cycle::handler(ctx)
    }
}
