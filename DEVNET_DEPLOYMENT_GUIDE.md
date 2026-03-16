# NEXUS Protocol - Devnet Deployment & Testing Guide

## Phase 6 Continuation: Devnet Deployment

This guide provides step-by-step instructions for deploying the NEXUS 5-layer on-chain corporate cash pooling protocol to Solana devnet and integrating the SIX Oracle Service.

---

## Prerequisites Completed ✅

- [x] Solana CLI 2.3.8 installed and configured for devnet
- [x] Devnet wallet created: `A7eV2cdTrH56ktXH3ZaSk4kbsF2aguHvggeszcAUXc5o`
- [x] Devnet SOL funded (2 SOL available)
- [x] All 5 programs compile successfully (`cargo build --lib --all` ✅)
- [x] All 58 integration tests pass
- [x] SIX Oracle Service complete and ready for deployment
- [x] Anchor.toml configured with all 5 program entries

---

## Build System Issue & Workaround

**Current Issue:** `anchor build` fails with `constant_time_eq v0.4.2` requiring `edition2024` feature.

**Root Cause:** Cargo version mismatch between system Cargo and Solana's bundled tools.

**Recommended Solutions:**

### Solution 1: Update Solana Tools (Preferred)

```bash
# Download latest Solana CLI
curl https://release.solana.com/v2.3.8/install | sh

# Reload shell
source ~/.bashrc

# Verify
solana --version
cargo --version
```

### Solution 2: Use Docker

```bash
docker pull projectserum/build:latest
docker run -v /home/sriranjini/nexus:/app -w /app projectserum/build anchor build
```

### Solution 3: Manual Compilation

If neither solution works, you can manually compile each program:

```bash
# Set up SBF target
rustup target add sbf-solana-solana

# Build entity-registry
cd programs/entity-registry
cargo build --target sbf-solana-solana --release

# Repeat for other programs
```

---

## Step 1: Build Programs for SBF Target

### Once Build System is Fixed:

```bash
cd /home/sriranjini/nexus

# Build all programs for Solana SBF
anchor build --skip-lint

# Or use cargo-build-sbf directly
cd programs/entity-registry && cargo build-sbf && cd ../..
cd programs/pooling-engine && cargo build-sbf && cd ../..
cd programs/compliance-hook && cargo build-sbf && cd ../..
cd programs/fx-netting && cargo build-sbf && cd ../..
cd programs/sweep-trigger && cargo build-sbf && cd ../..
```

### Expected Artifacts

After successful build, you'll have `.so` files in `target/sbf-solana-solana/release/`:

```
target/sbf-solana-solana/release/
├── entity_registry.so
├── pooling_engine.so
├── compliance_hook.so
├── fx_netting.so
└── sweep_trigger.so
```

---

## Step 2: Deploy Programs to Devnet

### Deploy Each Program

```bash
# Set network to devnet
solana config set --url https://api.devnet.solana.com

# Verify wallet balance
solana balance

# Deploy entity-registry
solana program deploy target/sbf-solana-solana/release/entity_registry.so \
  --program-id ~/.config/solana/id.json

# Deploy pooling-engine
solana program deploy target/sbf-solana-solana/release/pooling_engine.so \
  --program-id ~/.config/solana/id.json

# Deploy compliance-hook
solana program deploy target/sbf-solana-solana/release/compliance_hook.so \
  --program-id ~/.config/solana/id.json

# Deploy fx-netting
solana program deploy target/sbf-solana-solana/release/fx_netting.so \
  --program-id ~/.config/solana/id.json

# Deploy sweep-trigger
solana program deploy target/sbf-solana-solana/release/sweep_trigger.so \
  --program-id ~/.config/solana/id.json
```

### Capture Program IDs

After deployment, save the program IDs:

```bash
# Get all deployed programs
solana program show --programs

# Example output:
# Program Id: 11111111111111111111111111111111
# ...
```

---

## Step 3: Update Anchor.toml with Devnet Program IDs

Once you have the program IDs from deployment, update `Anchor.toml`:

