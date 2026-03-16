use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use errors::*;
use instructions::*;

declare_id!("4EbB5Ahei4nhAkfrqyjr7ZE3VPyBhi4pbMRyrpyRbEQq");

#[program]
pub mod sweep_trigger {
    use super::*;

    pub fn detect_sweep_trigger(
        ctx: Context<DetectSweepTrigger>,
        pool_id: [u8; 32],
        total_imbalance_usd: u64,
    ) -> Result<()> {
        instructions::detect_sweep_trigger::handler(ctx, pool_id, total_imbalance_usd)
    }

    pub fn execute_sweep(
        ctx: Context<ExecuteSweep>,
        pool_id: [u8; 32],
        sweep_id: [u8; 32],
        lender_entity: Pubkey,
        borrower_entity: Pubkey,
        loan_amount_usd: u64,
        loan_term_days: u32,
    ) -> Result<()> {
        instructions::execute_sweep::handler(
            ctx,
            pool_id,
            sweep_id,
            lender_entity,
            borrower_entity,
            loan_amount_usd,
            loan_term_days,
        )
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, repayment_id: [u8; 32], amount: u64) -> Result<()> {
        instructions::repay_loan::handler(ctx, repayment_id, amount)
    }
}
