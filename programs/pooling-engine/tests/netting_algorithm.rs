use anchor_lang::prelude::*;
use pooling_engine::netting_algorithm::*;
use pooling_engine::state::*;

#[cfg(test)]
mod netting_algorithm_tests {
    use super::*;

    /// Test scenario from spec: Basic Notional Offset (same currency)
    /// Setup:
    /// - Singapore: +800,000 USDC (surplus)
    /// - UAE: -300,000 USDC (deficit)
    /// - UK: +200,000 GBPC (surplus)
    /// - Germany: -400,000 EURC (deficit)
    #[test]
    fn test_basic_netting_offset_same_currency() {
        // Create test positions
        let positions = vec![
            PositionSnapshot {
                entity_id: Pubkey::new_unique(), // Singapore
                real_balance: 800_000_000_000,
                virtual_offset: 0,
                effective_position: 800_000_000_000 as i128,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(), // UAE
                real_balance: 0,
                virtual_offset: -300_000_000_000i128,
                effective_position: -300_000_000_000i128,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(), // UK
                real_balance: 200_000_000_000,
                virtual_offset: 0,
                effective_position: 200_000_000_000 as i128,
                currency_code: *b"GBP",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(), // Germany
                real_balance: 0,
                virtual_offset: -400_000_000_000i128,
                effective_position: -400_000_000_000i128,
                currency_code: *b"EUR",
                mint: Pubkey::new_unique(),
            },
        ];

        // Create algorithm
        let pool_id = [0u8; 32];
        let oracle_rates = vec![
            FxRate {
                currency_pair: *b"EURUSD",
                rate: 1_085_000_000,
                timestamp: 1000,
            },
            FxRate {
                currency_pair: *b"GBPUSD",
                rate: 1_265_000_000,
                timestamp: 1000,
            },
        ];

        let algorithm = NettingAlgorithm::new(pool_id, oracle_rates);

        // STEP 1: Position Snapshot
        let snapshots = algorithm.take_position_snapshot(positions).unwrap();
        assert_eq!(snapshots.len(), 4, "Should have 4 positions");

        // STEP 2: Currency Normalisation
        let normalized = algorithm.normalize_to_usd(&snapshots).unwrap();
        assert_eq!(normalized.len(), 4, "Should have 4 normalized positions");

        // STEP 3: Surplus/Deficit Classification
        let (surplus_list, deficit_list) = algorithm.classify_surplus_deficit(normalized).unwrap();
        assert_eq!(surplus_list.len(), 2, "Should have 2 surplus entities");
        assert_eq!(deficit_list.len(), 2, "Should have 2 deficit entities");

        // STEP 4: Greedy Offset Matching
        let (offset_matches, updated_positions) = algorithm
            .greedy_offset_matching(surplus_list, deficit_list)
            .unwrap();

        // Should have created offset matches
        assert!(
            offset_matches.len() > 0,
            "Should have created offset matches"
        );

        // Verify invariant: sum of (real + virtual) should remain constant
        let mut total_before: i128 = 0;
        let mut total_after: i128 = 0;

        for snap in &snapshots {
            total_before += snap.real_balance as i128 + snap.virtual_offset;
        }

        for pos in &updated_positions {
            total_after += pos.real_balance as i128 + pos.virtual_offset;
        }

        assert_eq!(
            total_before, total_after,
            "Sum of (real_balance + virtual_offset) should remain constant. Before: {}, After: {}",
            total_before, total_after
        );

        println!("✅ Test passed: Basic netting offset");
        println!("   - Offset matches created: {}", offset_matches.len());
        println!(
            "   - Invariant preserved: {} = {}",
            total_before, total_after
        );
    }

