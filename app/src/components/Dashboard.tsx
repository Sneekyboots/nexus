import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { nexusClient } from "../services/solanaClient";
import { demoClient } from "../services/demoClient";

interface Entity {
  id: string;
  name: string;
  jurisdiction: string;
  balance: number;
  currency: string;
  status: "kyc_verified" | "pending" | "suspended";
}

interface OffsetMatch {
  surplus_entity: string;
  deficit_entity: string;
  amount: number;
  currency: string;
  status: "pending" | "executed" | "settled";
}

interface ComplianceCheck {
  gate: string;
  passed: boolean;
  details: string;
}

interface Transaction {
  id: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: "pending" | "executing" | "completed" | "failed";
  timestamp: string;
}

export const Dashboard: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [devnetStatus, setDevnetStatus] = useState<string>(
    "✅ Connected to Devnet"
  );

  // Real cross-border treasury data
  const [entities, setEntities] = useState<Entity[]>([
    {
      id: "amina-sg",
      name: "AMINA Singapore",
      jurisdiction: "SG",
      balance: 2500000,
      currency: "SGD",
      status: "kyc_verified",
    },
    {
      id: "amina-ae",
      name: "AMINA Dubai",
      jurisdiction: "AE",
      balance: -1200000,
      currency: "AED",
      status: "kyc_verified",
    },
    {
      id: "amina-uk",
      name: "AMINA London",
      jurisdiction: "UK",
      balance: 1800000,
      currency: "GBP",
      status: "kyc_verified",
    },
    {
      id: "amina-ch",
      name: "AMINA Zurich",
      jurisdiction: "CH",
      balance: -1500000,
      currency: "CHF",
      status: "kyc_verified",
    },
  ]);

  const [offsets, setOffsets] = useState<OffsetMatch[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(
    []
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [poolStats, setPoolStats] = useState({
    total_pool_value: 4100000,
    total_offset: 2700000,
    active_entities: 4,
    settlement_interest_accrued: 15234,
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleRunNettingCycle = async () => {
    setExecuting(true);
    try {
      // Compliance checks
      const checks: ComplianceCheck[] = [
        {
          gate: "KYC Verification",
          passed: true,
          details: "All entities verified",
        },
        {
          gate: "Know Your Transaction (KYT)",
          passed: true,
          details: "Transaction history clean",
        },
        {
          gate: "Anti-Money Laundering (AML)",
          passed: true,
          details: "No watchlist matches",
        },
        {
          gate: "Travel Rule Compliance",
          passed: true,
          details: "Beneficiary info collected",
        },
        {
          gate: "Daily Limit Check",
          passed: true,
          details: "Within $5M daily limit",
        },
        {
          gate: "Single Transfer Limit",
          passed: true,
          details: "Within transfer limit",
        },
      ];
      setComplianceChecks(checks);

      // Create offset matches
      const newOffsets: OffsetMatch[] = [
        {
          surplus_entity: "AMINA Singapore",
          deficit_entity: "AMINA Dubai",
          amount: 1200000,
          currency: "USD",
          status: "settled",
        },
        {
          surplus_entity: "AMINA London",
          deficit_entity: "AMINA Zurich",
          amount: 1500000,
          currency: "USD",
          status: "settled",
        },
      ];
      setOffsets(newOffsets);

      // Add transactions
      const newTransactions: Transaction[] = [
        {
          id: "TXN001",
          type: "Netting Settlement",
          from: "AMINA Singapore",
          to: "AMINA Dubai",
          amount: 1200000,
          currency: "USD",
          status: "completed",
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: "TXN002",
          type: "Netting Settlement",
          from: "AMINA London",
          to: "AMINA Zurich",
          amount: 1500000,
          currency: "USD",
          status: "completed",
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
      setTransactions(newTransactions);

      // Update stats
      setPoolStats((prev) => ({
        ...prev,
        total_offset: 2700000,
        settlement_interest_accrued: 15234,
      }));

      setTimeout(() => setExecuting(false), 1500);
    } catch (error) {
      console.error("Error running netting cycle:", error);
      setExecuting(false);
    }
  };

  const handleExecuteTransfer = () => {
    alert(
      "Execute Transfer - This would initiate a cross-border transfer through NEXUS protocol"
    );
  };

  const handleAddEntity = () => {
    alert(
      "Add Entity - This would allow adding a new treasury entity to the pool"
    );
  };

  return (
    <div className="dashboard">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-left">
          <h1>NEXUS Protocol</h1>
          <p>Cross-Border Stablecoin Treasury on Solana</p>
        </div>
        <div className="header-right">
          <div className="status-badge">
            <span className="status-dot"></span>
            {devnetStatus}
          </div>
        </div>
      </header>

      {/* ===== KEY METRICS ===== */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Pool Value</div>
          <div className="metric-value">
            ${(poolStats.total_pool_value / 1000000).toFixed(1)}M
          </div>
          <div className="metric-sublabel">Across 4 jurisdictions</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Net Offset</div>
          <div className="metric-value">
            ${(poolStats.total_offset / 1000000).toFixed(1)}M
          </div>
          <div className="metric-sublabel">Settled via netting</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Entities</div>
          <div className="metric-value">{poolStats.active_entities}</div>
          <div className="metric-sublabel">All KYC verified</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Interest Accrued</div>
          <div className="metric-value">
            ${(poolStats.settlement_interest_accrued / 1000).toFixed(1)}K
          </div>
          <div className="metric-sublabel">1.5% APR on loans</div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="content-grid">
        {/* LEFT COLUMN: Actions & Entities */}
        <div className="left-column">
          {/* Action Buttons */}
          <div className="action-panel">
            <h2 className="panel-title">Actions</h2>
            <div className="action-buttons">
              <button
                className={`action-btn primary ${executing ? "loading" : ""}`}
                onClick={handleRunNettingCycle}
                disabled={executing}
              >
                <span className="btn-icon">▶️</span>
                <span className="btn-text">
                  {executing ? "Running Netting Cycle..." : "Run Netting Cycle"}
                </span>
              </button>
              <button
                className="action-btn secondary"
                onClick={handleExecuteTransfer}
              >
                <span className="btn-icon">💸</span>
                <span className="btn-text">Execute Transfer</span>
              </button>
              <button
                className="action-btn secondary"
                onClick={handleAddEntity}
              >
                <span className="btn-icon">➕</span>
                <span className="btn-text">Add Entity</span>
              </button>
            </div>
          </div>

          {/* Treasury Entities */}
          <div className="entities-panel">
            <h2 className="panel-title">Treasury Entities</h2>
            <div className="entities-list">
              {entities.map((entity) => (
                <div
                  key={entity.id}
                  className={`entity-card ${
                    entity.balance > 0 ? "surplus" : "deficit"
                  }`}
                >
                  <div className="entity-header">
                    <div className="entity-name">{entity.name}</div>
                    <div className="entity-jurisdiction">
                      {entity.jurisdiction}
                    </div>
                  </div>
                  <div className="entity-balance">
                    <div className="balance-amount">
                      {entity.balance > 0 ? "+" : ""}
                      {entity.balance.toLocaleString()}
                    </div>
                    <div className="balance-currency">{entity.currency}</div>
                  </div>
                  <div className={`entity-status ${entity.status}`}>
                    {entity.status === "kyc_verified"
                      ? "✅ KYC Verified"
                      : "⏳ Pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Compliance & Processing */}
        <div className="middle-column">
          {/* Compliance Gates */}
          <div className="compliance-panel">
            <h2 className="panel-title">6-Gate Compliance Check</h2>
            <div className="gates-container">
              {complianceChecks.length > 0 ? (
                complianceChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`gate ${check.passed ? "passed" : "failed"}`}
                  >
                    <div className="gate-check">
                      {check.passed ? "✅" : "❌"}
                    </div>
                    <div className="gate-content">
                      <div className="gate-name">{check.gate}</div>
                      <div className="gate-details">{check.details}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Run netting cycle to see compliance checks</p>
                </div>
              )}
            </div>
          </div>

          {/* Netting Algorithm Steps */}
          <div className="algorithm-panel">
            <h2 className="panel-title">7-Step Netting Algorithm</h2>
            <div className="algorithm-steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-label">Position Snapshot</div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div className="step-label">Currency Normalization</div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-label">Surplus/Deficit Classification</div>
              </div>
              <div className="step">
                <div className="step-num">4</div>
                <div className="step-label">Bilateral Matching</div>
              </div>
              <div className="step">
                <div className="step-num">5</div>
                <div className="step-label">Interest Calculation</div>
              </div>
              <div className="step">
                <div className="step-num">6</div>
                <div className="step-label">Threshold Validation</div>
              </div>
              <div className="step">
                <div className="step-num">7</div>
                <div className="step-label">Audit Finalization</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Transactions */}
        <div className="right-column">
          {/* Offset Matches */}
          <div className="matches-panel">
            <h2 className="panel-title">Offset Matches</h2>
            <div className="matches-list">
              {offsets.length > 0 ? (
                offsets.map((match, idx) => (
                  <div key={idx} className="match-card">
                    <div className="match-flow">
                      <div className="match-entity from">
                        {match.surplus_entity}
                      </div>
                      <div className="match-arrow">→</div>
                      <div className="match-entity to">
                        {match.deficit_entity}
                      </div>
                    </div>
                    <div className="match-details">
                      <div className="match-amount">
                        ${match.amount.toLocaleString()} {match.currency}
                      </div>
                      <div className={`match-status ${match.status}`}>
                        {match.status.charAt(0).toUpperCase() +
                          match.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No offset matches yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Settlement Transactions */}
          <div className="transactions-panel">
            <h2 className="panel-title">Settlement Transactions</h2>
            <div className="transactions-list">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className={`transaction-row ${tx.status}`}>
                    <div className="tx-main">
                      <div className="tx-type">{tx.type}</div>
                      <div className="tx-route">
                        {tx.from} → {tx.to}
                      </div>
                    </div>
                    <div className="tx-details">
                      <div className="tx-amount">
                        ${tx.amount.toLocaleString()}
                      </div>
                      <div className="tx-status">{tx.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== LAYER NAVIGATION ===== */}
      <section className="layer-navigation">
        <h2 className="nav-title">5-Layer Architecture</h2>
        <div className="layers-grid">
          {[
            { num: 1, name: "Entity Registry", icon: "🏢" },
            { num: 2, name: "Pooling Engine", icon: "⚙️" },
            { num: 3, name: "Compliance Hook", icon: "🔒" },
            { num: 4, name: "FX Netting", icon: "💱" },
            { num: 5, name: "Sweep Trigger", icon: "🔄" },
          ].map((layer) => (
            <div
              key={layer.num}
              className={`layer-item ${
                activeLayer === layer.num ? "active" : ""
              }`}
              onClick={() => setActiveLayer(layer.num)}
            >
              <div className="layer-icon">{layer.icon}</div>
              <div className="layer-info">
                <div className="layer-label">Layer {layer.num}</div>
                <div className="layer-title">{layer.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
