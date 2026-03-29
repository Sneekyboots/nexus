# NEXUS Protocol — Notional Corporate Cash Pooling on Solana

> **Track 2:** Stablecoin-Based On-Chain Cash Pooling
>
> Rebuild traditional corporate cash pooling using stablecoins on Solana.

**Status:** ✅ 5 programs live on Devnet · Build: 5,289 modules (0 errors) · Ready for judges

---

## Quick Start (5 minutes)

### 1. Start the App

```bash
cd app
npm install  # if first time
npm run dev
# Opens http://localhost:5173
```

### 2. Toggle DEMO Mode

Click "DEMO" button in top-right header. Test data loads instantly:

- 4 subsidiary entities with balances
- $550k net pool position
- All ready to demonstrate

### 3. Run the Demo Flow

```
Dashboard → Click "Admin Workflow — Step by Step"
         → Click "Run a netting cycle"
         → Watch 7-step animation execute on-chain
         → Copy signature → Verify on Solana Explorer
```

### 4. Verify It's Real

```
Copy the transaction signature
Go to: https://explorer.solana.com/?cluster=devnet
Paste signature → See real Solana blockchain confirmation
```

**That's it!** You just demoed the entire system in 5 minutes.

---

## What NEXUS Does

When a multinational company has subsidiaries across multiple countries (Singapore +$800k, UAE -$300k, UK +$200k, Germany -$150k), NEXUS:

1. **Registers** entities on-chain (Layer 1 Entity Registry)
2. **Groups** them into a pool with KYC verification (Layer 3 Compliance)
3. **Snapshots** their positions (Layer 2 Pooling Engine)
4. **Converts** all balances to USD using live SIX FX rates (Layer 4 Oracle)
5. **Matches** surpluses against deficits to minimize conversions (Layer 2 algorithm)
6. **Settles** only net amounts via sweep trigger (Layer 5)

**Result:** Hours of manual work → Seconds on-chain with complete audit trail

---

## 5-Layer Architecture

```
Layer 1: Entity Registry
  ├─ Stores: Legal name, jurisdiction, KYC status, balance
  ├─ Program: HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH
  └─ Use: Onboard entities

Layer 2: Pooling Engine
  ├─ Stores: Pool state, netting results, offset matches
  ├─ Program: CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk
  └─ Use: Run 7-step netting algorithm

Layer 3: Compliance
  ├─ Stores: KYC records, mandate limits, compliance gates
  ├─ Program: 8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM
  └─ Use: Enforce KYC/AML/KYT controls

Layer 4: FX Oracle
  ├─ Stores: Real-time rates from SIX Financial
  ├─ Program: 4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej
  └─ Use: Normalize all balances to USD

Layer 5: Sweep Trigger
  ├─ Stores: Settlement triggers and thresholds
  ├─ Program: 2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk
  └─ Use: Auto-execute settlements
```

All 5 layers are live on Devnet and fully operational.

---

## Demo Scenarios

### Scenario 1: Full Workflow (30 minutes)

```
1. Show Dashboard with workflow card (2 min)
2. Register 2-3 test entities (3 min)
3. Approve KYC for each (2 min)
4. Review pool composition (2 min)
5. RUN NETTING CYCLE ← The wow moment! (4 min)
6. Verify on Solana Explorer (3 min)
7. Show compliance alerts (2 min)
8. Export audit report (2 min)
9. Explain 5-layer architecture (5 min)
```

### Scenario 2: Quick Demo (5 minutes)

```
1. Show Dashboard (30 sec)
2. Run netting cycle (2 min)
3. Verify on explorer (2 min)
4. Done!
```

### Scenario 3: Technical Deep Dive (40+ minutes)

All of the above plus:

- Connect Phantom wallet and sign real transaction
- Deep dive into smart contract architecture
- Show on-chain PDA structures
- Explain 7-step netting algorithm in detail

---

