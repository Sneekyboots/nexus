/**
 * SIX Financial Information - Regulated FX Rate Oracle
 *
 * Authentication: mTLS with SIX team certificate
 * Base URL: https://api.six-group.com/web/v2
 * Endpoint: /listings/marketData/intradaySnapshot
 * Scheme: VALOR_BC
 *
 * Forex Spot Rates — BC = 148 (confirmed live; NOT 149)
 * EUR/USD : 946681_148
 * CHF/USD : 275164_148
 * GBP/USD : 275017_148
 * SGD/USD : 610497_148
 * USD/AED : 275159_148  → invert to get AED/USD
 *
 * Runs an HTTP server on :7070 so the Vite frontend can call
 *   GET http://localhost:7070/rates
 * with CORS enabled. Falls back to last-known rates on API error.
 */

import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const HTTP_PORT = parseInt(process.env.ORACLE_HTTP_PORT || "7070");
const SIX_API_URL =
  process.env.SIX_API_URL || "https://api.six-group.com/web/v2";
const CERT_PATH = process.env.SIX_CERT_PATH || "./certs/signed-certificate.pem";
const KEY_PATH = process.env.SIX_KEY_PATH || "./certs/private-key.pem";
const POLL_MS = parseInt(process.env.SIX_POLL_INTERVAL_MS || "30000");

// ---------------------------------------------------------------------------
// FX pair config — BC 149 = Forex Calculated Rates
// ---------------------------------------------------------------------------
interface PairConfig {
  pair: string;
  valorBc: string;
}

const PAIRS: PairConfig[] = [
  { pair: "EUR/USD", valorBc: "946681_148" },
  { pair: "GBP/USD", valorBc: "275017_148" },
  { pair: "CHF/USD", valorBc: "275164_148" },
  { pair: "SGD/USD", valorBc: "610497_148" },
  { pair: "USD/AED", valorBc: "275159_148" }, // inverted to AED/USD on output
];

// Fixed-peg approximations for pairs SIX doesn't carry
const FIXED_RATES: Record<string, number> = {
  "AED/USD": 0.2723, // AED is pegged 3.6725/USD
  "SGD/USD": 0.7481,
  "HKD/USD": 0.1282,
};

export interface FxRate {
  pair: string;
  rate: number;
  bid?: number;
  ask?: number;
  mid?: number;
  timestamp: number;
  source: "SIX" | "FIXED";
  stale: boolean;
}

// ---------------------------------------------------------------------------
// Oracle client
// ---------------------------------------------------------------------------
class SixOracleClient {
  private client: AxiosInstance;
  private lastRates: FxRate[] = [];
  private pollCount = 0;
  private errorCount = 0;

  constructor() {
    const cert = fs.readFileSync(CERT_PATH, "utf8");
    const key = fs.readFileSync(KEY_PATH, "utf8");

    this.client = axios.create({
      baseURL: SIX_API_URL,
      httpsAgent: new https.Agent({ cert, key, rejectUnauthorized: true }),
      timeout: 15000,
      headers: { Accept: "application/json" },
    });

    console.log("✓ SIX mTLS client initialised");
    console.log(`  Cert: ${CERT_PATH}`);
    console.log(`  URL:  ${SIX_API_URL}`);
    console.log(`  Pairs: ${PAIRS.map((p) => p.pair).join(", ")}`);
  }

  // -------------------------------------------------------------------------
  async fetchRates(): Promise<FxRate[]> {
    this.pollCount++;
    const ids = PAIRS.map((p) => p.valorBc).join(",");

    try {
      console.log(
        `\n[Poll #${this.pollCount}] GET intradaySnapshot ids=${ids}`
      );

      const { data } = await this.client.get(
        "/listings/marketData/intradaySnapshot",
        { params: { scheme: "VALOR_BC", ids, preferredLanguage: "EN" } }
      );

      const rates = this.parse(data);
      // Append fixed-peg pairs
      for (const [pair, rate] of Object.entries(FIXED_RATES)) {
        rates.push({
          pair,
          rate,
          timestamp: Date.now(),
          source: "FIXED",
          stale: false,
        });
      }

      this.lastRates = rates;
      this.errorCount = 0;
      console.log(`  ✓ Got ${rates.length} rates from SIX`);
      this.printRates(rates);
      return rates;
    } catch (err: any) {
      this.errorCount++;
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      console.error(`  ✗ SIX API error #${this.errorCount}: ${msg}`);

      if (this.lastRates.length > 0) {
        console.log("  → Using last-known rates");
        return this.lastRates.map((r) => ({ ...r, stale: true }));
      }
      // Bootstrap fallback so the frontend always gets something
      return this.fallback();
    }
  }

