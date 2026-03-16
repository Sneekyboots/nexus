use anchor_lang::prelude::*;

#[error_code]
pub enum FxError {
    #[msg("Unsupported currency")]
    UnsupportedCurrency = 4000,
    #[msg("Invalid exchange rate")]
    InvalidRate = 4001,
    #[msg("Invalid spread")]
    InvalidSpread = 4002,
    #[msg("Stale FX rate")]
    StaleFxRate = 4003,
    #[msg("Currency mismatch")]
    CurrencyMismatch = 4004,
}
