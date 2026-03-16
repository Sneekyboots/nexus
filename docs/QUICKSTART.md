# NEXUS Protocol — Quick Start Guide

## 🚀 Current Status

**Phase 0: Complete ✅**
- All 5 Anchor programs created and compiling
- ~1,500 lines of Rust code
- Ready to implement Phase 1 (Notional Pooling Engine)

---

## 📁 Project Organization

### Smart Contracts (5 Programs)

| Layer | Program | Location | Status | Key File |
|-------|---------|----------|--------|----------|
| 1 | Entity Registry | `programs/entity-registry/` | ✅ Ready | `src/instructions/register_entity.rs` |
| 2 | Pooling Engine | `programs/pooling-engine/` | 🔨 Next | `src/instructions/run_netting_cycle.rs` |
| 3 | Compliance Hook | `programs/compliance-hook/` | 🔜 After 2 | `src/instructions/transfer_hook.rs` |
| 4 | FX Netting | `programs/fx-netting/` | 🔜 Later | `src/instructions/cross_currency_offset.rs` |
| 5 | Sweep Trigger | `programs/sweep-trigger/` | 🔜 Later | `src/instructions/execute_sweep.rs` |

### Frontend (Not Started)
```
app/
├── layout.tsx                 # Global nav
├── pool/page.tsx              # Main hero screen (EntityCards)
├── activity/page.tsx          # Netting activity feed
├── compliance/page.tsx        # Compliance queue
├── fx/page.tsx                # FX analytics
├── loans/page.tsx             # Loan register
├── audit/page.tsx             # PDF export
└── lib/anchorClient.ts        # Anchor wrapper
```

### Off-Chain Services (Not Started)
```
services/
├── six-oracle/                # SIX BFI rate polling
├── amina-mock/                # Mock webhook server
└── event-indexer/             # Solana event → PostgreSQL
```

---

## 🛠️ Build & Test

### Build all programs:
```bash
cd /home/sriranjini/nexus
/home/sriranjini/.cargo/bin/cargo build --lib --all
```

Expected output:
```
   Finished `dev` profile [unoptimized + debuginfo] target(s) in 57.89s
```

### View all Rust files:
```bash
find programs -name "*.rs" | sort
```

### Check a specific instruction:
```bash
cat programs/entity-registry/src/instructions/register_entity.rs
```

---

## 📚 Key Files to Know

### Shared Utilities
- **`SEEDS.md`** — Complete PDA seed reference (use this for address derivation!)
- **`PHASE_0_COMPLETE.md`** — Detailed completion summary
- **`Anchor.toml`** — Program IDs and RPC configuration
- **`Cargo.toml`** — Workspace manifest

### Layer 1: Entity Registry
- **`programs/entity-registry/src/state.rs`** — EntityRecord account structure
- **`programs/entity-registry/src/errors.rs`** — Error codes (1000-1008 range)
- **`programs/entity-registry/src/lib.rs`** — Instruction routing

### Layer 2: Pooling Engine (CRITICAL PATH)
- **`programs/pooling-engine/src/state.rs`** — PoolState, EntityPosition, OffsetEvent, SixOracleState
- **`programs/pooling-engine/src/instructions/run_netting_cycle.rs`** — ⭐ **THE CORE ALGORITHM** (needs implementation)

### Layer 3: Compliance Hook
- **`programs/compliance-hook/src/instructions/transfer_hook.rs`** — 6-stage compliance gate

---

## 🎯 Phase 1: Next Steps

### Phase 1a: Implement `run_netting_cycle()`
**File:** `programs/pooling-engine/src/instructions/run_netting_cycle.rs`

**What it needs:**
```rust
pub fn handler(ctx: Context<RunNettingCycle>) -> Result<()> {
    // STEP 1: Position Snapshot
    // STEP 2: Currency Normalisation
    // STEP 3: Surplus/Deficit Classification
    // STEP 4: Greedy Offset Matching ← MOST COMPLEX
    // STEP 5: Interest Calculation
    // STEP 6: Sweep Threshold Check
    // STEP 7: Finalise
}
```

**Estimated effort:** 6 hours

