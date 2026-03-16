# SIX Oracle Service - Implementation Details

## 🎯 Overview

The SIX Oracle Service is a production-ready Node.js service that:

1. Connects to SIX Financial Information API using mTLS authentication
2. Polls for current FX rates every 30 seconds (configurable)
3. Parses SIX response data
4. Ready for integration with NEXUS on-chain programs

## 🔐 API Configuration

**Base URL:** `https://api.six-group.com/web/v2`

**Endpoint:** `/listings/marketData/intradaySnapshot`

**Authentication:** mTLS (Mutual TLS)

- Client Certificate: `certs/signed-certificate.pem`
- Private Key: `certs/private-key.pem`

**Query Parameters:**

```
scheme: VALOR_BC
ids: comma-separated list of VALOR_BC codes
preferredLanguage: EN
```

## 📊 Supported Currency Pairs

All identifiers use **VALOR_BC** scheme (valor*id + '*' + BC_code):

| Pair    | VALOR ID | BC Code | VALOR_BC   | Source                     |
| ------- | -------- | ------- | ---------- | -------------------------- |
| EUR/USD | 946681   | 148     | 946681_148 | SIX Forex Calculated Rates |
| GBP/USD | 275017   | 148     | 275017_148 | SIX Forex Calculated Rates |
| CHF/USD | 275164   | 148     | 275164_148 | SIX Forex Calculated Rates |
| USD/AED | 275159   | 148     | 275159_148 | SIX Forex Calculated Rates |
| USD/HKD | 275126   | 148     | 275126_148 | SIX Forex Calculated Rates |

## 📥 API Request Format

```http
GET https://api.six-group.com/web/v2/listings/marketData/intradaySnapshot?scheme=VALOR_BC&ids=946681_148,275017_148,275164_148,275159_148,275126_148&preferredLanguage=EN
```

**With mTLS Certificates:**

```
cert: signed-certificate.pem
key: private-key.pem
```

## 📤 API Response Format

Expected response structure:

```json
{
  "data": [
    {
      "id": "946681_148",
      "symbolValue": "EUR/USD",
      "snap": {
        "bid": 1.085,
        "ask": 1.086,
        "mid": 1.0855,
        "lastPrice": 1.0855,
        "timestamp": 1710681000000
      }
    },
    {
      "id": "275017_148",
      "symbolValue": "GBP/USD",
      "snap": {
        "bid": 1.265,
        "ask": 1.266,
        "mid": 1.2655,
        "lastPrice": 1.2655,
        "timestamp": 1710681000000
      }
    }
    // ... more pairs
  ]
}
```

## 🔄 Rate Parsing Logic

The service uses the following priority for rate selection:

1. **Mid Price** (`snap.mid`) - If available and non-null
2. **Calculated Mid** - Average of bid and ask: `(bid + ask) / 2`
3. **Last Price** (`snap.lastPrice`) - Fallback
4. **Skip** - If no valid price available, skip that pair

## ⚙️ Configuration

Create `.env` file from `.env.example`:

```env
# SIX API Configuration
SIX_API_URL=https://api.six-group.com/web/v2
SIX_TEAM_ID=CH56655
SIX_CERT_PATH=./certs/signed-certificate.pem
SIX_KEY_PATH=./certs/private-key.pem
SIX_CERT_PASSWORD=sixhackathon2026

# Poll Configuration
SIX_POLL_INTERVAL_MS=30000
SIX_RATE_STALENESS_THRESHOLD=3600000

# Solana Configuration (for on-chain integration)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
FX_NETTING_PROGRAM_ID=
ORACLE_AUTHORITY_KEYPAIR=../../solana-keypairs/oracle-authority.json
```

## 🚀 Service Startup

```bash
# Navigate to service directory
cd services/six-oracle

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run service
npm start

# Or development mode (with ts-node)
npm run dev
```

## 📈 Output Example

