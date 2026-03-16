use anchor_lang::prelude::*;
use entity_registry::state::*;

#[cfg(test)]
mod entity_registry_tests {
    use super::*;

    /// Test 1: Basic Entity Registration
    #[test]
    fn test_register_entity() {
        // Create test entity data
        let entity_id = [1u8; 32];
        let legal_name = "Singapore Corporate";
        let jurisdiction = JurisdictionCode::FINMA;
        let vault_address = Pubkey::new_unique();
        let compliance_officer = Pubkey::new_unique();

        // Verify entity can be created with correct initial state
        let entity = EntityRecord {
            entity_id,
            legal_name: legal_name.to_string(),
            jurisdiction: jurisdiction.clone(),
            kyc_status: KycStatus::Pending,
            kyc_expiry: 0,
            vault_address,
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer,
            created_at: 0,
            last_verified: 0,
            bump: 0,
        };

        // Verify entity properties
        assert_eq!(entity.entity_id, entity_id);
        assert_eq!(entity.legal_name, legal_name);
        assert_eq!(entity.jurisdiction, JurisdictionCode::FINMA);
        assert_eq!(entity.kyc_status, KycStatus::Pending);
        assert_eq!(entity.vault_address, vault_address);
    }

    /// Test 2: KYC Verification
    #[test]
    fn test_kyc_verification() {
        let now = 1000000i64;
        let expiry = now + 365 * 24 * 60 * 60; // 1 year from now

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::FCA,
            kyc_status: KycStatus::Pending,
            kyc_expiry: 0,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: now,
            last_verified: 0,
            bump: 0,
        };

        // Before verification
        assert_eq!(entity.kyc_status, KycStatus::Pending);
        assert!(!entity.is_kyc_verified(now));
        assert!(!entity.is_active(now));

        // Simulate verification
        entity.kyc_status = KycStatus::Verified;
        entity.kyc_expiry = expiry;
        entity.last_verified = now;

