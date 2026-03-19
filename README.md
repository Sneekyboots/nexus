# NEXUS Protocol — Notional Corporate Cash Pooling on Solana

> **Track 2:** Stablecoin-Based On-Chain Cash Pooling
> Rebuild traditional corporate cash pooling (physical or notional) using stablecoins.

**Status:** 5 programs live on Solana Devnet · Entity registered & KYC verified · Dashboard at `localhost:5173`

---

## The Track: Notional Corporate Cash Pooling with Stablecoins

This project addresses **Track 2: Cross-Border Stablecoin Treasury** by implementing **notional corporate cash pooling** — a smarter way for multi-entity groups to manage global cash positions.

> _"Fiat settlements for US dollars became expensive and time-consuming after the Signature Bank failure in 2023."_ — AMINA Bank, March 2026

### What Makes NEXUS Different

| Traditional Cash Pooling            | NEXUS Notional Pooling                    |
| ----------------------------------- | ----------------------------------------- |
| Physical transfers between accounts | **No tokens move** until settlement       |
| Multi-day correspondent bank delays | **Instant** on-chain netting              |
| Manual FX conversions               | **Automated** via SIX Financial rates     |
| Separate compliance checks          | **Integrated** KYC/KYT/AML at token level |
| Fragmented audit trails             | **Immutable** on-chain records            |

---

## The 5 Core Principles

```
01  Pool stablecoin balances across subsidiaries globally
    → USDC, EURC, GBPC held in entity vaults on Solana

02  Net surpluses against deficits — no tokens move
    → 7-step algorithm calculates offsets virtually

03  Convert currencies automatically via live SIX FX rates
    → Real-time EUR/USD, GBP/USD, CHF/USD rates on-chain

04  Enforce KYC · KYT · AML · Travel Rule at token level
    → 6-gate compliance hook blocks unauthorized transfers

05  Settle physically via on-chain stablecoin sweep when needed
    → Actual token movements only when threshold exceeded
```

---

## The Problem AMINA Told Us About

When Signature Bank collapsed in March 2023 it took the primary USD correspondent rail for crypto-native banks with it. What used to take hours now takes **3–5 business days** and costs **3–8× more** in correspondent fees.

**NEXUS fixes this.** Multi-entity groups with subsidiaries across CHF, EUR, GBP, AED, SGD can achieve the same cash pooling outcome — consolidated visibility, offset positions, reduced transfer costs — but using stablecoins and smart contracts instead of correspondent banking rails.

---

## What NEXUS Delivers

| Problem                                | Traditional                       | NEXUS                                    |
| -------------------------------------- | --------------------------------- | ---------------------------------------- |
| USD settlement after Signature Bank    | 3–5 days, $8–15 per payment       | < 5 min, ~$0.001 on Solana               |
| Multi-currency netting across entities | Manual spreadsheets, FX desks     | Automated 7-step on-chain algorithm      |
| KYC/KYT compliance per transaction     | Post-hoc AML screening            | 6-gate enforcement on every transfer     |
| Audit trail for regulators             | PDF exports from multiple systems | Immutable on-chain cert PDA per transfer |
| Identity verification                  | Siloed per institution            | Microsoft Entra B2C OIDC adapter         |
| Transaction monitoring                 | Separate Chainalysis integration  | KYT powered by Chainalysis (built-in)    |
| Live regulated FX rates                | Bloomberg terminal / FX desk      | SIX Financial API via mTLS, on-chain     |

---

## Live On-Chain Verification

### Successfully Verified on Solana Devnet (March 19, 2026)

1. **Entity Registered:** `TechCorp Singapore Pte Ltd`

   - Transaction: https://explorer.solana.com/tx/2okTXFFpLX5xuVvhv44zWcKS4xrxnoRDBxTwAgbxABZEHgG1kQNcoZwrpJKEah3yNT4oCknDmx6JruCG5Kqqox3o?cluster=devnet

2. **KYC Verified:** Status changed from Pending (0) to Verified (1)

   - Transaction: https://explorer.solana.com/tx/3SHzmEur24hTCbBXeCs5shJ8VqKH6kQ8Cro7mZZUkxqeQCXd4G9ghXBK9Hpvd51i1pR9aPvxCjvYS2thfWs3bZ3j?cluster=devnet

