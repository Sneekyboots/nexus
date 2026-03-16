# Phase 6: Tenity API & Devnet Setup Guide

## Step 1: Organize Tenity Credentials

You should have received from Tenity:

- **Account Certificate** (`.pem` or `.crt` file)
- **API Key** (authentication token)
- **Account ID** (your team's Tenity account identifier)
- **Web API Documentation** (PDF with endpoints)
- **Cross Currency & Commodities List** (Excel file)

### 1.1: Create credentials directory

```bash
mkdir -p credentials
mkdir -p solana-keypairs
```

### 1.2: Store Tenity Certificate

Place the Tenity certificate file in your credentials directory:

```bash
# Copy your certificate from Tenity email attachment
cp /path/to/your/tenity-certificate.pem credentials/tenity-cert.pem
cp /path/to/your/tenity-key.pem credentials/tenity-key.pem  # if provided
```

**IMPORTANT:** Never commit these files to git. They are automatically ignored by `.gitignore`.

---

## Step 2: Create `.env` Configuration File

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your Tenity credentials:

```env
# Tenity API Configuration
TENITY_API_URL=https://api.tenity.com/v1              # Get from documentation
TENITY_API_KEY=your_api_key_from_tenity_email         # Replace with your key
TENITY_ACCOUNT_ID=your_account_id_from_tenity_email   # Replace with your ID
TENITY_CERT_PATH=./credentials/tenity-cert.pem        # Path to certificate
TENITY_KEY_PATH=./credentials/tenity-key.pem          # Path to key (if provided)

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

**Important:** Keep `.env` local only, never commit it.

---

## Step 3: Generate Solana Keypairs for Devnet

```bash
# Generate deployer keypair (for deploying programs)
solana-keygen new --outfile solana-keypairs/deployer.json --no-passphrase

# Generate oracle authority keypair (for managing FX rates in the protocol)
solana-keygen new --outfile solana-keypairs/oracle-authority.json --no-passphrase

# (Optional) Generate test entity keypairs
solana-keygen new --outfile solana-keypairs/entity-singapore.json --no-passphrase
solana-keygen new --outfile solana-keypairs/entity-uae.json --no-passphrase
```

### Get Devnet SOL Funding

Your keypairs need SOL to deploy programs and execute transactions:

```bash
# Fund deployer keypair (request ~5 SOL)
solana airdrop 5 $(solana-keygen pubkey solana-keypairs/deployer.json) -u devnet

# Fund oracle authority keypair (request ~2 SOL)
solana airdrop 2 $(solana-keygen pubkey solana-keypairs/oracle-authority.json) -u devnet

# Check balance
solana balance $(solana-keygen pubkey solana-keypairs/deployer.json) -u devnet
```

---

## Step 4: Update Anchor.toml with Devnet Keypairs

Edit `Anchor.toml`:

```toml
[provider]
cluster = "devnet"
wallet = "solana-keypairs/deployer.json"

[programs.devnet]
entity_registry = "YOUR_ENTITY_REGISTRY_PROGRAM_ID"
pooling_engine = "YOUR_POOLING_ENGINE_PROGRAM_ID"
compliance_hook = "YOUR_COMPLIANCE_HOOK_PROGRAM_ID"
fx_netting = "YOUR_FX_NETTING_PROGRAM_ID"
sweep_trigger = "YOUR_SWEEP_TRIGGER_PROGRAM_ID"
```

---

## Step 5: Verify Tenity Connection (Optional)

Create a simple test script to verify your Tenity API credentials work:

```bash
# Test Tenity API connectivity
curl -X GET "https://api.tenity.com/v1/health" \
  -H "X-API-Key: YOUR_TENITY_API_KEY" \
  --cert credentials/tenity-cert.pem \
  --key credentials/tenity-key.pem
```

---

## Step 6: Environment Variables in Your Application

In your Rust code, use the `dotenv` crate to load credentials:

```rust
use dotenv::dotenv;
use std::env;

fn main() {
    dotenv().ok();

    let api_key = env::var("TENITY_API_KEY").expect("TENITY_API_KEY not found");
    let api_url = env::var("TENITY_API_URL").expect("TENITY_API_URL not found");

    // Use credentials in your application
}
```

---

## Credentials Checklist

- [ ] Downloaded Tenity certificate from email
- [ ] Copied certificate to `credentials/tenity-cert.pem`
- [ ] Created `.env` file with Tenity API key and account ID
- [ ] Generated Solana keypairs in `solana-keypairs/`
- [ ] Funded deployer keypair with devnet SOL
- [ ] Updated `Anchor.toml` with proper network configuration
- [ ] Verified `.env` is in `.gitignore` (not committed)
- [ ] (Optional) Verified Tenity API connectivity

---

## Security Best Practices

1. **Never commit credentials**: `.env`, `.pem`, and `.key` files are gitignored
2. **Use environment variables**: Don't hardcode API keys in source code
3. **Rotate keys regularly**: Generate new API keys if compromised
4. **Restrict keypair permissions**: `chmod 600 solana-keypairs/*.json`
5. **Share credentials safely**: Use secure channels (1Password, LastPass, etc.)

---

## Troubleshooting

**Q: "TENITY_API_KEY not found"**

- Ensure `.env` file exists in the root directory
- Check that you've added all required environment variables
- Verify the variable names match exactly (case-sensitive)

**Q: "Certificate verification failed"**

- Verify certificate file path is correct in `.env`
- Check certificate hasn't expired
- Ensure certificate format is correct (PEM format)

**Q: "Solana airdrop failed"**

- Wait a few seconds between airdrop requests
- Check that your keypair path is correct
- Verify you're using the correct devnet RPC URL

---

## Next Steps

Once setup is complete:

1. Run integration tests with Tenity FX rates
2. Deploy all 5 programs to devnet
3. Initialize protocol with test entities
4. Test full end-to-end netting workflow

See `PHASE_6_DEVNET_DEPLOYMENT.md` for deployment steps.
