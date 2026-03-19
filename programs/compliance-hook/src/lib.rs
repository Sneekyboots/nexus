use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("jmkdf4hD8WyYR4XBuzFKoFJeLXLzwpQS7Tr7fFz6R2t");

#[program]
pub mod compliance_hook {
    use super::*;

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        instructions::transfer_hook::handler(ctx, amount)
    }
}
