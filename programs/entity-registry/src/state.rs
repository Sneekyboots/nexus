use anchor_lang::prelude::*;

#[account]
pub struct EntityRecord {
    pub entity_id: [u8; 32],
    pub legal_name: String, // max 64 chars
    pub jurisdiction: JurisdictionCode,
    pub kyc_status: KycStatus,
    pub kyc_expiry: i64,
    pub vault_address: Pubkey,
    pub pool_membership: Pubkey,
    pub mandate_limits: MandateLimits,
    pub compliance_officer: Pubkey,
    pub created_at: i64,
    pub last_verified: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum KycStatus {
    Pending,
    Verified,
    Suspended,
    Revoked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum JurisdictionCode {
    FINMA,
    MICA,
    SFC,
    FCA,
    ADGM,
    RBI,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MandateLimits {
    pub max_single_transfer: u64,
    pub max_daily_aggregate: u64,
    pub daily_used: u64,
    pub day_reset_timestamp: i64,
}

impl Default for KycStatus {
    fn default() -> Self {
        KycStatus::Pending
    }
}

impl Default for JurisdictionCode {
    fn default() -> Self {
        JurisdictionCode::FINMA
    }
}
