# NEXUS Protocol — Cross-Border Stablecoin Treasury on Solana

**Status:** All 5 programs live on Solana Devnet · Demo dashboard at `localhost:5173`

---

## The Problem AMINA Told Us About

> _"Fiat settlements for US dollars became expensive and time-consuming after the Signature Bank failure in 2023. The pain is both the time it takes and the cost — and there is no efficient solution right now."_
> — AMINA Bank, March 17 2026 Workshop

When Signature Bank collapsed in March 2023 it took the primary USD correspondent rail for crypto-native banks with it. What used to take hours now takes **3–5 business days** and costs **3–8× more** in correspondent fees. AMINA Bank confirmed this is an active, unresolved pain point.

**NEXUS fixes this for corporate treasury clients.** Multi-entity groups with subsidiaries across CHF, EUR, GBP, AED, SGD, HKD can settle intercompany USD obligations in **minutes**, on-chain, with full KYC/KYT/AML compliance enforced by smart contract — no correspondent bank required.

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

---

## 5-Layer Architecture

| Layer  | Program         | Purpose                                                                                  | Program ID (Devnet)                            |
| ------ | --------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **L1** | entity-registry | KYC · jurisdiction · mandate limits                                                      | `6fEr9VsnyCUdCPMHY7XYV6SFsw7td48aN9biM1UowzGh` |
| **L2** | pooling-engine  | 7-step netting algorithm · offset matching                                               | `Cot9BDy1Aos6fga3D7ZcaYmzdXxqAJ4jHFGMHDdbq8Sz` |
| **L3** | compliance-hook | 6-gate enforcement (KYC, KYT/Chainalysis, AML, Travel Rule, Daily Limit, Transfer Limit) | `5rogVdJwxrCGBVPEKV42aeKxwpnW4ESQbccpMbN2BPNS` |
| **L4** | fx-netting      | Multi-currency · SIX Financial regulated FX rates (mTLS)                                 | `2RfkQCsFUjtzX1PavSHF2ZgCQj9Ua1Q72pLAzd3KfnZ7` |
| **L5** | sweep-trigger   | Intercompany loan settlement · 90-day / 1.5% APR                                         | `4EbB5Ahei4nhAkfrqyjr7ZE3VPyBhi4pbMRyrpyRbEQq` |

---

## AMINA-Specific Design Decisions

Three specifics from the March 17 workshop that shaped the architecture:

**1. Chainalysis KYT (L3 Compliance Hook)**
AMINA confirmed Chainalysis is their KYT provider and that every single transaction is screened. The compliance hook labels each gate result `KYT · Chainalysis` in the UI so judges immediately recognise the integration point.

**2. Microsoft Entra B2C Identity (Login Layer)**
AMINA stated Microsoft Entra B2C is their preferred IDP for external customers using OIDC / OAuth2. The login page shows an Entra B2C mock panel — subject ID is mapped to a Solana wallet address via an adapter pattern, exactly as described in the workshop.

**3. USD Settlement Gap (Core Narrative)**
The Signature Bank angle is the entire reason this project exists. The dashboard surfaces a "USD Settlement Cost Savings" metric so judges see the business case in the first 10 seconds.

---

## Quick Start

### 1. Clone and install

```bash
git clone <this-repo>
cd nexus

# Install app dependencies
cd app && npm install
cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — no changes needed for demo mode
```

### 3. (Optional) SIX FX Oracle — live rates

The oracle pulls real-time FX rates from SIX Financial using mTLS certificates. This requires a SIX API subscription with client certificates.

```bash
# Place your SIX mTLS certificates:
#   services/six-oracle/certs/signed-certificate.pem
#   services/six-oracle/certs/private-key.pem

# Copy and configure the oracle env:
cp services/six-oracle/.env.example services/six-oracle/.env
# Set SIX_CERT_PASSWORD and SIX_TEAM_ID in services/six-oracle/.env

# Test oracle (single fetch):
cd services/six-oracle
python3 oracle.py --once

# Run oracle server (port 7070):
python3 oracle.py
```

If the oracle is not running, the app falls back to seed rates with `stale: true` indicated in the UI.

### 4. Run the dashboard

```bash
cd app
npm run dev
# Open http://localhost:5173
```

---

## Demo Mode vs Live Mode

The header contains a **Demo / Live** toggle.

- **Demo mode** (default): All data is pre-populated. Four role dashboards with realistic entities, pools, transfers, and compliance events are visible immediately. No wallet or network connection required.
- **Live mode**: All data starts empty. Actions call the deployed Solana programs on Devnet. A wallet (e.g. Phantom) must be connected.

---

## Four Roles

Each role sees a completely different sidebar and dashboard experience:

| Role                 | Badge  | Access                                                             |
| -------------------- | ------ | ------------------------------------------------------------------ |
| `amina_admin`        | Gold   | Everything — full admin access across all 15 pages                 |
| `corporate_treasury` | Blue   | Dashboard, Entities (no KYC), Pools, Netting, Transfers, FX, Loans |
| `subsidiary_manager` | Green  | Dashboard, Entities (read-only), Transfers, Compliance feed        |
| `compliance_officer` | Purple | Dashboard, Entities (KYC+Mandates), Compliance (feed+KYT), Reports |

