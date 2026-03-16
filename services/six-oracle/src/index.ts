/**
 * SIX Financial Information - Regulated FX Rate Oracle
 *
 * This service connects to SIX's API using mTLS authentication and
 * polls for current exchange rates for the 5 required currency pairs.
 * Rates are then submitted on-chain to the fx-netting program.
 *
 * Certificate-based authentication ensures:
 * - Encrypted communication (TLS)
 * - Mutual authentication (both client and server verified)
 * - FINMA-compliant regulated data source
 */

import * as fs from "fs";
import * as https from "https";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

// Required currency pairs for NEXUS netting
const REQUIRED_PAIRS = ["EUR/USD", "GBP/USD", "CHF/USD", "USD/AED", "USD/HKD"];

interface FxRate {
  pair: string;
  rate: number;
  timestamp: number;
  source: "SIX";
}

interface RateSnapshot {
  timestamp: number;
  rates: FxRate[];
  isValid: boolean;
}

class SixOracleClient {
  private apiUrl: string;
  private certPath: string;
  private keyPath: string;
  private pollIntervalMs: number;
  private httpsAgent: https.Agent | null = null;
  private lastRates: RateSnapshot | null = null;

  constructor() {
    this.apiUrl = process.env.SIX_API_URL || "";
    this.certPath =
      process.env.SIX_CERT_PATH || "./certs/signed-certificate.pem";
    this.keyPath = process.env.SIX_KEY_PATH || "./certs/private-key.pem";
    this.pollIntervalMs = parseInt(process.env.SIX_POLL_INTERVAL_MS || "30000");

    if (!this.apiUrl) {
      throw new Error("SIX_API_URL not configured. Check .env file.");
    }

    this.initializeHttpsAgent();
  }

  /**
   * Initialize mTLS HTTPS Agent with certificates
   */
  private initializeHttpsAgent(): void {
    try {
      const cert = fs.readFileSync(this.certPath, "utf8");
      const key = fs.readFileSync(this.keyPath, "utf8");

      this.httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: true,
      });

      console.log("✓ mTLS certificates loaded successfully");
    } catch (error) {
      console.error("✗ Failed to load certificates:", error);
      throw new Error("Certificate initialization failed");
    }
  }

  /**
   * Fetch current rates from SIX API
   * TODO: Implement actual SIX API endpoint format once documented
   */
  async fetchRates(): Promise<FxRate[]> {
    try {
      // Placeholder - actual endpoint format from Hackathon Documentation 2026.pdf
      const endpoint = "/v1/api/quotation";
      const url = `${this.apiUrl}${endpoint}`;

      console.log(`📡 Fetching rates from SIX: ${url}`);

      const response = await axios.get(url, {
        httpsAgent: this.httpsAgent,
        timeout: 10000,
        params: {
          instruments: REQUIRED_PAIRS.join(","),
          format: "json",
        },
      });

      // TODO: Parse response format based on SIX API documentation
      const rates = this.parseRates(response.data);

      this.lastRates = {
        timestamp: Date.now(),
        rates,
        isValid: rates.length > 0,
      };

      return rates;
    } catch (error) {
      console.error("✗ Failed to fetch rates:", error);
      return [];
    }
  }

  /**
   * Parse SIX API response into FxRate objects
   * TODO: Adjust parsing logic based on actual API response format
   */
  private parseRates(data: any): FxRate[] {
    // Placeholder parsing - will be updated once we see the actual API response
    const rates: FxRate[] = [];

    // Example transformation (adjust based on actual SIX response)
    // const { quotations } = data;
    // if (Array.isArray(quotations)) {
    //   quotations.forEach(q => {
    //     if (REQUIRED_PAIRS.includes(q.symbol)) {
    //       rates.push({
    //         pair: q.symbol,
    //         rate: q.bid + ((q.ask - q.bid) / 2), // Mid-price
    //         timestamp: Date.now(),
    //         source: 'SIX',
    //       });
    //     }
    //   });
    // }

    console.log(`  ✓ Parsed ${rates.length} rates`);
    return rates;
  }

  /**
   * Start polling for FX rates
   */
  async startPolling(): Promise<void> {
    console.log(`\n🔄 SIX Oracle Service Starting`);
    console.log(`   Poll Interval: ${this.pollIntervalMs}ms`);
    console.log(`   Monitored Pairs: ${REQUIRED_PAIRS.join(", ")}`);

    // Initial fetch
    await this.fetchRates();

    // Recurring polls
    setInterval(async () => {
      const rates = await this.fetchRates();

      if (rates.length > 0) {
        console.log(`\n📊 Rate Update [${new Date().toISOString()}]`);
        rates.forEach((r) => {
          console.log(`   ${r.pair}: ${r.rate.toFixed(6)}`);
        });

        // TODO: Call set_fx_rate on fx-netting program
        // await this.submitRatesOnChain(rates);
      }
    }, this.pollIntervalMs);
  }

  /**
   * Get most recent rates
   */
  getLastRates(): RateSnapshot | null {
    return this.lastRates;
  }
}

// Main execution
async function main() {
  try {
    const oracle = new SixOracleClient();

    // Start polling service
    await oracle.startPolling();

    // Keep process alive
    console.log("✓ SIX Oracle Service is running. Press Ctrl+C to stop.");
    process.on("SIGINT", () => {
      console.log("\n✓ Shutting down gracefully...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();

export { SixOracleClient, FxRate, RateSnapshot };
