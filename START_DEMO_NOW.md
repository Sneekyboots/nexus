# START DEMO NOW - Checklist

## 30 Seconds to Demo Ready

### Step 1: Start Dev Server (if not running)
```bash
cd /home/sriranjini/nexus/app
npm run dev
# Should output: ➜  Local:   http://localhost:5173
```

### Step 2: Open in Browser
```
http://localhost:5173
```

### Step 3: Toggle DEMO Mode ON
Click the toggle in the top-right header labeled "DEMO"
(Wait 2-3 seconds for data to load)

### Step 4: You're Ready! 
All test data is now loaded:
- 4 entities with balances
- 1 pool with $550k net position
- FX rates from SIX Oracle
- All ready to demo

---

## Quick Demo Path (5 minutes)

### 1. Show Dashboard (30 seconds)
```
Current URL: http://localhost:5173
Point to: "Admin Workflow — Step by Step" card
Say: "Six steps to run a complete payment pool"
```

### 2. Run Netting (2 minutes)
```
Click: "Admin Workflow" → "Run a netting cycle"
OR Go to: http://localhost:5173/netting/run
Click: "Run Cycle" button
Watch: 7-step animation play out
Say: "All 7 steps just executed on-chain, in seconds"
```

### 3. Verify It's Real (2 minutes)
```
Copy: The transaction signature that appears
Go to: https://explorer.solana.com/?cluster=devnet
Paste: Signature into search box
Say: "This is real Solana blockchain. Verify it yourself."
```

### Done!
You just demoed the entire system in 5 minutes.

---

## Before Any Demo - Checklist

- [ ] Dev server running (port 5173, 5174, or 5175)
- [ ] DEMO mode toggled ON
- [ ] Solana Explorer tab open: https://explorer.solana.com/?cluster=devnet
- [ ] Have DEMO_SCRIPT.md or DEMO_QUICK_REFERENCE.md ready
- [ ] Browser zoomed to 100% (Ctrl+0 to reset)
- [ ] No cache issues (Ctrl+Shift+Delete if needed)

---

## Key URLs You Need

```
App Home:        http://localhost:5173
Register Entity: http://localhost:5173/entities/register
KYC Approval:    http://localhost:5173/entities/kyc
Pool Overview:   http://localhost:5173/pools
Run Netting:     http://localhost:5173/netting/run
Netting Results: http://localhost:5173/netting/history
Solana Explorer: https://explorer.solana.com/?cluster=devnet
```

---

## If Something Goes Wrong

**"Dev server won't start"**
```bash
killall node
cd /home/sriranjini/nexus/app
npm run dev
```

**"No entities showing"**
```
Toggle DEMO mode OFF then ON
Wait 3 seconds
Try page refresh (F5)
```

**"Transaction won't verify on explorer"**
```
1. Copy signature again
2. Make sure cluster is "devnet" (dropdown top-left)
3. Try pasting URL directly: 
   https://explorer.solana.com/tx/[SIGNATURE]?cluster=devnet
```

**"Something looks broken"**
```
Hard refresh: Ctrl+Shift+R
Or: Ctrl+Shift+Delete to clear cache
Then: F5 to reload
```

---

## The One Thing to Highlight

**The Netting Cycle Animation**

This is your "wow moment". Let it play fully. When judges see the 7-step algorithm execute in seconds on real blockchain, they'll get it.

Steps are:
1. Snapshot Positions
2. Normalize FX
3. Match Surplus/Deficit
4. Calculate Offsets
5. Accrue Interest
6. Finalize Settlement
7. Audit Trail

All on-chain. All in seconds.

---

## Pro Tips

1. **Have explorer open in background** - You'll need it ready
2. **Slow down when explaining** - The algorithm is complex
3. **Click on everything** - Show it's interactive
4. **Mention "real blockchain"** - People need to hear it's not fake
5. **Ask "Questions?"** - Pause at key moments
6. **Have Layer IDs ready** - If they ask for proof of smart contracts

---

## You're Set!

Everything you need:
✅ Dev server ready
✅ Test data loaded
✅ Demo script prepared
✅ Explorer ready
✅ This checklist for quick reference

Start the demo when ready. Good luck! 🚀

