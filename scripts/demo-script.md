# NEXUS Protocol — Video Demo Script

## StableHacks 2026 · Track 2 · AMINA Bank

**Target length:** 3–4 minutes  
**Format:** screen recording with voiceover  
**URL:** `http://localhost:5173` (run `cd app && npm run dev` before recording)

---

## Opening hook (0:00–0:20)

> "After the Signature Bank collapse in 2023, USD correspondent rails for
> crypto-native banks broke. What used to clear overnight now takes 3 to 5
> business days. AMINA Bank confirmed this is still an active pain point in
> March 2026. NEXUS fixes it — institutional treasury settlement in under
> 5 seconds, on Solana, with full compliance built in."

**On screen:** README open, show the problem/solution table at the top.

---

## 1. Architecture overview (0:20–0:40)

> "NEXUS is 5 Anchor programs deployed on Solana Devnet, orchestrated by a
> React dashboard. Five layers: Entity Registry, Pooling Engine with the
> 7-step netting algorithm, a Compliance Hook with 6 mandatory gates, FX
> Netting, and Sweep Trigger for intercompany loans. FX rates come from SIX
> Financial — the same regulated data provider Swiss institutional desks
> use — pushed on-chain every 30 seconds via mTLS."

**On screen:** Show the ASCII architecture diagram in the README.  
Then briefly show a Solscan link for one of the deployed programs — e.g.,
`https://solscan.io/account/CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk?cluster=devnet`

---

## 2. Login — demo mode (0:40–1:00)

> "Judges can explore without a wallet. The login page shows four role
> cards — AMINA Bank Admin, Corporate Treasury, Subsidiary Finance Manager,
> and Compliance Officer. One click gets you straight in."

**On screen:** Navigate to `http://localhost:5173/login`

- Show the hero panel: gradient, stats (5 layers · 6 gates · <5s · 25 tests), feature pills
- Point out "Demo mode · no wallet needed"
- Click **ADMIN** to log in as AMINA Bank Admin

---

## 3. AMINA Admin dashboard (1:00–1:30)

> "The admin dashboard gives full platform oversight. Here we see all
> registered entities, their KYC status, the pool net position, pending KYT
> alerts from Chainalysis, and live FX rates from SIX — EUR/USD 1.1470,
> GBP/USD 1.3270, CHF/USD 1.2617."

**On screen:**

- Show the 4-stat KPI row (entities, pool net position, KYT alerts, active loans)
- Scroll to the Solana Program Status table — click one of the program IDs to open Solscan
- Show the FX rate pills
- Expand step [1] in the Admin Workflow guide: "Register client entities"

---

## 4. Run a netting cycle (1:30–2:00)

> "This is the core of NEXUS. Click Run Netting Cycle from the guide, or
> navigate directly to the Netting page."

**On screen:** Navigate to `/netting` (click "Run Netting Cycle →" in the guide)

> "The 7-step algorithm runs atomically on-chain. Step 1 snapshots all
> entity positions. Step 2 normalises to USD using live SIX rates. Steps 3
> and 4 classify surplus and deficit entities and greedily match them.
> Step 5 accrues interest at 4.5% APR. Step 6 checks the sweep threshold
> and creates an intercompany loan if needed. Step 7 writes the final net
> position to chain and emits a NettingComplete event."

**On screen:** Click **Run Netting Cycle** button. Show the cycle result — offset count, total USD offset, entities matched.

---

## 5. 6-gate compliance (2:00–2:20)

> "Every single transfer runs 6 compliance gates atomically before
> execution. One failure reverts the whole transaction."

**On screen:** Navigate to `/compliance` (or go back to dashboard → "Open Event Feed")

> "Gate 1: KYC — entity must be verified and not expired. Gate 2: KYT —
> Chainalysis transaction risk score, which AMINA confirmed is their
> provider. Gate 3: AML risk score. Gate 4: Travel Rule — beneficiary info
> required above $1000. Gate 5: daily aggregate limit. Gate 6: single
> transfer limit. Every approval writes an immutable cert PDA on-chain."

**On screen:** Show the compliance event feed. Point out the blocked vs approved events. Navigate to `/compliance/kyt` and show a KYT alert with Chainalysis label.

---

## 6. Compliance Officer view (2:20–2:40)

> "Switch roles to see how the same data looks to a Compliance Officer."

**On screen:** Click the role switcher (top-right) → log out → log in as Compliance Officer

> "The compliance dashboard surfaces pending KYC submissions, blocked
> transfers, and KYT alerts that need actioning. The 6-gate status panel
> shows every gate active. Everything they need for a regulatory audit is
> here."

**On screen:** Show the 4-stat row, the L3 gate status panel, entities needing action.  
Navigate to `/reports` and show the Audit Export page.

---

## 7. SIX oracle — live rates on-chain (2:40–2:55)

> "The FX rates are real. Here's the on-chain SIX oracle PDA on Solana
> Devnet."

**On screen:** Navigate to `/fx` (FX Rates page). Show the 5 pairs with current values.  
Open a browser tab to:
`https://solscan.io/account/EjfuHxMXdqijV2KE4DjHPawgTJJv6W4ZyeczeWfE47Dd?cluster=devnet`

> "PDA address EjfuHxMX... — initialized on devnet March 19th, first live
> SIX push confirmed same day. EUR/USD 1.1470, GBP/USD 1.3270, CHF/USD
> 1.2617, SGD/USD 0.7795, AED/USD 0.2723. These come from SIX Group via
> mTLS — BC=148 Forex Spot Rates."

---

## 8. Test suite (2:55–3:10)

> "25 anchor tests, all passing, running against Surfpool local simnet."

**On screen:** Switch to terminal. Run:

```bash
anchor test --skip-local-validator --skip-deploy
```

Show output: `25 passing`.

---

## Closing (3:10–3:20)

> "NEXUS Protocol: 5 Solana programs live on devnet, 25 tests passing,
> live SIX FX rates on-chain, 6-gate compliance enforcement, 7-step
> netting algorithm, built for AMINA Bank. Cross-border stablecoin
> treasury settlement — minutes, not days."

**On screen:** Return to the login page hero panel — show the stats row and AMINA attribution.

---

## Quick-reference timings

| Segment                    | Time      |
| -------------------------- | --------- |
| Opening hook               | 0:00–0:20 |
| Architecture overview      | 0:20–0:40 |
| Login / demo mode          | 0:40–1:00 |
| Admin dashboard + FX rates | 1:00–1:30 |
| Run netting cycle          | 1:30–2:00 |
| 6-gate compliance          | 2:00–2:20 |
| Compliance Officer view    | 2:20–2:40 |
| Live SIX oracle on-chain   | 2:40–2:55 |
| Test suite (25 passing)    | 2:55–3:10 |
| Closing                    | 3:10–3:20 |

---

## Before you record — checklist

- [ ] `cd app && npm run dev` running at `localhost:5173`
- [ ] `services/six-oracle/oracle.py` running at `:7070` (for live FX in UI)
- [ ] Browser zoom at 80–90% so full dashboard is visible without scrolling
- [ ] Solscan tabs pre-loaded:
  - `https://solscan.io/account/CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk?cluster=devnet`
  - `https://solscan.io/account/EjfuHxMXdqijV2KE4DjHPawgTJJv6W4ZyeczeWfE47Dd?cluster=devnet`
- [ ] Terminal open in `/home/sriranjini/nexus` ready for test run
- [ ] Surfpool running (for test suite segment)
