use anchor_lang::prelude::*;
use entity_registry::state::*;

#[cfg(test)]
mod compliance_hook_tests {
    use super::*;

    fn create_test_entity(now: i64, kyc_status: KycStatus) -> EntityRecord {
        EntityRecord {
            entity_id: [1u8; 32],
            legal_name: "Test Entity".to_string(),
            jurisdiction: JurisdictionCode::FINMA,
            kyc_status,
            kyc_expiry: now + 365 * 24 * 60 * 60, // 1 year from now
            vault_address: Pubkey::new_unique(),
            pool_membership: Pubkey::new_unique(),
            mandate_limits: MandateLimits {
                max_single_transfer: 100_000_000_000, // 100B
                max_daily_aggregate: 500_000_000_000, // 500B per day
                daily_used: 0,
                day_reset_timestamp: now,
            },
            compliance_officer: Pubkey::new_unique(),
            created_at: now,
            last_verified: now,
            bump: 0,
        }
    }

    /// Test 1: Transfer succeeds when entity is active
    #[test]
    fn test_transfer_passes_when_entity_active() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Verified);

        // Entity is active and can transfer
        assert!(entity.is_active(now));

        // Transfer amount is within limits
        let amount = 50_000_000_000u64; // 50B
        assert!(!entity.exceeds_single_transfer_limit(amount));
        assert!(!entity.would_exceed_daily_limit(amount, now));

        // All checks pass ✅
    }

    /// Test 2: Transfer fails when entity is not verified
    #[test]
    fn test_transfer_fails_when_not_verified() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Pending);

        // Entity is not active - missing KYC verification
        assert!(!entity.is_active(now));
    }

    /// Test 3: Transfer fails when entity is suspended
    #[test]
    fn test_transfer_fails_when_suspended() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Suspended);

        // Entity is suspended - cannot transact
        assert!(entity.is_suspended());
        assert!(!entity.is_active(now));
    }

    /// Test 4: Transfer fails when entity is revoked
    #[test]
    fn test_transfer_fails_when_revoked() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Revoked);

        // Entity is revoked - permanently blocked
        assert!(entity.is_revoked());
        assert!(!entity.is_active(now));
    }

    /// Test 5: Transfer fails when KYC has expired
    #[test]
    fn test_transfer_fails_when_kyc_expired() {
        let start_time = 1000000i64;
        let expiry_time = start_time + 365 * 24 * 60 * 60;
        let expired_time = expiry_time + 1; // 1 second after expiry

        let mut entity = create_test_entity(start_time, KycStatus::Verified);
        entity.kyc_expiry = expiry_time;

        // Before expiry - OK
        assert!(entity.is_active(start_time));

        // After expiry - BLOCKED
        assert!(!entity.is_active(expired_time));
        assert!(entity.is_kyc_expired(expired_time));
    }

    /// Test 6: Transfer fails when exceeding single transfer limit
    #[test]
    fn test_transfer_fails_single_limit() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Verified);

        // Entity has 100B single transfer limit
        let amount = 150_000_000_000u64; // 150B > 100B limit

        assert!(entity.exceeds_single_transfer_limit(amount));
    }

    /// Test 7: Transfer fails when exceeding daily aggregate limit
    #[test]
    fn test_transfer_fails_daily_limit() {
        let now = 1000000i64;
        let mut entity = create_test_entity(now, KycStatus::Verified);

        // Entity already used 400B today
        entity.mandate_limits.daily_used = 400_000_000_000;

        // Trying to transfer 200B more (total would be 600B > 500B limit)
        let amount = 200_000_000_000u64;

        assert!(entity.would_exceed_daily_limit(amount, now));
    }

    /// Test 8: Transfer succeeds at daily limit boundary
    #[test]
    fn test_transfer_passes_at_daily_limit_boundary() {
        let now = 1000000i64;
        let mut entity = create_test_entity(now, KycStatus::Verified);

        // Entity already used 300B today
        entity.mandate_limits.daily_used = 300_000_000_000;

        // Trying to transfer 200B (total exactly 500B = limit)
        let amount = 200_000_000_000u64;

        assert!(!entity.would_exceed_daily_limit(amount, now));
    }

    /// Test 9: Daily counter resets on new day
    #[test]
    fn test_daily_limit_resets_next_day() {
        let day_1 = 1000000i64;
        let day_2 = day_1 + 86400 + 1; // Next day + 1 second

        let mut entity = create_test_entity(day_1, KycStatus::Verified);

        // Day 1: Used 400B
        entity.mandate_limits.daily_used = 400_000_000_000;
        entity.mandate_limits.day_reset_timestamp = day_1;

        // On day 1: Can only transfer 100B more
        let amount = 150_000_000_000u64; // 150B
        assert!(entity.would_exceed_daily_limit(amount, day_1));

        // On day 2: Counter resets, full 500B available again
        assert!(!entity.would_exceed_daily_limit(amount, day_2));
    }

    /// Test 10: Mandate updates work correctly
    #[test]
    fn test_mandate_updates() {
        let now = 1000000i64;
        let mut entity = create_test_entity(now, KycStatus::Verified);

        // Initial state
        assert_eq!(entity.mandate_limits.daily_used, 0);

        // Simulate first transfer: 100B
        entity.update_daily_usage(100_000_000_000, now);
        assert_eq!(entity.mandate_limits.daily_used, 100_000_000_000);

        // Simulate second transfer: 150B more
        entity.update_daily_usage(150_000_000_000, now);
        assert_eq!(entity.mandate_limits.daily_used, 250_000_000_000);

        // Next day: counter resets
        let next_day = now + 86400 + 1;
        entity.update_daily_usage(50_000_000_000, next_day);
        assert_eq!(entity.mandate_limits.daily_used, 50_000_000_000);
    }

    /// Test 11: Complete compliance flow (all checks pass)
    #[test]
    fn test_complete_compliance_flow() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Verified);

        // Step 1: Check if entity is active
        assert!(entity.is_active(now), "Entity should be active");

        // Step 2: Check single transfer limit
        let amount = 75_000_000_000u64; // 75B
        assert!(
            !entity.exceeds_single_transfer_limit(amount),
            "Should be under single limit"
        );

        // Step 3: Check daily aggregate limit
        assert!(
            !entity.would_exceed_daily_limit(amount, now),
            "Should be under daily limit"
        );

        // All checks passed - transfer should be approved ✅
    }

    /// Test 12: Multiple transfers throughout day
    #[test]
    fn test_multiple_transfers_throughout_day() {
        let now = 1000000i64;
        let mut entity = create_test_entity(now, KycStatus::Verified);

        // Transfer 1: 100B
        let amount1 = 100_000_000_000u64;
        assert!(!entity.would_exceed_daily_limit(amount1, now));
        entity.update_daily_usage(amount1, now);

        // Transfer 2: 150B (total 250B)
        let amount2 = 150_000_000_000u64;
        assert!(!entity.would_exceed_daily_limit(amount2, now));
        entity.update_daily_usage(amount2, now);

        // Transfer 3: 200B (total 450B)
        let amount3 = 200_000_000_000u64;
        assert!(!entity.would_exceed_daily_limit(amount3, now));
        entity.update_daily_usage(amount3, now);

        // Transfer 4: 100B (total 550B - exceeds 500B limit) ❌
        let amount4 = 100_000_000_000u64;
        assert!(entity.would_exceed_daily_limit(amount4, now));

        // But still able to transfer exactly remaining: 50B (total 500B) ✅
        let amount5 = 50_000_000_000u64;
        assert!(!entity.would_exceed_daily_limit(amount5, now));
    }

    /// Test 13: Entity with different jurisdictions
    #[test]
    fn test_compliance_with_different_jurisdictions() {
        let now = 1000000i64;

        let jurisdictions = vec![
            JurisdictionCode::FINMA,
            JurisdictionCode::MICA,
            JurisdictionCode::SFC,
            JurisdictionCode::FCA,
            JurisdictionCode::ADGM,
            JurisdictionCode::RBI,
        ];

        for jurisdiction in jurisdictions {
            let mut entity = create_test_entity(now, KycStatus::Verified);
            entity.jurisdiction = jurisdiction;

            // All should pass compliance checks regardless of jurisdiction
            assert!(entity.is_active(now));

            let amount = 50_000_000_000u64;
            assert!(!entity.exceeds_single_transfer_limit(amount));
            assert!(!entity.would_exceed_daily_limit(amount, now));
        }
    }

    /// Test 14: Zero transfer edge case
    #[test]
    fn test_zero_transfer() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Verified);

        // Zero transfer should pass all checks
        assert!(!entity.exceeds_single_transfer_limit(0));
        assert!(!entity.would_exceed_daily_limit(0, now));
    }

    /// Test 15: Maximum allowed transfer
    #[test]
    fn test_maximum_allowed_transfer() {
        let now = 1000000i64;
        let entity = create_test_entity(now, KycStatus::Verified);

        // Exactly at limits
        let amount = 100_000_000_000u64; // Exactly 100B = single limit

        assert!(!entity.exceeds_single_transfer_limit(amount));
        assert!(!entity.would_exceed_daily_limit(amount, now));

        // Just over limit
        let amount_over = 100_000_000_001u64;
        assert!(entity.exceeds_single_transfer_limit(amount_over));
    }
}
