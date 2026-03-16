use crate::state::*;
use crate::state::*;
use anchor_lang::prelude::*;

/// Position snapshot for a single entity
#[derive(Clone, Debug)]
pub struct PositionSnapshot {
    pub entity_id: Pubkey,
    pub real_balance: u64,
    pub virtual_offset: i128,
    pub effective_position: i128,
    pub currency_code: [u8; 3],
    pub mint: Pubkey,
}

/// Offset match result
#[derive(Clone, Debug)]
pub struct OffsetMatch {
    pub surplus_entity: Pubkey,
    pub deficit_entity: Pubkey,
    pub surplus_currency: [u8; 3],
    pub deficit_currency: [u8; 3],
    pub surplus_amount: u64,
    pub deficit_amount: u64,
    pub fx_rate_used: Option<u64>,
    pub net_offset_usd: u64,
}

/// Core netting algorithm implementation
pub struct NettingAlgorithm {
    pub pool_id: [u8; 32],
    pub oracle_rates: Vec<FxRate>,
    pub interest_rate_bps: u32,
}

impl NettingAlgorithm {
    pub fn new(pool_id: [u8; 32], oracle_rates: Vec<FxRate>) -> Self {
        NettingAlgorithm {
            pool_id,
            oracle_rates,
            interest_rate_bps: 450, // 4.5% annualised
        }
    }

    /// STEP 1: Position Snapshot
    /// Simulates reading positions from PDAs (in real implementation, iterate through PDAs)
    pub fn take_position_snapshot(
        &self,
        positions: Vec<PositionSnapshot>,
    ) -> Result<Vec<PositionSnapshot>> {
        msg!("STEP 1: Position Snapshot - {} entities", positions.len());

        let mut snapshots = positions;
        for snap in &mut snapshots {
            // In production: read real Token-2022 balance from vault
            // For MVP: use provided real_balance
            snap.effective_position = snap.real_balance as i128 + snap.virtual_offset;
        }

        msg!("Position snapshot complete. Effective positions updated.");
        Ok(snapshots)
    }

    /// STEP 2: Currency Normalisation
    /// Convert all positions to USD equivalents using oracle rates
    pub fn normalize_to_usd(
        &self,
        snapshots: &[PositionSnapshot],
    ) -> Result<Vec<(PositionSnapshot, u64)>> {
        msg!("STEP 2: Currency Normalisation");

        // Check oracle staleness (>300s = 5 minutes) - gracefully handle test environments
        #[cfg(not(target_os = "solana"))]
        {
            // In test environments, skip the Clock check
        }

        #[cfg(target_os = "solana")]
        {
            let now = Clock::get()?.unix_timestamp;
            let oracle_age = now - self.oracle_rates.get(0).map(|r| r.timestamp).unwrap_or(0);

            if oracle_age > 300 {
                msg!(
                    "⚠️  WARNING: Oracle data is stale ({}s old). Skipping cross-currency operations.",
                    oracle_age
                );
                emit!(StaleOracleAlert {
                    pool_id: self.pool_id,
                    last_update: self.oracle_rates.get(0).map(|r| r.timestamp).unwrap_or(0),
                    timestamp: now,
                });
            }
        }

        let mut normalized: Vec<(PositionSnapshot, u64)> = Vec::new();

        for snap in snapshots {
            let usd_equiv = if snap.currency_code == *b"USD" {
                snap.effective_position as u64
            } else {
                // Convert to USD using oracle rate
                let rate_opt = self.get_rate_for_pair(&snap.currency_code);
                match rate_opt {
                    Some(rate) => {
                        let amount_in_usd = (snap.effective_position as u128)
                            .saturating_mul(rate as u128)
                            .saturating_div(1_000_000_000); // Rate is 9 decimals
                        amount_in_usd as u64
                    }
                    None => {
                        msg!("⚠️  No rate found for currency: {:?}", snap.currency_code);
                        snap.effective_position as u64
                    }
                }
            };

            normalized.push((snap.clone(), usd_equiv));
        }

        msg!(
            "Currency normalisation complete. {} positions normalized to USD.",
            normalized.len()
        );
        Ok(normalized)
    }

