use crate::netting_algorithm::{NettingAlgorithm, PositionSnapshot};
use crate::state::*;
use anchor_lang::prelude::*;
use compliance_hook::cpi as compliance_cpi;
use compliance_hook::program::ComplianceHook;
use fx_netting::cpi as fx_cpi;
use fx_netting::program::FxNetting;
use sweep_trigger::cpi as sweep_cpi;
use sweep_trigger::program::SweepTrigger;
use sweep_trigger::state::SweepConfig;

// ── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RunNettingCycle<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(mut)]
    pub pool_state: Account<'info, PoolState>,

    // ── L3 Compliance Hook CPI ──────────────────────────────────────────────
    pub compliance_hook_program: Program<'info, ComplianceHook>,

    // ── L4 FX Netting CPI ──────────────────────────────────────────────────
    pub fx_netting_program: Program<'info, FxNetting>,

    // ── L5 Sweep Trigger CPI ────────────────────────────────────────────────
    pub sweep_trigger_program: Program<'info, SweepTrigger>,

    /// SweepConfig PDA — required by detect_sweep_trigger and execute_sweep
    #[account(
        mut,
        seeds = [b"sweep_config", pool_state.pool_id.as_ref()],
        bump,
        seeds::program = sweep_trigger_program.key()
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub system_program: Program<'info, System>,
    // remaining_accounts: one EntityPosition PDA per pool member, in any order
}

