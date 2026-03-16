/**
 * SIX Financial Information - Regulated FX Rate Oracle
 *
 * This service connects to SIX's API using mTLS authentication and
 * polls for current exchange rates for the 5 required currency pairs.
 * Rates are then submitted on-chain to the fx-netting program.
 *
 * API Details:
 * - Base URL: https://api.six-group.com/web/v2
 * - Authentication: mTLS (mutual TLS with certificates)
 * - Endpoint: /listings/marketData/intradaySnapshot
 * - Scheme: VALOR_BC (valor + '_' + bc_code)
 * - Rate Source: FINMA-regulated Swiss financial data
 *
 * FX Pair Identifiers (BC Code 148):
 * - EUR/USD: 946681_148
 * - GBP/USD: 275017_148
 * - CHF/USD: 275164_148
 * - USD/AED: 275159_148
 * - USD/HKD: 275126_148
 */

import * as fs from "fs";
import * as https from "https";
import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// FX Pairs with their SIX VALOR_BC identifiers
interface FxPairConfig {
  pair: string;
  valorBc: string;
  valor: number;
  bc: number;
}

const FOREX_PAIRS: FxPairConfig[] = [
  { pair: "EUR/USD", valorBc: "946681_148", valor: 946681, bc: 148 },
  { pair: "GBP/USD", valorBc: "275017_148", valor: 275017, bc: 148 },
  { pair: "CHF/USD", valorBc: "275164_148", valor: 275164, bc: 148 },
  { pair: "USD/AED", valorBc: "275159_148", valor: 275159, bc: 148 },
  { pair: "USD/HKD", valorBc: "275126_148", valor: 275126, bc: 148 },
];

interface FxRate {
  pair: string;
  rate: number;
  timestamp: number;
  source: "SIX";
  bid?: number;
  ask?: number;
  mid?: number;
}

interface RateSnapshot {
  timestamp: number;
  rates: FxRate[];
  isValid: boolean;
  errorMessage?: string;
}

interface SixListingSnapshot {
  id: string;
  symbolValue: string;
  snap: {
    bid?: number;
    ask?: number;
    mid?: number;
    lastPrice?: number;
    timestamp?: number;
  };
}

class SixOracleClient {
  private apiUrl: string;
  private certPath: string;
  private keyPath: string;
  private pollIntervalMs: number;
  private staleThresholdMs: number;
  private axiosClient: AxiosInstance | null = null;
  private lastRates: RateSnapshot | null = null;
  private pollCount = 0;
  private errorCount = 0;

  constructor() {
    this.apiUrl = process.env.SIX_API_URL || "https://api.six-group.com/web/v2";
    this.certPath =
      process.env.SIX_CERT_PATH || "./certs/signed-certificate.pem";
    this.keyPath = process.env.SIX_KEY_PATH || "./certs/private-key.pem";
    this.pollIntervalMs = parseInt(process.env.SIX_POLL_INTERVAL_MS || "30000");
    this.staleThresholdMs = parseInt(
      process.env.SIX_RATE_STALENESS_THRESHOLD || "3600000"
    );

    this.initializeAxiosClient();
    this.logConfiguration();
  }

  /**
   * Initialize axios client with mTLS certificates
   */
  private initializeAxiosClient(): void {
    try {
      const cert = fs.readFileSync(this.certPath, "utf8");
      const key = fs.readFileSync(this.keyPath, "utf8");

      const httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: true,
      });

      this.axiosClient = axios.create({
        baseURL: this.apiUrl,
        httpsAgent,
        timeout: 15000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("✓ mTLS certificates loaded successfully");
      console.log(`✓ API Base URL: ${this.apiUrl}`);
    } catch (error) {
      console.error("✗ Failed to load certificates:", error);
      throw new Error("Certificate initialization failed");
    }
  }

  /**
   * Log service configuration
   */
  private logConfiguration(): void {
    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║      SIX Financial Information Oracle           ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log(`\nConfiguration:`);
    console.log(`  API URL: ${this.apiUrl}`);
    console.log(`  Poll Interval: ${this.pollIntervalMs}ms`);
    console.log(
      `  Stale Threshold: ${this.staleThresholdMs}ms (${(
        this.staleThresholdMs / 60000
      ).toFixed(1)} min)`
    );
    console.log(
      `  Monitored Pairs: ${FOREX_PAIRS.map((p) => p.pair).join(", ")}`
    );
    console.log(`  Certificate Path: ${this.certPath}`);
  }

  /**
   * Fetch current rates from SIX API
   *
   * Endpoint: GET /listings/marketData/intradaySnapshot
   * Scheme: VALOR_BC
   */
  async fetchRates(): Promise<FxRate[]> {
    if (!this.axiosClient) {
      throw new Error("Axios client not initialized");
    }

    try {
      this.pollCount++;
      const ids = FOREX_PAIRS.map((p) => p.valorBc).join(",");

      const endpoint = "/listings/marketData/intradaySnapshot";
      const params = {
        scheme: "VALOR_BC",
        ids,
        preferredLanguage: "EN",
      };

      console.log(`\n📡 [Poll #${this.pollCount}] Fetching rates from SIX...`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   IDs: ${ids}`);

      const response = await this.axiosClient.get(endpoint, { params });
      const rates = this.parseRates(response.data);

      // Store snapshot
      this.lastRates = {
        timestamp: Date.now(),
        rates,
        isValid: rates.length > 0 && !this.hasStaleRates(rates),
      };

      if (this.lastRates.isValid) {
        console.log(`   ✓ Successfully fetched ${rates.length} rates`);
        this.errorCount = 0; // Reset error counter on success
      } else {
        console.warn(`   ⚠ Rates may be stale or invalid`);
      }

      return rates;
    } catch (error: any) {
      this.errorCount++;
      const errorMsg = error.response?.statusText || error.message;

      console.error(
        `   ✗ Failed to fetch rates (Error #${this.errorCount}): ${errorMsg}`
      );

      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("   ⚠ Authentication failed - check certificates");
      }

      if (this.lastRates && this.errorCount < 3) {
        console.log(
          `   📌 Using last known rates (${new Date(
            this.lastRates.timestamp
          ).toISOString()})`
        );
        return this.lastRates.rates;
      }

      return [];
    }
  }

