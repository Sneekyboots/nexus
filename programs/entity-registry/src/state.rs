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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum KycStatus {
    Pending,
    Verified,
    Suspended,
    Revoked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
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

// Validation and helper methods
impl EntityRecord {
    /// Check if entity is KYC verified (not just status, but also expiry)
    pub fn is_kyc_verified(&self, current_timestamp: i64) -> bool {
        self.kyc_status == KycStatus::Verified && current_timestamp <= self.kyc_expiry
    }

    /// Check if entity's KYC has expired
    pub fn is_kyc_expired(&self, current_timestamp: i64) -> bool {
        self.kyc_status == KycStatus::Verified && current_timestamp > self.kyc_expiry
    }

    /// Check if entity is suspended
    pub fn is_suspended(&self) -> bool {
        self.kyc_status == KycStatus::Suspended
    }

    /// Check if entity is revoked
    pub fn is_revoked(&self) -> bool {
        self.kyc_status == KycStatus::Revoked
    }

    /// Check if entity is active (verified and not suspended/revoked)
    pub fn is_active(&self, current_timestamp: i64) -> bool {
        self.is_kyc_verified(current_timestamp) && !self.is_suspended() && !self.is_revoked()
    }

    /// Check if a single transfer amount exceeds mandate limit
    pub fn exceeds_single_transfer_limit(&self, amount: u64) -> bool {
        amount > self.mandate_limits.max_single_transfer
    }

    /// Check if daily aggregate would exceed limit after this transfer
    pub fn would_exceed_daily_limit(&self, amount: u64, current_timestamp: i64) -> bool {
        // If it's a new day, reset daily_used
        let daily_used = if current_timestamp > self.mandate_limits.day_reset_timestamp {
            0
        } else {
            self.mandate_limits.daily_used
        };

        daily_used + amount > self.mandate_limits.max_daily_aggregate
    }

    /// Update daily usage tracker (should be called after a successful transfer)
    pub fn update_daily_usage(&mut self, amount: u64, current_timestamp: i64) {
        // If it's a new day, reset the counter
        if current_timestamp > self.mandate_limits.day_reset_timestamp {
            self.mandate_limits.daily_used = amount;
            self.mandate_limits.day_reset_timestamp = current_timestamp + 86400;
        // +1 day
        } else {
            self.mandate_limits.daily_used += amount;
        }
    }
}
