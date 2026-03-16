use anchor_lang::prelude::*;

#[error_code]
pub enum NexusError {
    #[msg("Entity not found")]
    EntityNotFound = 1000,

    #[msg("KYC verification failed")]
    KycVerificationFailed = 1001,

    #[msg("Entity is suspended")]
    EntitySuspended = 1002,

    #[msg("KYC has expired")]
    KycExpired = 1003,

    #[msg("Mandate limits exceeded")]
    MandateExceeded = 1004,

    #[msg("Single transfer exceeds limit")]
    SingleTransferExceedsLimit = 1005,

    #[msg("Daily aggregate exceeds limit")]
    DailyAggregateExceedsLimit = 1006,

    #[msg("Unauthorized access")]
    Unauthorized = 1007,

    #[msg("Invalid jurisdiction")]
    InvalidJurisdiction = 1008,

    #[msg("Travel rule violation")]
    TravelRuleViolation = 1009,

    #[msg("Sanctions match found")]
    SanctionsMatch = 1010,

    #[msg("Pool not found")]
    PoolNotFound = 2000,

    #[msg("Invalid pool state")]
    InvalidPoolState = 2001,

    #[msg("Stale oracle data")]
    StaleOracleData = 2002,

    #[msg("Invalid FX rate")]
    InvalidFxRate = 2003,

    #[msg("Entity position not found")]
    EntityPositionNotFound = 2004,

    #[msg("Netting cycle failed")]
    NettingCycleFailed = 2005,

    #[msg("Invalid sweep amount")]
    InvalidSweepAmount = 2006,

    #[msg("Insufficient balance")]
    InsufficientBalance = 2007,
}
