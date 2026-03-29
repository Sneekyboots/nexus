# NEXUS Demo - Quick Reference Card

## Pre-Demo Checklist

- [ ] Dev server running on localhost:5173 (or 5174/5175)
- [ ] Have Solana Explorer open in separate tab: https://explorer.solana.com/?cluster=devnet
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Turn on DEMO mode to load test data
- [ ] Have a copy of DEMO_SCRIPT.md open
- [ ] Optional: Phantom wallet installed and on Devnet

## URLs Reference

```
App:              http://localhost:5173
Dashboard:        http://localhost:5173/
Register Entity:  http://localhost:5173/entities/register
KYC Management:   http://localhost:5173/entities/kyc
Pool Overview:    http://localhost:5173/pools
Run Netting:      http://localhost:5173/netting/run
Netting History:  http://localhost:5173/netting/history
Transfers:        http://localhost:5173/transfers
KYT Alerts:       http://localhost:5173/compliance/kyt
Audit Report:     http://localhost:5173/reports
```

## Demo Data (Pre-loaded in DEMO mode)

```
Entity 1: TechCorp Singapore (sg-001)
  - Balance: +$800,000
  - Jurisdiction: SG
  - Status: verified

Entity 2: TechCorp UAE (ae-001)
  - Balance: -$300,000
  - Jurisdiction: AE
  - Status: verified

Entity 3: TechCorp UK (uk-001)
  - Balance: +$200,000
  - Jurisdiction: GB
  - Status: verified

Entity 4: TechCorp Germany (de-001)
  - Balance: -$150,000
  - Jurisdiction: DE
  - Status: verified

Pool: "pool-alpha"
  - Members: 4
  - Net Position: +$550,000
```

## Key Solana Program IDs (Can Click in Explorer)

```
Layer 1 (Entity):      HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH
Layer 2 (Pooling):     CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk
Layer 3 (Compliance):  8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM
Layer 4 (FX Oracle):   4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej
Layer 5 (Sweep):       2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk
```

## Step-by-Step Shortcut Path

```
1. Open Dashboard: http://localhost:5173
2. Toggle DEMO mode ON (header button)
3. Show "Admin Workflow" card on Dashboard
4. Click "Run Netting Cycle"
5. Watch 7-step animation
6. Copy signature and verify on Explorer
7. Go to /netting/history to show results
8. Explain each layer (Point to "Solana Program Status")
```

## Live Transaction Feed

```
Dashboard > Scroll down to "Live On-Chain Transactions"
Auto-refreshes every 15 seconds
Shows real Pooling Engine program activity
```

## Role Login Credentials

```
All roles have DEMO access by default:
- AMINA Bank Admin
- Corporate Treasury Manager
- Subsidiary Manager
- Compliance Officer

Demo data pre-populated for all roles
```

## What to Say at Each Step

**Dashboard Introduction:**
"This is the admin control center. The left panel shows a step-by-step workflow that guides us through setting up a payment pool. Let's follow it."

**Admin Workflow Card:**
"Six steps to get a pool operational: Register entities, approve KYC, review composition, run netting, check compliance alerts, export audit report."

**Running Netting (THE SHOWSTOPPER):**
"This 7-step algorithm runs entirely on-chain. It snapshots balances, normalizes FX rates, matches surpluses to deficits, calculates interest, and creates an audit trail. All in seconds."

**Transaction Signature:**
"This isn't a mock transaction. This is a real 88-character Solana signature. Let me verify it on the public blockchain."

**Solana Explorer:**
"You can see the program that processed it (Layer 2 Pooling Engine), the accounts involved, and the complete transaction history. This is immutable proof."

**Layer Status Table:**
"All 5 contract layers are live. Each one handles a specific part: entity registry, pooling logic, compliance, FX rates, and sweep triggers."

## Key Numbers to Highlight

```
- 5 contract layers (all deployed and live)
- 7-step netting algorithm
- 4 demo entities pre-loaded
- $550k net pool position
- 100% real on-chain transactions
- 88-character base58 signatures
- 20-second Solana finalization
```

## If Something Goes Wrong

**Dev server won't start:**

```bash
killall node
cd /home/sriranjini/nexus/app
npm run dev
```

**Browser cache issues:**

```
Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

**No entities showing:**

```
Toggle DEMO mode ON in header
Wait 2-3 seconds for data to load
```

**Explorer link broken:**

```
Manually copy signature
Paste into https://explorer.solana.com/?cluster=devnet
Verify cluster is "devnet" (top-left dropdown)
```

**Transfer won't submit:**

```
Check: Sender has sufficient balance
Check: Amount is within mandate limit
Check: Both entities are verified
Check: DEMO or LIVE mode is active
```

## Best Moments to Pause for Questions

1. After showing Dashboard (let them absorb the workflow)
2. After netting animation finishes (biggest "wow" moment)
3. After verifying on Solana Explorer (prove it's real)
4. After showing all 5 layers (technical deep dive moment)

## Talking Points by Audience

**For Executives:**

- Real workflow improvement (hours → seconds)
- Regulatory compliance baked in
- Cost savings on forex conversions
- Audit trail for compliance

**For Developers:**

- 5 Solana programs (show code)
- On-chain PDA storage
- Real wallet integration
- TypeScript React frontend

**For Regulators:**

- Complete audit trail
- KYC/AML integration (Chainalysis)
- Immutable transaction records
- Role-based compliance controls

**For Investors:**

- B2B SaaS model
- Real blockchain technology
- Production-ready deployment
- Enterprise clients (banks)
