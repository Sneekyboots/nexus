# NEXUS Protocol - 5-Layer On-Chain Corporate Cash Pooling

Production-ready Solana protocol for institutional cash management across multiple jurisdictions with real-time FX rates from SIX Financial Information.

## 🚀 Status: LIVE ON DEVNET

**All 5 programs successfully deployed to Solana Devnet** (March 17, 2026)

| Layer | Program         | Devnet Address                                 |
| ----- | --------------- | ---------------------------------------------- |
| 1     | entity-registry | `4eb3xfVvFtKnzDYrcaMjjZ5MESpmfyyfXVgUR2kkGjPa` |
| 2     | pooling-engine  | `67LiTobujmghnHLR812SUUD4juuA37j7ENsSMaZGjNCb` |
| 3     | compliance-hook | `FMjNbWedkgYovqpqHS2PojwFeVma2zVAup32j9VGVbpo` |
| 4     | fx-netting      | `6EU43gqjMV4WRjwwGYaxBAHcMUxUPTKUoK5wkBbb1Ayy` |
| 5     | sweep-trigger   | `81CJwxHEpWiY8j9c8qfLoru3edWKF2AjVZ3cUrHYU6CZ` |

See [`DEVNET_DEPLOYMENT_COMPLETE.md`](./DEVNET_DEPLOYMENT_COMPLETE.md) for full deployment details.

## Quick Overview

NEXUS is a **5-layer protocol** enabling:

- 🏢 **Multi-entity cash pooling** with KYC validation across 8 jurisdictions
- 💱 **Automated netting** with 7-step algorithm and 5 supported currencies
- ✅ **Compliance hooks** with transfer validation and AML integration
- 📊 **FX rate oracle** with FINMA-regulated SIX data
- 💰 **Intercompany loans** with configurable interest accrual

## Architecture

```
Layer 1: Entity Registry     → KYC validation, jurisdiction support
Layer 2: Pooling Engine      → 7-step netting algorithm
Layer 3: Compliance Hook     → 3-stage transfer validation
Layer 4: FX Netting          → Cross-currency offsetting
Layer 5: Sweep Trigger       → Intercompany loan settlement
```

## Getting Started

### Prerequisites

- Solana CLI 3.1.11+
- Rust 1.94.0+
- Node.js 18+
- Anchor 0.31.1

### Build & Test

```bash
# Build all programs
cargo build --lib --all

# Run all tests (58/58 passing)
cargo test --lib --all

# Build oracle service
cd services/six-oracle
npm install && npm run build
```

**Test Status:** ✅ 58/58 tests passing

- Entity Registry: 10 tests
- Pooling Engine: 3 tests + 5 CPI integration tests
- Compliance Hook: 15 tests
- FX Netting: 15 tests
- Sweep Trigger: 15 tests

## Project Structure

```
nexus/
├── programs/                 # 5 Anchor programs
│   ├── entity-registry/     # Layer 1: KYC validation
│   ├── pooling-engine/      # Layer 2: Netting algorithm
│   ├── compliance-hook/     # Layer 3: Transfer validation
│   ├── fx-netting/          # Layer 4: FX offsetting
│   └── sweep-trigger/       # Layer 5: Loan settlement
│
├── services/
│   └── six-oracle/          # FX rate oracle service
│       ├── src/index.ts     # mTLS client, rate polling
│       ├── .env.example     # Configuration template
│       └── certs/           # Certificates (gitignored)
│
├── docs/
│   └── phases/              # Implementation phases
│       ├── PHASE_0.md       # Setup
│       ├── PHASE_1.md       # Entity Registry
│       ├── PHASE_2.md       # Pooling Engine
│       ├── PHASE_3.md       # Compliance Hook
│       ├── PHASE_4.md       # FX Netting
│       └── PHASE_5.md       # Sweep Trigger
│
└── README.md               # This file
```

## Key Features

### Layer 1: Entity Registry

- KYC validation across 8 jurisdictions (FINMA, MICA, SFC, FCA, ADGM, RBI)
- Mandate limits: 100B per transfer, 500B per day
- Officer rotation and jurisdiction updates

### Layer 2: Pooling Engine

- 7-step netting algorithm
- Position snapshots and reconciliation
- Interest accrual on surplus balances

### Layer 3: Compliance Hook

- 3-stage transfer validation
- AML oracle integration
- Audit logging

### Layer 4: FX Netting

- Cross-currency offsetting (USD, GBP, EUR, SGD, AED)
- Real-time SIX exchange rates
- Configurable spreads

### Layer 5: Sweep Trigger

- Imbalance detection
- Intercompany loan creation
- 4.5% annual interest accrual

## SIX Oracle Integration

Connects to SIX Financial Information (FINMA-regulated) for institutional FX rates.

- **Authentication:** mTLS with client certificates
- **Polling:** 30-second intervals
- **Pairs:** EUR/USD, GBP/USD, CHF/USD, USD/AED, USD/HKD

See `services/six-oracle/README.md` for setup instructions.

## Deployment

### Devnet Deployment

```bash
# Fix build system (if needed)
curl https://release.solana.com/stable/install | sh

# Configure for devnet
solana config set --url https://api.devnet.solana.com

# Build programs
anchor build --skip-lint

# Deploy
solana program deploy target/sbf-solana-solana/release/*.so -u devnet
```

## Status

| Component       | Status       | Tests     |
| --------------- | ------------ | --------- |
| Entity Registry | ✅ Complete  | 10/10     |
| Pooling Engine  | ✅ Complete  | 3/3       |
| Compliance Hook | ✅ Complete  | 15/15     |
| FX Netting      | ✅ Complete  | 15/15     |
| Sweep Trigger   | ✅ Complete  | 15/15     |
| Oracle Service  | ✅ Complete  | Ready     |
| **Total**       | **✅ Ready** | **58/58** |

## Documentation

See `docs/phases/` for detailed implementation documentation by phase.

## Security

- ✅ All code compiled with zero errors
- ✅ 58/58 tests passing
- ✅ Secrets protected with .gitignore
- ✅ Certificate-based authentication (mTLS)
- ✅ Audit trail on all transactions

**Never commit:**

- `.env` files
- Certificate files (_.pem, _.p12)
- Private keys

## Developed for SIX Hackathon 2026