    /// Test invariant: No value creation
    /// The core invariant of notional pooling is that the sum of all
    /// (real_balance + virtual_offset) should remain constant across netting cycles.
    #[test]
    fn test_invariant_no_value_creation() {
        let positions = vec![
            PositionSnapshot {
                entity_id: Pubkey::new_unique(),
                real_balance: 1000, // 1000
                virtual_offset: 0,
                effective_position: 1000,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(),
                real_balance: 500, // 500
                virtual_offset: 0,
                effective_position: 500,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(),
                real_balance: 0, // -600
                virtual_offset: -600,
                effective_position: -600,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: Pubkey::new_unique(),
                real_balance: 0, // -400
                virtual_offset: -400,
                effective_position: -400,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
        ];

        // Calculate total before
        let total_before: i128 = positions
            .iter()
            .map(|p| p.real_balance as i128 + p.virtual_offset)
            .sum();

        let algorithm = NettingAlgorithm::new([0u8; 32], vec![]);

        let snapshots = algorithm.take_position_snapshot(positions).unwrap();
        let normalized = algorithm.normalize_to_usd(&snapshots).unwrap();
        let (surplus_list, deficit_list) = algorithm.classify_surplus_deficit(normalized).unwrap();
        let (_offset_matches, updated_positions) = algorithm
            .greedy_offset_matching(surplus_list, deficit_list)
            .unwrap();

        // Calculate total after
        let total_after: i128 = updated_positions
            .iter()
            .map(|p| p.real_balance as i128 + p.virtual_offset)
            .sum();

        assert_eq!(
            total_before, total_after,
            "Invariant violated: total changed from {} to {}",
            total_before, total_after
        );
        assert_eq!(total_before, 500, "Expected total of 500");

        println!("✅ Test passed: Invariant preserved (no value creation)");
        println!("   - Total before: {}", total_before);
        println!("   - Total after: {}", total_after);
    }

    /// Test: Surplus entity virtual offset decreases
    /// When an offset is matched, the surplus entity's virtual offset should decrease
    #[test]
    fn test_surplus_entity_offset_decreases() {
        let singapore_id = Pubkey::new_unique();
        let uae_id = Pubkey::new_unique();

        let positions = vec![
            PositionSnapshot {
                entity_id: singapore_id,
                real_balance: 800_000_000_000,
                virtual_offset: 0,
                effective_position: 800_000_000_000 as i128,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
            PositionSnapshot {
                entity_id: uae_id,
                real_balance: 0,
                virtual_offset: -300_000_000_000i128,
                effective_position: -300_000_000_000i128,
                currency_code: *b"USD",
                mint: Pubkey::new_unique(),
            },
        ];

        let algorithm = NettingAlgorithm::new([0u8; 32], vec![]);

        let snapshots = algorithm.take_position_snapshot(positions).unwrap();
        let normalized = algorithm.normalize_to_usd(&snapshots).unwrap();
        let (surplus_list, deficit_list) = algorithm.classify_surplus_deficit(normalized).unwrap();
        let (_offset_matches, updated_positions) = algorithm
            .greedy_offset_matching(surplus_list, deficit_list)
            .unwrap();

        // Find the updated positions
        let updated_singapore = updated_positions
            .iter()
            .find(|p| p.entity_id == singapore_id)
            .unwrap();
        let updated_uae = updated_positions
            .iter()
            .find(|p| p.entity_id == uae_id)
            .unwrap();

        // Singapore's virtual offset should have DECREASED (become more negative)
        assert!(
            updated_singapore.virtual_offset < 0,
            "Singapore virtual offset should be negative after offset"
        );

        // UAE's virtual offset should have INCREASED (become less negative)
        assert!(
            updated_uae.virtual_offset > -300_000_000_000i128,
            "UAE virtual offset should have increased"
        );

        println!("✅ Test passed: Surplus entity offset decreases");
        println!(
            "   - Singapore offset: {} → {}",
            0, updated_singapore.virtual_offset
        );
        println!(
            "   - UAE offset: {} → {}",
            -300_000_000_000i128, updated_uae.virtual_offset
        );
    }
}