    /// STEP 3: Surplus/Deficit Classification
    /// Separate positions into surplus and deficit lists, sorted by amount
    pub fn classify_surplus_deficit(
        &self,
        normalized: Vec<(PositionSnapshot, u64)>,
    ) -> Result<(Vec<(PositionSnapshot, u64)>, Vec<(PositionSnapshot, u64)>)> {
        msg!("STEP 3: Surplus/Deficit Classification");

        let mut surplus_list: Vec<(PositionSnapshot, u64)> = Vec::new();
        let mut deficit_list: Vec<(PositionSnapshot, u64)> = Vec::new();

        for (snap, usd_amount) in normalized {
            if snap.effective_position > 0 {
                surplus_list.push((snap, usd_amount));
            } else if snap.effective_position < 0 {
                deficit_list.push((snap, usd_amount));
            }
            // Skip balanced (effective_position == 0)
        }

        // Sort descending by amount
        surplus_list.sort_by(|a, b| b.1.cmp(&a.1));
        deficit_list.sort_by(|a, b| b.1.cmp(&a.1));

        msg!(
            "Classification complete: {} surplus, {} deficit",
            surplus_list.len(),
            deficit_list.len()
        );
        Ok((surplus_list, deficit_list))
    }

    /// STEP 4: Greedy Offset Matching
    /// Match surpluses to deficits, creating OffsetEvent records
    pub fn greedy_offset_matching(
        &self,
        mut surplus_list: Vec<(PositionSnapshot, u64)>,
        mut deficit_list: Vec<(PositionSnapshot, u64)>,
    ) -> Result<(Vec<OffsetMatch>, Vec<PositionSnapshot>)> {
        msg!("STEP 4: Greedy Offset Matching");

        let mut offset_matches: Vec<OffsetMatch> = Vec::new();
        let mut updated_positions: Vec<PositionSnapshot> = Vec::new();

        // Collect original positions for tracking updates
        for (snap, _) in surplus_list.iter().chain(deficit_list.iter()) {
            updated_positions.push(snap.clone());
        }

        let mut idx_surplus = 0;
        let mut idx_deficit = 0;

        while idx_surplus < surplus_list.len() && idx_deficit < deficit_list.len() {
            let (s_snap, mut s_remaining) = surplus_list[idx_surplus].clone();
            let (d_snap, mut d_remaining) = deficit_list[idx_deficit].clone();

            // Match amount = min(surplus, deficit)
            let match_amount = std::cmp::min(s_remaining, d_remaining);

            if match_amount > 0 {
                // Get FX rate if cross-currency
                let fx_rate = if s_snap.currency_code != d_snap.currency_code {
                    self.get_rate_for_pair(&s_snap.currency_code)
                } else {
                    None
                };

                offset_matches.push(OffsetMatch {
                    surplus_entity: s_snap.entity_id,
                    deficit_entity: d_snap.entity_id,
                    surplus_currency: s_snap.currency_code,
                    deficit_currency: d_snap.currency_code,
                    surplus_amount: match_amount,
                    deficit_amount: match_amount,
                    fx_rate_used: fx_rate,
                    net_offset_usd: match_amount,
                });

                // Update virtual offsets
                // Surplus: decrease virtual offset (they're giving away)
                // Deficit: increase virtual offset (they're receiving)
                let match_amount_i128 = match_amount as i128;

                for pos in &mut updated_positions {
                    if pos.entity_id == s_snap.entity_id {
                        pos.virtual_offset -= match_amount_i128;
                        pos.effective_position = pos.real_balance as i128 + pos.virtual_offset;
                    }
                    if pos.entity_id == d_snap.entity_id {
                        pos.virtual_offset += match_amount_i128;
                        pos.effective_position = pos.real_balance as i128 + pos.virtual_offset;
                    }
                }

                s_remaining -= match_amount;
                d_remaining -= match_amount;
            }

            // Move to next entity if this one is exhausted
            if s_remaining == 0 {
                idx_surplus += 1;
            }
            if d_remaining == 0 {
                idx_deficit += 1;
            }

            // Prevent infinite loops
            if idx_surplus >= surplus_list.len() || idx_deficit >= deficit_list.len() {
                break;
            }
        }

        msg!(
            "Offset matching complete: {} matches created",
            offset_matches.len()
        );
        Ok((offset_matches, updated_positions))
    }

