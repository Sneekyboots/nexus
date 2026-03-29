# NEXUS Protocol - NodeOps Deployment Guide

## Overview

The NEXUS Protocol application is ready for production deployment on NodeOps. The deployment consists of:

- **Frontend**: Static React/Vite application (app/dist)
- **Optional Oracle Service**: Python FX rate provider (services/six-oracle)

## Build Status

✅ **Production Build**: PASSED

- 0 TypeScript errors
- 5,289 modules compiled
- Minified + gzipped: 227 KB (main JS bundle)
- Build artifacts ready in: `app/dist/`

## Deployment Steps on NodeOps

### Step 1: Create Frontend Service (Static Site)

**Service Type**: Static Site  
**Build Command**: `cd app && npm install && npm run build`  
**Output Directory**: `app/dist`

**Environment Variables**:

```
VITE_RPC_URL=https://api.devnet.solana.com
VITE_FX_ORACLE_URL=<oracle-url-if-deployed>
```

**Configuration**:

- Route all requests to `index.html` for SPA routing
- Enable gzip compression
- Cache static assets with max-age=31536000

### Step 2: (Optional) Deploy Oracle Service

**Service Type**: Background Worker / Server  
**Build Command**: `pip install -r services/six-oracle/requirements.txt`  
**Start Command**: `cd services && python3 six-oracle/oracle.py`  
**Port**: 7070

**Environment Variables**:

```
SOLANA_RPC_URL=https://api.devnet.solana.com
SIX_API_URL=https://api.six-group.com/web/v2
SIX_TEAM_ID=<secret>
SIX_CERT_PATH=./services/six-oracle/certs/signed-certificate.pem
SIX_KEY_PATH=./services/six-oracle/certs/private-key.pem
ORACLE_AUTHORITY_KEYPAIR=./solana-keypairs/oracle-authority.json
LOG_LEVEL=INFO
```

**Note**: SIX Financial credentials are enterprise-only. Contact SIX for API access.

### Step 3: Update Frontend Environment Variables

After deploying services, set:

- `VITE_RPC_URL`: Point to production Solana RPC (devnet by default)
- `VITE_FX_ORACLE_URL`: Point to deployed oracle service (if applicable)

If oracle service is unavailable, app gracefully falls back to mock FX rates.

## Deployment Architecture

```
NodeOps
├── Frontend Service (Static)
│   ├── React/Vite SPA
│   ├── Wallet integration (Phantom, MetaMask)
│   ├── Connects to Solana devnet
│   └── Optional: Calls oracle service for FX rates
│
└── Oracle Service (Optional)
    ├── Python FastAPI
    ├── Fetches real FX rates from SIX Financial
    ├── Updates on-chain via Solana RPC
    └── Falls back to mock rates if SIX unavailable
```

## Application Modes

### DEMO Mode (Default)

Pre-seeded test data with 4 entities:

- Singapore (SGD)
- UK (GBP)
- Eurozone (EUR)
- UAE (AED)

All positions and transactions are simulated. Perfect for demos and testing.

### LIVE Mode

Users register entities locally. The app:

1. Stores registrations in browser localStorage
2. Fetches on-chain entities from Solana devnet
3. Merges local + on-chain (local takes priority)
4. Supports real netting cycles and transfers

## Key Features Deployed

✅ **Entity Management**

- Register corporate entities with KYC documents
- Supports: Certificate of Incorporation, Business License, Tax ID, Bank Charter
- ZK proof generation for document verification

✅ **Pool Operations**

- Create liquidity pools with configurable currencies
- Automated netting with 7-step animation
- Real-time position tracking

✅ **Compliance**

- KYC verification workflow
- Mandate limits per entity
- Compliance event logging
- Alert system for policy violations

✅ **FX Netting**

- Real or mock FX rates
- Automatic currency conversion
- Settlement tracking

## Testing Checklist

After deployment, verify:

- [ ] Frontend loads at deployed URL
- [ ] Wallet connection works (Phantom/MetaMask)
- [ ] Entity registration form accepts corporate documents
- [ ] DEMO mode shows 4 pre-seeded entities
- [ ] Can switch to LIVE mode and register new entity
- [ ] Registered entity persists in localStorage
- [ ] Netting cycle animation runs smoothly
- [ ] FX rates display (real or mock)
- [ ] Pool operations show realistic balances

## Performance

**Frontend Bundle Size**: ~800 KB (uncompressed)

- Main JS: 770 KB
- CSS: 83 KB
- HTML + assets: ~1 KB

**Recommended Hosting**:

- NodeOps static sites (gzip-enabled)
- CDN for edge distribution
- Minimum 2 vCPU, 2 GB RAM

## Security Notes

⚠️ **Important**: The following are NOT stored on-chain:

- User keypairs (stored in wallet extension only)
- Document proofs (hashed with SHA-256 for privacy)
- Transaction signatures (managed by Solana runtime)

✅ **On-Chain Verifiable**:

- Entity registrations
- Pool memberships
- Netting history
- Compliance events

## Troubleshooting

**Issue**: Frontend fails to load  
**Solution**: Check that build artifacts exist in `app/dist/` and static file serving is enabled

**Issue**: Wallet connection fails  
**Solution**: Verify `VITE_RPC_URL` points to correct Solana network (devnet)

**Issue**: Entity registration shows error  
**Solution**: Check browser console for ZK proof generation errors; verify document hash is valid

**Issue**: FX rates show as 0  
**Solution**: Oracle service unavailable; app using mock rates. This is expected behavior.

## Rollback Plan

If issues occur post-deployment:

1. Revert to previous build: `git checkout HEAD~1 -- app/dist/`
2. Redeploy frontend service
3. Clear browser cache and localStorage if needed
4. Verify in DEMO mode first

## Next Steps

1. Deploy frontend to NodeOps
2. Test with DEMO mode (no wallet needed)
3. Connect wallet and test LIVE mode
4. (Optional) Deploy oracle service if SIX credentials available
5. Monitor logs for errors

---

**Questions?** See README.md or DEMO_SCRIPT.md for detailed instructions.