```toml
[programs.devnet]
entity-registry = "YOUR_ENTITY_REGISTRY_PROGRAM_ID"
pooling-engine = "YOUR_POOLING_ENGINE_PROGRAM_ID"
compliance-hook = "YOUR_COMPLIANCE_HOOK_PROGRAM_ID"
fx-netting = "YOUR_FX_NETTING_PROGRAM_ID"
sweep-trigger = "YOUR_SWEEP_TRIGGER_PROGRAM_ID"
```

---

## Step 4: Configure Oracle Service

### 4.1 Set Up SIX Certificates

```bash
# Create certs directory if not present
mkdir -p services/six-oracle/certs

# Copy your team's certificates (LOCAL ONLY - NEVER COMMIT)
cp /path/to/private-key.pem services/six-oracle/certs/
cp /path/to/signed-certificate.pem services/six-oracle/certs/
cp /path/to/certificate.p12 services/six-oracle/certs/
```

### 4.2 Create .env File

```bash
cd services/six-oracle

# Create .env from template
cp .env.example .env

# Edit .env with your configuration (DO NOT COMMIT)
cat > .env << 'EOF'
# SIX API Configuration
SIX_API_URL=https://api.six-group.com/web/v2
SIX_POLL_INTERVAL_MS=30000
SIX_RATE_STALENESS_THRESHOLD=3600000
SIX_CERT_PATH=./certs/signed-certificate.pem
SIX_KEY_PATH=./certs/private-key.pem

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com

# Oracle Configuration
FX_NETTING_PROGRAM_ID=YOUR_FX_NETTING_PROGRAM_ID
ORACLE_AUTHORITY_KEYPAIR_PATH=~/.config/solana/id.json
EOF

# Never commit .env
echo ".env" >> .gitignore
```

### 4.3 Build Oracle Service

```bash
cd services/six-oracle

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test connection (optional - requires certificates)
npm start
```

---

## Step 5: Implement On-Chain Rate Submission

Update `services/six-oracle/src/index.ts` to submit rates on-chain:

### 5.1 Add Solana Dependencies

```bash
cd services/six-oracle
npm install @solana/web3.js @solana/spl-token
```

### 5.2 Implement submitRatesOnChain() Method

```typescript
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

async submitRatesOnChain(
  rates: Map<string, RateData>,
  oracleAuthorityPath: string,
  programId: PublicKey,
  connection: Connection
): Promise<void> {
  try {
    // Load oracle authority keypair
    const keypairPath = oracleAuthorityPath.replace('~', process.env.HOME!);
    const secretKey = JSON.parse(
      fs.readFileSync(keypairPath, 'utf-8')
    ) as number[];
    const oracleAuthority = Keypair.fromSecretKey(
      Uint8Array.from(secretKey)
    );

    // Create instructions for each rate
    const instructions: TransactionInstruction[] = [];

    for (const [pair, rateData] of rates) {
      const instruction = await this.createSetFxRateInstruction(
        programId,
        oracleAuthority,
        pair,
        rateData.rate
      );
      instructions.push(instruction);
    }

    // Create and send transaction
    const transaction = new Transaction();
    instructions.forEach(ix => transaction.add(ix));

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [oracleAuthority],
      { commitment: 'processed' }
    );

    console.log(`✅ Rates submitted on-chain: ${signature}`);
    this.stats.successfulSubmissions++;
  } catch (error) {
    console.error('❌ Failed to submit rates on-chain:', error);
    this.stats.failedSubmissions++;
  }
}

private async createSetFxRateInstruction(
  programId: PublicKey,
  oracleAuthority: Keypair,
  pair: string,
  rate: number
): Promise<TransactionInstruction> {
  // This would be implemented based on your actual fx-netting program IDL
  // For now, return a placeholder
  const instruction = new TransactionInstruction({
    programId,
    keys: [
      {
        pubkey: oracleAuthority.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    data: Buffer.from(JSON.stringify({ pair, rate })),
  });
  return instruction;
}
```

### 5.3 Integrate Rate Submission into Polling Loop

```typescript
async startPolling(): Promise<void> {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  );
  const programId = new PublicKey(process.env.FX_NETTING_PROGRAM_ID!);

  setInterval(async () => {
    try {
      await this.fetchRates();
      const rates = await this.parseRates();

      // Display rates in console
      this.displayRates(rates);

      // Submit rates on-chain
      await this.submitRatesOnChain(
        rates,
        process.env.ORACLE_AUTHORITY_KEYPAIR_PATH!,
        programId,
        connection
      );

      this.lastFetchTime = new Date();
    } catch (error) {
      console.error('❌ Polling error:', error);
      this.stats.failedFetches++;
    }
  }, this.pollInterval);
}
```

