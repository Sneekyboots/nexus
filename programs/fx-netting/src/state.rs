use anchor_lang::prelude::*;

#[account]
pub struct FxConversionEvent {
    pub conversion_id: [u8; 32],
    pub timestamp: i64,
    pub source_currency: [u8; 3],
    pub target_currency: [u8; 3],
    pub source_amount: u64,
    pub target_amount: u64,
    pub rate_used: u64,
    pub spread_bps: u32,
    pub bump: u8,
}