        // After verification
        assert_eq!(entity.kyc_status, KycStatus::Verified);
        assert!(entity.is_kyc_verified(now));
        assert!(entity.is_active(now));
        assert!(!entity.is_suspended());
        assert!(!entity.is_revoked());
    }

    /// Test 3: KYC Expiration
    #[test]
    fn test_kyc_expiration() {
        let start_time = 1000000i64;
        let expiry_time = start_time + 365 * 24 * 60 * 60; // 1 year
        let expired_time = expiry_time + 1; // 1 second after expiry

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::ADGM,
            kyc_status: KycStatus::Verified,
            kyc_expiry: expiry_time,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: start_time,
            last_verified: start_time,
            bump: 0,
        };

        // Before expiry
        assert!(entity.is_kyc_verified(start_time));
        assert!(!entity.is_kyc_expired(start_time));
        assert!(entity.is_active(start_time));

        // At exact expiry boundary
        assert!(entity.is_kyc_verified(expiry_time)); // exactly at timestamp is still valid
        assert!(!entity.is_kyc_expired(expiry_time));

        // After expiry
        assert!(!entity.is_kyc_verified(expired_time));
        assert!(entity.is_kyc_expired(expired_time));
        assert!(!entity.is_active(expired_time));
    }

    /// Test 4: Entity Suspension
    #[test]
    fn test_entity_suspension() {
        let now = 1000000i64;

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::SFC,
            kyc_status: KycStatus::Verified,
            kyc_expiry: now + 365 * 24 * 60 * 60,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: now,
            last_verified: now,
            bump: 0,
        };

        // Before suspension
        assert!(!entity.is_suspended());
        assert!(entity.is_active(now));

        // Suspend entity
        entity.kyc_status = KycStatus::Suspended;

        // After suspension
        assert!(entity.is_suspended());
        assert!(!entity.is_active(now));
    }

    /// Test 5: Single Transfer Limit
    #[test]
    fn test_single_transfer_limit() {
        let entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::MICA,
            kyc_status: KycStatus::Verified,
            kyc_expiry: 2000000i64,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000, // 100B
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: 1000000i64,
            last_verified: 1000000i64,
            bump: 0,
        };

        // Transfer below limit
        assert!(!entity.exceeds_single_transfer_limit(50_000_000_000)); // 50B < 100B
        assert!(!entity.exceeds_single_transfer_limit(100_000_000_000)); // exactly at limit

        // Transfer above limit
        assert!(entity.exceeds_single_transfer_limit(100_000_000_001)); // 100B + 1 > 100B
        assert!(entity.exceeds_single_transfer_limit(150_000_000_000)); // 150B > 100B
    }

    /// Test 6: Daily Aggregate Limit (same day)
    #[test]
    fn test_daily_aggregate_limit_same_day() {
        let start_time = 1000000i64;
        let next_day = start_time + 86400; // +1 day

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::RBI,
            kyc_status: KycStatus::Verified,
            kyc_expiry: start_time + 365 * 24 * 60 * 60,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000, // 500B per day
                daily_used: 0,
                day_reset_timestamp: start_time,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: start_time,
            last_verified: start_time,
            bump: 0,
        };

        // No transfers yet
        assert!(!entity.would_exceed_daily_limit(100_000_000_000, start_time));
        assert!(!entity.would_exceed_daily_limit(500_000_000_000, start_time)); // exactly at limit

        // Simulate some transfers
        entity.mandate_limits.daily_used = 300_000_000_000; // 300B already used

        // Additional transfers on same day
        assert!(!entity.would_exceed_daily_limit(200_000_000_000, start_time)); // 300B + 200B = 500B
        assert!(entity.would_exceed_daily_limit(200_000_000_001, start_time)); // 300B + 200B + 1 > 500B

        // On next day, counter resets
        assert!(!entity.would_exceed_daily_limit(500_000_000_000, next_day)); // Fresh day, 500B is OK
    }

    /// Test 7: Daily Usage Update
    #[test]
    fn test_daily_usage_update() {
        let start_time = 1000000i64;
        let next_day = start_time + 86400; // +1 day
        let two_days = start_time + 2 * 86400 + 1; // +2 days + 1 second (to trigger reset)

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::FCA,
            kyc_status: KycStatus::Verified,
            kyc_expiry: start_time + 365 * 24 * 60 * 60,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: start_time,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: start_time,
            last_verified: start_time,
            bump: 0,
        };

        // First transfer
        entity.update_daily_usage(100_000_000_000, start_time);
        assert_eq!(entity.mandate_limits.daily_used, 100_000_000_000);

        // Second transfer on same day
        entity.update_daily_usage(150_000_000_000, start_time);
        assert_eq!(entity.mandate_limits.daily_used, 250_000_000_000);

        // Reset on next day
        entity.update_daily_usage(200_000_000_000, next_day);
        assert_eq!(entity.mandate_limits.daily_used, 200_000_000_000); // reset and new transfer
        assert_eq!(entity.mandate_limits.day_reset_timestamp, next_day + 86400);

        // Another day (with 1 extra second to ensure reset happens)
        entity.update_daily_usage(50_000_000_000, two_days);
        assert_eq!(entity.mandate_limits.daily_used, 50_000_000_000);
        assert_eq!(entity.mandate_limits.day_reset_timestamp, two_days + 86400);
    }

    /// Test 8: Entity Revocation
    #[test]
    fn test_entity_revocation() {
        let now = 1000000i64;

        let mut entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::FINMA,
            kyc_status: KycStatus::Verified,
            kyc_expiry: now + 365 * 24 * 60 * 60,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: now,
            last_verified: now,
            bump: 0,
        };

        // Initially active
        assert!(entity.is_active(now));
        assert!(!entity.is_revoked());

        // Revoke entity
        entity.kyc_status = KycStatus::Revoked;

        // After revocation
        assert!(entity.is_revoked());
        assert!(!entity.is_active(now));
    }

    /// Test 9: Multiple jurisdictions
    #[test]
    fn test_multiple_jurisdictions() {
        let jurisdictions = vec![
            JurisdictionCode::FINMA,
            JurisdictionCode::MICA,
            JurisdictionCode::SFC,
            JurisdictionCode::FCA,
            JurisdictionCode::ADGM,
            JurisdictionCode::RBI,
        ];

        for jurisdiction in jurisdictions {
            let entity = EntityRecord {
                entity_id: [1u8; 32],
                legal_name: format!("Test Entity in {:?}", jurisdiction),
                jurisdiction: jurisdiction.clone(),
                kyc_status: KycStatus::Verified,
                kyc_expiry: 2000000i64,
                vault_address: Pubkey::new_unique(),
                pool_membership: Pubkey::new_unique(),
                mandate_limits: MandateLimits {
                    max_single_transfer: 100_000_000_000,
                    max_daily_aggregate: 500_000_000_000,
                    daily_used: 0,
                    day_reset_timestamp: 0,
                },
                compliance_officer: Pubkey::new_unique(),
                created_at: 1000000i64,
                last_verified: 1000000i64,
                bump: 0,
            };

            assert_eq!(entity.jurisdiction, jurisdiction);
            assert!(entity.is_active(1000000i64));
        }
    }

    /// Test 10: Mandate Limits Edge Cases
    #[test]
    fn test_mandate_limits_edge_cases() {
        let entity = EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::FINMA,
            kyc_status: KycStatus::Verified,
            kyc_expiry: 2000000i64,
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000,
                max_daily_aggregate: 500_000_000_000,
                daily_used: 0,
                day_reset_timestamp: 0,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: 1000000i64,
            last_verified: 1000000i64,
            bump: 0,
        };

        // Zero transfer is allowed
        assert!(!entity.exceeds_single_transfer_limit(0));
        assert!(!entity.would_exceed_daily_limit(0, 1000000i64));

        // Maximum allowed transfer
        assert!(!entity.exceeds_single_transfer_limit(100_000_000_000));
        assert!(!entity.would_exceed_daily_limit(500_000_000_000, 1000000i64));

        // Just above maximum
        assert!(entity.exceeds_single_transfer_limit(100_000_000_001));
        assert!(entity.would_exceed_daily_limit(500_000_000_001, 1000000i64));
    }
}
