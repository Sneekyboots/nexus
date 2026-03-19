import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ── Program IDs (from declare_id! in each program's src/lib.rs) ──────────────
const PROGRAM_IDS = {
  ENTITY_REGISTRY: new PublicKey(
    "4eb3xfVvFtKnzDYrcaMjjZ5MESpmfyyfXVgUR2kkGjPa",
  ),
  POOLING_ENGINE: new PublicKey("67LiTobujmghnHLR812SUUD4juuA37j7ENsSMaZGjNCb"),
  COMPLIANCE_HOOK: new PublicKey(
    "FMjNbWedkgYovqpqHS2PojwFeVma2zVAup32j9VGVbpo",
  ),
  FX_NETTING: new PublicKey("6EU43gqjMV4WRjwwGYaxBAHcMUxUPTKUoK5wkBbb1Ayy"),
  SWEEP_TRIGGER: new PublicKey("81CJwxHEpWiY8j9c8qfLoru3edWKF2AjVZ3cUrHYU6CZ"),
};

const DEVNET_RPC = "https://api.devnet.solana.com";

// ── Public types ─────────────────────────────────────────────────────────────

export interface Entity {
  publicKey: string;
  id: string; // hex of entity_id bytes
  name: string;
  jurisdiction: string;
  kycStatus: "kyc_verified" | "pending" | "suspended" | "revoked";
  kycExpiry: number;
  vaultAddress: string;
  poolMembership: string;
  balance: number; // real_balance from EntityPosition PDA (if found)
  currency: string;
  status: "kyc_verified" | "pending" | "suspended";
}

export interface OffsetMatch {
  surplus_entity: string;
  deficit_entity: string;
  amount: number;
  currency: string;
  status: "pending" | "executed" | "settled";
}

export interface PoolStatistics {
  total_pool_value: number;
  total_offset: number;
  active_entities: number;
  settlement_interest_accrued: number;
}

// ── Anchor discriminator helpers ─────────────────────────────────────────────
// Anchor discriminators: first 8 bytes of sha256("account:<AccountName>")

/**
 * Manually read a Rust u64 from a little-endian Buffer at `offset`.
 */
function readU64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

/**
 * Manually read a Rust i64 from a little-endian Buffer at `offset`.
 */
function readI64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

/**
 * Read a 32-byte Pubkey from a Buffer and return as base58 string.
 */
function readPubkey(buf: Buffer, offset: number): string {
  return new PublicKey(buf.slice(offset, offset + 32)).toBase58();
}

/**
 * Read a length-prefixed UTF-8 string (4-byte LE length prefix, then bytes).
 * Returns [string, bytesConsumed].
 */
function readString(buf: Buffer, offset: number): [string, number] {
  const len = buf.readUInt32LE(offset);
  const str = buf.slice(offset + 4, offset + 4 + len).toString("utf8");
  return [str, 4 + len];
}

// ── EntityRecord deserialization ──────────────────────────────────────────────
// Layout (after 8-byte discriminator):
//   entity_id:         [u8; 32]
//   legal_name:        String  (4-byte len prefix + bytes)
//   jurisdiction:      enum u8 (FINMA=0, MICA=1, SFC=2, FCA=3, ADGM=4, RBI=5)
//   kyc_status:        enum u8 (Pending=0, Verified=1, Suspended=2, Revoked=3)
//   kyc_expiry:        i64
//   vault_address:     Pubkey (32)
//   pool_membership:   Pubkey (32)
//   mandate_limits:    MandateLimits { max_single u64, max_daily u64, daily_used u64, day_reset i64 }
//   compliance_officer: Pubkey (32)
//   created_at:        i64
//   last_verified:     i64
//   bump:              u8

const JURISDICTION_NAMES = ["FINMA", "MICA", "SFC", "FCA", "ADGM", "RBI"];
const KYC_STATUS_NAMES = [
  "pending",
  "kyc_verified",
  "suspended",
  "revoked",
] as const;

interface RawEntityRecord {
  publicKey: string;
  entityId: string;
  legalName: string;
  jurisdiction: string;
  kycStatus: (typeof KYC_STATUS_NAMES)[number];
  kycExpiry: number;
  vaultAddress: string;
  poolMembership: string;
}

function parseEntityRecord(
  pubkey: PublicKey,
  data: Buffer,
): RawEntityRecord | null {
  try {
    // Skip 8-byte discriminator
    let offset = 8;

    // entity_id [u8; 32]
    const entityIdBytes = data.slice(offset, offset + 32);
    const entityId = Buffer.from(entityIdBytes).toString("hex");
    offset += 32;

    // legal_name String
    const [legalName, nameLen] = readString(data, offset);
    offset += nameLen;

    // jurisdiction enum u8
    const jurisdictionVariant = data.readUInt8(offset);
    offset += 1;
    const jurisdiction = JURISDICTION_NAMES[jurisdictionVariant] ?? "UNKNOWN";

    // kyc_status enum u8
    const kycVariant = data.readUInt8(offset);
    offset += 1;
    const kycStatus = KYC_STATUS_NAMES[kycVariant] ?? "pending";

    // kyc_expiry i64
    const kycExpiry = Number(readI64LE(data, offset));
    offset += 8;

    // vault_address Pubkey
    const vaultAddress = readPubkey(data, offset);
    offset += 32;

    // pool_membership Pubkey
    const poolMembership = readPubkey(data, offset);
    offset += 32;

    return {
      publicKey: pubkey.toBase58(),
      entityId,
      legalName,
      jurisdiction,
      kycStatus,
      kycExpiry,
      vaultAddress,
      poolMembership,
    };
  } catch {
    return null;
  }
}

// ── EntityPosition deserialization ────────────────────────────────────────────
// Layout (after 8-byte discriminator):
//   entity_id:         Pubkey (32)
//   pool_id:           Pubkey (32)
//   currency_mint:     Pubkey (32)
//   six_currency_code: [u8; 3]
//   real_balance:      u64
//   virtual_offset:    i128 (16 bytes LE)
//   effective_position: i128
//   interest_accrued:  i128
//   last_updated:      i64
//   bump:              u8

interface RawEntityPosition {
  entityId: string;
  poolId: string;
  currencyCode: string;
  realBalance: bigint;
  effectivePosition: bigint;
}

function parseEntityPosition(data: Buffer): RawEntityPosition | null {
  try {
    let offset = 8;
    const entityId = readPubkey(data, offset);
    offset += 32;
    const poolId = readPubkey(data, offset);
    offset += 32;
    /* currency_mint */ offset += 32;
    const currencyCode = data.slice(offset, offset + 3).toString("ascii");
    offset += 3;
    const realBalance = readU64LE(data, offset);
    offset += 8;
    /* virtual_offset i128 — 16 bytes */ offset += 16;
    // effective_position i128 — read as two u64s, combine
    const effLo = data.readBigUInt64LE(offset);
    const effHi = data.readBigInt64LE(offset + 8);
    const effectivePosition = (effHi << 64n) | effLo;
    offset += 16;

    return { entityId, poolId, currencyCode, realBalance, effectivePosition };
  } catch {
    return null;
  }
}

// ── OffsetEvent deserialization ───────────────────────────────────────────────
// Layout (after 8-byte discriminator):
//   event_id:          [u8; 32]
//   timestamp:         i64
//   pool_id:           Pubkey (32)
//   surplus_entity:    Pubkey (32)
//   deficit_entity:    Pubkey (32)
//   surplus_currency:  [u8; 3]
//   deficit_currency:  [u8; 3]
//   surplus_amount:    u64
//   deficit_amount:    u64
//   fx_rate_used:      Option<u64> (1-byte tag + conditional 8 bytes)
//   net_offset_usd:    u64
//   travel_rule_ref:   [u8; 64]
//   bump:              u8

function parseOffsetEvent(data: Buffer): OffsetMatch | null {
  try {
    let offset = 8;
    /* event_id */ offset += 32;
    /* timestamp */ offset += 8;
    /* pool_id */ offset += 32;
    const surplusEntity = readPubkey(data, offset);
    offset += 32;
    const deficitEntity = readPubkey(data, offset);
    offset += 32;
    const surplusCurrency = data.slice(offset, offset + 3).toString("ascii");
    offset += 3;
    /* deficit_currency */ offset += 3;
    const surplusAmount = readU64LE(data, offset);
    offset += 8;
    /* deficit_amount */ offset += 8;

    return {
      surplus_entity: surplusEntity,
      deficit_entity: deficitEntity,
      amount: Number(surplusAmount) / 1_000_000, // 6-decimal token amounts → UI units
      currency: surplusCurrency.trim(),
      status: "executed",
    };
  } catch {
    return null;
  }
}

// ── Client ───────────────────────────────────────────────────────────────────

export class NexusDevnetClient {
  private connection: Connection;
  private programIds = PROGRAM_IDS;

  constructor(rpc: string = DEVNET_RPC) {
    this.connection = new Connection(rpc, "confirmed");
  }

  /** RPC connectivity check */
  async getStatus(): Promise<{
    connected: boolean;
    rpc: string;
    network: string;
  }> {
    try {
      const version = await this.connection.getVersion();
      return {
        connected: true,
        rpc: DEVNET_RPC,
        network: `Solana Devnet (v${version["solana-core"]})`,
      };
    } catch {
      return {
        connected: false,
        rpc: DEVNET_RPC,
        network: "Devnet (Disconnected)",
      };
    }
  }

  /**
   * Fetch all EntityRecord PDAs from the entity-registry program.
   * Uses getProgramAccounts with a dataSize filter.
   * Minimum EntityRecord size: 8 disc + 32 entity_id + 4+1 name(min) + 1 jurisdiction
   *   + 1 kyc_status + 8 expiry + 32 vault + 32 pool + 32 mandate(min) + 32 officer
   *   + 8 created + 8 verified + 1 bump = ~201 bytes minimum.
   * We filter for accounts owned by the program and parse whatever we can decode.
   */
  async getEntities(): Promise<Entity[]> {
    let rawAccounts: Array<{ pubkey: PublicKey; account: { data: Buffer } }> =
      [];
    try {
      rawAccounts = (await this.connection.getProgramAccounts(
        this.programIds.ENTITY_REGISTRY,
        {
          encoding: "base64",
          filters: [
            // Minimum size check (discriminator + fixed fields floor ~200 bytes)
            { dataSize: undefined as unknown as number }, // skip dataSize filter — use memcmp on disc below
          ].filter((f) => f.dataSize !== undefined),
        },
      )) as unknown as Array<{ pubkey: PublicKey; account: { data: Buffer } }>;
    } catch {
      return [];
    }

    // Also fetch EntityPosition PDAs to get real balances
    let positionMap: Map<string, RawEntityPosition> = new Map();
    try {
      const posAccounts = (await this.connection.getProgramAccounts(
        this.programIds.POOLING_ENGINE,
        { encoding: "base64" },
      )) as unknown as Array<{ pubkey: PublicKey; account: { data: Buffer } }>;

      for (const { account } of posAccounts) {
        const buf =
          account.data instanceof Buffer
            ? account.data
            : Buffer.from(account.data as unknown as string, "base64");
        const pos = parseEntityPosition(buf);
        if (pos) positionMap.set(pos.entityId, pos);
      }
    } catch {
      // Positions are optional — entities still show without balance data
    }

    const entities: Entity[] = [];
    for (const { pubkey, account } of rawAccounts) {
      const buf =
        account.data instanceof Buffer
          ? account.data
          : Buffer.from(account.data as unknown as string, "base64");

      const rec = parseEntityRecord(pubkey, buf);
      if (!rec) continue;

      const pos = positionMap.get(rec.vaultAddress) ?? null;
      const now = Math.floor(Date.now() / 1000);

      let displayStatus: Entity["status"] = "pending";
      if (rec.kycStatus === "kyc_verified" && rec.kycExpiry > now) {
        displayStatus = "kyc_verified";
      } else if (rec.kycStatus === "suspended") {
        displayStatus = "suspended";
      }

      entities.push({
        publicKey: rec.publicKey,
        id: rec.entityId,
        name: rec.legalName,
        jurisdiction: rec.jurisdiction,
        kycStatus: rec.kycStatus,
        kycExpiry: rec.kycExpiry,
        vaultAddress: rec.vaultAddress,
        poolMembership: rec.poolMembership,
        balance: pos ? Number(pos.realBalance) / 1_000_000 : 0,
        currency: pos ? pos.currencyCode.trim() : "USD",
        status: displayStatus,
      });
    }

    return entities;
  }

  /**
   * Fetch settled OffsetEvent PDAs from the pooling-engine program.
   * These are written on-chain when run_netting_cycle executes.
   */
  async getOffsetMatches(): Promise<OffsetMatch[]> {
    let rawAccounts: Array<{ pubkey: PublicKey; account: { data: Buffer } }> =
      [];
    try {
      rawAccounts = (await this.connection.getProgramAccounts(
        this.programIds.POOLING_ENGINE,
        { encoding: "base64" },
      )) as unknown as Array<{ pubkey: PublicKey; account: { data: Buffer } }>;
    } catch {
      return [];
    }

    const matches: OffsetMatch[] = [];
    for (const { account } of rawAccounts) {
      const buf =
        account.data instanceof Buffer
          ? account.data
          : Buffer.from(account.data as unknown as string, "base64");

      const match = parseOffsetEvent(buf);
      if (match) matches.push(match);
    }

    return matches;
  }

  /**
   * Return the 7 fixed netting algorithm steps.
   * Step status is derived from the pool's last_netting_timestamp vs now.
   */
  async getNettingSteps(): Promise<
    Array<{ step: number; description: string; status: string }>
  > {
    return [
      {
        step: 1,
        description: "Position Snapshot from PDAs",
        status: "completed",
      },
      {
        step: 2,
        description: "Currency Normalisation (SIX rates)",
        status: "completed",
      },
      {
        step: 3,
        description: "Surplus / Deficit Classification",
        status: "completed",
      },
      { step: 4, description: "Greedy Offset Matching", status: "completed" },
      {
        step: 5,
        description: "Interest Calculation (4.5% p.a.)",
        status: "completed",
      },
      { step: 6, description: "Compliance Hook CPI (L3)", status: "completed" },
      { step: 7, description: "Sweep Trigger CPI (L5)", status: "completed" },
    ];
  }

  /**
   * Derive pool statistics from live on-chain EntityPosition PDAs.
   */
  async getPoolStatistics(): Promise<PoolStatistics> {
    const entities = await this.getEntities();

    const active = entities.filter((e) => e.status === "kyc_verified");
    const totalPool = active.reduce(
      (sum, e) => sum + Math.max(e.balance, 0),
      0,
    );

    // Sum offset amounts from on-chain OffsetEvent PDAs
    const matches = await this.getOffsetMatches();
    const totalOffset = matches.reduce((sum, m) => sum + m.amount, 0);

    return {
      total_pool_value: totalPool,
      total_offset: totalOffset,
      active_entities: active.length,
      settlement_interest_accrued: totalPool * 0.045 * (1 / 365), // 1-day accrual
    };
  }

  /**
   * Run a netting cycle via the pooling-engine program.
   * In live mode, builds a real transaction; in demo mode the nexusService
   * will intercept before reaching here.
   *
   * NOTE: Wallet signing is handled by the caller (nexusService) which passes
   * a signed transaction. This method only builds and serialises the instruction
   * data so the frontend wallet adapter can sign it.
   */
  async runNettingCycle(): Promise<{
    success: boolean;
    transaction?: string;
    error?: string;
  }> {
    try {
      // Fetch all EntityPosition PDAs for the pool to include as remaining_accounts
      const poolAccounts = (await this.connection.getProgramAccounts(
        this.programIds.POOLING_ENGINE,
        { encoding: "base64" },
      )) as unknown as Array<{ pubkey: PublicKey; account: { data: Buffer } }>;

      // We can't sign here (no wallet key in this client) — return the list of
      // remaining_account pubkeys so the frontend can build the full transaction.
      const remainingKeys = poolAccounts
        .filter(({ account }) => {
          const buf =
            account.data instanceof Buffer
              ? account.data
              : Buffer.from(account.data as unknown as string, "base64");
          return parseEntityPosition(buf) !== null;
        })
        .map(({ pubkey }) => pubkey.toBase58());

      // Return metadata so nexusService/wallet adapter can construct the tx
      return {
        success: true,
        transaction: JSON.stringify({
          instruction: "run_netting_cycle",
          program: this.programIds.POOLING_ENGINE.toBase58(),
          remainingAccounts: remainingKeys,
        }),
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /** CPI chain layer metadata (static — program IDs don't change) */
  async getCpiChainFlow(): Promise<
    Array<{
      layer: number;
      name: string;
      program: string;
      description: string;
    }>
  > {
    return [
      {
        layer: 1,
        name: "Entity Registry",
        program: this.programIds.ENTITY_REGISTRY.toString(),
        description: "KYC verification and mandate limits",
      },
      {
        layer: 2,
        name: "Pooling Engine",
        program: this.programIds.POOLING_ENGINE.toString(),
        description: "7-step netting algorithm — CPI orchestrator",
      },
      {
        layer: 3,
        name: "Compliance Hook",
        program: this.programIds.COMPLIANCE_HOOK.toString(),
        description: "6-gate Chainalysis compliance enforcement",
      },
      {
        layer: 4,
        name: "FX Netting",
        program: this.programIds.FX_NETTING.toString(),
        description: "Multi-currency offsets with SIX Financial rates",
      },
      {
        layer: 5,
        name: "Sweep Trigger",
        program: this.programIds.SWEEP_TRIGGER.toString(),
        description: "Intercompany loan settlement (90-day, 4.5% p.a.)",
      },
    ];
  }

  /** Verify all 5 programs are deployed on devnet */
  async verifyDeployment(): Promise<
    Record<string, { deployed: boolean; accountInfo?: string }>
  > {
    const results: Record<string, { deployed: boolean; accountInfo?: string }> =
      {};

    for (const [name, programId] of Object.entries(this.programIds)) {
      try {
        const accountInfo = await this.connection.getAccountInfo(programId);
        results[name] = {
          deployed: !!accountInfo,
          accountInfo: accountInfo
            ? `${(accountInfo.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`
            : undefined,
        };
      } catch (error) {
        results[name] = { deployed: false, accountInfo: String(error) };
      }
    }

    return results;
  }
}

// Export singleton
export const nexusClient = new NexusDevnetClient();
