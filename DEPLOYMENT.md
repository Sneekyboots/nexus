# NEXUS Protocol — Deployment Guide

Deploy NEXUS to Render for the StableHacks 2026 demo.

---

## Quick Start

### 1. Fork & Connect

1. Fork this repo to your GitHub
2. Go to [Render.com](https://render.com) → **Blueprints**
3. Click **"New Blueprint Instance"**
4. Connect your GitHub repo

### 2. Deploy Frontend (Static Site)

Render will auto-detect `render.yaml` and show:

| Setting           | Value                                    |
| ----------------- | ---------------------------------------- |
| **Service Type**  | Web Service                              |
| **Name**          | `nexus-frontend`                         |
| **Build Command** | `cd app && npm install && npm run build` |
| **Publish Path**  | `app/dist`                               |

**Environment Variables:**

| Key                  | Value                                    |
| -------------------- | ---------------------------------------- |
| `VITE_RPC_URL`       | `https://api.devnet.solana.com`          |
| `VITE_FX_ORACLE_URL` | `https://your-nexus-oracle.onrender.com` |

### 3. (Optional) Deploy FX Oracle

For **live FX rates**, deploy the Python oracle:

| Setting           | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| **Service Type**  | Background Worker                                     |
| **Name**          | `nexus-oracle`                                        |
| **Build Command** | `pip install -r services/six-oracle/requirements.txt` |
| **Start Command** | `python3 services/six-oracle/oracle.py`               |

**Environment Variables (Secrets):**

| Key           | Value                    |
| ------------- | ------------------------ |
| `SIX_API_KEY` | Your SIX API key         |
| `SIX_CERT`    | `cert.pem` (upload file) |
| `SIX_KEY`     | `key.pem` (upload file)  |

---

## Without Oracle (Demo Mode)

The app works **without the oracle** in Demo mode:

1. Toggle "Demo" in the top-right corner
2. Dashboard shows pre-populated data
3. FX rates display mock data
4. No SIX credentials needed

---

## Environment Variables Reference

### Frontend (Public)

| Variable             | Default                         | Description         |
| -------------------- | ------------------------------- | ------------------- |
| `VITE_RPC_URL`       | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `VITE_FX_ORACLE_URL` | `http://localhost:7070`         | FX oracle URL       |

### Backend/Oracle (Secrets)

| Variable      | Required    | Description       |
| ------------- | ----------- | ----------------- |
| `SIX_API_KEY` | For live FX | SIX Group API key |
| `SIX_CERT`    | For live FX | mTLS certificate  |
| `SIX_KEY`     | For live FX | mTLS private key  |

---

## File Structure

```
nexus/
├── render.yaml           # ← Render deployment config
├── app/                  # ← Frontend source
│   ├── dist/            # ← Built output (served as static)
│   └── public/zk/       # ← ZK verification artifacts
└── services/
    └── six-oracle/      # ← Python FX oracle
        └── oracle.py     # ← FX data fetcher
```

---

## What Can Be Committed

✅ **Safe:**

- Source code
- Program IDs
- ZK verification key + WASM
- Configuration files

❌ **Never Commit:**

- `.env` files
- `*.pem`, `*.key` certificates
- `*.zkey` proving keys
- SIX API credentials

---

## Troubleshooting

**Q: Build fails?**

```bash
cd app && npm install && npm run build
```

**Q: Oracle not responding?**

- Check if Background Worker is running in Render dashboard
- Verify `SIX_API_KEY` is set as secret

**Q: Wallet not connecting?**

- Ensure `VITE_RPC_URL` points to public endpoint
- Phantom wallet must be connected to Devnet

---

## Support

For NEXUS technical questions, check the main [README.md](./README.md).
