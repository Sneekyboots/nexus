use anchor_lang::prelude::*;

/// Sweep Configuration - Stores thresholds and parameters
#[account]
pub struct SweepConfig {
    pub pool_id: [u8; 32],
    pub admin: Pubkey,
    pub sweep_threshold_usd: u64, // Trigger sweep when imbalance exceeds this
    pub max_intercompany_loan_usd: u64, // Max loan per sweep
    pub min_loan_term_days: u32,  // Minimum loan duration
    pub max_loan_term_days: u32,  // Maximum loan duration
    pub base_interest_rate_bps: u32, // Base annual rate (basis points)
    pub last_sweep_timestamp: i64,
    pub total_loans_issued: u64,
    pub bump: u8,
}

impl SweepConfig {
    pub fn calculate_interest(&self, principal: u64, days_elapsed: i32) -> u64 {
        // Simple interest: principal * rate * days / 36500
        let rate_factor = self.base_interest_rate_bps as u128;
        let principal_u128 = principal as u128;
        let days_u128 = days_elapsed as u128;

        let interest = (principal_u128 * rate_factor * days_u128) / 36500 / 10000;
        interest as u64
    }
}

/// Intercompany Loan - Represents a notional loan between entities
#[account]
pub struct IntercompanyLoan {
    pub loan_id: [u8; 32],
    pub sweep_id: [u8; 32],         // Reference to triggering sweep
    pub lender_entity: Pubkey,      // Entity providing credit
    pub borrower_entity: Pubkey,    // Entity receiving credit
    pub principal: u64,             // Loan amount
    pub currency_code: [u8; 3],     // Currency (USD, GBP, EUR, etc.)
    pub interest_rate_bps: u32,     // Annual rate (basis points)
    pub origination_timestamp: i64, // When loan was created
    pub maturity_timestamp: i64,    // When loan matures
    pub outstanding_balance: u64,   // Principal + accrued interest
    pub accrued_interest: u64,      // Interest accrued to date
    pub paid_back: u64,             // Amount repaid
    pub status: LoanStatus,         // Current status
    pub compliance_cert: Pubkey,    // Compliance certificate reference
    pub bump: u8,
}

impl IntercompanyLoan {
    pub fn calculate_accrued_interest(&self, current_timestamp: i64) -> u64 {
        if current_timestamp < self.origination_timestamp {
            return 0;
        }

        let seconds_elapsed = (current_timestamp - self.origination_timestamp) as u128;
        let days_elapsed = seconds_elapsed / 86400; // seconds per day

        // Interest = principal * rate_bps * days / 36500 / 10000
        let rate_factor = self.interest_rate_bps as u128;
        let principal_u128 = self.principal as u128;

        let interest = (principal_u128 * rate_factor * days_elapsed) / 36500 / 10000;
        interest as u64
    }

    pub fn is_mature(&self, current_timestamp: i64) -> bool {
        current_timestamp >= self.maturity_timestamp
    }

    pub fn remaining_balance(&self) -> u64 {
        self.outstanding_balance.saturating_sub(self.paid_back)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub enum LoanStatus {
    Active = 0,    // Currently active
    Mature = 1,    // Matured but not fully repaid
    Repaid = 2,    // Fully repaid
    Default = 3,   // Defaulted
    Cancelled = 4, // Cancelled
}

/// Sweep Event - Records when a sweep was triggered
#[account]
pub struct SweepEvent {
    pub sweep_id: [u8; 32],
    pub pool_id: [u8; 32],
    pub triggered_timestamp: i64,          // When sweep was triggered
    pub total_imbalance_usd: u64,          // Total imbalance that triggered sweep
    pub num_loans_created: u32,            // Number of intercompany loans created
    pub total_loan_amount_usd: u64,        // Total loans issued
    pub settlement_complete: bool,         // Whether settlement is complete
    pub settlement_timestamp: Option<i64>, // When settlement was completed
    pub bump: u8,
}

/// Loan Repayment Record
#[account]
pub struct LoanRepayment {
    pub repayment_id: [u8; 32],
    pub loan_id: [u8; 32],
    pub amount_repaid: u64,
    pub timestamp: i64,
    pub bump: u8,
}

/// Configuration constants
pub const SWEEP_THRESHOLD_DEFAULT_USD: u64 = 100_000_000; // 100M USD
pub const MAX_LOAN_DEFAULT_USD: u64 = 500_000_000; // 500M USD per sweep
pub const MIN_LOAN_TERM_DAYS: u32 = 30;
pub const MAX_LOAN_TERM_DAYS: u32 = 365;
pub const BASE_INTEREST_RATE_BPS: u32 = 450; // 4.5% annual