  /**
   * Parse SIX API response into FxRate objects
   *
   * Expected response structure from intradaySnapshot endpoint:
   * {
   *   data: [
   *     {
   *       id: "946681_148",
   *       symbolValue: "EUR/USD",
   *       snap: {
   *         bid: 1.0850,
   *         ask: 1.0860,
   *         mid: 1.0855,
   *         lastPrice: 1.0855,
   *         timestamp: 1710681000000
   *       }
   *     },
   *     ...
   *   ]
   * }
   */
  private parseRates(data: any): FxRate[] {
    const rates: FxRate[] = [];

    if (!data || !data.data || !Array.isArray(data.data)) {
      console.warn("   ⚠ Unexpected response format from SIX API");
      return rates;
    }

    data.data.forEach((item: SixListingSnapshot) => {
      // Find matching pair configuration
      const pairConfig = FOREX_PAIRS.find((p) => p.valorBc === item.id);

      if (!pairConfig) {
        console.warn(`   ⚠ Unknown instrument ID: ${item.id}`);
        return;
      }

      const snap = item.snap || {};

      // Use mid price if available, otherwise calculate from bid/ask, fallback to lastPrice
      let rate: number;
      if (snap.mid !== undefined && snap.mid !== null) {
        rate = snap.mid;
      } else if (snap.bid !== undefined && snap.ask !== undefined) {
        rate = (snap.bid + snap.ask) / 2;
      } else if (snap.lastPrice !== undefined) {
        rate = snap.lastPrice;
      } else {
        console.warn(`   ⚠ No valid price for ${pairConfig.pair}`);
        return;
      }

      rates.push({
        pair: pairConfig.pair,
        rate,
        bid: snap.bid,
        ask: snap.ask,
        mid: snap.mid,
        timestamp: snap.timestamp || Date.now(),
        source: "SIX",
      });
    });

    return rates;
  }

  /**
   * Check if any rates are stale (older than threshold)
   */
  private hasStaleRates(rates: FxRate[]): boolean {
    if (rates.length === 0) return true;

    const now = Date.now();
    return rates.some((rate) => now - rate.timestamp > this.staleThresholdMs);
  }

  /**
   * Format rate for display
   */
  private formatRate(rate: FxRate): string {
    const formatted = rate.rate.toFixed(6);
    if (rate.bid && rate.ask) {
      return `${formatted} (bid: ${rate.bid.toFixed(
        6
      )}, ask: ${rate.ask.toFixed(6)})`;
    }
    return formatted;
  }

  /**
   * Start polling for FX rates
   */
  async startPolling(): Promise<void> {
    console.log("\n🚀 Starting oracle polling service...\n");

    // Initial fetch
    const initialRates = await this.fetchRates();
    if (initialRates.length > 0) {
      this.displayRates(initialRates);
    }

    // Recurring polls
    const intervalId = setInterval(async () => {
      const rates = await this.fetchRates();
      if (rates.length > 0) {
        this.displayRates(rates);
      }
    }, this.pollIntervalMs);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\n✓ Shutting down gracefully...");
      clearInterval(intervalId);
      process.exit(0);
    });
  }

  /**
   * Display rates in formatted table
   */
  private displayRates(rates: FxRate[]): void {
    console.log(`\n📊 Exchange Rates [${new Date().toISOString()}]`);
    console.log("┌─────────────┬──────────────┬──────────────┬──────────────┐");
    console.log("│ Pair        │ Rate         │ Bid          │ Ask          │");
    console.log("├─────────────┼──────────────┼──────────────┼──────────────┤");

    rates.forEach((rate) => {
      const pair = rate.pair.padEnd(11);
      const rateStr = rate.rate.toFixed(6).padEnd(12);
      const bid = (rate.bid?.toFixed(6) || "N/A").padEnd(12);
      const ask = (rate.ask?.toFixed(6) || "N/A").padEnd(12);
      console.log(`│ ${pair} │ ${rateStr} │ ${bid} │ ${ask} │`);
    });

    console.log("└─────────────┴──────────────┴──────────────┴──────────────┘");
  }

  /**
   * Get most recent rates
   */
  getLastRates(): RateSnapshot | null {
    return this.lastRates;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      pollCount: this.pollCount,
      errorCount: this.errorCount,
      lastUpdate: this.lastRates?.timestamp,
      lastRatesValid: this.lastRates?.isValid,
      rateCount: this.lastRates?.rates.length || 0,
    };
  }
}

// Main execution
async function main() {
  try {
    const oracle = new SixOracleClient();
    await oracle.startPolling();

    console.log("\n✓ SIX Oracle Service is running. Press Ctrl+C to stop.\n");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();

export { SixOracleClient, FxRate, RateSnapshot, FOREX_PAIRS };