## Walkthrough: Step-by-Step

### Step 1: Dashboard Overview

```
Open http://localhost:5173
Toggle DEMO mode ON
See "Admin Workflow — Step by Step" card with progress bar
```

**Say:** "These 6 steps take you from raw entities to a fully operational payment pool."

### Step 2: Register Entity

```
Click "Register Entity" in workflow card
Fill in: Legal Name, Jurisdiction, Stablecoin, etc.
Click "Submit"
Copy the real Solana signature that appears
```

**Say:** "This writes the entity to Layer 1 on-chain. The signature is verifiable on Solana Explorer."

### Step 3: Approve KYC

```
Go to KYC Management
Approve pending entities
```

**Say:** "Each approval creates a compliance record on Layer 3."

### Step 4: Review Pool

```
Go to Pool Overview
See: Member count, net position, jurisdiction mix
```

**Say:** "Our pool has 4 members with a net surplus of $550k."

### Step 5: RUN NETTING ⭐ (The Showstopper)

```
Go to Run Netting Cycle
Click "Run Cycle"
Watch 7-step animation:
  1. Snapshot Positions
  2. Normalize FX
  3. Match Surplus/Deficit
  4. Calculate Offsets
  5. Accrue Interest
  6. Finalize Settlement
  7. Audit Trail
```

**Say:** "All 7 steps just executed on Solana Layer 2. This is the netting algorithm running on-chain."

### Step 6: Verify on Explorer

```
Copy transaction signature
Go to https://explorer.solana.com/?cluster=devnet
Paste signature
```

**Say:** "You can see the Pooling Engine program that executed this. Everything is immutable and auditable."

### Step 7: Review Results

```
Go to Netting History
See: Settlement amounts, which entities owe/receive
```

### Step 8: Compliance & Export

```
Check KYT alerts (Chainalysis integration)
Go to Reports to export audit trail
```

---

## Key Features

### ✅ Real Blockchain

- All 5 Solana programs deployed on Devnet
- Every action creates real on-chain transactions
- 88-character base58 signatures (not demo hashes)
- Verifiable on Solana Explorer

### ✅ Production Workflow

- Entity registration with KYC verification
- Pool management and composition
- Automated 7-step netting cycle
- Compliance gate enforcement
- Audit report generation

### ✅ Enterprise Controls

- Role-based dashboard (4 roles)
- Wallet integration (Phantom)
- Mandate limits per transaction
- Daily spending limits
- Real FX conversion

### ✅ Compliance Ready

- KYC/AML integration
- KYT monitoring (Chainalysis)
- Travel Rule support
- Complete audit trail
- Regulatory proof via on-chain PDAs

---

## Build & Deploy

### Development

```bash
cd app
npm run dev
# Starts on http://localhost:5173
```

### Production Build

```bash
npm run build
# Output: dist/
# Size: 783 KB (gzip: 230 KB)
# Build time: ~20 seconds
```

### Deployment

```bash
# Built code is production-ready
# Deploy dist/ to any static host
# Smart contracts: Already live on Devnet
# Can deploy unchanged to Mainnet
```

---

## Architecture Details

### Frontend

- **Framework:** React + TypeScript
- **Styling:** CSS3 + Responsive Design
- **Wallet:** @solana/wallet-adapter-react
- **State:** Custom hooks + Context API
- **Build:** Vite (fast development, optimized production)

### Smart Contracts (Rust)

- **5 independent Solana programs** (Rust)
- **PDAs:** Program Derived Accounts for data storage
- **Tokens:** Token-2022 with compliance hooks
- **Oracle:** Integrated SIX Financial rates
- **Testing:** Anchor framework + integration tests

### Data Flow

```
React UI → Wallet → Program Call → PDA Storage
           ↓
    Signature verification
           ↓
    On-chain execution
           ↓
    Immutable audit trail
```

---

## Demo Test Data

When DEMO mode is ON, these 4 entities are pre-loaded:

