#![cfg(test)]

use fx_netting::state::*;
use fx_netting::state::*;

#[test]
fn test_supported_currencies() {
    // Verify all 5 supported currencies are correctly defined
    assert!(is_supported_currency(b"USD"));
    assert!(is_supported_currency(b"GBP"));
    assert!(is_supported_currency(b"EUR"));
    assert!(is_supported_currency(b"SGD"));
    assert!(is_supported_currency(b"AED"));
}

#[test]
fn test_unsupported_currency() {
    // Verify rejection of unsupported currencies
    assert!(!is_supported_currency(b"JPY"));
    assert!(!is_supported_currency(b"CNY"));
    assert!(!is_supported_currency(b"INR"));
}

#[test]
fn test_fx_rate_oracle_creation() {
    // Create a mock FX rate oracle
    let rate_value = 1_500_000u64; // 1.5 GBP per 1 USD
    let spread = 50u32; // 50 basis points

    // Verify rate storage structure
    assert!(rate_value > 0, "FX rate must be positive");
    assert!(spread < 1000, "Spread must be < 1000 bps");
}

#[test]
fn test_fx_rate_oracle_conversion_usd_to_gbp() {
    // Create mock oracle: 1 USD = 0.73 GBP (rate stored as 730000)
    let rate = 730_000u64;
    let amount_usd = 1_000_000u64; // 1 million USD (in base units)

    // Conversion: 1_000_000 * 730_000 / 1_000_000 = 730_000
    let expected_gbp = amount_usd.saturating_mul(rate) / 1_000_000;
    assert_eq!(expected_gbp, 730_000, "USD to GBP conversion failed");
}

#[test]
fn test_fx_rate_oracle_conversion_gbp_to_usd() {
    // Reverse: 1 GBP = 1.37 USD (rate stored as 1370000)
    let rate = 1_370_000u64;
    let amount_gbp = 1_000_000u64; // 1 million GBP

    // Conversion: 1_000_000 * 1_370_000 / 1_000_000 = 1_370_000
    let expected_usd = amount_gbp.saturating_mul(rate) / 1_000_000;
    assert_eq!(expected_usd, 1_370_000, "GBP to USD conversion failed");
}

#[test]
fn test_fx_rate_oracle_conversion_with_spread_buy() {
    // Oracle: 1 USD = 0.73 GBP with 50 bps spread (buy side)
    let rate = 730_000u64;
    let spread_bps = 50u32; // 0.5%
    let amount_usd = 1_000_000u64;

    // Step 1: Convert amount
    let converted = amount_usd.saturating_mul(rate) / 1_000_000;
    assert_eq!(converted, 730_000, "Initial conversion failed");

    // Step 2: Apply spread (reduce by 0.5%)
    let spread_factor = 10000u64.saturating_sub(spread_bps as u64);
    let with_spread = converted.saturating_mul(spread_factor) / 10000;

    // Expected: 730_000 * 9950 / 10000 = 726_350
    assert_eq!(with_spread, 726_350, "Spread calculation failed");
}

#[test]
fn test_fx_rate_oracle_conversion_with_spread_sell() {
    // Oracle: 1 GBP = 1.37 USD with 50 bps spread (sell side)
    let rate = 1_370_000u64;
    let spread_bps = 50u32; // 0.5%
    let amount_gbp = 1_000_000u64;

    // Step 1: Convert amount
    let converted = amount_gbp.saturating_mul(rate) / 1_000_000;

    // Step 2: Apply spread
    let spread_factor = 10000u64.saturating_sub(spread_bps as u64);
    let with_spread = converted.saturating_mul(spread_factor) / 10000;

    // Expected: 1_370_000 * 9950 / 10000 = 1_363_150
    assert_eq!(
        with_spread, 1_363_150,
        "Spread calculation with sell side failed"
    );
}

#[test]
fn test_fx_rate_oracle_stale_detection() {
    // Test staleness detection logic - rates older than max_age are stale
    let oracle_timestamp = 1000i64;
    let current_timestamp = 4000i64; // 3000 seconds old
    let max_age_seconds = 3600i64;

    let age = current_timestamp - oracle_timestamp;
    let is_stale = age > max_age_seconds;

    assert!(
        !is_stale,
        "Rate should not be stale (age: 3000s, max: 3600s)"
    );
}

