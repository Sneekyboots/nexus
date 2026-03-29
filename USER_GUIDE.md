# NEXUS Protocol — User Guide

## Quick Navigation

- [Dashboard Overview](#dashboard-overview)
- [Role-Based Access](#role-based-access)
- [Demo Mode vs Live Mode](#demo-mode-vs-live-mode)
- [How to Register an Entity](#how-to-register-an-entity)
- [How to Run a Netting Cycle](#how-to-run-a-netting-cycle)
- [How to Initiate a Transfer](#how-to-initiate-a-transfer)
- [Understanding the 7-Step Netting Algorithm](#understanding-the-7-step-netting-algorithm)
- [Understanding the 6 Compliance Gates](#understanding-the-6-compliance-gates)
- [Explorer Links](#explorer-links)

---

## Dashboard Overview

**URL:** http://localhost:5173

The NEXUS dashboard provides a complete cross-border stablecoin treasury management interface. It consists of:

- **Left Sidebar:** Navigation menu with role-based access
- **Header Bar:** Demo/Live toggle, network status, wallet connection
- **Main Content:** Role-specific dashboard and pages

### Dashboard Home

The main dashboard shows:

- **USD Settlement Cost Savings** — Total savings vs traditional banking
- **Pool Status** — Net position, entity count, netting frequency
- **Recent Transfers** — Latest transactions with status
- **Layer Status** — Health check of all 5 on-chain programs
- **Compliance Events** — Recent KYC, KYT, and AML alerts

---

## Role-Based Access

Each role has a tailored experience with specific permissions:

### 1. AMINA Bank Admin (Gold Badge)

**Access Level:** Full admin

| Page                | Access                        |
| ------------------- | ----------------------------- |
| Dashboard           | Full view with all metrics    |
| All Entities        | View, register, KYC, mandates |
| Register New Entity | ✓ Create new entities         |
| KYC Management      | ✓ Approve/reject KYC          |
| Mandate Controls    | ✓ Set limits per entity       |
| Pools               | Full pool management          |
| Netting             | Run cycles, view history      |
| Transfers           | Initiate transfers            |
| Compliance          | Full event feed, KYT alerts   |
| FX Rates            | View live rates               |
| Loans               | View, create, repay           |
| Reports             | Full audit export             |

**Walkthrough Steps:**

1. Onboard client entities
2. Manage the liquidity pool
3. Run netting cycles
4. Monitor compliance events
5. Export regulatory reports

---

### 2. Corporate Treasury (Blue Badge)

**Access Level:** Business operations

| Page                | Access                      |
| ------------------- | --------------------------- |
| Dashboard           | Treasury overview           |
| All Entities        | View only                   |
| Register New Entity | ✓ Register new subsidiaries |
| KYC Management      | ✗ No access                 |
| Mandate Controls    | ✓ Set limits                |
| Pools               | Full pool view              |
| Netting             | Run cycles, view history    |
| Transfers           | ✓ Initiate transfers        |
| Compliance          | View event feed only        |
| FX Rates            | ✓ View rates                |
| Loans               | ✓ Manage loans              |
| Reports             | ✗ No access                 |

**Walkthrough Steps:**

1. View registered entities
2. Check pool positions
3. Run netting cycles
4. Initiate transfers
5. Monitor FX rates

---

### 3. Subsidiary Manager (Green Badge)

**Access Level:** Operational

| Page                | Access                |
| ------------------- | --------------------- |
| Dashboard           | Summary view          |
| All Entities        | View only (read-only) |
| Register New Entity | ✗ No access           |
| KYC Management      | ✗ No access           |
| Mandate Controls    | ✗ No access           |
| Pools               | ✗ No access           |
| Netting             | ✗ No access           |
| Transfers           | ✓ Initiate transfers  |
| Compliance          | ✓ View event feed     |
| FX Rates            | ✗ No access           |
| Loans               | ✗ No access           |
| Reports             | ✗ No access           |

**Walkthrough Steps:**

1. View assigned entities
2. Initiate cross-border transfers
3. Monitor compliance events

---

### 4. Compliance Officer (Purple Badge)

**Access Level:** Regulatory & compliance

| Page                | Access                        |
| ------------------- | ----------------------------- |
| Dashboard           | Compliance summary            |
| All Entities        | View with KYC details         |
| Register New Entity | ✗ No access                   |
| KYC Management      | ✓ Full KYC management         |
| Mandate Controls    | ✓ View mandates               |
| Pools               | ✗ No access                   |
| Netting             | View history only             |
| Transfers           | ✗ No access                   |
| Compliance          | ✓ Full event feed, KYT alerts |
| FX Rates            | ✗ No access                   |
| Loans               | ✗ No access                   |
| Reports             | ✓ Full audit export           |

**Walkthrough Steps:**

1. Review entity KYC status
2. Monitor compliance events
3. Investigate KYT alerts
4. Export audit reports

---

## Demo Mode vs Live Mode

### Demo Mode (Default)

- All data is pre-populated
- 6 demo entities with balances
- No wallet connection required
- Instant setup for demonstrations

**When to use:**

- Showing the full UI to judges
- Testing workflows without blockchain
- Quick demonstrations

### Live Mode

- Connects to Solana Devnet
- Real on-chain data only
- Phantom wallet required
- Actions write to blockchain

**When to use:**

- Proving real blockchain integration
- Testing with actual transactions
- Live demonstrations

### Switching Modes

1. Look for the **Demo/Live toggle** in the top-right header
2. Click to switch between modes
3. In Live mode, connect your Phantom wallet

---

## How to Register an Entity

### Via Dashboard (Demo Mode)

1. Click **Register New Entity** in the sidebar
2. Complete the 4-step form:

#### Step 1: Basic Information

- Entity ID (auto-generated or custom)
- Legal Name
- Jurisdiction (select from list)
- Currency (USD, EUR, GBP, CHF, AED, SGD, HKD)

#### Step 2: KYC Setup

- Select KYC Provider (SumSub, Onfido, or Jumio)
- Enter Compliance Officer wallet address
- Option to add to pool immediately

#### Step 3: Mandate Limits

- Max Single Transfer (USD)
- Max Daily Aggregate (USD)

#### Step 4: Review & Submit

- Review all details
- Submit registration

### Via On-Chain (Live Mode)

Entities can be registered directly on Solana:

```javascript
// Register entity on-chain
const tx = await program.methods
  .registerEntity(entityId, "Entity Legal Name")
  .accounts({
    entityRecord: entityPda,
    registrar: payer.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Verify KYC
await program.methods
  .verifyEntity(entityId, expiryTimestamp)
  .accounts({
    entityRecord: entityPda,
    kycOracle: payer.publicKey,
  })
  .rpc();
```

**On-Chain Verification:**

- Entity PDA: `Gs8VEPPK7SqKCwFkEYcjUj7N1pbyW7RL4LZPpDfK8sbx`
- Explorer: https://explorer.solana.com/tx/2okTXFFp... (register)
- Explorer: https://explorer.solana.com/tx/3SHzmEur... (verify KYC)

---

## How to Run a Netting Cycle

### What is Netting?

Netting is the process of offsetting opposing positions between entities within a pool. Instead of each entity settling individually, positions are matched to minimize actual transfers.

**Example:**

- Entity A has +$800,000
- Entity B has -$300,000
- After netting: Entity A transfers $300,000 to Entity B
- Result: Net settlement = $300,000 (vs $1,100,000 without netting)

### Via Dashboard

1. Navigate to **Netting** → **Run Cycle**
2. Select the pool (e.g., TechCorp Global Pool)
3. Review current positions
4. Click **"Run Netting Cycle"**

### The 7-Step Process

| Step | Description                                                        |
| ---- | ------------------------------------------------------------------ |
| 1    | Position Snapshot — Read all entity balances                       |
| 2    | FX Normalisation — Convert to USD using SIX rates                  |
| 3    | Surplus/Deficit Classification — Categorize positions              |
| 4    | Greedy Offset Matching — Pair largest surplus with largest deficit |
| 5    | Interest Accrual — Calculate 4.5% APR on positive positions        |
| 6    | Sweep Threshold Check — Trigger loans if threshold exceeded        |
| 7    | Finalise — Write results to on-chain PoolState                     |

### Viewing History

Navigate to **Netting** → **Cycle History** to see:

- Past netting cycles
- Offset matches created
- Interest accrued
- Transaction hashes

---

## How to Initiate a Transfer

### Prerequisites

1. Both entities must be:

   - KYC Verified
   - Active (not suspended)
   - Members of the same pool

2. Transfer must pass all 6 compliance gates

### Via Dashboard

1. Navigate to **Transfers** → **Initiate Transfer**
2. Fill in the form:

   - **From Entity:** Sender's entity
   - **To Entity:** Recipient's entity
   - **Amount:** USD amount to transfer
   - **Currency:** Source currency
   - **Reference:** Optional memo

3. Click **"Submit Transfer"**

### Compliance Gate Results

After submission, see results for all 6 gates:

| Gate              | Check                        | Your Result |
| ----------------- | ---------------------------- | ----------- |
| KYC Check         | Entity verified              | ✓/✗         |
| KYT / Chainalysis | Transaction screened         | ✓/✗         |
| AML Score         | Risk below threshold         | ✓/✗         |
| Travel Rule       | Beneficiary info present     | ✓/✗         |
| Daily Limit       | Within daily aggregate       | ✓/✗         |
| Transfer Limit    | Within single transfer limit | ✓/✗         |

### If All Gates Pass

- Transfer is approved
- Event logged to compliance feed
- Audit trail created on-chain

### If Any Gate Fails

- Transfer is blocked
- Failure reason displayed
- Event logged for compliance review

---

## Understanding the 7-Step Netting Algorithm

The netting algorithm runs atomically on-chain via CPI (Cross-Program Invocation):

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETTING CYCLE EXECUTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: POSITION SNAPSHOT                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Entity A: +$800,000 USD                               │    │
│  │  Entity B: -$300,000 USD                               │    │
│  │  Entity C: +$200,000 GBP  →  $265,400 USD             │    │
│  │  Entity D: -$150,000 EUR  →  $172,050 USD             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 2: FX NORMALISATION                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  All positions converted to USD using SIX oracle       │    │
│  │  GBP/USD: 1.3270  |  EUR/USD: 1.1470                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 3: CLASSIFICATION                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Surplus: Entity A ($800k), Entity C ($265k)          │    │
│  │  Deficit:  Entity B ($300k), Entity D ($172k)          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 4: OFFSET MATCHING                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Match 1: Entity A → Entity B  = $300,000             │    │
│  │  Match 2: Entity C → Entity D  = $172,050             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 5: INTEREST ACCRUAL                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Entity A: $800,000 × 4.5% APR = $360/day            │    │
│  │  Entity C: $265,400 × 4.5% APR = $119/day            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 6: SWEEP CHECK                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Threshold: $1,000,000                                 │    │
│  │  Total Deficit: $472,050 < Threshold → No sweep      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  Step 7: FINALISE                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PoolState updated on-chain                            │    │
│  │  NettingComplete event emitted                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Understanding the 6 Compliance Gates

Every transfer passes through 6 mandatory gates enforced by the L3 Compliance Hook:

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE GATE ENFORCEMENT                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Transfer Request Received                                       │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 1: KYC     │ → Is entity KYC Verified & not expired?    │
│  │    [✓ PASSED]   │ → If NO → Transaction REVERTS             │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 2: KYT     │ → Chainalysis screening result?           │
│  │    [✓ PASSED]   │ → If NO → Transaction REVERTS            │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 3: AML     │ → AML risk score below threshold?         │
│  │    [✓ PASSED]   │ → If NO → Transaction REVERTS            │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 4: Travel  │ → Beneficiary info present (> $1k)?       │
│  │     Rule        │ → If NO → Transaction REVERTS            │
│  │    [✓ PASSED]   │                                           │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 5: Daily   │ → daily_used + amount ≤ max_daily?         │
│  │    Limit       │ → If NO → Transaction REVERTS            │
│  │    [✓ PASSED]   │                                           │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  ┌──────────────────┐                                           │
│  │ Gate 6: Single  │ → amount ≤ max_single_transfer?          │
│  │    Transfer     │ → If NO → Transaction REVERTS            │
│  │    [✓ PASSED]   │                                           │
│  └──────────────────┘                                           │
│          ↓                                                       │
│  Transfer Approved — Audit Event Emitted                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Event: TransferApproved                               │    │
│  │  From: Entity A  |  To: Entity B                       │    │
│  │  Amount: $300,000 | Timestamp: 2026-03-19T10:30:00Z   │    │
│  │  TxHash: 3SHzmEur...                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Explorer Links

### On-Chain Programs

| Program         | Devnet Explorer Link                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Entity Registry | [Solscan](https://solscan.io/account/HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH?cluster=devnet) |
| Pooling Engine  | [Solscan](https://solscan.io/account/CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk?cluster=devnet) |
| Compliance Hook | [Solscan](https://solscan.io/account/8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM?cluster=devnet) |
| FX Netting      | [Solscan](https://solscan.io/account/4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej?cluster=devnet) |
| Sweep Trigger   | [Solscan](https://solscan.io/account/2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk?cluster=devnet) |

### Verified Transactions

| Action              | Transaction                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity Registration | [2okTXFFp...](https://explorer.solana.com/tx/2okTXFFpLX5xuVvhv44zWcKS4xrxnoRDBxTwAgbxABZEHgG1kQNcoZwrpJKEah3yNT4oCknDmx6JruCG5Kqqox3o?cluster=devnet) |
| KYC Verification    | [3SHzmEur...](https://explorer.solana.com/tx/3SHzmEur24hTCbBXeCs5shJ8VqKH6kQ8Cro7mZZUkxqeQCXd4G9ghXBK9Hpvd51i1pR9aPvxCjvYS2thfWs3bZ3j?cluster=devnet) |

### Registered Entity

| Entity                     | PDA Address                                    |
| -------------------------- | ---------------------------------------------- |
| TechCorp Singapore Pte Ltd | `Gs8VEPPK7SqKCwFkEYcjUj7N1pbyW7RL4LZPpDfK8sbx` |

---

## Need Help?

### Troubleshooting

**Dashboard not loading?**

```bash
cd app
npm run dev
```

**Live mode not working?**

- Ensure Phantom wallet is connected
- Check network is set to Solana Devnet
- Verify wallet has SOL for transactions

**SIX FX rates showing as stale?**

```bash
cd services/six-oracle
python3 oracle.py --once
```

### Key Files

| File                                  | Purpose                       |
| ------------------------------------- | ----------------------------- |
| `app/src/services/nexusService.ts`    | Main data service             |
| `app/src/services/solanaClient.ts`    | On-chain data fetching        |
| `programs/entity-registry/src/lib.rs` | Entity registration program   |
| `programs/pooling-engine/src/lib.rs`  | Netting algorithm program     |
| `programs/compliance-hook/src/lib.rs` | 6-gate compliance enforcement |