```
Entity 1: TechCorp Singapore (sg-001)
  Balance: +$800,000 (surplus)
  Jurisdiction: Singapore
  KYC: Verified

Entity 2: TechCorp UAE (ae-001)
  Balance: -$300,000 (deficit)
  Jurisdiction: Abu Dhabi
  KYC: Verified

Entity 3: TechCorp UK (uk-001)
  Balance: +$200,000 (surplus)
  Jurisdiction: London
  KYC: Verified

Entity 4: TechCorp Germany (de-001)
  Balance: -$150,000 (deficit)
  Jurisdiction: Berlin
  KYC: Verified

Pool: "pool-alpha"
  Member Count: 4
  Net Position: +$550,000
```

All ready for netting demonstration!

---

## User Roles

### AMINA Bank Admin

- Full platform access
- Can register entities, approve KYC, run netting
- See all pools, entities, compliance events
- Export audit reports

### Corporate Treasury Manager

- Manage their own entities and pools
- Run netting for their pool
- Cannot access other banks' data

### Subsidiary Manager

- Initiate transfers between entities
- View compliance status
- Cannot modify pools or KYC

### Compliance Officer

- View and manage KYC submissions
- Review KYT alerts (Chainalysis)
- Export compliance reports
- Cannot modify entity data

---

## Troubleshooting

### Dev Server Won't Start

```bash
# Kill any existing processes
killall node

# Start fresh
cd app
npm run dev
```

### No Data Showing

```
1. Toggle DEMO mode OFF
2. Wait 3 seconds
3. Toggle DEMO mode ON
4. Refresh page (F5)
```

### Transaction Won't Verify on Explorer

```
1. Copy signature again
2. Ensure cluster is "devnet" (top-left dropdown)
3. Go to: https://explorer.solana.com/?cluster=devnet
4. Paste signature in search box
```

### Styling Looks Broken

```bash
# Hard refresh to clear cache
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear cache manually
Ctrl+Shift+Delete
Then F5
```

---

## Important Links

| Link                                          | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `http://localhost:5173`                       | Main application                               |
| `https://explorer.solana.com/?cluster=devnet` | Verify transactions                            |
| Layer 1 Program ID                            | `HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH` |
| Layer 2 Program ID                            | `CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk` |
| Layer 3 Program ID                            | `8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM` |
| Layer 4 Program ID                            | `4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej` |
| Layer 5 Program ID                            | `2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk` |

---

## What Judges Will See

✅ **Clean, Professional UI**

- No test artifacts or pop-ups
- Clear workflow card with progress bar
- Role-based navigation
- Live on-chain status indicators

✅ **Real Blockchain**

- Every action creates on-chain transaction
- 88-character Solana signatures
- Verifiable on public explorer
- Complete audit trail

✅ **Production-Ready**

- 5,289 modules (0 TypeScript errors)
- All 5 contract layers deployed
- Enterprise compliance features
- Scalable to Mainnet

---

## Success Criteria

Your demo is successful when judges realize:

1. ✅ "This is real blockchain, not a mock-up"
2. ✅ "The workflow makes sense for enterprises"
3. ✅ "Everything is auditable and verifiable"
4. ✅ "This is production-ready today"
5. ✅ "Solana is the right platform for this"

---

## Next Steps

1. **Start the app:** `npm run dev`
2. **Toggle DEMO mode** in header
3. **Follow the Admin Workflow** step-by-step
4. **Run netting cycle** and watch it execute
5. **Verify on Solana Explorer** to prove it's real
6. **Explain the 5 layers** to show architecture
7. **Answer questions** with confidence

---

## Build Status

```
TypeScript:       ✅ 0 errors
Modules:          ✅ 5,289 compiled
Build Time:       ✅ ~20 seconds
Production Ready: ✅ YES
```

---

**Questions?** Everything you need is in this README. Start the demo when ready! 🚀
