use crate::netting_algorithm::{NettingAlgorithm, PositionSnapshot};
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RunNettingCycle<'info> {
    pub pool_admin: Signer<'info>,

    #[account(mut)]
    pub pool_state: Account<'info, PoolState>,
}

pub fn handler(ctx: Context<RunNettingCycle>) -> Result<()> {
    let pool = &mut ctx.accounts.pool_state;
    let now = Clock::get()?.unix_timestamp;

    msg!("═══════════════════════════════════════════════════════════");
    msg!("🔄 STARTING NETTING CYCLE - Pool: {}", pool.pool_id[0]);
    msg!("═══════════════════════════════════════════════════════════");

    // ===== DUMMY DATA FOR MVP =====
    // In production, iterate through actual EntityPosition PDAs
    let dummy_positions = create_dummy_positions();

    msg!("📊 Loaded {} entities", dummy_positions.len());

    // Initialize netting algorithm
    let oracle_rates = vec![
        FxRate {
            currency_pair: *b"EURUSD",
            rate: 1_085_000_000, // 1.085 USD per EUR (9 decimals)
            timestamp: now,
        },
        FxRate {
            currency_pair: *b"GBPUSD",
            rate: 1_265_000_000, // 1.265 USD per GBP
            timestamp: now,
        },
        FxRate {
            currency_pair: *b"CHFUSD",
            rate: 1_020_000_000, // 1.020 USD per CHF
            timestamp: now,
        },
        FxRate {
            currency_pair: *b"AEDUSD",
            rate: 272_000_000, // 0.272 USD per AED
            timestamp: now,
        },
    ];

    let mut algorithm = NettingAlgorithm::new(pool.pool_id, oracle_rates);

    // ===== 7-STEP NETTING ALGORITHM =====

    // STEP 1: Position Snapshot
    let mut positions = algorithm.take_position_snapshot(dummy_positions)?;
    msg!(
        "✅ STEP 1 complete: {} positions snapshotted",
        positions.len()
    );

    // STEP 2: Currency Normalisation
    let normalized = algorithm.normalize_to_usd(&positions)?;
    msg!(
        "✅ STEP 2 complete: {} positions normalized to USD",
        normalized.len()
    );

    // STEP 3: Surplus/Deficit Classification
    let (surplus_list, deficit_list) = algorithm.classify_surplus_deficit(normalized)?;
    msg!(
        "✅ STEP 3 complete: {} surplus, {} deficit",
        surplus_list.len(),
        deficit_list.len()
    );

    // STEP 4: Greedy Offset Matching
    let (offset_matches, updated_positions) =
        algorithm.greedy_offset_matching(surplus_list, deficit_list)?;
    msg!(
        "✅ STEP 4 complete: {} offset matches created",
        offset_matches.len()
    );

    // Emit OffsetEvent for each match
    for (idx, m) in offset_matches.iter().enumerate() {
        emit!(OffsetEventEmitted {
            index: idx as u32,
            surplus_entity: m.surplus_entity,
            deficit_entity: m.deficit_entity,
            surplus_amount: m.surplus_amount,
            deficit_amount: m.deficit_amount,
            fx_rate_used: m.fx_rate_used,
        });
    }

    positions = updated_positions;

    // STEP 5: Interest Calculation
    let positions = algorithm.calculate_interest(positions, now)?;
    msg!("✅ STEP 5 complete: interest calculated");

    // STEP 6: Sweep Threshold Check
    let sweep_entities = algorithm.check_sweep_thresholds(&positions, pool.sweep_threshold)?;
    msg!(
        "✅ STEP 6 complete: {} entities flagged for sweep",
        sweep_entities.len()
    );

    // STEP 7: Finalise
    algorithm.finalise(pool, &positions, offset_matches.len() as u32)?;
    msg!("✅ STEP 7 complete: pool state updated");

    msg!("═══════════════════════════════════════════════════════════");
    msg!("✨ NETTING CYCLE COMPLETE");
    msg!("═══════════════════════════════════════════════════════════");
    msg!("📈 Net Position: ${}", pool.net_position_usd);
    msg!("🎯 Total Offsets: {}", offset_matches.len());
    msg!("🚨 Sweeps Required: {}", sweep_entities.len());

    Ok(())
}

// ============ Dummy Data for MVP Testing ============

fn create_dummy_positions() -> Vec<PositionSnapshot> {
    vec![
        // Singapore: +800,000 USDC (surplus)
        PositionSnapshot {
            entity_id: Pubkey::new_unique(),
            real_balance: 800_000_000_000, // 800k tokens with 6 decimals
            virtual_offset: 0,
            effective_position: 800_000_000_000 as i128,
            currency_code: *b"USD",
            mint: Pubkey::new_unique(),
        },
        // UAE: -300,000 USDC (deficit)
        PositionSnapshot {
            entity_id: Pubkey::new_unique(),
            real_balance: 0,
            virtual_offset: -300_000_000_000i128,
            effective_position: -300_000_000_000i128,
            currency_code: *b"USD",
            mint: Pubkey::new_unique(),
        },
        // UK: +200,000 GBPC (surplus)
        PositionSnapshot {
            entity_id: Pubkey::new_unique(),
            real_balance: 200_000_000_000,
            virtual_offset: 0,
            effective_position: 200_000_000_000 as i128,
            currency_code: *b"GBP",
            mint: Pubkey::new_unique(),
        },
        // Germany: -400,000 EURC (deficit)
        PositionSnapshot {
            entity_id: Pubkey::new_unique(),
            real_balance: 0,
            virtual_offset: -400_000_000_000i128,
            effective_position: -400_000_000_000i128,
            currency_code: *b"EUR",
            mint: Pubkey::new_unique(),
        },
    ]
}

// ============ Events ============

#[event]
pub struct OffsetEventEmitted {
    pub index: u32,
    pub surplus_entity: Pubkey,
    pub deficit_entity: Pubkey,
    pub surplus_amount: u64,
    pub deficit_amount: u64,
    pub fx_rate_used: Option<u64>,
}
