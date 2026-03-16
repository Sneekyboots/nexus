use anchor_lang::prelude::*;

#[error_code]
pub enum PoolingError {
    #[msg("Pool not found")]
    PoolNotFound = 2000,

    #[msg("Entity position not found")]
    EntityPositionNotFound = 2001,

    #[msg("Stale oracle data")]
    StaleOracleData = 2002,

    #[msg("Invalid FX rate")]
    InvalidFxRate = 2003,

    #[msg("Netting cycle failed")]
    NettingCycleFailed = 2004,

    #[msg("Invalid offset amount")]
    InvalidOffsetAmount = 2005,

    #[msg("Unauthorized")]
    Unauthorized = 2006,

    #[msg("Invalid currency pair")]
    InvalidCurrencyPair = 2007,

    #[msg("Oracle authority mismatch")]
    OracleAuthorityMismatch = 2008,
}
