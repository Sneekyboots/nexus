use anchor_lang::prelude::*;

#[error_code]
pub enum ComplianceError {
    #[msg("KYC verification failed")]
    KycVerificationFailed = 3000,

    #[msg("Mandate exceeded")]
    MandateExceeded = 3001,

    #[msg("Sanctions match found")]
    SanctionsMatch = 3002,

    #[msg("Travel rule violation")]
    TravelRuleViolation = 3003,

    #[msg("Invalid memo format")]
    InvalidMemoFormat = 3004,

    #[msg("KYC expired")]
    KycExpired = 3005,

    #[msg("Single transfer exceeds limit")]
    SingleTransferExceedsLimit = 3006,

    #[msg("Daily aggregate exceeds limit")]
    DailyAggregateExceedsLimit = 3007,

    #[msg("Unauthorized")]
    Unauthorized = 3008,

    #[msg("Entity record mismatch")]
    EntityRecordMismatch = 3009,
}