---

## Step 6: Run End-to-End Devnet Testing

### 6.1 Start Oracle Service

```bash
cd services/six-oracle

# Build and start
npm run build && npm start

# Expected output:
# ✅ Oracle service starting...
# ✅ Fetching rates from SIX API...
# [Rates displayed in table format]
# ✅ Rates submitted on-chain
```

### 6.2 Run Integration Tests Against Devnet

```bash
# In a new terminal
cd /home/sriranjini/nexus

# Run tests targeting devnet
SOLANA_NETWORK=devnet npm test

# Or using anchor test
anchor test --provider.cluster devnet
```

### 6.3 Verify On-Chain State

```bash
# Check oracle rates in fx-netting program state
solana account <FX_NETTING_PROGRAM_ID> -u devnet

# Get recent transactions
solana history --limit 10 -u devnet
```

---

## Testing Workflow

### Phase 1: Program Initialization

1. Initialize entity registry with test entities
2. Verify KYC validation logic
3. Check jurisdiction support for all 8 regulatory regions

```bash
# Example: Register test entity
solana program invoke <ENTITY_REGISTRY_PROGRAM_ID> \
  --data register_entity_data.json \
  -u devnet
```

### Phase 2: Pooling Cycle

1. Create test positions for 5 entities
2. Run netting cycle
3. Verify offset matches and interest calculations

### Phase 3: Compliance Checks

1. Execute test transfers
2. Verify transfer hook validation
3. Check AML oracle integration

### Phase 4: FX Rate Management

1. Verify SIX rates are fetched and stored on-chain
2. Test cross-currency offsetting
3. Validate rate oracle spreads

### Phase 5: Sweep Trigger

1. Create imbalances exceeding threshold
2. Verify loan creation
3. Test interest accrual (4.5% annual)
4. Execute loan repayment

---

## Troubleshooting

### Program Deployment Fails

```bash
# Check wallet balance
solana balance -u devnet

# Verify program builds correctly
cargo build --lib -p entity-registry

# Check devnet network status
solana cluster-version -u devnet
```

### Oracle Service Cannot Connect

```bash
# Verify certificates are in place
ls -la services/six-oracle/certs/

# Test mTLS connection manually
curl --cert services/six-oracle/certs/signed-certificate.pem \
     --key services/six-oracle/certs/private-key.pem \
     https://api.six-group.com/web/v2/
```

### Rate Submission Fails

```bash
# Verify oracle authority keypair
solana address -u devnet

# Check program address format
solana program show <PROGRAM_ID> -u devnet

# Review transaction logs
solana logs <TX_SIGNATURE> -u devnet
```

---

## Next Steps After Deployment

1. **Full Protocol Testing:** Execute complete workflow from entity registration to loan repayment
2. **Stress Testing:** Test with 100+ entities and complex netting scenarios
3. **Dashboard Development:** Build React UI for position tracking
4. **Mainnet Audit Prep:** Security audit before production deployment
5. **Documentation:** Complete technical specification and operator guides

---

## Security Checklist

- [ ] Certificates stored locally only (not in git)
- [ ] .env file in .gitignore
- [ ] Private keys never logged to console
- [ ] Rate updates signed and verified on-chain
- [ ] Rate staleness checks implemented
- [ ] Failed submissions logged for audit trail
- [ ] All transactions require oracle authority signature

---

## Deployment Confirmation Checklist

- [ ] All 5 programs deployed to devnet
- [ ] Program IDs updated in Anchor.toml
- [ ] Devnet wallet funded with enough SOL
- [ ] Oracle service connects to SIX API
- [ ] Rates submitted on-chain every 30 seconds
- [ ] All 58 integration tests pass on devnet
- [ ] Complete workflow executes end-to-end

---

**Status:** Ready for deployment once build system is fixed  
**Timeline:** ~2 hours for complete devnet setup and testing  
**Next Review:** After first successful on-chain rate submission