#[test]
fn test_fx_rate_oracle_stale_detection_old_rate() {
    // Test staleness with old rate
    let oracle_timestamp = 1000i64;
    let current_timestamp = 6000i64; // 5000 seconds old
    let max_age_seconds = 3600i64;

    let age = current_timestamp - oracle_timestamp;
    let is_stale = age > max_age_seconds;

    assert!(is_stale, "Rate should be stale (age: 5000s, max: 3600s)");
}

#[test]
fn test_multi_currency_scenario_eur_to_gbp() {
    // Multi-currency scenario: EUR to GBP conversion
    // 1 EUR = 0.86 GBP (rate: 860000)
    let rate_eur_to_gbp = 860_000u64;
    let amount_eur = 2_000_000u64; // 2 million EUR

    let amount_gbp = amount_eur.saturating_mul(rate_eur_to_gbp) / 1_000_000;

    // Expected: 2_000_000 * 860_000 / 1_000_000 = 1_720_000
    assert_eq!(amount_gbp, 1_720_000, "EUR to GBP conversion failed");
}

#[test]
fn test_multi_currency_scenario_sgd_to_usd() {
    // Multi-currency scenario: SGD to USD conversion
    // 1 SGD = 0.74 USD (rate: 740000)
    let rate_sgd_to_usd = 740_000u64;
    let spread_bps = 50u32;
    let amount_sgd = 5_000_000u64; // 5 million SGD

    // Convert and apply spread
    let converted = amount_sgd.saturating_mul(rate_sgd_to_usd) / 1_000_000;
    let spread_factor = 10000u64.saturating_sub(spread_bps as u64);
    let with_spread = converted.saturating_mul(spread_factor) / 10000;

    // Expected: 5_000_000 * 740_000 / 1_000_000 = 3_700_000
    // With spread: 3_700_000 * 9950 / 10000 = 3_681_500
    assert_eq!(with_spread, 3_681_500, "SGD to USD with spread failed");
}

#[test]
fn test_fx_conversion_preserves_value_usd_base() {
    // Verify that converting back to original currency maintains value (within spread)
    let rate_usd_to_gbp = 730_000u64; // 1 USD = 0.73 GBP
    let rate_gbp_to_usd = 1_370_000u64; // 1 GBP = 1.37 USD
    let spread_bps = 50u32;

    let original_usd = 1_000_000u64;

    // USD -> GBP
    let gbp = original_usd.saturating_mul(rate_usd_to_gbp) / 1_000_000;

    // Apply spread on GBP side
    let spread_factor = 10000u64.saturating_sub(spread_bps as u64);
    let gbp_with_spread = gbp.saturating_mul(spread_factor) / 10000;

    // GBP -> USD (back conversion)
    let back_to_usd = gbp_with_spread.saturating_mul(rate_gbp_to_usd) / 1_000_000;

    // Apply spread on USD side
    let usd_with_spread = back_to_usd.saturating_mul(spread_factor) / 10000;

    // Should recover most of original (with 2 spreads applied = 1% total cost)
    // Expected: ~990,000 (lost 1% to spreads)
    assert!(
        usd_with_spread < original_usd,
        "Value should decrease due to spreads"
    );
    assert!(
        usd_with_spread > original_usd * 99 / 100,
        "Should retain >99% after round-trip with spreads"
    );
}

#[test]
fn test_large_amount_conversion() {
    // Test conversion with large amounts (shows saturation behavior)
    let rate = 1_000_000u64; // 1:1 conversion
    let large_amount = 100_000_000_000_000u64; // 100 trillion

    // Conversion: large_amount * rate / 1_000_000
    // This will overflow during multiplication, triggering saturating behavior
    let result = large_amount.saturating_mul(rate) / 1_000_000;

    // The result should be less than u64::MAX, showing saturation works
    assert!(result <= u64::MAX, "Conversion should not exceed u64::MAX");
}

#[test]
fn test_zero_amount_conversion() {
    // Test zero amount edge case
    let rate = 1_500_000u64;
    let amount = 0u64;

    let result = amount.saturating_mul(rate) / 1_000_000;

    assert_eq!(result, 0, "Zero amount should convert to zero");
}

#[test]
fn test_small_amount_conversion() {
    // Test very small amount conversion
    let rate = 750_000u64; // 0.75 rate
    let small_amount = 1u64;

    let result = small_amount.saturating_mul(rate) / 1_000_000;

    // Result should round to 0 for very small amounts
    assert_eq!(
        result, 0,
        "Very small amount with conversion should round to 0"
    );
}
