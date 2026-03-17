import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Devnet program addresses (from DEVNET_DEPLOYMENT_COMPLETE.md)
const PROGRAM_IDS = {
  ENTITY_REGISTRY: new PublicKey(
    "4eb3xfVvFtKnzDYrcaMjjZ5MESpmfyyfXVgUR2kkGjPa"
  ),
  POOLING_ENGINE: new PublicKey("67LiTobujmghnHLR812SUUD4juuA37j7ENsSMaZGjNCb"),
  COMPLIANCE_HOOK: new PublicKey(
    "FMjNbWedkgYovqpqHS2PojwFeVma2zVAup32j9VGVbpo"
  ),
  FX_NETTING: new PublicKey("6EU43gqjMV4WRjwwGYaxBAHcMUxUPTKUoK5wkBbb1Ayy"),
  SWEEP_TRIGGER: new PublicKey("81CJwxHEpWiY8j9c8qfLoru3edWKF2AjVZ3cUrHYU6CZ"),
};

// Devnet connection
const DEVNET_RPC = "https://api.devnet.solana.com";

export interface Entity {
  id: string;
  name: string;
  jurisdiction: string;
  balance: number;
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

/**
 * Solana devnet client for NEXUS protocol
 * Connects to all 5 deployed programs and fetches data
 */
export class NexusDevnetClient {
  private connection: Connection;
  private programIds = PROGRAM_IDS;

  constructor() {
    this.connection = new Connection(DEVNET_RPC, "confirmed");
  }

  /**
   * Get connection status
   */
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
    } catch (error) {
      return {
        connected: false,
        rpc: DEVNET_RPC,
        network: "Devnet (Disconnected)",
      };
    }
  }

  /**
   * Get mock entities - in production, these would be fetched from Entity Registry
   * For now, we return sample data to demonstrate the flow
   */
  async getEntities(): Promise<Entity[]> {
    // Mock data representing entities registered on-chain
    return [
      {
        id: "sg-001",
        name: "Singapore Hub",
        jurisdiction: "SG",
        balance: 800000,
        currency: "USD",
        status: "kyc_verified",
      },
      {
        id: "ae-001",
        name: "UAE Operations",
        jurisdiction: "AE",
        balance: -300000,
        currency: "USD",
        status: "kyc_verified",
      },
      {
        id: "uk-001",
        name: "UK Treasury",
        jurisdiction: "UK",
        balance: 200000,
        currency: "GBP",
        status: "kyc_verified",
      },
      {
        id: "de-001",
        name: "Germany HQ",
        jurisdiction: "DE",
        balance: -150000,
        currency: "EUR",
        status: "kyc_verified",
      },
      {
        id: "ch-001",
        name: "Switzerland Branch",
        jurisdiction: "CH",
        balance: 450000,
        currency: "CHF",
        status: "pending",
      },
    ];
  }

  /**
   * Get offset matches from pooling engine
   * These represent netting results from the 7-step algorithm
   */
  async getOffsetMatches(): Promise<OffsetMatch[]> {
    // Mock data showing netting algorithm results
    return [
      {
        surplus_entity: "sg-001",
        deficit_entity: "ae-001",
        amount: 300000,
        currency: "USD",
        status: "executed",
      },
      {
        surplus_entity: "ch-001",
        deficit_entity: "de-001",
        amount: 150000,
        currency: "EUR",
        status: "pending",
      },
      {
        surplus_entity: "uk-001",
        deficit_entity: "sg-001",
        amount: 150000,
        currency: "GBP",
        status: "settled",
      },
    ];
  }

  /**
   * Get netting algorithm steps for visualization
   */
  async getNettingSteps(): Promise<
    Array<{ step: number; description: string; status: string }>
  > {
    return [
      { step: 1, description: "Balance Aggregation", status: "completed" },
      { step: 2, description: "Currency Normalization", status: "completed" },
      {
        step: 3,
        description: "Surplus/Deficit Identification",
        status: "completed",
      },
      {
        step: 4,
        description: "Bilateral Offset Matching",
        status: "completed",
      },
      { step: 5, description: "FX Rate Application", status: "in_progress" },
      { step: 6, description: "Compliance Validation", status: "pending" },
      {
        step: 7,
        description: "Settlement & Sweep Trigger",
        status: "pending",
      },
    ];
  }

  /**
   * Get pooling statistics
   */
  async getPoolStatistics(): Promise<PoolStatistics> {
    const entities = await this.getEntities();
    const surplusTotal = entities
      .filter((e) => e.balance > 0)
      .reduce((sum, e) => sum + e.balance, 0);

    return {
      total_pool_value: surplusTotal,
      total_offset: 600000,
      active_entities: entities.filter((e) => e.status === "kyc_verified")
        .length,
      settlement_interest_accrued: 8750,
    };
  }

  /**
   * Run a netting cycle on pooling engine
   * This would send an actual transaction in production
   */
  async runNettingCycle(): Promise<{
    success: boolean;
    transaction?: string;
    error?: string;
  }> {
    try {
      // In production, this would:
      // 1. Create the instruction to call run_netting_cycle on pooling_engine
      // 2. Send a transaction with all 5 programs via CPI chain
      // 3. Return the transaction signature

      // For now, we simulate success
      return {
        success: true,
        transaction:
          "MockTxn_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Get CPI chain visualization data
   * Shows how all 5 programs interact
   */
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
        description: "7-step netting algorithm (THE MOAT)",
      },
      {
        layer: 3,
        name: "Compliance Hook",
        program: this.programIds.COMPLIANCE_HOOK.toString(),
        description: "6-gate compliance enforcement",
      },
      {
        layer: 4,
        name: "FX Netting",
        program: this.programIds.FX_NETTING.toString(),
        description: "Multi-currency netting with SIX rates",
      },
      {
        layer: 5,
        name: "Sweep Trigger",
        program: this.programIds.SWEEP_TRIGGER.toString(),
        description: "Intercompany loan settlement (90-day, 1.5%)",
      },
    ];
  }

  /**
   * Verify all programs are deployed and accessible
   */
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
        results[name] = {
          deployed: false,
          accountInfo: String(error),
        };
      }
    }

    return results;
  }
}

// Export singleton instance
export const nexusClient = new NexusDevnetClient();
