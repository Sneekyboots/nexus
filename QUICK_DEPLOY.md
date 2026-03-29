# 🚀 NEXUS Protocol - Quick Deploy Guide

**Status**: ✅ Production Ready | **Build**: 5,289 modules, 0 errors | **Size**: 800 KB

## Deploy in 5 Minutes

### Prerequisites

- ✅ CreateOS account with API key
- ✅ GitHub repository access
- ✅ `opencode.json` with valid API key

### Three Ways to Deploy

#### Option 1: Web Dashboard (Easiest)

```
1. Log in to https://createos.nodeops.network
2. Click "New Project" → "Static Site"
3. Select your GitHub repository
4. Build Command: cd app && npm install && npm run build
5. Publish Directory: app/dist
6. Add env vars: VITE_RPC_URL, VITE_FX_ORACLE_URL
7. Click "Deploy Now"
8. Wait 2-3 minutes for URL
```

**Result**: `https://nexus-<id>.nodeops.network` ✅

#### Option 2: Automated Script

```bash
# Verify everything is ready
node deploy.js

# Follow prompts to deploy from CreateOS dashboard
```

#### Option 3: Opencode Desktop (Most Integrated)

```
1. Launch Opencode Desktop
2. Open project: /home/sriranjini/nexus
3. Ctrl+P → "CreateOS: Deploy Frontend"
4. Select deployment target
5. Monitor progress
6. Get deployed URL
```

---

## Files Generated

```
✅ app/dist/           - Production frontend (ready to deploy)
✅ opencode.json       - MCP configuration (API key protected)
✅ deploy.js           - Automated deployment checker
✅ CREATEOS_DEPLOYMENT.md  - Detailed deployment guide
✅ NODEOPS_DEPLOYMENT.md   - Alternative deployment methods
✅ OPENCODE_INTEGRATION.md - Opencode Desktop integration
```

---

## Deployment Timeline

```
Step 1: Create project in dashboard     (1 min)
Step 2: Configure build settings        (1 min)
Step 3: CreateOS builds (auto)          (1-2 min)
Step 4: Deploy to CDN (auto)            (0-1 min)
Step 5: Generate SSL cert (auto)        (30 sec)
────────────────────────────────────────────
Total: 3-5 minutes ✅
```

---

## What Gets Deployed

### Frontend ✅

- React 18 + Vite (SPA)
- Tailwind CSS + Sketch UI framework
- Wallet integration (Phantom, MetaMask)
- Solana devnet connection
- Entity registration form
- DEMO mode with 4 pre-seeded entities
- LIVE mode with localStorage persistence

### Optional: Oracle Service

- Python FastAPI server
- Real FX rates from SIX Financial
- Automatic Solana updates

**Note**: Oracle is optional. App works with mock rates if unavailable.

---

## Post-Deployment Checklist

After deployment completes, verify:

- [ ] Visit deployed URL in browser
- [ ] Dashboard loads and styles render
- [ ] "DEMO Mode" displays 4 entities (Singapore, UK, Eurozone, UAE)
- [ ] "Switch to LIVE Mode" button works
- [ ] Register new entity form appears
- [ ] Wallet connection works (Phantom/MetaMask)
- [ ] Netting cycle animation plays smoothly
- [ ] No console errors (F12 to check)

---

## Test User Scenarios

### Scenario 1: View Demo (No Wallet Needed)

1. Open deployed URL
2. Dashboard shows 4 entities
3. Click "Run Netting Cycle"
4. Watch 7-step animation
5. See final balances

**Expected**: Everything works without wallet ✅

### Scenario 2: Register Entity (Wallet Required)

1. Click "Switch to LIVE Mode"
2. Click "Register Entity"
3. Fill in form:
   - Legal Name: "My Company Ltd"
   - Jurisdiction: "GB"
   - Document Type: "Certificate of Incorporation"
4. Click "Register"
5. Entity appears in entity list
6. Refresh page → Entity still there (localStorage)

**Expected**: Entity persists in browser ✅

---

## Troubleshooting

### ❌ Build Failed

**Check**:

```bash
cd app && npm run build
```

Should show: `✓ built in X.XXs` with 5,289 modules

### ❌ Frontend Shows 404

**Check**: Publish directory is set to `app/dist` in CreateOS

### ❌ Wallet Won't Connect

**Check**:

- Browser has Phantom or MetaMask installed
- MetaMask is set to Solana devnet
- Check browser console (F12) for errors

### ❌ Styles Look Wrong

**Check**:

- Network tab (F12) for failed CSS files
- CreateOS gzip compression enabled
- Browser cache cleared

---

## Monitoring Deployment

### In CreateOS Dashboard

```
Project → Deployments → Select Latest
├─ Build Log (shows npm install, tsc, vite build)
├─ Deployment Status (shows CDN sync)
├─ Logs (real-time server logs)
└─ Analytics (traffic, performance)
```

### From Command Line

```bash
# Check deployment URL
curl -I https://nexus-<id>.nodeops.network/

# Should return:
# HTTP/2 200
# Content-Type: text/html
```

---

## Environment Variables

**Frontend** (set in CreateOS dashboard):

```
VITE_RPC_URL=https://api.devnet.solana.com
VITE_FX_ORACLE_URL=http://localhost:7070
```

**Oracle** (if deploying - optional):

```
SIX_API_URL=https://api.six-group.com/web/v2
SIX_TEAM_ID=<secret>
SIX_CERT_PATH=./services/six-oracle/certs/signed-certificate.pem
SIX_KEY_PATH=./services/six-oracle/certs/private-key.pem
SOLANA_RPC_URL=https://api.devnet.solana.com
LOG_LEVEL=INFO
```

---

## Performance

**Bundle Metrics**:

- Uncompressed: 800 KB
- Gzipped: 227 KB (main JS)
- First load: 2-3 seconds
- Cached load: 500ms

**CDN**: CreateOS provides global edge distribution

---

## Next Steps

1. **Deploy Now**: Go to https://createos.nodeops.network
2. **Test**: Visit deployed URL and verify functionality
3. **Optional**: Deploy oracle service for real FX rates
4. **Monitor**: Check deployment logs and analytics
5. **Iterate**: Push changes to master → auto-redeploy

---

## Documentation

- 📖 [CREATEOS_DEPLOYMENT.md](CREATEOS_DEPLOYMENT.md) - Full guide
- 📖 [NODEOPS_DEPLOYMENT.md](NODEOPS_DEPLOYMENT.md) - Alternative platforms
- 📖 [OPENCODE_INTEGRATION.md](OPENCODE_INTEGRATION.md) - Opencode Desktop
- 📖 [README.md](README.md) - Architecture & features
- 📖 [DEMO_SCRIPT.md](DEMO_SCRIPT.md) - 30-min walkthrough

---

## Support

**Questions about**:

- 🔗 CreateOS/NodeOps → https://docs.createos.nodeops.network
- 🔗 Opencode Desktop → https://opencode.ai/docs
- 🔗 NEXUS Protocol → See README.md

---

**Ready?** 🚀 Go to: https://createos.nodeops.network

Let's deploy! 🎉
