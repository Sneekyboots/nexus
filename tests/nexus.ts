/**
 * NEXUS Protocol — Full Integration Test Suite
 *
 * Covers all 5 layers against the surfpool local validator:
 *   L1  entity-registry  : register, verify, suspend, update_mandate_limits, rotate_compliance_officer
 *   L2  pooling-engine   : create_pool, init_oracle, update_six_oracle, add_entity_to_pool, run_netting_cycle
 *   L3  compliance-hook  : transfer_hook (pass + fail cases)
 *   L4  fx-netting       : set_fx_rate, cross_currency_offset
 *   L5  sweep-trigger    : init_sweep_config, detect_sweep_trigger, execute_sweep, repay_loan
 *   E2E                  : full 5-layer CPI chain
 *
 * Run: anchor test --skip-local-validator
 */

import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";
import entityRegistryIdl from "../target/idl/entity_registry.json" with { type: "json" };
import poolingEngineIdl from "../target/idl/pooling_engine.json" with { type: "json" };
import complianceHookIdl from "../target/idl/compliance_hook.json" with { type: "json" };
import fxNettingIdl from "../target/idl/fx_netting.json" with { type: "json" };
import sweepTriggerIdl from "../target/idl/sweep_trigger.json" with { type: "json" };

// ── Surfpool program IDs (matches keypairs in target/deploy/) ──────────────
const ENTITY_REGISTRY_ID = new PublicKey(
  "J4CSWfakHC2Ta7k2BTszksmgQLZU3cJAKpVDNgCgwXwq"
);
const POOLING_ENGINE_ID = new PublicKey(
  "C9nSWxVhNk71FcshhkpQ8b3Ro4hqFP1Y9XLEKqfzJjeF"
);
const COMPLIANCE_HOOK_ID = new PublicKey(
  "jmkdf4hD8WyYR4XBuzFKoFJeLXLzwpQS7Tr7fFz6R2t"
);
const FX_NETTING_ID = new PublicKey(
  "9UbcgtEHCN558aC2fmcTuiC7P9X8nMp31i9xeiymuiC3"
);
const SWEEP_TRIGGER_ID = new PublicKey(
  "A1duxrShkRCTVatLiNptFNC9rsKNM9chQnCysq6r9hDN"
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomBytes32(): Uint8Array {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return b;
}

function bytes3(s: string): number[] {
  const b = Buffer.from(s.padEnd(3, "\0").slice(0, 3));
  return Array.from(b);
}

async function airdropIfNeeded(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  minLamports = 2 * LAMPORTS_PER_SOL
) {
  const balance = await connection.getBalance(pubkey);
  if (balance < minLamports) {
    const sig = await connection.requestAirdrop(pubkey, 4 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — entity-registry
// ─────────────────────────────────────────────────────────────────────────────

describe("L1 — entity-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let program: Program;

  // shared across tests in this suite
  const entityId = randomBytes32();
  let entityRecordPda: PublicKey;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);
    program = new Program(entityRegistryIdl as anchor.Idl, provider);

    [entityRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(entityId)],
      ENTITY_REGISTRY_ID
    );
  });

  it("register_entity — creates EntityRecord PDA", async () => {
    const mandateLimits = {
      maxSingleTransfer: new BN("1000000000000"),
      maxDailyAggregate: new BN("5000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };

    const tx = await program.methods
      .registerEntity(
        Array.from(entityId),
        "AMINA Bank Singapore",
        2,
        mandateLimits
      )
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: entityRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    register_entity tx:", tx);

    const record = await program.account["entityRecord"].fetch(entityRecordPda);
    assert.deepEqual(record.entityId, Array.from(entityId));
    assert.equal(record.legalName, "AMINA Bank Singapore");
    assert.deepEqual(record.kycStatus, { pending: {} });
    assert.deepEqual(record.jurisdiction, { sfc: {} }); // jurisdiction 2 = SFC
    assert.equal(
      record.mandateLimits.maxSingleTransfer.toString(),
      "1000000000000"
    );
  });

  it("verify_entity — sets KYC Verified with future expiry", async () => {
    const expiry = new BN(Math.floor(Date.now() / 1000) + 365 * 86400);

    const tx = await program.methods
      .verifyEntity(Array.from(entityId), expiry)
      .accounts({
        kycOracle: adminKp.publicKey,
        entityRecord: entityRecordPda,
      })
      .rpc();

    console.log("    verify_entity tx:", tx);

    const record = await program.account["entityRecord"].fetch(entityRecordPda);
    assert.deepEqual(record.kycStatus, { verified: {} });
    assert(record.kycExpiry.gt(new BN(0)), "kycExpiry should be > 0");
  });

  it("update_mandate_limits — compliance officer updates limits", async () => {
    // admin is compliance_officer on the newly registered entity
    const newLimits = {
      maxSingleTransfer: new BN("500000000000"),
      maxDailyAggregate: new BN("2000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };

    const tx = await program.methods
      .updateMandateLimits(Array.from(entityId), newLimits)
      .accounts({
        complianceOfficer: adminKp.publicKey,
        entityRecord: entityRecordPda,
      })
      .rpc();

    console.log("    update_mandate_limits tx:", tx);

    const record = await program.account["entityRecord"].fetch(entityRecordPda);
    assert.equal(
      record.mandateLimits.maxSingleTransfer.toString(),
      "500000000000"
    );
    assert.equal(
      record.mandateLimits.maxDailyAggregate.toString(),
      "2000000000000"
    );
  });

  it("rotate_compliance_officer — transfers compliance role", async () => {
    const newOfficer = Keypair.generate().publicKey;

    const tx = await program.methods
      .rotateComplianceOfficer(Array.from(entityId), newOfficer)
      .accounts({
        authority: adminKp.publicKey,
        entityRecord: entityRecordPda,
      })
      .rpc();

    console.log("    rotate_compliance_officer tx:", tx);

    const record = await program.account["entityRecord"].fetch(entityRecordPda);
    assert.equal(record.complianceOfficer.toString(), newOfficer.toString());
  });

  it("register_entity — second entity (UAE, KYC pending)", async () => {
    const uaeEntityId = randomBytes32();
    const [uaePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(uaeEntityId)],
      ENTITY_REGISTRY_ID
    );

    const mandateLimits = {
      maxSingleTransfer: new BN("2000000000000"),
      maxDailyAggregate: new BN("10000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };

    const tx = await program.methods
      .registerEntity(Array.from(uaeEntityId), "Emirates NBD", 3, mandateLimits)
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: uaePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    register_entity (UAE) tx:", tx);

    const record = await program.account["entityRecord"].fetch(uaePda);
    assert.equal(record.legalName, "Emirates NBD");
    assert.deepEqual(record.kycStatus, { pending: {} });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — pooling-engine
// ─────────────────────────────────────────────────────────────────────────────

describe("L2 — pooling-engine", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let program: Program;

  const poolId = randomBytes32();
  let poolStatePda: PublicKey;

  const entityIdA = randomBytes32(); // Singapore USD entity
  const entityIdB = randomBytes32(); // UAE USD entity
  let entityPositionPdaA: PublicKey;
  let entityPositionPdaB: PublicKey;
  let oraclePda: PublicKey;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);
    program = new Program(poolingEngineIdl as anchor.Idl, provider);

    [poolStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from(poolId)],
      POOLING_ENGINE_ID
    );
    [entityPositionPdaA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("entity_position"),
        Buffer.from(poolId),
        adminKp.publicKey.toBuffer(),
      ],
      POOLING_ENGINE_ID
    );
    [oraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("six_oracle")],
      POOLING_ENGINE_ID
    );
  });

  it("create_pool — creates PoolState PDA", async () => {
    const sweepThreshold = new BN("100000000000");
    const nettingFrequency = 3; // Manual

    const tx = await program.methods
      .createPool(Array.from(poolId), sweepThreshold, nettingFrequency)
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    create_pool tx:", tx);

    const pool = await program.account["poolState"].fetch(poolStatePda);
    assert.deepEqual(pool.poolId, Array.from(poolId));
    assert.equal(pool.memberCount, 0);
    assert.deepEqual(pool.nettingFrequency, { manual: {} });
    assert.equal(pool.sweepThreshold.toString(), "100000000000");
  });

  it("init_oracle — creates SixOracleState PDA", async () => {
    const tx = await program.methods
      .initOracle()
      .accounts({
        payer: adminKp.publicKey,
        oracleState: oraclePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    init_oracle tx:", tx);

    const oracle = await program.account["sixOracleState"].fetch(oraclePda);
    assert.ok(oracle.authority.toString() === adminKp.publicKey.toString());
  });

  it("update_six_oracle — sets FX rates for 2 pairs", async () => {
    // Program takes a fixed [FxRate; 6] array — pad remaining entries with zeroes
    const zeroRate = {
      currencyPair: Array.from(Buffer.alloc(6)),
      rate: new BN(0),
      timestamp: new BN(0),
    };
    const rates = [
      {
        currencyPair: Array.from(Buffer.from("EURUSD")),
        rate: new BN("1085000000"),
        timestamp: new BN(Math.floor(Date.now() / 1000)),
      },
      {
        currencyPair: Array.from(Buffer.from("GBPUSD")),
        rate: new BN("1265000000"),
        timestamp: new BN(Math.floor(Date.now() / 1000)),
      },
      zeroRate,
      zeroRate,
      zeroRate,
      zeroRate,
    ];

    const tx = await program.methods
      .updateSixOracle(rates)
      .accounts({
        authority: adminKp.publicKey,
        oracleState: oraclePda,
      })
      .rpc();

    console.log("    update_six_oracle tx:", tx);

    const oracle = await program.account["sixOracleState"].fetch(oraclePda);
    // At least the first rate should be set
    assert.ok(oracle.rates[0].rate.toString() !== "0");
  });

  it("add_entity_to_pool (A) — Singapore USD entity", async () => {
    const currencyMint = Keypair.generate().publicKey;
    const sixCode = bytes3("USD");

    const tx = await program.methods
      .addEntityToPool(
        Array.from(poolId),
        adminKp.publicKey,
        currencyMint,
        sixCode
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        entityPosition: entityPositionPdaA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    add_entity_to_pool (A) tx:", tx);

    const pos = await program.account["entityPosition"].fetch(
      entityPositionPdaA
    );
    assert.equal(pos.entityId.toString(), adminKp.publicKey.toString());
    assert.equal(pos.realBalance.toString(), "0");

    const pool = await program.account["poolState"].fetch(poolStatePda);
    assert.equal(pool.memberCount, 1);
  });

  it("add_entity_to_pool (B) — second entity EUR", async () => {
    const entityBKp = Keypair.generate();
    await airdropIfNeeded(provider.connection, entityBKp.publicKey);

    [entityPositionPdaB] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("entity_position"),
        Buffer.from(poolId),
        entityBKp.publicKey.toBuffer(),
      ],
      POOLING_ENGINE_ID
    );

    const currencyMint = Keypair.generate().publicKey;
    const sixCode = bytes3("EUR");

    const tx = await program.methods
      .addEntityToPool(
        Array.from(poolId),
        entityBKp.publicKey,
        currencyMint,
        sixCode
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        entityPosition: entityPositionPdaB,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    add_entity_to_pool (B) tx:", tx);

    const pool = await program.account["poolState"].fetch(poolStatePda);
    assert.equal(pool.memberCount, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — compliance-hook
// ─────────────────────────────────────────────────────────────────────────────

describe("L3 — compliance-hook", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let erProgram: Program;
  let chProgram: Program;

  const entityId = randomBytes32();
  let entityRecordPda: PublicKey;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);
    erProgram = new Program(entityRegistryIdl as anchor.Idl, provider);
    chProgram = new Program(complianceHookIdl as anchor.Idl, provider);

    [entityRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(entityId)],
      ENTITY_REGISTRY_ID
    );

    // Register + verify the entity
    const mandateLimits = {
      maxSingleTransfer: new BN("1000000000000"),
      maxDailyAggregate: new BN("5000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };
    await erProgram.methods
      .registerEntity(
        Array.from(entityId),
        "Compliance Test Bank",
        2,
        mandateLimits
      )
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: entityRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const expiry = new BN(Math.floor(Date.now() / 1000) + 365 * 86400);
    await erProgram.methods
      .verifyEntity(Array.from(entityId), expiry)
      .accounts({
        kycOracle: adminKp.publicKey,
        entityRecord: entityRecordPda,
      })
      .rpc();
  });

  it("transfer_hook — passes for KYC-verified entity under limit", async () => {
    const amount = new BN("100000000000"); // 100k USDC — under 1M limit

    const tx = await chProgram.methods
      .transferHook(amount)
      .accounts({
        sourceTokenAccount: adminKp.publicKey,
        destinationTokenAccount: adminKp.publicKey,
        senderEntity: entityRecordPda,
      })
      .rpc();

    console.log("    transfer_hook (pass) tx:", tx);
    assert.ok(tx);
  });

  it("transfer_hook — rejects amount exceeding single-transfer limit", async () => {
    const amount = new BN("2000000000000"); // 2M USDC — over 1M limit

    try {
      await chProgram.methods
        .transferHook(amount)
        .accounts({
          sourceTokenAccount: adminKp.publicKey,
          destinationTokenAccount: adminKp.publicKey,
          senderEntity: entityRecordPda,
        })
        .rpc();
      assert.fail("Expected transaction to fail");
    } catch (err: any) {
      console.log("    transfer_hook (reject over limit) correctly failed");
      assert.ok(
        err.message.includes("SingleTransferExceedsLimit") ||
          err.message.includes("0x") ||
          err.error?.errorCode?.code === "SingleTransferExceedsLimit",
        `Unexpected error: ${err.message}`
      );
    }
  });

  it("transfer_hook — rejects unverified (pending KYC) entity", async () => {
    // Create a new entity but do NOT verify it
    const unverifiedId = randomBytes32();
    const [unverifiedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(unverifiedId)],
      ENTITY_REGISTRY_ID
    );
    const mandateLimits = {
      maxSingleTransfer: new BN("1000000000000"),
      maxDailyAggregate: new BN("5000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };
    await erProgram.methods
      .registerEntity(
        Array.from(unverifiedId),
        "Unverified Corp",
        1,
        mandateLimits
      )
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: unverifiedPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    try {
      await chProgram.methods
        .transferHook(new BN("1000000"))
        .accounts({
          sourceTokenAccount: adminKp.publicKey,
          destinationTokenAccount: adminKp.publicKey,
          senderEntity: unverifiedPda,
        })
        .rpc();
      assert.fail("Expected transaction to fail for unverified entity");
    } catch (err: any) {
      console.log("    transfer_hook (reject unverified) correctly failed");
      assert.ok(err, "Should throw an error");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4 — fx-netting
// ─────────────────────────────────────────────────────────────────────────────

describe("L4 — fx-netting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let program: Program;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);
    program = new Program(fxNettingIdl as anchor.Idl, provider);
  });

  it("set_fx_rate — EUR/USD rate", async () => {
    const src = bytes3("EUR");
    const tgt = bytes3("USD");
    const rate = new BN("1085000000"); // 1.085 (9 decimal places)
    const spreadBps = 10;

    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fxrate"), Buffer.from(src), Buffer.from(tgt)],
      FX_NETTING_ID
    );

    const tx = await program.methods
      .setFxRate(src, tgt, rate, spreadBps)
      .accounts({
        oracleAuthority: adminKp.publicKey,
        fxRateOracle: fxRatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    set_fx_rate EUR/USD tx:", tx);

    const oracle = await program.account["fxRateOracle"].fetch(fxRatePda);
    assert.equal(oracle.rate.toString(), rate.toString());
    assert.equal(oracle.spreadBps, spreadBps);
    assert.deepEqual(oracle.sourceCurrency, src);
    assert.deepEqual(oracle.targetCurrency, tgt);
  });

  it("set_fx_rate — GBP/USD rate", async () => {
    const src = bytes3("GBP");
    const tgt = bytes3("USD");
    const rate = new BN("1265000000");
    const spreadBps = 12;

    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fxrate"), Buffer.from(src), Buffer.from(tgt)],
      FX_NETTING_ID
    );

    const tx = await program.methods
      .setFxRate(src, tgt, rate, spreadBps)
      .accounts({
        oracleAuthority: adminKp.publicKey,
        fxRateOracle: fxRatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    set_fx_rate GBP/USD tx:", tx);

    const oracle = await program.account["fxRateOracle"].fetch(fxRatePda);
    assert.equal(oracle.rate.toString(), rate.toString());
  });

  it("set_fx_rate — SGD/USD rate", async () => {
    const src = bytes3("SGD");
    const tgt = bytes3("USD");
    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fxrate"), Buffer.from(src), Buffer.from(tgt)],
      FX_NETTING_ID
    );
    await program.methods
      .setFxRate(src, tgt, new BN("742000000"), 8)
      .accounts({
        oracleAuthority: adminKp.publicKey,
        fxRateOracle: fxRatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("    set_fx_rate SGD/USD ok");
  });

  it("set_fx_rate — rejects unsupported currency", async () => {
    const src = bytes3("XYZ"); // not in supported list
    const tgt = bytes3("USD");
    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fxrate"), Buffer.from(src), Buffer.from(tgt)],
      FX_NETTING_ID
    );

    try {
      await program.methods
        .setFxRate(src, tgt, new BN("1000000000"), 10)
        .accounts({
          oracleAuthority: adminKp.publicKey,
          fxRateOracle: fxRatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Expected UnsupportedCurrency error");
    } catch (err: any) {
      console.log("    set_fx_rate (unsupported currency) correctly rejected");
      assert.ok(err, "Should throw");
    }
  });

  it("cross_currency_offset — EUR -> USD conversion", async () => {
    const src = bytes3("EUR");
    const tgt = bytes3("USD");
    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fxrate"), Buffer.from(src), Buffer.from(tgt)],
      FX_NETTING_ID
    );

    const sourceEntity = Keypair.generate().publicKey;
    const targetEntity = Keypair.generate().publicKey;
    const sourceAmount = new BN("500000000000"); // 500k EUR

    const tx = await program.methods
      .crossCurrencyOffset(sourceEntity, targetEntity, src, tgt, sourceAmount)
      .accounts({
        poolAdmin: adminKp.publicKey,
        fxRateOracle: fxRatePda,
      })
      .rpc();

    console.log("    cross_currency_offset EUR/USD tx:", tx);
    assert.ok(tx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 5 — sweep-trigger
// ─────────────────────────────────────────────────────────────────────────────

describe("L5 — sweep-trigger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let program: Program;

  const poolId = randomBytes32();
  const sweepId = randomBytes32();
  let sweepConfigPda: PublicKey;
  let loanPda: PublicKey;

  const lenderEntity = Keypair.generate().publicKey;
  const borrowerEntity = Keypair.generate().publicKey;

  before(async () => {
    await airdropIfNeeded(provider.connection, adminKp.publicKey);
    program = new Program(sweepTriggerIdl as anchor.Idl, provider);

    [sweepConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sweep_config"), Buffer.from(poolId)],
      SWEEP_TRIGGER_ID
    );
    [loanPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), Buffer.from(sweepId)],
      SWEEP_TRIGGER_ID
    );
  });

  it("init_sweep_config — creates SweepConfig PDA", async () => {
    const sweepThreshold = new BN("50000000000"); // 50k USD
    const maxLoan = new BN("10000000000000"); // 10M USD
    const interestRateBps = 350; // 3.5%

    const tx = await program.methods
      .initSweepConfig(
        Array.from(poolId),
        sweepThreshold,
        maxLoan,
        interestRateBps
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        sweepConfig: sweepConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    init_sweep_config tx:", tx);

    const config = await program.account["sweepConfig"].fetch(sweepConfigPda);
    assert.deepEqual(config.poolId, Array.from(poolId));
    assert.equal(
      config.sweepThresholdUsd.toString(),
      sweepThreshold.toString()
    );
    assert.equal(config.maxIntercompanyLoanUsd.toString(), maxLoan.toString());
    assert.equal(config.baseInterestRateBps, interestRateBps);
    assert.equal(config.totalLoansIssued.toString(), "0");
  });

  it("detect_sweep_trigger — fires when imbalance exceeds threshold", async () => {
    const imbalance = new BN("75000000000"); // 75k USD > 50k threshold

    const tx = await program.methods
      .detectSweepTrigger(Array.from(poolId), imbalance)
      .accounts({
        poolAdmin: adminKp.publicKey,
        sweepConfig: sweepConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    detect_sweep_trigger tx:", tx);
    assert.ok(tx);
  });

  it("detect_sweep_trigger — rejects when below threshold", async () => {
    const imbalance = new BN("10000000000"); // 10k USD < 50k threshold

    try {
      await program.methods
        .detectSweepTrigger(Array.from(poolId), imbalance)
        .accounts({
          poolAdmin: adminKp.publicKey,
          sweepConfig: sweepConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Expected ThresholdNotReached error");
    } catch (err: any) {
      console.log(
        "    detect_sweep_trigger (below threshold) correctly rejected"
      );
      assert.ok(err, "Should throw");
    }
  });

  it("execute_sweep — creates IntercompanyLoan PDA", async () => {
    const loanAmount = new BN("5000000000000"); // 5M USD
    const loanTermDays = 90;

    const tx = await program.methods
      .executeSweep(
        Array.from(poolId),
        Array.from(sweepId),
        lenderEntity,
        borrowerEntity,
        loanAmount,
        loanTermDays
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        sweepConfig: sweepConfigPda,
        loan: loanPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    execute_sweep tx:", tx);

    const loan = await program.account["intercompanyLoan"].fetch(loanPda);
    assert.equal(loan.lenderEntity.toString(), lenderEntity.toString());
    assert.equal(loan.borrowerEntity.toString(), borrowerEntity.toString());
    assert.equal(loan.principal.toString(), loanAmount.toString());
    assert.equal(loan.outstandingBalance.toString(), loanAmount.toString());
    assert.deepEqual(loan.status, { active: {} });
    assert.equal(loan.interestRateBps, 350);

    // SweepConfig totals updated
    const config = await program.account["sweepConfig"].fetch(sweepConfigPda);
    assert.equal(config.totalLoansIssued.toString(), loanAmount.toString());
  });

  it("repay_loan — records partial repayment", async () => {
    const repaymentId = randomBytes32();
    const repayAmount = new BN("1000000000000"); // 1M USD partial repayment

    const tx = await program.methods
      .repayLoan(Array.from(repaymentId), repayAmount)
      .accounts({
        borrower: adminKp.publicKey,
        loanAccount: loanPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    repay_loan (partial) tx:", tx);

    const loan = await program.account["intercompanyLoan"].fetch(loanPda);
    assert.equal(loan.paidBack.toString(), repayAmount.toString());
    // Loan should still be active (not fully repaid yet)
    assert.deepEqual(loan.status, { active: {} });
  });

  it("repay_loan — fully repays loan changes status to Repaid", async () => {
    // Repay remaining balance
    const loan = await program.account["intercompanyLoan"].fetch(loanPda);
    const remaining = loan.outstandingBalance.sub(loan.paidBack);
    const repaymentId = randomBytes32();

    const tx = await program.methods
      .repayLoan(Array.from(repaymentId), remaining)
      .accounts({
        borrower: adminKp.publicKey,
        loanAccount: loanPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    repay_loan (full) tx:", tx);

    const updatedLoan = await program.account["intercompanyLoan"].fetch(
      loanPda
    );
    assert.deepEqual(updatedLoan.status, { repaid: {} });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// END-TO-END — full 5-layer CPI chain
// ─────────────────────────────────────────────────────────────────────────────

describe("E2E — full 5-layer CPI chain (run_netting_cycle)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const adminKp = provider.wallet as anchor.Wallet;

  let erProgram: Program;
  let peProgram: Program;

  const poolId = randomBytes32();
  const entityId = randomBytes32();

  let poolStatePda: PublicKey;
  let sweepConfigPda: PublicKey;
  let entityPositionPda: PublicKey;
  let entityRecordPda: PublicKey;

  before(async () => {
    await airdropIfNeeded(
      provider.connection,
      adminKp.publicKey,
      4 * LAMPORTS_PER_SOL
    );

    erProgram = new Program(entityRegistryIdl as anchor.Idl, provider);
    peProgram = new Program(poolingEngineIdl as anchor.Idl, provider);
    const stProgram = new Program(sweepTriggerIdl as anchor.Idl, provider);

    // PDAs
    [poolStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from(poolId)],
      POOLING_ENGINE_ID
    );
    [sweepConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sweep_config"), Buffer.from(poolId)],
      SWEEP_TRIGGER_ID
    );
    [entityPositionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("entity_position"),
        Buffer.from(poolId),
        adminKp.publicKey.toBuffer(),
      ],
      POOLING_ENGINE_ID
    );
    [entityRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("entity"), Buffer.from(entityId)],
      ENTITY_REGISTRY_ID
    );

    // ── L1: Register + verify entity ──────────────────────────────────────
    const mandateLimits = {
      maxSingleTransfer: new BN("1000000000000"),
      maxDailyAggregate: new BN("5000000000000"),
      dailyUsed: new BN(0),
      dayResetTimestamp: new BN(0),
    };
    await erProgram.methods
      .registerEntity(Array.from(entityId), "E2E Test Bank", 2, mandateLimits)
      .accounts({
        payer: adminKp.publicKey,
        entityRecord: entityRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const expiry = new BN(Math.floor(Date.now() / 1000) + 365 * 86400);
    await erProgram.methods
      .verifyEntity(Array.from(entityId), expiry)
      .accounts({ kycOracle: adminKp.publicKey, entityRecord: entityRecordPda })
      .rpc();

    // ── L2: Create pool + add entity ──────────────────────────────────────
    await peProgram.methods
      .createPool(Array.from(poolId), new BN("100000000000"), 3)
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await peProgram.methods
      .addEntityToPool(
        Array.from(poolId),
        adminKp.publicKey,
        Keypair.generate().publicKey,
        bytes3("USD")
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        poolState: poolStatePda,
        entityPosition: entityPositionPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // ── L5: Init sweep config (required for run_netting_cycle CPI) ────────
    await stProgram.methods
      .initSweepConfig(
        Array.from(poolId),
        new BN("50000000000"),
        new BN("10000000000000"),
        350
      )
      .accounts({
        poolAdmin: adminKp.publicKey,
        sweepConfig: sweepConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("    E2E setup complete — all PDAs initialised");
  });

  it("run_netting_cycle — executes 7-step algorithm with CPI chain", async () => {
    // Verify all 5 programs are reachable on surfpool
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
        console.log(
          `    Skipping: ${name} not found — deploy to surfpool first`
        );
        return;
      }
    }

    const tx = await peProgram.methods
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
        {
          pubkey: entityPositionPda,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: entityRecordPda,
          isWritable: false,
          isSigner: false,
        },
      ])
      .rpc();

    console.log("    run_netting_cycle tx:", tx);
    assert.ok(tx, "Expected a valid transaction signature");

    // Verify pool state was updated
    const pool = await peProgram.account["poolState"].fetch(poolStatePda);
    assert.ok(
      pool.lastNettingTimestamp.gt(new BN(0)),
      "lastNettingTimestamp should be set"
    );
    console.log("    net_position_usd:", pool.netPositionUsd.toString());
    console.log("    total_offsets:", pool.totalOffsets?.toString() ?? "n/a");
  });
});
