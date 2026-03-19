#!/usr/bin/env node
/**
 * scripts/six_oracle_feeder.mjs
 * ================================
 * Fetches live FX rates from SIX Group API (BC=148) using mTLS,
 * then calls update_six_oracle on the NEXUS pooling-engine program
 * to push those rates on-chain.
 *
 * Usage:
 *   node scripts/six_oracle_feeder.mjs [--once] [--rpc <url>]
 *
 *   --once        Fetch + push once then exit (default: loop every 30s)
 *   --rpc <url>   RPC endpoint (default: http://127.0.0.1:8899)
 *   --keypair     Path to wallet keypair JSON (default: ~/.config/solana/id.json)
 *
 * Cert paths (resolved automatically from project root):
 *   docs/stablehacks2026yoursixdataaccesscredentials/
 *     CH56655-api2026hack13/CH56655-api2026hack13/signed-certificate.pem
 *     CH56655-api2026hack13/CH56655-api2026hack13/private-key.pem
 *
 * FX pairs (BC=148 Forex Spot Rates):
 *   EUR/USD  946681_148   rate field: mid
 *   GBP/USD  275017_148
 *   CHF/USD  275164_148
 *   SGD/USD  610497_148
 *   USD/AED  275159_148   inverted to AED/USD
 */

import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const once = args.includes("--once");
const rpcIdx = args.indexOf("--rpc");
const keypairIdx = args.indexOf("--keypair");
const rpcUrl = rpcIdx >= 0 ? args[rpcIdx + 1] : "http://127.0.0.1:8899";
const keypairArg =
  keypairIdx >= 0
    ? args[keypairIdx + 1]
    : path.join(homedir(), ".config/solana/id.json");
const POLL_MS = 30_000;

// ---------------------------------------------------------------------------
// SIX API config
// ---------------------------------------------------------------------------
const SIX_CERT_DIR = path.join(
  PROJECT_ROOT,
  "docs/stablehacks2026yoursixdataaccesscredentials/CH56655-api2026hack13/CH56655-api2026hack13"
);
const CERT_PATH =
  process.env.SIX_CERT_PATH ||
  path.join(SIX_CERT_DIR, "signed-certificate.pem");
const KEY_PATH =
  process.env.SIX_KEY_PATH || path.join(SIX_CERT_DIR, "private-key.pem");

const SIX_BASE =
  "https://api.six-group.com/web/v2/listings/marketData/intradaySnapshot";

// VALOR_BC identifiers — BC=148 (Forex Spot Rates, confirmed live 2026-03-19)
const SIX_PAIRS = [
  { valorBc: "946681_148", outputPair: "EURUSD", invert: false },
  { valorBc: "275017_148", outputPair: "GBPUSD", invert: false },
  { valorBc: "275164_148", outputPair: "CHFUSD", invert: false },
  { valorBc: "610497_148", outputPair: "SGDUSD", invert: false },
  { valorBc: "275159_148", outputPair: "AEDUSD", invert: true }, // SIX quotes USD/AED; invert
];

// Seed fallbacks (9 decimal places, matching on-chain encoding)
const SEED_RATES = {
  EURUSD: 1_147_345_000n,
  GBPUSD: 1_327_785_000n,
  CHFUSD: 1_262_315_000n,
  SGDUSD: 779_700_000n,
  AEDUSD: 272_220_000n,
};

const DECIMALS = 1_000_000_000n; // 9 decimal places

// ---------------------------------------------------------------------------
// mTLS HTTPS agent
// ---------------------------------------------------------------------------
function buildAgent() {
  return new https.Agent({
    cert: fs.readFileSync(CERT_PATH, "utf8"),
    key: fs.readFileSync(KEY_PATH, "utf8"),
    rejectUnauthorized: true,
  });
}