```
╔════════════════════════════════════════════════╗
║      SIX Financial Information Oracle           ║
╚════════════════════════════════════════════════╝

Configuration:
  API URL: https://api.six-group.com/web/v2
  Poll Interval: 30000ms
  Stale Threshold: 3600000ms (60.0 min)
  Monitored Pairs: EUR/USD, GBP/USD, CHF/USD, USD/AED, USD/HKD
  Certificate Path: ./certs/signed-certificate.pem

🚀 Starting oracle polling service...

📡 [Poll #1] Fetching rates from SIX...
   Endpoint: /listings/marketData/intradaySnapshot
   IDs: 946681_148,275017_148,275164_148,275159_148,275126_148
   ✓ Successfully fetched 5 rates

📊 Exchange Rates [2026-03-16T15:30:45.123Z]
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Pair        │ Rate         │ Bid          │ Ask          │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ EUR/USD     │ 1.085500     │ 1.085000     │ 1.086000     │
│ GBP/USD     │ 1.265500     │ 1.265000     │ 1.266000     │
│ CHF/USD     │ 1.125400     │ 1.125000     │ 1.125800     │
│ USD/AED     │ 3.672500     │ 3.672000     │ 3.673000     │
│ USD/HKD     │ 7.855300     │ 7.854800     │ 7.855800     │
└─────────────┴──────────────┴──────────────┴──────────────┘

✓ SIX Oracle Service is running. Press Ctrl+C to stop.
```

## 🔗 Integration with NEXUS

### Next Steps:

1. **Implement `submitRatesOnChain()` method** - Call fx-netting program's `set_fx_rate` instruction
2. **Setup Solana RPC** - Configure SOLANA_RPC_URL in .env
3. **Get Program ID** - After deploying fx-netting program to devnet, update FX_NETTING_PROGRAM_ID
4. **Sign Transactions** - Use ORACLE_AUTHORITY_KEYPAIR to sign rate updates
5. **Run Continuously** - Deploy oracle service alongside blockchain programs

### Rate Submission Flow:

```
SIX API
  ↓
Fetch Rates (every 30s)
  ↓
Parse & Validate
  ↓
Submit to fx-netting via set_fx_rate instruction
  ↓
RateUpdatedEvent emitted on-chain
  ↓
Audit trail recorded (immutable)
```

## 🔍 Error Handling

- **Certificate Errors**: Service fails fast at startup if certificates not found
- **API Errors**: Logged and falls back to last known rates (up to 3 retries)
- **Stale Rates**: Detected if older than threshold (default 1 hour)
- **Missing Prices**: Pair skipped with warning if no valid price available
- **Parse Errors**: Gracefully handled, service continues running

## 📊 Service Statistics

Access via `getStats()` method:

```typescript
const stats = oracle.getStats();
console.log({
  pollCount: 123, // Total polls attempted
  errorCount: 0, // Current error streak
  lastUpdate: 1710681045123, // Timestamp of last successful update
  lastRatesValid: true, // Whether last rates are valid
  rateCount: 5, // Number of rates in last snapshot
});
```

## 🔐 Security Considerations

1. **Certificates Protected**: 600 permission bits, never committed to git
2. **mTLS Encryption**: All communication encrypted and mutually authenticated
3. **No Secrets in Code**: All sensitive data in .env (gitignored)
4. **Rate Validation**: Staleness checks prevent using outdated data
5. **Error Recovery**: Graceful fallback and retry logic

## 📚 References

- SIX API Docs: https://api.six-group.com/web/v2 (requires mTLS)
- Hackathon Documentation: `/sixapi/Hackathon Documentation 2026.pdf`
- Currency List: `/sixapi/Cross Currency and Precious Metals Identifiers.xlsx`
- Certificate Details: `/docs/SIX_INTEGRATION.md`

---

**Status**: ✅ Production-ready oracle service with real SIX API integration  
**Next**: Implement on-chain integration with fx-netting program