### Phase 1b: Test with hardcoded data
- Create 4 dummy entities
- Run netting cycle
- Verify OffsetEvent PDAs created correctly
- Verify `sum(real_balance + virtual_offset) = constant` (no value creation)

**Estimated effort:** 2 hours

---

## 🔑 PDA Reference (Quick Lookup)

### Entity Registry
```rust
// EntityRecord
PDA = PublicKey::find_program_address(
    &[b"entity", entity_id.as_ref()],
    &entity_registry_program_id
)
```

### Pooling Engine
```rust
// PoolState
PDA = PublicKey::find_program_address(
    &[b"pool", pool_id.as_ref()],
    &pooling_engine_program_id
)

// EntityPosition
PDA = PublicKey::find_program_address(
    &[b"entity_position", pool_id.as_ref(), entity_id.as_ref()],
    &pooling_engine_program_id
)

// SixOracleState
PDA = PublicKey::find_program_address(
    &[b"six_oracle"],
    &pooling_engine_program_id
)
```

See **`SEEDS.md`** for complete reference.

---

## 💻 Environment Setup

- **Rust:** 1.94.0 (stable)
- **Anchor:** 0.31.1
- **Target:** Solana devnet
- **Workspace:** `/home/sriranjini/nexus`
- **Cargo:** `/home/sriranjini/.cargo/bin/cargo`

---

## 📋 Phase Checklist

- [x] Phase 0: Workspace + 5 programs scaffolded
- [ ] Phase 1a: Implement netting algorithm
- [ ] Phase 1b: Test netting with hardcoded data
- [ ] Phase 2a: Entity registry (register, verify, suspend)
- [ ] Phase 2b: Token-2022 mint + seed script
- [ ] Phase 3a: Transfer hook interface
- [ ] Phase 3b: 6-stage compliance gate
- [ ] Phase 4: FX netting + Sweep trigger
- [ ] Phase 5: Devnet seed script
- [ ] Phase 6: Integration tests
- [ ] Phase 7: Off-chain services
- [ ] Phase 8: Next.js dashboard (/pool page)
- [ ] ✅ Milestone 1: 4 entities, netting cycle, compliance blocking

---

## 🚨 Common Issues & Solutions

### Issue: `error[E0432]: unresolved import`
**Solution:** Make sure all imports are in `mod.rs` files and re-exported with `pub use`

### Issue: PDA seed size mismatch
**Solution:** Use `.as_ref()` to convert `&[u8; 32]` → `&[u8]`

### Issue: Ambiguous re-exports
**Solution:** Rename handler functions in instructions (e.g., `handler_a`, `handler_b`)

### Issue: Cargo version conflicts
**Solution:** Use `/home/sriranjini/.cargo/bin/cargo build` directly (not `anchor build`)

---

## 📖 Documentation

- **`SEEDS.md`** — All PDA seeds for address derivation
- **`PHASE_0_COMPLETE.md`** — Detailed Phase 0 summary
- **Protocol Spec** — See user's original specification for full details

---

## 🎓 Learning Path

If you're new to this codebase:

1. Read **`SEEDS.md`** — understand how PDAs work
2. Read **`programs/entity-registry/src/state.rs`** — understand account structures
3. Read **`programs/entity-registry/src/lib.rs`** — see how instructions are routed
4. Read **`programs/entity-registry/src/instructions/register_entity.rs`** — see a complete instruction
5. Look at **`programs/pooling-engine/src/instructions/run_netting_cycle.rs`** — see what needs implementation

---

## 🔗 Useful Commands

```bash
# Navigate to workspace
cd /home/sriranjini/nexus

# Build all programs
/home/sriranjini/.cargo/bin/cargo build --lib --all

# Check Rust version
rustc --version

# List all .rs files
find programs -name "*.rs" | sort

# View a specific file
cat programs/pooling-engine/src/state.rs

# Edit the core algorithm
code programs/pooling-engine/src/instructions/run_netting_cycle.rs
```

---

**Last updated:** March 16, 2026 | 13:27 UTC
**Created by:** OpenCode Agent (Build Mode)
**Status:** 🟢 Ready for Phase 1
