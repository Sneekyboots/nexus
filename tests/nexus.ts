/**
 * NEXUS Protocol — Anchor integration tests
 *
 * Tests the entity-registry (L1) → pooling-engine (L2) flow on a local validator.
 * Run with:  anchor test --skip-local-validator   (against devnet)
 *        or: anchor test                          (spins up local validator)
 *
 * Coverage:
 *   1. register_entity        — creates EntityRecord PDA on L1
 *   2. verify_entity          — sets KYC Verified + expiry on L1
 *   3. create_pool            — creates PoolState PDA on L2
 *   4. add_entity_to_pool     — creates EntityPosition PDA on L2
 *   5. run_netting_cycle      — runs 7-step algorithm (passes EntityPosition via remaining_accounts)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";

// ── Program IDs (must match declare_id! in each lib.rs) ──────────────────────
const ENTITY_REGISTRY_ID = new PublicKey(
  "6fEr9VsnyCUdCPMHY7XYV6SFsw7td48aN9biM1UowzGh"
);
const POOLING_ENGINE_ID = new PublicKey(
  "Cot9BDy1Aos6fga3D7ZcaYmzdXxqAJ4jHFGMHDdbq8Sz"
);
const COMPLIANCE_HOOK_ID = new PublicKey(
  "5rogVdJwxrCGBVPEKV42aeKxwpnW4ESQbccpMbN2BPNS"
);
const FX_NETTING_ID = new PublicKey(
  "2RfkQCsFUjtzX1PavSHF2ZgCQj9Ua1Q72pLAzd3KfnZ7"
);
const SWEEP_TRIGGER_ID = new PublicKey(
  "4EbB5Ahei4nhAkfrqyjr7ZE3VPyBhi4pbMRyrpyRbEQq"
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomId(): Uint8Array {
  const id = new Uint8Array(32);
  crypto.getRandomValues(id);
  return id;
}

async function airdropIfNeeded(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  minLamports: number = 2 * LAMPORTS_PER_SOL
) {
  const balance = await connection.getBalance(pubkey);
  if (balance < minLamports) {
    const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  }
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("NEXUS Protocol — entity-registry + pooling-engine integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const adminKp = provider.wallet as anchor.Wallet;

  // Load programs by ID with minimal IDL stubs — Anchor's Program constructor
  // accepts a raw IDL object; we provide enough for instruction building.
  let entityRegistryProgram: Program;
  let poolingEngineProgram: Program;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);

    // Load generated IDLs (produced by `anchor build`).
    // The IDL JSON contains an "address" field matching the program's declare_id!,
    // so no program-id argument is needed in Anchor 0.31.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const entityRegistryIdl = require("../target/idl/entity_registry.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const poolingEngineIdl = require("../target/idl/pooling_engine.json");

    // Anchor 0.31 Program constructor: new Program(idl, provider?)
    entityRegistryProgram = new Program(entityRegistryIdl, provider);
    poolingEngineProgram = new Program(poolingEngineIdl, provider);
  });

  // ── Shared state ─────────────────────────────────────────────────────────

  const entityId = randomId();
  const poolId = randomId();

  let entityRecordPda: PublicKey;
  let entityRecordBump: number;
  let poolStatePda: PublicKey;
  let poolStateBump: number;
  let entityPositionPda: PublicKey;

  // ── 1. register_entity ───────────────────────────────────────────────────

  it("L1 register_entity — creates EntityRecord PDA", async () => {
    [entityRecordPda, entityRecordBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(entityId)],
      ENTITY_REGISTRY_ID
    );

    const mandateLimits = {
      maxSingleTransfer: new BN("1000000000000"), // 1M USDC (6 dec)
      maxDailyAggregate: new BN("5000000000000"), // 5M USDC
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };

    const tx = await entityRegistryProgram.methods
      .registerEntity(
        Array.from(entityId),
        "AMINA Bank Singapore",
        2, // SFC jurisdiction
        mandateLimits
      )
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: entityRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  register_entity tx:", tx);

    const record = await entityRegistryProgram.account["entityRecord"].fetch(
      entityRecordPda
    );
    assert.deepEqual(record.entityId, Array.from(entityId));
    assert.equal(record.legalName, "AMINA Bank Singapore");
    assert.deepEqual(record.kycStatus, { pending: {} });
  });

  // ── 2. verify_entity ────────────────────────────────────────────────────

  it("L1 verify_entity — sets KYC Verified with future expiry", async () => {
    // 1 year from now
    const expiry = new BN(Math.floor(Date.now() / 1000) + 365 * 86400);

    const tx = await entityRegistryProgram.methods
      .verifyEntity(Array.from(entityId), expiry)
      .accounts({
        kycOracle: adminKp.publicKey,
        entityRecord: entityRecordPda,
      })
      .rpc();

    console.log("  verify_entity tx:", tx);

    const record = await entityRegistryProgram.account["entityRecord"].fetch(
      entityRecordPda
    );
    assert.deepEqual(record.kycStatus, { verified: {} });
    assert(record.kycExpiry.gt(new BN(0)));
  });

  // ── 3. create_pool ──────────────────────────────────────────────────────

  it("L2 create_pool — creates PoolState PDA", async () => {
    [poolStatePda, poolStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from(poolId)],
      POOLING_ENGINE_ID
    );

    const sweepThreshold = new BN("100000000000"); // 100k USDC
    const nettingFrequency = 3; // Manual

    const tx = await poolingEngineProgram.methods
      .createPool(Array.from(poolId), sweepThreshold, nettingFrequency)
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  create_pool tx:", tx);

    const pool = await poolingEngineProgram.account["poolState"].fetch(
      poolStatePda
    );
    assert.deepEqual(pool.poolId, Array.from(poolId));
    assert.equal(pool.memberCount, 0);
    assert.deepEqual(pool.nettingFrequency, { manual: {} });
  });

  // ── 4. add_entity_to_pool ───────────────────────────────────────────────

  it("L2 add_entity_to_pool — creates EntityPosition PDA", async () => {
    const entityPubkey = adminKp.publicKey; // entity_id is the pubkey in this instruction

    [entityPositionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("entity_position"),
        Buffer.from(poolId),
        entityPubkey.toBuffer(),
      ],
      POOLING_ENGINE_ID
    );

    const currencyMint = Keypair.generate().publicKey; // placeholder mint
    const sixCurrencyCode = Array.from(Buffer.from("USD"));

    const tx = await poolingEngineProgram.methods
      .addEntityToPool(
        Array.from(poolId),
        entityPubkey,
        currencyMint,
        sixCurrencyCode
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        entityPosition: entityPositionPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  add_entity_to_pool tx:", tx);

    const pos = await poolingEngineProgram.account["entityPosition"].fetch(
      entityPositionPda
    );
    assert.equal(pos.entityId.toString(), entityPubkey.toString());
    assert.equal(pos.realBalance.toString(), "0");

    const pool = await poolingEngineProgram.account["poolState"].fetch(
      poolStatePda
    );
    assert.equal(pool.memberCount, 1);
  });

  // ── 5. run_netting_cycle ────────────────────────────────────────────────
  // NOTE: run_netting_cycle requires SweepConfig, ComplianceHook, FxNetting, and
  // SweepTrigger programs to be deployed and their PDAs to be initialised.
  // On a bare local validator without those programs deployed, the CPI calls will
  // fail. This test validates the instruction can be built and submitted; it is
  // marked as skipped unless the full 5-program suite is deployed.

  it("L2 run_netting_cycle — dispatches 7-step netting via real CPI chain", async function () {
    // Check if all 5 programs are deployed; skip gracefully if not
    const programs = [
      { name: "entity-registry", id: ENTITY_REGISTRY_ID },
      { name: "pooling-engine", id: POOLING_ENGINE_ID },
      { name: "compliance-hook", id: COMPLIANCE_HOOK_ID },
      { name: "fx-netting", id: FX_NETTING_ID },
      { name: "sweep-trigger", id: SWEEP_TRIGGER_ID },
    ];

    for (const { name, id } of programs) {
      const info = await provider.connection.getAccountInfo(id);
      if (!info) {
        console.log(`  Skipping: ${name} not deployed on this network`);
        this.skip();
      }
    }

    // Derive sweep_config PDA on sweep-trigger program
    const [sweepConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sweep_config"), Buffer.from(poolId)],
      SWEEP_TRIGGER_ID
    );

    const tx = await poolingEngineProgram.methods
      .runNettingCycle()
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        complianceHookProgram: COMPLIANCE_HOOK_ID,
        fxNettingProgram: FX_NETTING_ID,
        sweepTriggerProgram: SWEEP_TRIGGER_ID,
        sweepConfig: sweepConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        // Pass the EntityPosition PDA so the handler can read it
        {
          pubkey: entityPositionPda,
          isWritable: false,
          isSigner: false,
        },
      ])
      .rpc();

    console.log("  run_netting_cycle tx:", tx);
    assert.ok(tx, "Expected a transaction signature");
  });
});
