# Opencode Desktop - CreateOS MCP Integration Guide

## Overview

The `opencode.json` configuration file enables Opencode Desktop to communicate with CreateOS via the Model Context Protocol (MCP). This integration allows you to deploy your NEXUS Protocol application directly from your development environment.

## Configuration File

**Location**: `/home/sriranjini/nexus/opencode.json`

### Current Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "createos": {
      "type": "remote",
      "url": "https://api-createos.nodeops.network/mcp",
      "headers": {
        "X-Api-Key": "CREATEOS_API_KEY"
      }
    }
  }
}
```

## Setup Instructions

### Step 1: Get Your CreateOS API Key

1. Log in to [CreateOS Dashboard](https://createos.nodeops.network)
2. Navigate to **Profile Settings**
3. Find the **API Keys** section
4. Copy your active API key

### Step 2: Update Configuration

Replace `CREATEOS_API_KEY` in `opencode.json` with your actual API key:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "createos": {
      "type": "remote",
      "url": "https://api-createos.nodeops.network/mcp",
      "headers": {
        "X-Api-Key": "your-actual-api-key-here"
      }
    }
  }
}
```

### Step 3: Verify Integration in Opencode Desktop

1. Launch Opencode Desktop
2. Open your project directory (`/home/sriranjini/nexus`)
3. Opencode should automatically detect `opencode.json`
4. You should see CreateOS integration available in the MCP menu

## Deployment Workflow

Once configured, you can deploy directly from Opencode:

### Deploy Frontend

```
1. Open Opencode Desktop
2. Press Ctrl+P to open Command Palette
3. Search for "CreateOS: Deploy Frontend"
4. Select app/dist as deployment source
5. Choose deployment target (NodeOps)
6. Monitor deployment status in Opencode
```

### Environment Variables

Configure these in CreateOS before deploying:

| Variable             | Value                           | Notes                   |
| -------------------- | ------------------------------- | ----------------------- |
| `VITE_RPC_URL`       | `https://api.devnet.solana.com` | Solana devnet RPC       |
| `VITE_FX_ORACLE_URL` | `http://localhost:7070`         | Optional oracle service |

### Deploy Oracle Service (Optional)

```
1. Open Opencode Desktop
2. Search for "CreateOS: Deploy Service"
3. Select services/six-oracle
4. Configure environment variables (SIX credentials)
5. Deploy to NodeOps background worker
```

## Testing Connection

### In Opencode Desktop

1. Press `Ctrl+P`
2. Search for "MCP: Test Connection"
3. Select "createos"
4. You should see: "✅ Connected to CreateOS MCP"

### Via Command Line

```bash
# Test CreateOS API connectivity
curl -H "X-Api-Key: YOUR_API_KEY" \
  https://api-createos.nodeops.network/mcp/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Deployment Targets

### Primary Target: NodeOps

**Type**: Static Site + Optional Background Worker  
**URL Pattern**: `https://nexus-<random>.nodeops.network`  
**Build Command**: `cd app && npm install && npm run build`  
**Output**: `app/dist/`

### Features Available

- ✅ Automatic builds on git push
- ✅ Environment variable management
- ✅ Custom domain support
- ✅ SSL/TLS certificates (auto-renewed)
- ✅ Logs and monitoring
- ✅ Rollback to previous deployments

## Project Structure for Deployment

```
nexus/
├── opencode.json                 # MCP Configuration (THIS FILE)
├── app/
│   ├── dist/                     # Frontend build artifacts
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── services/
│   └── six-oracle/               # Optional oracle service
│       ├── oracle.py
│       └── requirements.txt
├── NODEOPS_DEPLOYMENT.md         # Deployment guide
└── README.md                      # Main documentation
```

## Troubleshooting

### Issue: "MCP Connection Failed"

**Solution**:

1. Verify `opencode.json` is in project root
2. Check API key is valid (not expired)
3. Test CreateOS API connectivity (see Testing Connection above)
4. Restart Opencode Desktop

### Issue: "Deployment Failed - Build Error"

**Solution**:

1. Verify build passes locally: `cd app && npm run build`
2. Check `VITE_RPC_URL` is accessible
3. Ensure no TypeScript errors: `cd app && npm run build`

### Issue: "Cannot Find app/dist"

**Solution**:

1. Build frontend first: `cd app && npm install && npm run build`
2. Verify dist folder exists: `ls -la app/dist/`
3. Re-run deployment

## Security Best Practices

⚠️ **Important**:

1. **Never commit API keys**

   - Add `opencode.json` to `.gitignore` if using real keys
   - Use environment variable: `CREATEOS_API_KEY`
   - Or use Opencode's secure secret storage

2. **Rotate API keys regularly**

   - CreateOS dashboard: Settings → API Keys
   - Regenerate quarterly

3. **Limit API key permissions**
   - Use scoped keys for CI/CD
   - Restrict to deployment operations only

## Example: Complete Deployment Workflow

```bash
# 1. Ensure build is ready
cd app
npm run build
cd ..

# 2. Verify configuration
cat opencode.json

# 3. In Opencode Desktop:
# - Open command palette (Ctrl+P)
# - Search "CreateOS: Deploy"
# - Select app/dist as source
# - Monitor deployment status
# - Get deployment URL

# 4. Test deployed app
# - Visit provided URL in browser
# - Verify frontend loads
# - Test wallet connection
# - Verify entity registration works
```

## Advanced Configuration

### Multiple Deployment Targets

To deploy to multiple platforms, extend `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "createos": {
      "type": "remote",
      "url": "https://api-createos.nodeops.network/mcp",
      "headers": {
        "X-Api-Key": "CREATEOS_API_KEY"
      }
    },
    "render": {
      "type": "remote",
      "url": "https://api.render.com/mcp",
      "headers": {
        "Authorization": "Bearer RENDER_API_KEY"
      }
    }
  }
}
```

### Environment-Specific Configs

Create per-environment configurations:

```bash
opencode.json              # Base config
opencode.dev.json          # Development overrides
opencode.prod.json         # Production overrides
```

## Support & Documentation

- **Opencode Docs**: https://opencode.ai/docs
- **CreateOS API Docs**: https://docs.createos.nodeops.network
- **MCP Protocol Spec**: https://modelcontextprotocol.io

---

**Configuration Created**: `opencode.json`  
**Next Step**: Replace `CREATEOS_API_KEY` with your actual API key from CreateOS dashboard.
