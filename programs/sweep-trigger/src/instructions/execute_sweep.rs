use crate::errors::*;
use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

/// ExecuteSweep instruction
/// Creates intercompany loans to settle outstanding imbalances
#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct ExecuteSweep<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sweep_config", pool_id.as_ref()],
        bump = sweep_config.bump
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ExecuteSweep>,
    pool_id: [u8; 32],
    sweep_id: [u8; 32],
    lender_entity: Pubkey,
    borrower_entity: Pubkey,
    loan_amount_usd: u64,
    loan_term_days: u32,
) -> Result<()> {
    let config = &mut ctx.accounts.sweep_config;
    let now = Clock::get()?.unix_timestamp;

    // Validate inputs
    require!(loan_amount_usd > 0, SweepError::InvalidAmount);
    require!(
        loan_amount_usd <= config.max_intercompany_loan_usd,
        SweepError::InvalidAmount
    );
    require!(
        loan_term_days >= config.min_loan_term_days && loan_term_days <= config.max_loan_term_days,
        SweepError::InvalidLoanTerms
    );

    let maturity_timestamp = now + (loan_term_days as i64 * 86400);

    // Create loan record (would be PDA in real implementation)
    let loan = IntercompanyLoan {
        loan_id: sweep_id,
        sweep_id,
        lender_entity,
        borrower_entity,
        principal: loan_amount_usd,
        currency_code: *b"USD",
        interest_rate_bps: config.base_interest_rate_bps,
        origination_timestamp: now,
        maturity_timestamp,
        outstanding_balance: loan_amount_usd,
        accrued_interest: 0,
        paid_back: 0,
        status: LoanStatus::Active,
        compliance_cert: Pubkey::default(), // Would be set by compliance layer
        bump: 0,
    };

    // Update configuration
    config.total_loans_issued = config.total_loans_issued.saturating_add(loan_amount_usd);
    config.last_sweep_timestamp = now;

    msg!(
        "Sweep executed: {} USD loan from {} to {} (maturity: {} days)",
        loan_amount_usd,
        lender_entity,
        borrower_entity,
        loan_term_days
    );

    emit!(SweepExecuted {
        sweep_id,
        pool_id,
        lender_entity,
        borrower_entity,
        principal: loan_amount_usd,
        interest_rate_bps: config.base_interest_rate_bps,
        loan_term_days,
        maturity_timestamp,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct SweepExecuted {
    pub sweep_id: [u8; 32],
    pub pool_id: [u8; 32],
    pub lender_entity: Pubkey,
    pub borrower_entity: Pubkey,
    pub principal: u64,
    pub interest_rate_bps: u32,
    pub loan_term_days: u32,
    pub maturity_timestamp: i64,
    pub timestamp: i64,
}
