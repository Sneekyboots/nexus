use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

/// RepayLoan instruction
/// Records loan repayment and updates outstanding balance
#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(mut)]
    pub loan_account: Account<'info, IntercompanyLoan>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RepayLoan>, repayment_id: [u8; 32], amount: u64) -> Result<()> {
    let loan = &mut ctx.accounts.loan_account;
    let now = Clock::get()?.unix_timestamp;

    // Validate repayment amount
    require!(amount > 0, SweepError::InvalidAmount);
    require!(
        loan.status == LoanStatus::Active || loan.status == LoanStatus::Mature,
        SweepError::InvalidAmount
    );

    // Calculate accrued interest
    let accrued_interest = loan.calculate_accrued_interest(now);
    loan.accrued_interest = accrued_interest;
    loan.outstanding_balance = loan.principal.saturating_add(accrued_interest);

    let remaining_balance = loan.remaining_balance();
    require!(amount <= remaining_balance, SweepError::InvalidAmount);

    // Record repayment
    loan.paid_back = loan.paid_back.saturating_add(amount);

    // Check if fully repaid
    if loan.paid_back >= loan.outstanding_balance {
        loan.status = LoanStatus::Repaid;
    }

    msg!(
        "Loan repayment: {} USD (remaining: {} USD)",
        amount,
        remaining_balance.saturating_sub(amount)
    );

    emit!(LoanRepaid {
        loan_id: loan.loan_id,
        repayment_id,
        amount_repaid: amount,
        new_outstanding: loan.outstanding_balance.saturating_sub(loan.paid_back),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct LoanRepaid {
    pub loan_id: [u8; 32],
    pub repayment_id: [u8; 32],
    pub amount_repaid: u64,
    pub new_outstanding: u64,
    pub timestamp: i64,
}