  // -------------------------------------------------------------------------
  private parse(data: any): FxRate[] {
    const rates: FxRate[] = [];
    if (!data?.data || !Array.isArray(data.data)) {
      console.warn(
        "  ⚠ Unexpected SIX response shape:",
        JSON.stringify(data).slice(0, 200)
      );
      return rates;
    }

    for (const item of data.data) {
      const cfg = PAIRS.find((p) => p.valorBc === item.id);
      if (!cfg) continue;

      const snap = item.snap ?? item.latestTrade ?? {};
      let rate: number | undefined;

      if (snap.mid != null) rate = snap.mid;
      else if (snap.bid != null && snap.ask != null)
        rate = (snap.bid + snap.ask) / 2;
      else if (snap.lastPrice != null) rate = snap.lastPrice;
      else if (snap.closingPrice != null) rate = snap.closingPrice;

      if (rate == null) {
        console.warn(`  ⚠ No price for ${cfg.pair} (id=${item.id})`);
        continue;
      }

      rates.push({
        pair: cfg.pair,
        rate,
        bid: snap.bid,
        ask: snap.ask,
        mid: snap.mid,
        timestamp: snap.dateTime
          ? new Date(snap.dateTime).getTime()
          : Date.now(),
        source: "SIX",
        stale: false,
      });
    }
    return rates;
  }

  // -------------------------------------------------------------------------
  private fallback(): FxRate[] {
    console.log("  → Using static fallback rates");
    const defaults: Record<string, number> = {
      "EUR/USD": 1.0847,
      "GBP/USD": 1.2651,
      "CHF/USD": 1.1203,
      "CHF/EUR": 1.033,
      ...FIXED_RATES,
    };
    return Object.entries(defaults).map(([pair, rate]) => ({
      pair,
      rate,
      timestamp: Date.now(),
      source: pair in FIXED_RATES ? "FIXED" : "SIX",
      stale: true,
    }));
  }

  // -------------------------------------------------------------------------
  private printRates(rates: FxRate[]) {
    for (const r of rates) {
      const bid = r.bid?.toFixed(6) ?? "—";
      const ask = r.ask?.toFixed(6) ?? "—";
      console.log(
        `    ${r.pair.padEnd(10)} ${r.rate.toFixed(
          6
        )}  bid=${bid}  ask=${ask}  [${r.source}]`
      );
    }
  }

  // -------------------------------------------------------------------------
  async startPolling(): Promise<void> {
    await this.fetchRates();
    setInterval(() => this.fetchRates(), POLL_MS);
  }

  getRates(): FxRate[] {
    return this.lastRates.length ? this.lastRates : this.fallback();
  }
}

// ---------------------------------------------------------------------------
// HTTP server — GET /rates returns JSON; CORS open for localhost Vite dev
// ---------------------------------------------------------------------------
function startHttpServer(oracle: SixOracleClient) {
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url?.split("?")[0];

    if (url === "/rates") {
      const rates = oracle.getRates();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, rates, ts: Date.now() }));
      return;
    }

    if (url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ ok: true, rateCount: oracle.getRates().length })
      );
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
  });

  server.listen(HTTP_PORT, "127.0.0.1", () => {
    console.log(
      `\n✓ Oracle HTTP server listening on http://localhost:${HTTP_PORT}`
    );
    console.log("  GET /rates  → current FX rates JSON");
    console.log("  GET /health → health check\n");
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   NEXUS · SIX Financial FX Oracle                ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const oracle = new SixOracleClient();
  startHttpServer(oracle);
  await oracle.startPolling();

  process.on("SIGINT", () => {
    console.log("\n✓ Oracle shutting down");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

export { SixOracleClient, FxRate };
