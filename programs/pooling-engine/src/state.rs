use anchor_lang::prelude::*;

#[account]
pub struct PoolState {
    pub pool_id: [u8; 32],
    pub pool_admin: Pubkey,
    pub member_count: u16,
    pub supported_currencies: [CurrencyPair; 6], // Max 6 currencies
    pub net_position_usd: i128,
    pub last_netting_timestamp: i64,
    pub netting_frequency: NettingFrequency,
    pub sweep_threshold: u64,
    pub total_virtual_offsets: u64,
    pub bump: u8,
}

#[account]
pub struct EntityPosition {
    pub entity_id: Pubkey,
    pub pool_id: Pubkey,
    pub currency_mint: Pubkey,
    pub six_currency_code: [u8; 3],
    pub real_balance: u64,
    pub virtual_offset: i128,
    pub effective_position: i128,
    pub interest_accrued: i128,
    pub last_updated: i64,
    pub bump: u8,
}

#[account]
pub struct OffsetEvent {
    pub event_id: [u8; 32],
    pub timestamp: i64,
    pub pool_id: Pubkey,
    pub surplus_entity: Pubkey,
    pub deficit_entity: Pubkey,
    pub surplus_currency: [u8; 3],
    pub deficit_currency: [u8; 3],
    pub surplus_amount: u64,
    pub deficit_amount: u64,
    pub fx_rate_used: Option<u64>,
    pub net_offset_usd: u64,
    pub travel_rule_ref: [u8; 64],
    pub bump: u8,
}

#[account]
pub struct SixOracleState {
    pub authority: Pubkey,
    pub rates: [FxRate; 6], // Max 6 currency pairs
    pub last_updated: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct FxRate {
    pub currency_pair: [u8; 6],
    pub rate: u64,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct CurrencyPair {
    pub code: [u8; 3],
    pub mint: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum NettingFrequency {
    Hourly,
    Daily,
    Weekly,
    Manual,
}

impl Default for NettingFrequency {
    fn default() -> Self {
        NettingFrequency::Manual
    }
}
