use anchor_lang::prelude::*;

#[account]
pub struct IntercompanyLoan {
    pub loan_id: [u8; 32],
    pub lender_entity: Pubkey,
    pub borrower_entity: Pubkey,
    pub principal: u64,
    pub currency_mint: Pubkey,
    pub interest_rate_bps: u32,
    pub origination_timestamp: i64,
    pub maturity_date: Option<i64>,
    pub outstanding_balance: u64,
    pub accrued_interest: u64,
    pub compliance_cert: Pubkey,
    pub amina_confirmation_ref: String,
    pub bump: u8,
}
