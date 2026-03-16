use anchor_lang::prelude::*;

/// FX Rate Oracle - Stores current exchange rates for supported currencies
/// Seeds: [b"fxrate", source_currency, target_currency]
#[account]
pub struct FxRateOracle {
    pub source_currency: [u8; 3], // e.g. "USD"
    pub target_currency: [u8; 3], // e.g. "GBP"
    pub rate: u64,                // Rate * 1_000_000 (6 decimal places)
    pub last_updated: i64,        // Unix timestamp
    pub oracle_authority: Pubkey, // Who can update rates
    pub spread_bps: u32,          // Spread in basis points (default 50 = 0.5%)
    pub bump: u8,
}

impl FxRateOracle {
    pub fn is_stale(&self, current_timestamp: i64, max_age_seconds: i64) -> bool {
        current_timestamp - self.last_updated > max_age_seconds
    }

    pub fn convert_amount(&self, amount: u64) -> u64 {
        // amount_in_target = amount_in_source * rate / 1_000_000
        amount.saturating_mul(self.rate) / 1_000_000
    }

    pub fn apply_spread(&self, amount: u64) -> u64 {
        // Apply spread: amount * (10000 - spread_bps) / 10000
        let spread_factor = 10000u64.saturating_sub(self.spread_bps as u64);
        amount.saturating_mul(spread_factor) / 10000
    }

    pub fn convert_with_spread(&self, amount: u64) -> u64 {
        let converted = self.convert_amount(amount);
        self.apply_spread(converted)
    }
}

/// FX Conversion Event - Logged for every cross-currency transaction
#[account]
pub struct FxConversionLog {
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

/// Supported currencies in NEXUS protocol
pub const SUPPORTED_CURRENCIES: &[&[u8; 3]] = &[
    b"USD", // US Dollar
    b"GBP", // British Pound
    b"EUR", // Euro
    b"SGD", // Singapore Dollar
    b"AED", // UAE Dirham
];

pub fn is_supported_currency(currency: &[u8; 3]) -> bool {
    SUPPORTED_CURRENCIES.contains(&currency)
}