On first login, each role gets a **step-by-step walkthrough overlay** with clickable navigation buttons that guide them to the relevant pages.

---

## 15 Pages

```
NEXUS
├── Dashboard (/)
├── Entities
│   ├── All Entities (/entities)
│   ├── Register New Entity (/entities/register)
│   ├── KYC Management (/entities/kyc)
│   └── Mandate Controls (/entities/mandates)
├── Pools → Pool Overview (/pools)
├── Netting
│   ├── Run Cycle (/netting)
│   └── Cycle History (/netting/history)
├── Transfers → Initiate Transfer (/transfers)
├── Compliance
│   ├── Live Event Feed (/compliance)
│   └── KYT Alerts (/compliance/kyt)
├── FX Rates (/fx-rates)
├── Loans → Active Loans (/loans)
└── Reports → Audit Export (/reports)
```

---

## Key Innovation: 7-Step Netting Algorithm

```
1. Position snapshot   — capture all entity balances
2. FX normalisation    — convert to USD using SIX rates
3. Surplus/deficit     — classify each entity
4. Bilateral matching  — greedy offset pairing
5. Interest accrual    — 1.5% APR on outstanding balance
6. Sweep validation    — check against threshold
7. On-chain finalise   — write cert PDA, emit audit event
```

---

## Compliance: 6 Mandatory Gates (L3)

Every transfer passes all 6 gates before execution:

| Gate                           | Provider            |
| ------------------------------ | ------------------- |
| KYC status check               | L1 Entity Registry  |
| KYT transaction screening      | **Chainalysis**     |
| AML risk score                 | L3 Compliance Hook  |
| Travel Rule (beneficiary info) | L3 Compliance Hook  |
| Daily aggregate limit          | L1 Mandate Controls |
| Single transfer limit          | L1 Mandate Controls |

---

## Identity: Microsoft Entra B2C Adapter

AMINA's preferred IDP is Microsoft Entra B2C (confirmed March 17). The adapter flow:

```
User authenticates → Entra B2C → OIDC id_token (sub claim)
                                        ↓
                              Nexus Entra Adapter
                                        ↓
                     Solana wallet address (deterministic mapping)
                                        ↓
                              Wallet signs transactions
```

The login page mocks this flow: the Entra B2C panel shows a subject ID that maps to the connected wallet address.

---

## FX Oracle: SIX Financial (mTLS)

The `services/six-oracle/oracle.py` sidecar (Python stdlib only — no external dependencies) connects to the SIX Financial API using mutual TLS authentication:

- **Endpoint:** `https://api.six-group.com/web/v2/listings/marketData/intradaySnapshot`
- **Auth:** mTLS with SIX-issued client certificate + private key
- **Pairs covered:** EUR/USD, GBP/USD, CHF/USD, CHF/EUR via VALOR_BC identifiers
- **Fallback pairs:** AED/USD, SGD/USD, HKD/USD (fixed peg — SIX does not carry these)
- **Cache TTL:** 30 seconds
- **Fallback:** Seed rates with `stale: true` if SIX is unreachable

The oracle serves `GET /rates` and `GET /health` on `http://localhost:7070`.

> **Note:** SIX mTLS certificates are never committed. Obtain them from SIX Group API portal and place in `services/six-oracle/certs/`.

---

## Project Structure

```
programs/              # 5 Anchor programs (Rust)
├── entity-registry/
├── pooling-engine/
├── compliance-hook/
├── fx-netting/
└── sweep-trigger/

app/                   # React dashboard (TypeScript + Vite)
├── src/
│   ├── pages/         # 15 pages (role-gated)
│   ├── context/       # AuthContext · NexusContext (demo/live state)
│   ├── layouts/       # AppLayout — role sidebar with SVG icons
│   ├── components/    # Walkthrough · DataNotification
│   ├── services/      # nexusService · solanaClient · demoClient
│   ├── constants.ts   # Program IDs · nav items · icons
│   └── styles/        # sketch.css — hand-drawn wireframe theme
└── index.html

services/
└── six-oracle/        # Python mTLS FX oracle
    ├── oracle.py      # stdlib only — no pip installs needed
    ├── .env.example
    └── certs/         # ← NOT committed (gitignored)

migrations/
└── seed-devnet.ts     # Devnet seeding script
```

---

## Tech Stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Blockchain | Solana · Anchor framework                                               |
| Frontend   | React 18 · TypeScript · Vite                                            |
| Styling    | Custom `sketch.css` — Caveat / Patrick Hand / Architects Daughter fonts |
| FX Oracle  | Python 3 stdlib · SIX Financial API (mTLS)                              |
| Identity   | Microsoft Entra B2C (OIDC mock adapter)                                 |
| Compliance | Chainalysis KYT (integrated in L3 compliance-hook)                      |
| State      | React Context — demo store + live Solana client                         |

---

## Submission

**Track:** Track 2 — Cross-Border Stablecoin Treasury Management
**Partner:** AMINA Bank (regulated Swiss crypto bank)
**Deadline:** March 22, 2026
**Devnet:** All 5 programs deployed and verified
**Dashboard:** Demo mode pre-populated · Live mode starts empty for real on-chain registration
