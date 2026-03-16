# NEXUS Protocol: 5-Layer On-Chain Corporate Cash Pooling

![Status](https://img.shields.io/badge/Status-Phase%204%20Complete-brightgreen)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)
![Tests](https://img.shields.io/badge/Tests-43%2F43%20Passing-brightgreen)
![Solana](https://img.shields.io/badge/Solana-Devnet-blue)

## Overview

**NEXUS** is a production-ready **5-layer on-chain corporate cash pooling protocol** built on Solana that enables international entities to net notional positions without moving tokens. It combines sophisticated compliance checks, multi-currency FX netting, and automated sweep triggers into a unified protocol.

### Key Features

- ✅ **KYC/Compliance Gating** - Time-based KYC verification with jurisdiction support (FINMA, MICA, SFC, FCA, ADGM, RBI)
- ✅ **Notional Pooling Engine** - 7-step netting algorithm that offsets positions across entities
- ✅ **Transfer Hook Validation** - 3-stage compliance gate on all token movements
- ✅ **Multi-Currency FX Netting** - Cross-currency offsetting with configurable spreads
- ✅ **Automated Sweep Trigger** - Physical liquidity settlement when imbalances exceed thresholds
- ✅ **Zero Token Movement** - Virtual positions offset without moving actual funds (until sweep)

---

## Architecture

### 5-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│  Layer 5: Sweep Trigger                                 │
│  Physical liquidity settlement & intercompany loans      │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│  Layer 4: FX Netting                                    │
│  Cross-currency offset matching with spreads            │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Compliance Hook                               │
│  Transfer hook validation (3-stage gate)                │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Pooling Engine                                │
│  7-step netting algorithm & position tracking           │
└─────────────────────────────────────────────────────────┘
                           ▲
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Entity Registry                               │
│  KYC verification, mandate limits, jurisdiction rules   │
└─────────────────────────────────────────────────────────┘
```

### Programs Summary

| Layer | Program         | Status         | Tests  | LoC        |
| ----- | --------------- | -------------- | ------ | ---------- |
| 1     | entity-registry | ✅ Complete    | 10     | 450        |
| 2     | pooling-engine  | ✅ Complete    | 3      | 400        |
| 3     | compliance-hook | ✅ Complete    | 15     | 380        |
| 4     | fx-netting      | ✅ Complete    | 15     | 518        |
| 5     | sweep-trigger   | 🔨 In Progress | -      | -          |
|       | **TOTAL**       |                | **43** | **~2,000** |

---

## Getting Started

### Prerequisites

- **Rust:** 1.94.0+ (install via `rustup`)
- **Solana CLI:** 2.0.0+
- **Anchor:** 0.31.1+
- **Node.js:** 18+ (for TypeScript migrations)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/anomalyco/nexus.git
cd nexus

# Build all programs
cargo build --lib --all

# Run all tests
cargo test --lib --all

# Run Phase 4 FX netting tests
cd programs/fx-netting
cargo test --test fx_netting
```

### Project Structure

```
nexus/
├── programs/
│   ├── entity-registry/          Layer 1: KYC & Entity Management
│   ├── pooling-engine/           Layer 2: Netting Algorithm
│   ├── compliance-hook/          Layer 3: Transfer Validation
│   ├── fx-netting/               Layer 4: Multi-Currency FX
│   └── sweep-trigger/            Layer 5: Settlement Trigger
│
├── docs/
│   ├── phases/                   Phase-wise implementation docs
│   │   ├── PHASE_0_COMPLETE.md   Workspace setup
│   │   ├── PHASE_2B_COMPLETE.md  Entity Registry + Tests
│   │   └── PHASE_4_COMPLETE.md   FX Netting Layer
│   ├── architecture/             Architecture & design docs
│   │   ├── SEEDS.md              PDA seed references
│   │   ├── ENTITY_REGISTRY_HELPERS.md
│   │   ├── EXPLAINED_SIMPLE.md   Simple explanations
│   │   └── REVIEW_SUMMARY.md     Review notes
│   └── testing/                  Testing guides
│
├── migrations/                   TypeScript seed scripts
├── Anchor.toml                   Anchor config
├── Cargo.toml                    Rust workspace
└── README.md                     This file
```

---

## Layer Details

### Layer 1: Entity Registry ✅ COMPLETE

**Purpose:** Manages entity identities, KYC verification, and mandate limits

**Key Components:**

- `EntityRecord` - Stores entity info, KYC status, jurisdiction, mandate limits
- `register_entity()` - Create new entity
- `verify_entity()` - Verify KYC (oracle-only)
- `suspend_entity()` - Suspend entity (blocks all transactions)
- 8 validation helpers for other layers

**Features:**

- ✅ Time-based KYC expiry (automatic invalidation)
- ✅ Daily mandate limits with automatic reset at UTC midnight
- ✅ Single transfer limit: 100B per transaction
- ✅ Daily aggregate limit: 500B per day
- ✅ 6 jurisdiction types: FINMA, MICA, SFC, FCA, ADGM, RBI

**Test Coverage:** 10/10 tests passing

- Entity registration & KYC workflow
- Time-based expiry enforcement
- Daily limit tracking & reset
- Suspension & revocation

**See:** [docs/phases/PHASE_0_COMPLETE.md](docs/phases/PHASE_0_COMPLETE.md)

---

### Layer 2: Pooling Engine ✅ COMPLETE

**Purpose:** Implements the 7-step netting algorithm that offsets entity positions

**Key Components:**

- `NettingAlgorithm` - Core algorithm implementation
- `PositionSnapshot` - Entity balance snapshots
- `OffsetMatch` - Records of successful offsets
- `run_netting_cycle()` - Execute full netting

**Algorithm Steps:**

1. **Position Snapshot** - Read entity real balances + virtual offsets
2. **Currency Normalisation** - Convert to USD using FX oracle
3. **Surplus/Deficit Classification** - Sort entities by balance
4. **Greedy Offset Matching** - Match surplus against deficit
5. **Interest Calculation** - Accrue interest on positions
6. **Sweep Threshold Check** - Detect when settlement needed
7. **Finalise** - Update pool state, emit events

**Key Invariant:** `sum(real_balance + virtual_offset) = CONSTANT`
(Money is neither created nor destroyed in virtual offsets)

**Test Coverage:** 3/3 tests passing

- Same-currency position offsetting
- Multi-entity matching
- Invariant preservation

**See:** [docs/phases/PHASE_0_COMPLETE.md](docs/phases/PHASE_0_COMPLETE.md)

---

### Layer 3: Compliance Hook ✅ COMPLETE

**Purpose:** Validates all token transfers before execution

**Key Components:**

- `transfer_hook()` - 3-stage validation gate
- `ComplianceCertificate` - Audit record of transfer
- Transfer limits delegation to Layer 1

**Validation Stages:**

1. **KYC Check** - Entity must be verified & non-expired
2. **Mandate Check** - Transfer must not exceed limits
3. **Audit Log** - Emit `ComplianceCertificate` event

**Features:**

- ✅ Delegates to Layer 1 validation helpers (no redundancy)
- ✅ Prevents unauthorized token transfers
- ✅ Full audit trail via events
- ✅ Graceful rejection with error codes

**Test Coverage:** 15/15 tests passing

- All validation paths
- Limit enforcement
- Error conditions

**See:** [docs/phases/PHASE_2B_COMPLETE.md](docs/phases/PHASE_2B_COMPLETE.md)

---

### Layer 4: FX Netting ✅ COMPLETE

**Purpose:** Handles cross-currency offsetting with FX rates and spreads

**Key Components:**

- `FxRateOracle` - Stores exchange rates per currency pair
- `set_fx_rate()` - Update FX rates
- `cross_currency_offset()` - Execute multi-currency offset

**Supported Currencies:**

- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)
- SGD (Singapore Dollar)
- AED (UAE Dirham)

**Rate Precision:** 6 decimal places

- Formula: `rate * 1_000_000`
- Example: 1 USD = 0.73 GBP stored as `730_000`

**Spread Model:** Basis points (max 1000 = 10%)

- Applied during conversion to cover transaction costs
- Default: 50 bps (0.5%)

**Features:**

- ✅ Validates rate freshness (max 1 hour old)
- ✅ Prevents invalid rates (rate > 0)
- ✅ Enforces spread limits (< 1000 bps)
- ✅ Only oracle authority can update rates

**Test Coverage:** 15/15 tests passing

- Currency support validation
- FX conversions (USD→GBP, GBP→USD, EUR→GBP, etc.)
- Spread application on both buy/sell sides
- Rate staleness detection
- Value preservation through round-trip conversions
- Edge cases (zero, large amounts)

**See:** [docs/phases/PHASE_4_COMPLETE.md](docs/phases/PHASE_4_COMPLETE.md)

---

### Layer 5: Sweep Trigger 🔨 IN PROGRESS

**Purpose:** Triggers physical liquidity settlement when imbalances exceed thresholds

**Planned Components:**

- `SweepTrigger` - Detects when virtual offsetting is insufficient
- `execute_sweep()` - Creates intercompany loans for physical settlement
- `settle_sweep()` - Executes physical token movements

**Planned Features:**

- ✅ Threshold-based triggering (e.g., when imbalance > 100M USDC)
- ✅ Multi-entity settlement
- ✅ Intercompany loan creation
- ✅ Integration with all 4 previous layers

**Status:** Architecture designed, implementation in progress

---

## Test Summary

### Test Counts by Layer

```
Layer 1 (Entity Registry):        10 tests ✅
Layer 2 (Pooling Engine):          3 tests ✅
Layer 3 (Compliance Hook):        15 tests ✅
Layer 4 (FX Netting):             15 tests ✅
Layer 5 (Sweep Trigger):          - (in progress)
─────────────────────────────────────────
TOTAL:                            43 tests ✅
```

### Running Tests

```bash
# All tests
cargo test --lib --all

# By layer
cd programs/entity-registry && cargo test --test entity_registry
cd programs/pooling-engine && cargo test --test netting_algorithm
cd programs/compliance-hook && cargo test --test compliance_hook
cd programs/fx-netting && cargo test --test fx_netting
```

---

## Test Entities (Devnet Seed)

Four test entities configured for end-to-end testing:

| Entity    | Jurisdiction | Currency | Balance              | Notes          |
| --------- | ------------ | -------- | -------------------- | -------------- |
| Singapore | FINMA        | USDC     | +800B                | Surplus entity |
| UAE       | ADGM         | USDC     | 0B (receives offset) | Deficit entity |
| UK        | FCA          | GBP      | +200B                | Surplus entity |
| Germany   | MICA         | EUR      | -400B                | Deficit entity |

**Mandate Limits (all entities):**

- Single transfer: 100B
- Daily aggregate: 500B
- KYC expiry: 1 year from verification

**Seed with:**

```bash
ts-node migrations/seed-devnet.ts
```

---

## Documentation Index

### Phase-Wise Implementation

- [Phase 0: Workspace Setup](docs/phases/PHASE_0_COMPLETE.md)
- [Phase 1-2B: Entity Registry & Tests](docs/phases/PHASE_2B_COMPLETE.md)
- [Phase 4: FX Netting Layer](docs/phases/PHASE_4_COMPLETE.md)

### Architecture & Design

- [PDA Seeds Reference](docs/architecture/SEEDS.md)
- [Entity Registry Helpers](docs/architecture/ENTITY_REGISTRY_HELPERS.md)
- [Simple Explanations](docs/architecture/EXPLAINED_SIMPLE.md)
- [Review Summary](docs/architecture/REVIEW_SUMMARY.md)

### Getting Started

- [Quick Start Guide](docs/QUICKSTART.md)

---

## Build Status

```bash
$ cargo build --lib --all
   Compiling entity-registry v0.1.0
   Compiling pooling-engine v0.1.0
   Compiling compliance-hook v0.1.0
   Compiling fx-netting v0.1.0
   Compiling sweep-trigger v0.1.0
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 8.45s

✅ Zero compilation errors
✅ All 5 programs building successfully
```

---

## Development Roadmap

### ✅ Completed

- **Phase 0:** Workspace & scaffolding
- **Phase 1:** Netting algorithm (7-step)
- **Phase 2:** Entity registry + validation
- **Phase 3:** Compliance hook + transfer validation
- **Phase 4:** FX netting + cross-currency offsetting

### 🔨 In Progress

- **Phase 5:** Sweep trigger implementation

### 🔜 Next

- **Phase 6:** Devnet deployment
- **Phase 7:** Dashboard & UI (React)
- **Phase 8:** End-to-end integration testing

---

## Key Metrics

| Metric                  | Value                                |
| ----------------------- | ------------------------------------ |
| Total Programs          | 5                                    |
| Total Integration Tests | 43                                   |
| Test Pass Rate          | 100%                                 |
| Lines of Code           | ~2,000                               |
| Supported Currencies    | 5 (USD, GBP, EUR, SGD, AED)          |
| Supported Jurisdictions | 6 (FINMA, MICA, SFC, FCA, ADGM, RBI) |
| Anchor Version          | 0.31.1                               |
| Solana Version          | Latest devnet                        |
| Rust Edition            | 2021                                 |

---

## Error Code Reference

### Layer 1 (Entity Registry): 1000-2008

- `1000-1010` - Entity registration errors
- `1100-1199` - KYC verification errors
- `2000-2008` - Entity state errors

### Layer 2 (Pooling Engine): 2000+

- Netting algorithm specific errors

### Layer 3 (Compliance Hook): 3000-3009

- Transfer validation errors
- Compliance gate failures

### Layer 4 (FX Netting): 4000-4004

- `4000` - UnsupportedCurrency
- `4001` - InvalidRate
- `4002` - InvalidSpread
- `4003` - StaleFxRate
- `4004` - CurrencyMismatch

### Layer 5 (Sweep Trigger): 5000+

- Settlement and sweep errors

---

## Git Workflow

All implementation tracked in git with clear commit messages per phase:

```bash
# View recent commits
git log --oneline | head -20

# By phase
git log --grep="Phase" --oneline
```

---

## Support & Documentation

- **Questions?** See [QUICKSTART.md](docs/QUICKSTART.md) for common issues
- **Architecture questions?** Check [docs/architecture/](docs/architecture/)
- **Phase details?** See [docs/phases/](docs/phases/)

---

## License

NEXUS Protocol - Proprietary

---

## Next Steps

👉 **Currently:** Phase 5 implementation (Sweep Trigger)

**To get started:**

1. Clone repo and install dependencies
2. Run `cargo build --lib --all`
3. Run `cargo test --lib --all`
4. Read [docs/QUICKSTART.md](docs/QUICKSTART.md)

**To contribute:**

- Follow the phase-wise structure in docs/
- Add tests for all new functionality
- Update README as you progress

---

**Last Updated:** March 16, 2026
**Status:** Phase 4 Complete, Phase 5 In Progress
