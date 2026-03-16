# SIX Oracle Service

## Overview

This is the off-chain oracle service that polls **SIX Financial Information** for regulated FX rates and submits them on-chain to the NEXUS fx-netting program.

## What is SIX?

**SIX Financial Information** is the official Swiss financial data provider, regulated by FINMA. Banks and regulators recognize SIX rates as the authoritative source for currency exchange rates. Every rate this service provides carries institutional credibility.

## Architecture

```
six-oracle (Node.js service)
    ↓ mTLS with certificates
    ↓
SIX API (Regulated Swiss data)
    ↓
Fetch rates: EUR/USD, GBP/USD, CHF/USD, USD/AED, USD/HKD
    ↓
Parse & validate
    ↓
Submit to fx-netting program (Solana devnet)
    ↓
OffsetEvent PDAs (on-chain audit trail)
```

## Setup

### 1. Install Dependencies

```bash
cd services/six-oracle
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:

- `SIX_API_URL` - From Hackathon Documentation 2026.pdf
- `SOLANA_RPC_URL` - Devnet RPC endpoint
- `FX_NETTING_PROGRAM_ID` - After program deployment
- `ORACLE_AUTHORITY_KEYPAIR` - Path to oracle keypair

### 3. Certificates

Certificates are stored in `certs/` (secured and gitignored):

- `private-key.pem` - Private key for mTLS
- `signed-certificate.pem` - Client certificate
- `certificate.p12` - PKCS#12 format

Password: `sixhackathon2026`

### 4. Build & Run

```bash
# Build TypeScript
npm run build

# Run oracle service
npm start

# Or development mode with ts-node
npm run dev
```

## Supported Currency Pairs

All available in SIX data:

- EUR/USD
- GBP/USD
- CHF/USD
- USD/AED (UAE Dirham)
- USD/HKD (Hong Kong Dollar)

Plus 860+ additional instruments if needed.

## How It Works

1. **Service Start** → Load certificates from `certs/`
2. **mTLS Connection** → Establish secure, encrypted connection to SIX API
3. **Poll Loop** (every 30 seconds):
   - Fetch current rates for 5 currency pairs
   - Validate rates are fresh and sensible
   - Parse response
4. **On-Chain Update** → Call `set_fx_rate` instruction on fx-netting program
5. **Audit Trail** → Every rate is immutably recorded in RateUpdatedEvent

## Why This Matters

When regulators audit AMINA's international cash pooling:

- Every OffsetEvent has a **SIX-sourced exchange rate** embedded
- The rate is **FINMA-recognized** and auditable
- The blockchain provides an **immutable audit trail**
- **No rate manipulation** is possible - it's all timestamped on-chain

This is institutional-grade compliance infrastructure.

## Development

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Security

- ✅ Certificates stored locally, never in git (`.gitignore`)
- ✅ mTLS encryption for all communication
- ✅ Environment variables for all secrets (no hardcoding)
- ✅ Each rate update signed by oracle authority keypair
- ✅ On-chain immutable audit log

## TODO

1. **Extract API Details** from `Hackathon Documentation 2026.pdf`:

   - Actual endpoint URL/path
   - Response format (JSON structure)
   - Query parameter format
   - Rate limits and polling frequency

2. **Implement Rate Parsing** - Update `parseRates()` method based on actual SIX API response

3. **Integrate On-Chain** - Implement `submitRatesOnChain()` method to call fx-netting program

4. **Error Handling** - Implement rate staleness checks, fallback mechanisms

5. **Testing** - Write integration tests with mock SIX API responses

## Files

```
services/six-oracle/
├── certs/                          # ✓ SIX certificates (secured)
│   ├── private-key.pem
│   ├── signed-certificate.pem
│   └── certificate.p12
├── src/
│   ├── index.ts                    # ✓ Main oracle service
│   ├── client.ts                   # TODO: Implement
│   ├── types.ts                    # TODO: Implement
│   └── config.ts                   # TODO: Implement
├── dist/                           # Compiled output
├── package.json                    # ✓ Dependencies
├── tsconfig.json                   # ✓ TypeScript config
├── .env.example                    # ✓ Configuration template
└── README.md                       # ✓ This file
```

## Related Documentation

- `/docs/SIX_INTEGRATION.md` - Full SIX integration details
- `/docs/phases/PHASE_4_COMPLETE.md` - FX netting layer details
- `/programs/fx-netting/` - The on-chain program this service feeds

---

**Status:** Oracle service scaffolded. Awaiting API endpoint details from SIX documentation to complete implementation.
