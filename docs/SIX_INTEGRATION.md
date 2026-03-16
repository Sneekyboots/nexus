# SIX Financial Information Integration

## Overview

**SIX** is the official Swiss financial data provider regulated by FINMA. NEXUS uses SIX for **regulated, auditable FX rates** that flow into every OffsetEvent PDA on-chain. This provides institutional credibility for compliance audits.

## Certificate Details

**Location:** `services/six-oracle/certs/`

- `private-key.pem` - Private key for mTLS authentication
- `signed-certificate.pem` - Client certificate for mTLS
- `certificate.p12` - PKCS#12 format (if needed for Node.js)

**Certificate Password:** `sixhackathon2026`

**Team ID:** CH56655

## Supported Currency Pairs

### Required Pairs (Confirmed Available)

- ✅ **EUR/USD** - Euro to US Dollar
- ✅ **GBP/USD** - British Pound to US Dollar
- ✅ **CHF/USD** - Swiss Franc to US Dollar
- ✅ **USD/AED** - US Dollar to UAE Dirham
- ✅ **USD/HKD** - US Dollar to Hong Kong Dollar

### Additional Pairs (Available for Extended Support)

- USD/SGD - US Dollar to Singapore Dollar
- GBP/AED - British Pound to UAE Dirham
- SGD/HKD - Singapore Dollar to Hong Kong Dollar
- EUR/AED - Euro to UAE Dirham
- And 860+ more instrument combinations

**Total Available Instruments:** 882 (currencies + precious metals)

## API Endpoints

**Base URL:** (To be extracted from PDF - see Hackathon Documentation 2026.pdf)

**Endpoint Format:** `/v1/api/quotation` or similar (see PDF)

**Authentication:** mTLS (mutual TLS using certificates)

**Rate Query Format:** `TICKER_BC` code scheme (e.g., `EUR/USD_148`)

## API Integration Plan

### Layer: Services/Six-Oracle

```
services/six-oracle/
├── certs/                          # Certificate storage (gitignored)
│   ├── private-key.pem
│   ├── signed-certificate.pem
│   └── certificate.p12
├── src/
│   ├── index.ts                    # Main oracle poller service
│   ├── client.ts                   # SIX API client (mTLS)
│   ├── types.ts                    # TypeScript interfaces
│   └── config.ts                   # Configuration loader
├── tests/
│   └── six-oracle.test.ts         # Integration tests
├── .env.example                    # Environment template
├── package.json
└── README.md
```

## Key Workflow

1. **Service Startup** → Load certificates from `certs/` directory
2. **mTLS Connection** → Establish secure connection to SIX API using client certificates
3. **Poll Rates** → Every 30 seconds, fetch current rates for 5 currency pairs
4. **Validation** → Verify rate freshness and accuracy
5. **On-Chain Update** → Call `set_fx_rate` instruction on fx-netting program with authenticated rates
6. **Audit Trail** → Every rate update is recorded in RateUpdatedEvent on-chain

## Environment Configuration

```env
# SIX API Configuration
SIX_API_URL=https://[api.six.com]              # Extract from PDF
SIX_CERT_PATH=./certs/signed-certificate.pem
SIX_KEY_PATH=./certs/private-key.pem
SIX_CERT_PASSWORD=sixhackathon2026
SIX_TEAM_ID=CH56655

# Poll Configuration
SIX_POLL_INTERVAL_MS=30000                     # Poll every 30 seconds
SIX_RATE_STALENESS_THRESHOLD=3600000           # 1 hour in milliseconds

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
FX_NETTING_PROGRAM_ID=[program_id]
ORACLE_AUTHORITY_KEYPAIR=./keys/oracle.json
```

## Security Considerations

1. **Certificates are NOT committed to git** (in `.gitignore`)
2. **Environment variables never hardcoded** (use `.env` files)
3. **mTLS provides encrypted, authenticated channel** to SIX
4. **Each rate update signed by oracle authority keypair** before on-chain submission
5. **Audit logs in blockchain are immutable** - full rate history is traceable

## Compliance Value

When regulators audit AMINA's international cash pooling:

- Every OffsetEvent has a **SIX-provided exchange rate** embedded
- Rates are **time-stamped** and **immutable** on-chain
- The **audit trail is complete** - no rate manipulation possible
- **FINMA recognizes SIX rates** as official reference data

This is why institutional judges will notice NEXUS above other teams - the regulated rate integration is a key differentiator.

## Next Steps

1. Extract API endpoint URL and authentication details from `Hackathon Documentation 2026.pdf`
2. Build SIX API client with mTLS authentication
3. Create oracle poller service that feeds rates on-chain
4. Integrate with fx-netting program's `set_fx_rate` instruction
5. Deploy oracle service alongside devnet programs

---

**Files Reference:**

- `/sixapi/Hackathon Documentation 2026.pdf` - API endpoint details (TO BE READ)
- `/sixapi/Cross Currency and Precious Metals Identifiers.xlsx` - ✓ Currency pairs extracted
- `/sixapi/CH56655-api2026hack13.zip` - ✓ Certificates extracted
- `/services/six-oracle/certs/` - ✓ Secured certificate storage
