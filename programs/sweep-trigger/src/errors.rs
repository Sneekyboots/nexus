use anchor_lang::prelude::*;

#[error_code]
pub enum SweepError {
    #[msg("Sweep threshold not reached")]
    ThresholdNotReached = 5000,
    #[msg("Invalid sweep amount")]
    InvalidAmount = 5001,
    #[msg("Pool has insufficient balance")]
    InsufficientBalance = 5002,
    #[msg("Entity is not active")]
    EntityNotActive = 5003,
    #[msg("Sweep already executed")]
    SweepAlreadyExecuted = 5004,
    #[msg("Invalid loan terms")]
    InvalidLoanTerms = 5005,
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin = 5006,
}
