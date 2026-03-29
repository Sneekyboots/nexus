# CreateOS Deployment Guide - NEXUS Protocol

## Quick Deploy (5 minutes)

### Step 1: Prepare Build Artifacts

```bash
cd app
npm install
npm run build
```

✅ Ready: `app/dist/` contains production build

### Step 2: Create Deployment in CreateOS Web Dashboard

1. Log in to [CreateOS Dashboard](https://createos.nodeops.network)
2. Click **"New Project"** or **"New Deployment"**
3. Select **"Static Site"** as project type

### Step 3: Configure Frontend Deployment

**Project Name**: `nexus-protocol-frontend`

**Build Settings**:

- Repository: `https://github.com/YOUR_GITHUB_USERNAME/nexus`
- Branch: `master`
- Build Command: `cd app && npm install && npm run build`
- Publish Directory: `app/dist`

**Environment Variables**:

```
VITE_RPC_URL=https://api.devnet.solana.com
VITE_FX_ORACLE_URL=http://localhost:7070
```

**Advanced Settings**:

- Node Version: 18.x or higher
- Enable gzip compression: ✓
- Auto-deploy on push: ✓

### Step 4: Deploy

Click **"Deploy Now"**

CreateOS will:

1. ✓ Clone repository
2. ✓ Install dependencies
3. ✓ Run build: `tsc && vite build`
4. ✓ Upload dist/ to CDN
5. ✓ Provision SSL certificate
6. ✓ Generate deployment URL

**Deployment URL Format**: `https://nexus-<random-id>.nodeops.network`

### Step 5: Verify Deployment

Once deployment completes:

```bash
# Test deployed URL
curl -I https://nexus-<random-id>.nodeops.network/

# Should return:
# HTTP/2 200
# Content-Type: text/html
```

Visit URL in browser and verify:

- ✅ Dashboard loads
- ✅ Wallet connection available
- ✅ Entity registration form appears
- ✅ DEMO mode shows 4 entities

---

## Optional: Deploy Oracle Service

### Step 6: Create Background Worker (Optional)

If you have SIX Financial credentials:

1. Create new project: **"Background Worker"**

**Project Name**: `nexus-fx-oracle`

**Build Settings**:

- Repository: `https://github.com/YOUR_GITHUB_USERNAME/nexus`
- Branch: `master`
- Build Command: `pip install -r services/six-oracle/requirements.txt`
- Start Command: `cd services && python3 six-oracle/oracle.py`
- Runtime: Python 3.10+

**Environment Variables** (Secrets):

```
SIX_API_URL=https://api.six-group.com/web/v2
SIX_TEAM_ID=<your-six-team-id>
SIX_CERT_PATH=./services/six-oracle/certs/signed-certificate.pem
SIX_KEY_PATH=./services/six-oracle/certs/private-key.pem
SOLANA_RPC_URL=https://api.devnet.solana.com
ORACLE_AUTHORITY_KEYPAIR=./solana-keypairs/oracle-authority.json
LOG_LEVEL=INFO
```

### Step 7: Update Frontend Environment

Once oracle deploys, update frontend env var:

```
VITE_FX_ORACLE_URL=https://nexus-oracle-<random-id>.nodeops.network
```

---

## Deployment Architecture

```
CreateOS (NodeOps)
├── Frontend Service (Static)
│   ├── Git: master branch
│   ├── Build: tsc && vite build
│   ├── Output: app/dist/
│   ├── URL: https://nexus-<id>.nodeops.network
│   └── SSL: Auto-provisioned
│
└── Oracle Service (Optional)
    ├── Git: master branch
    ├── Build: pip install requirements
    ├── Runtime: Python 3.10
    ├── Port: 7070
    └── URL: https://nexus-oracle-<id>.nodeops.network
```

---

## Features After Deployment

### ✅ Available Immediately

- Dashboard with pool overview
- Entity management (register, view, update)
- DEMO mode with 4 pre-seeded entities
- Netting cycle visualization (7-step animation)
- Compliance event logging
- KYC workflow

### ✅ Optional (requires oracle)

- Real FX rates from SIX Financial
- Live price updates
- More accurate netting calculations

### ⚠️ Limitations

- **Blockchain**: Connects to Solana devnet (free, public)
- **Wallet**: Requires Phantom or MetaMask browser extension
- **Transactions**: Simulated locally (not submitted to blockchain)
- **FX Rates**: Mock data if oracle unavailable

---

## Monitoring & Logs

In CreateOS Dashboard:

1. Select your deployment
2. Click **"Logs"** tab
3. View real-time logs:
   ```
   info: Starting NEXUS dashboard server
   info: Build: 5289 modules compiled
   info: Frontend served from app/dist/
   info: RPC endpoint: https://api.devnet.solana.com
   info: Ready at https://nexus-<id>.nodeops.network
   ```

## Rollback & Redeploy

### Rollback to Previous Version

1. Go to deployment settings
2. Click **"Deployments"** history
3. Select previous deployment
4. Click **"Rollback"**

### Redeploy from Git

```bash
# Push changes to master
git add .
git commit -m "Update: your changes"
git push origin master

# CreateOS auto-detects and redeploys
# (if auto-deploy enabled)
```

---

## Troubleshooting

### Issue: Build Fails

**Error**: `tsc: command not found`

**Solution**:

- Ensure Node 18+ is selected in CreateOS settings
- Check build command: `cd app && npm install && npm run build`

---

### Issue: Frontend Shows 404

**Error**: `Cannot GET /`

**Solution**:

- Verify publish directory is `app/dist`
- Check SPA routing enabled (should rewrite all to index.html)
- Contact CreateOS support if issue persists

---

### Issue: Wallet Connection Fails

**Error**: `RPC endpoint unreachable`

**Solution**:

- Verify `VITE_RPC_URL=https://api.devnet.solana.com`
- Check devnet status: https://status.solana.com
- Try different RPC: `https://api.devnet.solana.com` (primary)

---

### Issue: FX Rates Show 0

**Expected**: This means oracle service is unavailable, which is normal.

**Solution**:

- If you want real rates, deploy oracle service with SIX credentials
- Otherwise, app continues with mock rates (for demo)

---

## Production Checklist

- [ ] Build passes locally: `npm run build`
- [ ] 0 TypeScript errors
- [ ] `app/dist/` folder created
- [ ] CreateOS API key saved in `opencode.json`
- [ ] Repository pushed to GitHub
- [ ] Deployment created in CreateOS
- [ ] Build completes successfully
- [ ] URL is accessible in browser
- [ ] Dashboard loads without errors
- [ ] Entity registration works
- [ ] LIVE mode persists entities
- [ ] Wallet connection works
- [ ] All CSS/styling renders correctly

---

## Performance Metrics

**Frontend Bundle**:

- Total: ~800 KB
- Main JS: 770 KB (gzip: 227 KB)
- CSS: 83 KB (gzip: 14.76 KB)
- Assets: ~1 KB

**Expected Load Time**:

- First load: 2-3 seconds (cold cache)
- Subsequent: 500ms (cached)

**CDN**: CreateOS provides global CDN distribution

---

## Support

- **CreateOS Docs**: https://docs.createos.nodeops.network
- **Opencode Docs**: https://opencode.ai/docs
- **GitHub Issues**: Report deployment issues

---

**Status**: ✅ Ready to Deploy  
**Latest Build**: 5,289 modules, 0 errors  
**Build Date**: March 29, 2026