3. **Account PDA:** `Gs8VEPPK7SqKCwFkEYcjUj7N1pbyW7RL4LZPpDfK8sbx`
   - Jurisdiction: ADGM (4)
   - KYC Status: Verified (1)
   - Data Size: 275 bytes

---

## Architecture: 5 Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXUS Protocol                               │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │  L1          │   │  L2          │   │  L3                  │   │
│  │  entity-     │◄──│  pooling-    │──►│  compliance-hook     │   │
│  │  registry    │   │  engine      │   │  (Token-2022)        │   │
│  │              │   │              │   │                      │   │
│  │  KYC status  │   │  7-step      │   │  6 gates per tx:     │   │
│  │  Jurisdiction│   │  netting     │   │  KYC · KYT · AML     │   │
│  │  Mandates    │   │  algorithm   │   │  Travel Rule         │   │
│  │  Compliance  │   │  SIX oracle  │   │  Daily limit         │   │
│  │  officer     │   │  CPI coord   │   │  Transfer limit      │   │
│  └──────────────┘   └──────┬───────┘   └──────────────────────┘   │
│                             │                                       │
│                    ┌────────┴────────┐                             │
│                    │                 │                             │
│             ┌──────▼──────┐  ┌──────▼──────┐                     │
│             │  L4         │  │  L5         │                     │
│             │  fx-netting │  │  sweep-     │                     │
│             │             │  │  trigger    │                     │
│             │  Multi-ccy  │  │             │                     │
│             │  conversion │  │  Interco.   │                     │
│             │  Spread bps │  │  loans      │                     │
│             │  SIX rates  │  │  4.5% APR   │                     │
│             └─────────────┘  └─────────────┘                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SIX Financial Oracle (mTLS)                                 │  │
│  │  EUR/USD · GBP/USD · CHF/USD · SGD/USD · AED/USD            │  │
│  │  BC=148 · VALOR_BC scheme · 30s refresh · on-chain          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deployed Program IDs

### Devnet (LIVE - All Programs Deployed & Verified)

