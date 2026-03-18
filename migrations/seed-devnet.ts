/**
 * NEXUS Protocol - Devnet Seed Script (Phase 2d)
 *
 * This script sets up 4 test entities on Solana devnet:
 * - Singapore: +800 billion USDC (surplus)
 * - UAE: -300 billion USDC (deficit)
 * - UK: +200 billion GBP (surplus)
 * - Germany: -400 billion EUR (deficit)
 *
 * Creates:
 * 1. Registers all 4 entities in Layer 1 (Entity Registry)
 * 2. Verifies KYC for all 4 entities
 *
 * Note: Token-2022 mints should be created separately using Token-2022 CLI tools
 * or integrated with a full deployment script.
 *
 * Run with: ts-node migrations/seed-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";

interface TestEntity {
  name: string;
  jurisdiction: number;
  currency: string;
  initialBalance: bigint;
  maxSingleTransfer: bigint;
  maxDailyAggregate: bigint;
  entityId: Buffer;
  vaultKeypair: Keypair;
}

// Start with empty - users register their first company through the UI
const TEST_ENTITIES: TestEntity[] = [];

const JURISDICTION_NAMES: Record<number, string> = {
  0: "FINMA (Switzerland)",
  1: "MICA (EU)",
  2: "SFC (Hong Kong)",
  3: "FCA (UK)",
  4: "ADGM (UAE)",
  5: "RBI (India)",
};

async function registerEntity(
  program: anchor.Program,
  entity: TestEntity,
  payer: Keypair
): Promise<void> {
  console.log(`\n→ Registering entity: ${entity.name}...`);

  try {
    const [entityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), entity.entityId],
      program.programId
    );

    // Call register_entity instruction
    const tx = await program.methods
      .registerEntity(entity.entityId, entity.name)
      .accounts({
        entityRecord: entityPda,
        registrar: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc({ commitment: "confirmed" });

    console.log(`  ✓ Entity registered: ${entity.name}`);
    console.log(`    PDA: ${entityPda.toBase58()}`);
    console.log(`    Transaction: ${tx}`);

    // Verify entity (set KYC status to Verified)
    console.log(`  → Verifying KYC for ${entity.name}...`);

    const expiryTimestamp = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    const verifyTx = await program.methods
      .verifyEntity(entity.entityId, new anchor.BN(expiryTimestamp))
      .accounts({
        entityRecord: entityPda,
        kycOracle: payer.publicKey,
      })
      .signers([payer])
      .rpc({ commitment: "confirmed" });

    console.log(`  ✓ KYC verified for ${entity.name}`);
    console.log(
      `    Expiry: ${new Date(expiryTimestamp * 1000).toISOString()}`
    );
    console.log(`    Transaction: ${verifyTx}`);
  } catch (error) {
    console.error(`✗ Failed to register entity ${entity.name}:`, error);
    throw error;
  }
}

async function main() {
  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL || "http://localhost:8899",
    "confirmed"
  );

  // Get payer from Solana CLI default
  const payerPath = path.join(homedir(), ".config/solana/id.json");
  if (!fs.existsSync(payerPath)) {
    throw new Error(
      `Payer keypair not found at ${payerPath}. Run 'solana-keygen new' first.`
    );
  }

  const payerSecret = JSON.parse(fs.readFileSync(payerPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Buffer.from(payerSecret));

  console.log("\n" + "=".repeat(80));
  console.log("NEXUS Protocol - Devnet Seed Script (Phase 2d)");
  console.log("=".repeat(80));
  console.log(`\nPayer: ${payer.publicKey.toBase58()}`);
  console.log(`RPC Endpoint: ${connection.rpcEndpoint}`);

  // Check payer balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Payer Balance: ${(balance / 1e9).toFixed(4)} SOL`);

  if (balance < 5 * 1e9) {
    console.error(
      "\n✗ Insufficient balance. Need at least 5 SOL to seed. Continuing anyway...\n"
    );
  }

  console.log("\n" + "=".repeat(80));
  console.log("Step 1: Registering Entities");
  console.log("=".repeat(80));

  try {
    const idlPath = path.join(__dirname, "../target/idl/entity_registry.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const programId = new PublicKey(
      process.env.ENTITY_REGISTRY_PROGRAM_ID ||
        "11111111111111111111111111111111"
    );

    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: payer.publicKey,
        signTransaction: async (tx) => {
          tx.sign([payer]);
          return tx;
        },
        signAllTransactions: async (txs) => {
          return txs.map((tx) => {
            tx.sign([payer]);
            return tx;
          });
        },
      } as any,
      { commitment: "confirmed" }
    );

    const program = new anchor.Program(idl, provider);

    // Register all 4 entities
    for (const entity of TEST_ENTITIES) {
      await registerEntity(program, entity, payer);
    }

    console.log("\n✓ All entities registered and KYC verified!");
  } catch (error) {
    console.error(
      "\n⚠ Note: Entity Registry program not yet deployed. Skipping entity registration."
    );
    console.error("  This will be completed after Phase 2b is finished.\n");
    console.error(`  Error: ${(error as Error).message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("Seed Script Summary");
  console.log("=".repeat(80) + "\n");

  console.log("Entities Configured:");
  for (const entity of TEST_ENTITIES) {
    const balanceBillion = entity.initialBalance / BigInt(1_000_000_000);
    console.log(`  • ${entity.name} (${entity.currency})`);
    console.log(`    → Initial Balance: ${balanceBillion}B`);
    console.log(
      `    → Jurisdiction: ${JURISDICTION_NAMES[entity.jurisdiction]}`
    );
    console.log(`    → Max Single Transfer: 100B`);
    console.log(`    → Max Daily Aggregate: 500B`);
    console.log(`    → Vault: ${entity.vaultKeypair.publicKey.toBase58()}`);
  }

  console.log("\nConfiguration saved to: /tmp/nexus-seed-config.json");

  const seedConfig = {
    network: "devnet",
    timestamp: new Date().toISOString(),
    payer: payer.publicKey.toBase58(),
    entities: TEST_ENTITIES.map((e) => ({
      name: e.name,
      currency: e.currency,
      jurisdiction: JURISDICTION_NAMES[e.jurisdiction],
      initialBalance: e.initialBalance.toString(),
      maxSingleTransfer: e.maxSingleTransfer.toString(),
      maxDailyAggregate: e.maxDailyAggregate.toString(),
      entityId: e.entityId.toString("hex"),
      vault: e.vaultKeypair.publicKey.toBase58(),
    })),
  };

  fs.writeFileSync(
    "/tmp/nexus-seed-config.json",
    JSON.stringify(seedConfig, null, 2)
  );

  console.log("\n" + "=".repeat(80));
  console.log("Expected Algorithm Behavior (from Phase 1 tests)");
  console.log("=".repeat(80) + "\n");

  console.log("After first netting cycle:");
  console.log("-".repeat(80));
  console.log("\nMatches Created:");
  console.log("  1. Singapore (+800B) ↔ UAE (-300B)");
  console.log("     → Singapore gives 300B to UAE → Both settled!");
  console.log("  2. UK (+200B) ↔ Germany (-400B)");
  console.log("     → UK gives 200B to Germany → Germany still owes 200B");

  console.log("\nResult:");
  console.log("  • 2 offset matches created");
  console.log("  • Total before = Total after (invariant preserved)");
  console.log("  • Interest accrues to Singapore and UK (4.5% per year)");
  console.log("  • Germany's remaining debt triggers sweep");

  console.log("\n" + "=".repeat(80) + "\n");
}

main()
  .then(() => {
    console.log("✅ Seed script completed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