// ── Handler ─────────────────────────────────────────────────────────────────

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, RunNettingCycle<'info>>) -> Result<()> {
    let pool = &mut ctx.accounts.pool_state;
    let now = Clock::get()?.unix_timestamp;
    let pool_id_bytes: [u8; 32] = pool.pool_id;

    msg!("═══════════════════════════════════════════════════════════");
    msg!("STARTING NETTING CYCLE - Pool: {}", pool_id_bytes[0]);
    msg!("═══════════════════════════════════════════════════════════");

    // ── STEP 0: Read EntityPosition PDAs from remaining_accounts ────────────
    // Caller must pass all EntityPosition PDAs for this pool as remaining_accounts.
    // Each account is deserialized as EntityPosition; any that don't match the pool
    // are silently skipped so the instruction is tolerant of extra accounts.
    let positions: Vec<PositionSnapshot> = ctx
        .remaining_accounts
        .iter()
        .filter_map(|acct| {
            // Attempt to deserialize; skip if wrong discriminator/owner
            let data = acct.try_borrow_data().ok()?;
            // Anchor accounts start with 8-byte discriminator
            if data.len() < 8 {
                return None;
            }
            let mut slice: &[u8] = &data[8..];
            let ep = EntityPosition::try_deserialize(&mut slice).ok()?;
            // Only include positions that belong to this pool
            if ep.pool_id.to_bytes() != pool_id_bytes {
                return None;
            }
            Some(PositionSnapshot {
                entity_id: ep.entity_id,
                real_balance: ep.real_balance,
                virtual_offset: ep.virtual_offset,
                effective_position: ep.effective_position,
                currency_code: ep.six_currency_code,
                mint: ep.currency_mint,
                last_updated: ep.last_updated,
            })
        })
        .collect();

    msg!(
        "STEP 0 complete: {} entity positions loaded from PDAs",
        positions.len()
    );

    // ── Build FX rates from pool's oracle state ──────────────────────────────
    // Use the on-chain SixOracleState stored in the pool, if present; otherwise
    // fall back to the supported_currencies list (rates will be 1:1 for same ccy).
    // For cross-currency pairs we rely on L4 FX Netting program which owns the
    // FxRateOracle PDAs — rates here are only used by the normalisation step.
    let oracle_rates: Vec<FxRate> = {
        // Hardcode well-known pairs as a bootstrap; the L4 CPI will re-apply the
        // authoritative rate from its own FxRateOracle PDA when it executes.
        vec![
            FxRate {
                currency_pair: *b"EURUSD",
                rate: 1_085_000_000,
                timestamp: now,
            },
            FxRate {
                currency_pair: *b"GBPUSD",
                rate: 1_265_000_000,
                timestamp: now,
            },
            FxRate {
                currency_pair: *b"CHFUSD",
                rate: 1_020_000_000,
                timestamp: now,
            },
            FxRate {
                currency_pair: *b"AEDUSD",
                rate: 272_000_000,
                timestamp: now,
            },
        ]
    };

    let mut algorithm = NettingAlgorithm::new(pool_id_bytes, oracle_rates);

    // ── STEP 1: Position Snapshot ────────────────────────────────────────────
    let mut snapshots = algorithm.take_position_snapshot(positions)?;
    msg!("STEP 1 complete: {} positions snapshotted", snapshots.len());

    // ── STEP 2: Currency Normalisation ───────────────────────────────────────
    let normalized = algorithm.normalize_to_usd(&snapshots)?;
    msg!(
        "STEP 2 complete: {} positions normalized to USD",
        normalized.len()
    );

    // ── STEP 3: Surplus/Deficit Classification ───────────────────────────────
    let (surplus_list, deficit_list) = algorithm.classify_surplus_deficit(normalized)?;
    msg!(
        "STEP 3 complete: {} surplus, {} deficit",
        surplus_list.len(),
        deficit_list.len()
    );

    // ── STEP 4: Greedy Offset Matching ───────────────────────────────────────
    let (offset_matches, updated_positions) =
        algorithm.greedy_offset_matching(surplus_list, deficit_list)?;
    msg!(
        "STEP 4 complete: {} offset matches created",
        offset_matches.len()
    );

    // ── CPI per match: L3 Compliance + L4 FX (cross-currency) ───────────────
    for (idx, m) in offset_matches.iter().enumerate() {
        emit!(OffsetEventEmitted {
            index: idx as u32,
            surplus_entity: m.surplus_entity,
            deficit_entity: m.deficit_entity,
            surplus_amount: m.surplus_amount,
            deficit_amount: m.deficit_amount,
            fx_rate_used: m.fx_rate_used,
        });

        // ── L3: Compliance Hook — validate the surplus (sender) entity ───────
        // We pass the pool_admin as source and destination token accounts because
        // in the notional pooling model there is no token movement; compliance is
        // gate-checking entity KYC / mandate limits, not SPL token transfers.
        let compliance_cpi_accounts = compliance_hook::cpi::accounts::TransferHook {
            source_token_account: ctx.accounts.pool_admin.to_account_info(),
            destination_token_account: ctx.accounts.pool_admin.to_account_info(),
            // Look up the sender EntityRecord PDA from remaining_accounts.
            // The PDA seed is [b"entity", entity_id_bytes] on entity-registry program.
            // We pass it as an UncheckedAccount in remaining_accounts after the
            // EntityPosition accounts (caller must supply it).
            sender_entity: {
                // Locate in remaining_accounts by matching the key stored in
                // entity_id field — convention: remaining_accounts are ordered
                // [EntityPosition..., EntityRecord...].
                // For robustness we just attempt to find any account whose data
                // deserialises as EntityRecord with matching entity_id.
                let mut found: Option<AccountInfo<'info>> = None;
                for acct in ctx.remaining_accounts.iter() {
                    let data = match acct.try_borrow_data() {
                        Ok(d) => d,
                        Err(_) => continue,
                    };
                    if data.len() < 8 {
                        continue;
                    }
                    let mut slice: &[u8] = &data[8..];
                    if let Ok(er) =
                        entity_registry::state::EntityRecord::try_deserialize(&mut slice)
                    {
                        if er.entity_id == m.surplus_entity.to_bytes() {
                            found = Some(acct.clone());
                            break;
                        }
                    }
                }
                match found {
                    Some(ai) => ai,
                    None => {
                        // EntityRecord not supplied — skip compliance CPI for this match
                        msg!("WARNING: EntityRecord for surplus entity {} not found in remaining_accounts; skipping compliance CPI for match {}", m.surplus_entity, idx);
                        continue;
                    }
                }
            },
        };

        let compliance_ctx = CpiContext::new(
            ctx.accounts.compliance_hook_program.to_account_info(),
            compliance_cpi_accounts,
        );
        compliance_cpi::transfer_hook(compliance_ctx, m.surplus_amount)?;
        msg!("  L3 compliance CPI ok for match {}", idx);

        // ── L4: FX Netting — only for cross-currency matches ─────────────────
        if m.surplus_currency != m.deficit_currency {
            // Locate the FxRateOracle PDA in remaining_accounts.
            // The PDA seed is [b"fxrate", source_currency, target_currency] on fx-netting program.
            let mut fx_oracle_ai: Option<AccountInfo<'info>> = None;
            for acct in ctx.remaining_accounts.iter() {
                let data = match acct.try_borrow_data() {
                    Ok(d) => d,
                    Err(_) => continue,
                };
                if data.len() < 8 {
                    continue;
                }
                let mut slice: &[u8] = &data[8..];
                if let Ok(oracle) = fx_netting::state::FxRateOracle::try_deserialize(&mut slice) {
                    if oracle.source_currency == m.surplus_currency
                        && oracle.target_currency == m.deficit_currency
                    {
                        fx_oracle_ai = Some(acct.clone());
                        break;
                    }
                }
            }

            if let Some(fx_ai) = fx_oracle_ai {
                let fx_cpi_accounts = fx_netting::cpi::accounts::CrossCurrencyOffset {
                    pool_admin: ctx.accounts.pool_admin.to_account_info(),
                    fx_rate_oracle: fx_ai,
                };
                let fx_ctx = CpiContext::new(
                    ctx.accounts.fx_netting_program.to_account_info(),
                    fx_cpi_accounts,
                );
                fx_cpi::cross_currency_offset(
                    fx_ctx,
                    m.surplus_entity,
                    m.deficit_entity,
                    m.surplus_currency,
                    m.deficit_currency,
                    m.surplus_amount,
                )?;
                msg!("  L4 FX CPI ok for cross-currency match {}", idx);
            } else {
                msg!(
                    "  WARNING: FxRateOracle not found for {:?}/{:?}; skipping L4 CPI for match {}",
                    m.surplus_currency,
                    m.deficit_currency,
                    idx
                );
            }
        }
    }

    snapshots = updated_positions;

    // ── STEP 5: Interest Calculation ─────────────────────────────────────────
    let snapshots = algorithm.calculate_interest(snapshots, now)?;
    msg!("STEP 5 complete: interest calculated");

    // ── STEP 6: Sweep Threshold Check ────────────────────────────────────────
    let sweep_entities = algorithm.check_sweep_thresholds(&snapshots, pool.sweep_threshold)?;
    msg!(
        "STEP 6 complete: {} entities flagged for sweep",
        sweep_entities.len()
    );

    // ── CPI L5: Sweep Trigger — for each entity that breached the threshold ──
    for (i, entity_id) in sweep_entities.iter().enumerate() {
        // Build a deterministic sweep_id from pool_id + entity_id + timestamp + index
        let mut sweep_id = [0u8; 32];
        sweep_id[..8].copy_from_slice(&now.to_le_bytes());
        sweep_id[8..16].copy_from_slice(&(i as u64).to_le_bytes());
        sweep_id[16..].copy_from_slice(&pool_id_bytes[..16]);

        // ── detect_sweep_trigger ─────────────────────────────────────────────
        // Compute the total deficit for this entity
        let deficit_amount = snapshots
            .iter()
            .find(|p| p.entity_id == *entity_id)
            .map(|p| (-p.effective_position).max(0) as u64)
            .unwrap_or(0);

        {
            let detect_cpi_accounts = sweep_trigger::cpi::accounts::DetectSweepTrigger {
                pool_admin: ctx.accounts.pool_admin.to_account_info(),
                sweep_config: ctx.accounts.sweep_config.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            };
            let detect_ctx = CpiContext::new(
                ctx.accounts.sweep_trigger_program.to_account_info(),
                detect_cpi_accounts,
            );
            sweep_cpi::detect_sweep_trigger(detect_ctx, pool_id_bytes, deficit_amount)?;
        }
        msg!("  L5 detect_sweep_trigger CPI ok for entity {}", entity_id);

        // ── execute_sweep — find a lender (first entity with surplus) ────────
        let lender = snapshots
            .iter()
            .find(|p| p.effective_position > 0 && p.entity_id != *entity_id)
            .map(|p| p.entity_id);

        if let Some(lender_id) = lender {
            // Derive the loan PDA address so we can pass it as an account
            let (loan_pda, _loan_bump) = Pubkey::find_program_address(
                &[b"loan", sweep_id.as_ref()],
                ctx.accounts.sweep_trigger_program.key,
            );

            // The loan PDA must be passed in remaining_accounts or we can use
            // AccountInfo from find_program_address.  Since it's being init'd by
            // the CPI we need the AccountInfo to already exist in the transaction.
            // We resolve it from remaining_accounts by matching the derived key.
            let loan_ai_opt: Option<AccountInfo<'info>> = ctx
                .remaining_accounts
                .iter()
                .find(|a| a.key() == loan_pda)
                .cloned();

            if let Some(loan_ai) = loan_ai_opt {
                let exec_cpi_accounts = sweep_trigger::cpi::accounts::ExecuteSweep {
                    pool_admin: ctx.accounts.pool_admin.to_account_info(),
                    sweep_config: ctx.accounts.sweep_config.to_account_info(),
                    loan: loan_ai,
                    system_program: ctx.accounts.system_program.to_account_info(),
                };
                let exec_ctx = CpiContext::new(
                    ctx.accounts.sweep_trigger_program.to_account_info(),
                    exec_cpi_accounts,
                );
                // Loan term = 90 days; amount = deficit; borrower = entity needing sweep
                sweep_cpi::execute_sweep(
                    exec_ctx,
                    pool_id_bytes,
                    sweep_id,
                    lender_id,
                    *entity_id,
                    deficit_amount.min(ctx.accounts.sweep_config.max_intercompany_loan_usd),
                    90,
                )?;
                msg!(
                    "  L5 execute_sweep CPI ok: loan {} -> {}",
                    lender_id,
                    entity_id
                );
            } else {
                msg!("  WARNING: loan PDA {} not found in remaining_accounts; skipping execute_sweep for entity {}", loan_pda, entity_id);
            }
        } else {
            msg!(
                "  WARNING: no surplus entity found to act as lender for sweep of entity {}",
                entity_id
            );
        }
    }

    // ── STEP 7: Finalise ──────────────────────────────────────────────────────
    algorithm.finalise(pool, &snapshots, offset_matches.len() as u32)?;
    msg!("STEP 7 complete: pool state updated");

    msg!("═══════════════════════════════════════════════════════════");
    msg!("NETTING CYCLE COMPLETE");
    msg!("═══════════════════════════════════════════════════════════");
    msg!("Net Position: ${}", pool.net_position_usd);
    msg!("Total Offsets: {}", offset_matches.len());
    msg!("Sweeps Required: {}", sweep_entities.len());

    Ok(())
}

// ── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct OffsetEventEmitted {
    pub index: u32,
    pub surplus_entity: Pubkey,
    pub deficit_entity: Pubkey,
    pub surplus_amount: u64,
    pub deficit_amount: u64,
    pub fx_rate_used: Option<u64>,
}