// ---------------------------------------------------------------------------
// SIX API fetch (Node native https, no external deps)
// ---------------------------------------------------------------------------
function httpsGet(url, agent) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent,
        headers: {
          Accept: "application/json",
          "User-Agent": "NEXUS-Feeder/1.0",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          } else {
            resolve(JSON.parse(body));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(10_000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function fetchAllRates(agent) {
  const ids = SIX_PAIRS.map((p) => p.valorBc).join(",");
  const url = `${SIX_BASE}?scheme=VALOR_BC&ids=${ids}&preferredLanguage=EN`;
  const data = await httpsGet(url, agent);

  const rateMap = {};
  const listings = data?.data?.listings ?? [];
  for (const listing of listings) {
    if (listing.lookupStatus !== "FOUND") continue;
    const snap = listing?.marketData?.intradaySnapshot;
    if (!snap) continue;

    // BC=148 primary field is "mid"; fall back to last
    const midVal = snap.mid?.value ?? snap.last?.value;
    if (midVal == null || midVal === 0) continue;

    // SIX returns "requestedId" (e.g. "946681_148") to identify the pair
    const listingId = listing.requestedId ?? listing.id ?? listing.valor ?? "";
    const cfg = SIX_PAIRS.find(
      (p) =>
        listingId === p.valorBc || listingId.includes(p.valorBc.split("_")[0])
    );
    if (!cfg) continue;

    let rate = parseFloat(midVal);
    if (cfg.invert) rate = 1.0 / rate;

    rateMap[cfg.outputPair] = BigInt(Math.round(rate * Number(DECIMALS)));
    console.log(
      `[SIX] ${cfg.outputPair} = ${rate.toFixed(6)} → ${
        rateMap[cfg.outputPair]
      } (9dp)`
    );
  }
  return rateMap;
}

// ---------------------------------------------------------------------------
// Anchor / on-chain
// ---------------------------------------------------------------------------
function loadWallet(keypairPath) {
  const resolved = keypairPath.replace(/^~/, homedir());
  const raw = JSON.parse(fs.readFileSync(resolved, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function toBytes6(str) {
  const buf = Buffer.alloc(6, 0);
  Buffer.from(str, "utf8").copy(buf, 0, 0, 6);
  return Array.from(buf);
}

async function pushRatesToChain(rateMap) {
  const wallet = loadWallet(keypairArg);
  const connection = new Connection(rpcUrl, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    {
      commitment: "confirmed",
    }
  );
  anchor.setProvider(provider);

  // Load IDL
  const idlPath = path.join(PROJECT_ROOT, "target/idl/pooling_engine.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new PublicKey(idl.address);
  const program = new anchor.Program(idl, provider);

  // Derive oracle PDA
  const [oracleState] = PublicKey.findProgramAddressSync(
    [Buffer.from("six_oracle")],
    programId
  );

  // Build FxRate array — exactly 6 entries, pad with zeroes
  const pairs = ["EURUSD", "GBPUSD", "CHFUSD", "SGDUSD", "AEDUSD"];
  const now = BigInt(Math.floor(Date.now() / 1000));

  const fxRates = pairs.map((pair) => {
    const rate = rateMap[pair] ?? SEED_RATES[pair] ?? 0n;
    return {
      currencyPair: toBytes6(pair),
      rate: new BN(rate.toString()),
      timestamp: new BN(now.toString()),
    };
  });

  // Pad to 6
  while (fxRates.length < 6) {
    fxRates.push({
      currencyPair: [0, 0, 0, 0, 0, 0],
      rate: new BN(0),
      timestamp: new BN(0),
    });
  }

  console.log(`[Chain] Calling update_six_oracle on ${programId.toBase58()}`);
  console.log(`[Chain] Oracle PDA: ${oracleState.toBase58()}`);

  const tx = await program.methods
    .updateSixOracle(fxRates)
    .accounts({
      authority: wallet.publicKey,
      oracleState,
    })
    .rpc();

  console.log(`[Chain] ✓ update_six_oracle tx: ${tx}`);
  return tx;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
async function runOnce() {
  console.log(`[Feeder] Connecting to RPC: ${rpcUrl}`);
  console.log(
    `[Feeder] Wallet: ${loadWallet(keypairArg).publicKey.toBase58()}`
  );
  console.log(`[Feeder] Cert:   ${CERT_PATH}`);

  let rateMap = {};
  try {
    const agent = buildAgent();
    rateMap = await fetchAllRates(agent);
    console.log(
      `[Feeder] Fetched ${Object.keys(rateMap).length} live rates from SIX`
    );
  } catch (err) {
    console.warn(`[Feeder] SIX API error: ${err.message} — using seed rates`);
  }

  await pushRatesToChain(rateMap);
}

async function main() {
  if (once) {
    await runOnce();
    return;
  }

  console.log(`[Feeder] Starting poll loop every ${POLL_MS / 1000}s`);
  await runOnce();
  setInterval(async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error(`[Feeder] Loop error: ${err.message}`);
    }
  }, POLL_MS);
}

main().catch((err) => {
  console.error("[Feeder] Fatal:", err);
  process.exit(1);
});