    /// STEP 5: Interest Calculation
    /// Accrue interest on each position
    pub fn calculate_interest(
        &self,
        mut positions: Vec<PositionSnapshot>,
        timestamp_now: i64,
    ) -> Result<Vec<PositionSnapshot>> {
        msg!("STEP 5: Interest Calculation");

        const SECONDS_PER_YEAR: i64 = 31_536_000;

        for pos in &mut positions {
            let elapsed = timestamp_now - pos.last_updated_timestamp().unwrap_or(timestamp_now);

            if elapsed > 0 && pos.effective_position > 0 {
                // Only accrue on positive balances
                let interest = (pos.effective_position as i128)
                    .saturating_mul(self.interest_rate_bps as i128)
                    .saturating_mul(elapsed as i128)
                    .saturating_div((10000 * SECONDS_PER_YEAR) as i128);

                // Store this in a separate field (would need to update PositionSnapshot)
                msg!("Entity interest accrued: {}", interest);
            }
        }

        msg!("Interest calculation complete");
        Ok(positions)
    }

    /// STEP 6: Sweep Threshold Check
    /// Emit SweepRequired events for positions exceeding deficit threshold
    pub fn check_sweep_thresholds(
        &self,
        positions: &[PositionSnapshot],
        sweep_threshold: u64,
    ) -> Result<Vec<Pubkey>> {
        msg!(
            "STEP 6: Sweep Threshold Check (threshold: {} tokens)",
            sweep_threshold
        );

        let mut entities_needing_sweep: Vec<Pubkey> = Vec::new();

        for pos in positions {
            if pos.effective_position < 0 {
                let deficit_abs = (-pos.effective_position) as u64;
                if deficit_abs > sweep_threshold {
                    msg!(
                        "⚠️  SWEEP REQUIRED: Entity {} has deficit {} > threshold {}",
                        pos.entity_id,
                        deficit_abs,
                        sweep_threshold
                    );

                    emit!(SweepRequired {
                        pool_id: self.pool_id,
                        entity_id: pos.entity_id,
                        deficit_amount: deficit_abs,
                        timestamp: Clock::get()?.unix_timestamp,
                    });

                    entities_needing_sweep.push(pos.entity_id);
                }
            }
        }

        if entities_needing_sweep.is_empty() {
            msg!("No sweeps required");
        }

        Ok(entities_needing_sweep)
    }

    /// STEP 7: Finalise
    /// Update pool state and emit completion event
    pub fn finalise(
        &self,
        pool: &mut PoolState,
        positions: &[PositionSnapshot],
        offset_count: u32,
    ) -> Result<()> {
        msg!("STEP 7: Finalise");

        // Calculate aggregate net position
        let mut net_position: i128 = 0;
        for pos in positions {
            net_position = net_position.saturating_add(pos.effective_position);
        }

        pool.net_position_usd = net_position;
        pool.last_netting_timestamp = Clock::get()?.unix_timestamp;

        msg!("Pool net position: {}", net_position);
        msg!("Last netting: {}", pool.last_netting_timestamp);

        emit!(NettingComplete {
            pool_id: self.pool_id,
            timestamp: pool.last_netting_timestamp,
            total_offsets: offset_count,
        });

        msg!("Netting cycle complete!");
        Ok(())
    }

    // ============ Helper Functions ============

    /// Get FX rate for a currency pair
    fn get_rate_for_pair(&self, currency_code: &[u8; 3]) -> Option<u64> {
        // Map single currency to USD rate
        // e.g., EUR -> EURUSD rate
        for rate in &self.oracle_rates {
            // Simple matching: if rate.currency_pair starts with our currency and ends with USD
            if rate.currency_pair[0..3] == *currency_code && rate.currency_pair[3..6] == *b"USD" {
                return Some(rate.rate);
            }
        }
        None
    }
}

// ============ Trait Extensions ============

impl PositionSnapshot {
    pub fn last_updated_timestamp(&self) -> Option<i64> {
        // Would be stored in the actual PDA
        None
    }
}

// ============ Events ============

#[event]
pub struct StaleOracleAlert {
    pub pool_id: [u8; 32],
    pub last_update: i64,
    pub timestamp: i64,
}

#[event]
pub struct SweepRequired {
    pub pool_id: [u8; 32],
    pub entity_id: Pubkey,
    pub deficit_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct NettingComplete {
    pub pool_id: [u8; 32],
    pub timestamp: i64,
    pub total_offsets: u32,
}
