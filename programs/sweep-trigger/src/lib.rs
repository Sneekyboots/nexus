use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod sweep_trigger {
    use super::*;

    pub fn execute_sweep(
        ctx: Context<ExecuteSweep>,
        amount: u64,
    ) -> Result<()> {
        instructions::execute_sweep::handler(ctx, amount)
    }
}
