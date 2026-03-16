use anchor_lang::prelude::*;

#[account]
pub struct ComplianceCert {
    pub transfer_ref: [u8; 32],
    pub timestamp: i64,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
    pub kyc_check: bool,
    pub mandate_check: bool,
    pub aml_check: bool,
    pub travel_rule_check: bool,
    pub kyt_check: bool,
    pub travel_rule_memo_hash: [u8; 32],
    pub bump: u8,
}

#[account]
pub struct AmlOracleState {
    pub authority: Pubkey,
    pub flagged_addresses: Vec<Pubkey>,
    pub last_updated: i64,
    pub bump: u8,
}

#[account]
pub struct KytState {
    pub entity_id: Pubkey,
    pub transaction_count_24h: u32,
    pub volume_24h: u64,
    pub moving_average_30d: u64,
    pub window_start: i64,
    pub flagged: bool,
    pub bump: u8,
}