| Layer | Program         | Program ID                                     | Explorer Link                                                                                     |
| ----- | --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| L1    | entity-registry | `HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH` | [Solscan](https://solscan.io/account/HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH?cluster=devnet) |
| L2    | pooling-engine  | `CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk` | [Solscan](https://solscan.io/account/CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk?cluster=devnet) |
| L3    | compliance-hook | `8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM` | [Solscan](https://solscan.io/account/8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM?cluster=devnet) |
| L4    | fx-netting      | `4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej` | [Solscan](https://solscan.io/account/4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej?cluster=devnet) |
| L5    | sweep-trigger   | `2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk` | [Solscan](https://solscan.io/account/2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk?cluster=devnet) |

**Authority wallet:** `A7eV2cdTrH56ktXH3ZaSk4kbsF2aguHvggeszcAUXc5o` (22.79 SOL)

**Deployed:** March 19, 2026

### Surfpool (local simnet — tests run here)

| Layer | Program         | Program ID                                     |
| ----- | --------------- | ---------------------------------------------- |
| L1    | entity-registry | `J4CSWfakHC2Ta7k2BTszksmgQLZU3cJAKpVDNgCgwXwq` |
| L2    | pooling-engine  | `C9nSWxVhNk71FcshhkpQ8b3Ro4hqFP1Y9XLEKqfzJjeF` |
| L3    | compliance-hook | `jmkdf4hD8WyYR4XBuzFKoFJeLXLzwpQS7Tr7fFz6R2t`  |
| L4    | fx-netting      | `9UbcgtEHCN558aC2fmcTuiC7P9X8nMp31i9xeiymuiC3` |
| L5    | sweep-trigger   | `A1duxrShkRCTVatLiNptFNC9rsKNM9chQnCysq6r9hDN` |

---

## Key Innovation: 7-Step Netting Algorithm (L2)

The `run_netting_cycle` instruction executes all 7 steps atomically on-chain, with CPI calls into L3, L4, and L5:

```
Step 1 — Position Snapshot
         Read all EntityPosition PDAs in the pool.
         Compute effective_position = real_balance + virtual_offset.

Step 2 — FX Normalisation
         Convert every position to USD using live SIX oracle rates.
         Rate encoding: 9 decimal places (e.g. 1.147250 → 1_147_250_000).
         Stale oracle (>300s) emits StaleOracleAlert event, skips cross-ccy ops.

Step 3 — Surplus / Deficit Classification
         Split entities into surplus list and deficit list.
         Sort each descending by USD amount.

Step 4 — Greedy Offset Matching
         Pair largest surplus against largest deficit.
         match_amount = min(surplus_remaining, deficit_remaining).
         Creates OffsetMatch records. Updates virtual_offset on both sides.
         Cross-currency matches attach the SIX FX rate used.

Step 5 — Interest Accrual
         Accrue 4.5% APR on positive positions.
         interest = position × rate_bps × elapsed_seconds / (10000 × 31_536_000)

Step 6 — Sweep Threshold Check
         Any deficit exceeding sweep_threshold emits SweepRequired event.
         CPI → L5 sweep-trigger to create IntercompanyLoan PDA.

Step 7 — Finalise
         Write aggregate net_position_usd to PoolState.
         Set last_netting_timestamp.
         Emit NettingComplete event with total offset count.
```

---

## Compliance: 6 Mandatory Gates (L3)

Every transfer passes all 6 gates atomically before execution. A single failure reverts the transaction:

| Gate                     | Check                                        | Error code                   |
| ------------------------ | -------------------------------------------- | ---------------------------- |
| 1. KYC status            | Entity must be `Verified` and not expired    | `KycVerificationFailed`      |
| 2. KYT screening         | Chainalysis transaction risk score           | `KytScreeningFailed`         |
| 3. AML risk score        | Entity AML risk below threshold              | `AmlRiskTooHigh`             |
| 4. Travel Rule           | Beneficiary info present for transfers >$1k  | `TravelRuleViolation`        |
| 5. Daily aggregate limit | `daily_used + amount <= max_daily_aggregate` | `DailyAggregateExceedsLimit` |
| 6. Single transfer limit | `amount <= max_single_transfer`              | `SingleTransferExceedsLimit` |

On pass, emits `TransferApproved` — an immutable on-chain audit certificate with entity ID, amount, and timestamp.

---

## FX Oracle: SIX Financial (mTLS)

NEXUS uses **real regulated FX rates** from SIX Group — the same data provider used by Swiss institutional desks.

**Live rates confirmed on devnet** (March 19 2026):

| Pair    | SIX VALOR_BC ID         | Live mid rate |
| ------- | ----------------------- | ------------- |
| EUR/USD | `946681_148`            | 1.1470        |
| GBP/USD | `275017_148`            | 1.3270        |
| CHF/USD | `275164_148`            | 1.2617        |
| SGD/USD | `610497_148`            | 0.7795        |
| AED/USD | `275159_148` (inverted) | 0.2723        |

**BC=148** = Forex Spot Rates (confirmed live). Rates encoded as 9 decimal place u64 integers on-chain.

---

## AMINA-Specific Design Decisions

**1. Chainalysis KYT (L3 Compliance Hook)**
AMINA confirmed Chainalysis is their KYT provider and that every single transaction is screened. The compliance hook labels each gate result `KYT · Chainalysis` in the UI. Gate 2 of the 6-gate enforcement is explicitly the Chainalysis integration point.

**2. Microsoft Entra B2C Identity (Login Layer)**
AMINA stated Microsoft Entra B2C is their preferred IDP for external customers using OIDC / OAuth2. The login page shows an Entra B2C mock panel — subject ID is mapped to a Solana wallet address via an adapter pattern.

**3. USD Settlement Gap (Core Narrative)**
The Signature Bank angle is the entire reason this project exists. The dashboard surfaces a "USD Settlement Cost Savings" metric so judges see the business case in the first 10 seconds.

---

## Quick Start

### 1. Run the dashboard

```bash
cd app
npm install
npm run dev
# Open http://localhost:5173
```

### 2. Demo mode (no wallet needed)

- Click any role card to log in
- Data is pre-populated for demonstration

### 3. Live mode (connects to Solana Devnet)

- Connect a Phantom wallet
- Toggle "Live" in the top-right corner
- Actions interact with real on-chain programs

### 4. Run tests

```bash
# Start Surfpool first (separate terminal):
surfpool start

# Run all 25 tests:
anchor test --skip-local-validator --skip-deploy
```

### 5. Push live SIX rates to devnet

Requires SIX mTLS certificates.

```bash
# Single push:
node scripts/six_oracle_feeder.mjs --once --rpc https://api.devnet.solana.com

# Continuous 30s loop:
node scripts/six_oracle_feeder.mjs --rpc https://api.devnet.solana.com
```

### 6. Run the Python oracle HTTP server

```bash
cd services/six-oracle
python3 oracle.py           # starts on http://localhost:7070
python3 oracle.py --once    # single fetch + print, then exit
```

---

## Four Roles

| Role                 | Badge  | Access                                                             |
| -------------------- | ------ | ------------------------------------------------------------------ |
| `amina_admin`        | Gold   | Everything — full admin access across all 15 pages                 |
| `corporate_treasury` | Blue   | Dashboard, Entities (no KYC), Pools, Netting, Transfers, FX, Loans |
| `subsidiary_manager` | Green  | Dashboard, Entities (read-only), Transfers, Compliance feed        |
| `compliance_officer` | Purple | Dashboard, Entities (KYC+Mandates), Compliance (feed+KYT), Reports |

---

## 15 Pages

```
NEXUS
├── Dashboard (/)                        ← USD savings metric · live oracle status · pool summary
├── Entities
│   ├── All Entities (/entities)         ← search · filter by jurisdiction / KYC status
│   ├── Register New Entity (/entities/register)
│   ├── KYC Management (/entities/kyc)   ← compliance_officer only
│   └── Mandate Controls (/entities/mandates)
├── Pools → Pool Overview (/pools)
├── Netting
│   ├── Run Cycle (/netting)             ← triggers 7-step algorithm on-chain
│   └── Cycle History (/netting/history)
├── Transfers → Initiate Transfer (/transfers)
├── Compliance
│   ├── Live Event Feed (/compliance)    ← real-time TransferApproved / rejected events
│   └── KYT Alerts (/compliance/kyt)    ← Chainalysis flagged transactions
├── FX Rates (/fx-rates)                 ← live SIX rates · staleness indicator
├── Loans → Active Loans (/loans)        ← intercompany sweep loans · repayment
└── Reports → Audit Export (/reports)   ← compliance_officer / admin only
```

---

## Project Structure

```
nexus/
├── programs/                      # 5 Anchor programs (Rust)
│   ├── entity-registry/
│   ├── pooling-engine/
│   ├── compliance-hook/
│   ├── fx-netting/
│   └── sweep-trigger/
├── tests/
│   └── nexus.ts                   # 25 integration tests
├── scripts/
│   └── six_oracle_feeder.mjs      # SIX mTLS → on-chain oracle
├── services/
│   └── six-oracle/
│       └── oracle.py              # Python HTTP sidecar on :7070
├── app/                           # React 18 + TypeScript + Vite dashboard
│   └── src/
│       ├── pages/                 # 15 pages (role-gated)
│       ├── context/               # AuthContext · NexusContext
│       ├── services/              # nexusService · solanaClient
│       └── styles/               # sketch.css
├── Anchor.toml                    # Program IDs
└── README.md                      # This file
```

---

## Tech Stack

| Layer            | Technology                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| Blockchain       | Solana · Anchor framework · Token-2022                                  |
| Programs         | Rust · 5 programs · ~2,600 lines                                        |
| Tests            | TypeScript · Mocha/Chai · 25 tests · Surfpool                           |
| Frontend         | React 18 · TypeScript · Vite                                            |
| Styling          | Custom `sketch.css` — Caveat / Patrick Hand / Architects Daughter fonts |
| FX Oracle (HTTP) | Python 3 stdlib · no external dependencies                              |
| FX Data          | SIX Financial Group API · mTLS · BC=148 Forex Spot Rates                |
| Identity         | Microsoft Entra B2C · OIDC mock adapter                                 |
| Compliance       | Chainalysis KYT (integrated in L3)                                      |

---

## Submission

**Track 2:** Cross-Border Stablecoin Treasury — **Stablecoin-Based On-Chain Cash Pooling**

> Rebuild traditional corporate cash pooling (physical or notional) using stablecoins.

**Examples from Track Description:**

1. Credit-Enabled Stablecoin Treasury Infrastructure
2. ✅ **Stablecoin-Based On-Chain Cash Pooling** ← NEXUS implements this

**Partner:** AMINA Bank (regulated Swiss crypto bank)
**Deadline:** March 22, 2026
**Devnet:** All 5 programs deployed · Entity registered & KYC verified on-chain
**Dashboard:** Demo mode pre-populated · Live mode calls real devnet programs
