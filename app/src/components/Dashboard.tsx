import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { nexusClient } from "../services/solanaClient";

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

export const Dashboard: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [devnetStatus, setDevnetStatus] = useState<string>("Connecting...");
  const [entities, setEntities] = useState<Entity[]>([
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
      balance: -400000,
      currency: "EUR",
      status: "kyc_verified",
    },
  ]);

  const [offsets, setOffsets] = useState<OffsetMatch[]>([
    {
      surplus_entity: "sg-001",
      deficit_entity: "ae-001",
      amount: 300000,
      currency: "USD",
      status: "executed",
    },
    {
      surplus_entity: "uk-001",
      deficit_entity: "de-001",
      amount: 200000,
      currency: "GBP",
      status: "pending",
    },
  ]);

  // Load data from devnet on mount
  useEffect(() => {
    const loadDevnetData = async () => {
      try {
        // Get devnet connection status
        const status = await nexusClient.getStatus();
        setDevnetStatus(
          status.connected ? "✅ Connected to Devnet" : "❌ Devnet Offline"
        );

        // Load entities
        const entitiesData = await nexusClient.getEntities();
        setEntities(entitiesData);

        // Load offset matches
        const offsetsData = await nexusClient.getOffsetMatches();
        setOffsets(offsetsData);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load devnet data:", error);
        setDevnetStatus("⚠️ Data load failed");
        setLoading(false);
      }
    };

    loadDevnetData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "kyc_verified":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "suspended":
        return "#ef4444";
      case "executed":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>🌐 NEXUS Protocol</h1>
          <p>5-Layer On-Chain Corporate Cash Pooling</p>
        </div>
        <div className="wallet-info">
          <span className="badge">{devnetStatus}</span>
          <span className="address">A7eV2...UXc5o</span>
        </div>
      </div>

      {/* Layer Navigation */}
      <div className="layer-nav">
        {[
          { num: 1, name: "Entity Registry", icon: "🏢" },
          { num: 2, name: "Pooling Engine", icon: "💱" },
          { num: 3, name: "Compliance Hook", icon: "✅" },
          { num: 4, name: "FX Netting", icon: "📊" },
          { num: 5, name: "Sweep Trigger", icon: "💰" },
        ].map((layer) => (
          <button
            key={layer.num}
            className={`layer-btn ${activeLayer === layer.num ? "active" : ""}`}
            onClick={() => setActiveLayer(layer.num)}
          >
            <span className="layer-icon">{layer.icon}</span>
            <span className="layer-num">Layer {layer.num}</span>
            <span className="layer-name">{layer.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Entities */}
        <div className="panel entities-panel">
          <h2>📋 Registered Entities</h2>
          <div className="entities-grid">
            {entities.map((entity) => (
              <div key={entity.id} className="entity-card">
                <div className="entity-header">
                  <h3>{entity.name}</h3>
                  <span className="jurisdiction-badge">
                    {entity.jurisdiction}
                  </span>
                </div>
                <div className="entity-details">
                  <div className="detail-row">
                    <span>Balance:</span>
                    <strong
                      style={{
                        color: entity.balance > 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {entity.balance > 0 ? "+" : ""}
                      {entity.balance.toLocaleString()} {entity.currency}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(entity.status) }}
                    >
                      {entity.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="entity-type">
                  {entity.balance > 0 ? "📈 Surplus" : "📉 Deficit"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel - Algorithm Flow */}
        <div className="panel algorithm-panel">
          <h2>🔄 7-Step Netting Algorithm</h2>
          <div className="algorithm-steps">
            {[
              {
                step: 1,
                name: "Position Snapshot",
                desc: "Read all balances",
                icon: "📸",
              },
              {
                step: 2,
                name: "Currency Normalization",
                desc: "Convert to USD",
                icon: "💱",
              },
              {
                step: 3,
                name: "Surplus/Deficit Classification",
                desc: "Sort entities",
                icon: "🔀",
              },
              {
                step: 4,
                name: "Greedy Offset Matching",
                desc: "Match pairs",
                icon: "⚙️",
              },
              {
                step: 5,
                name: "Interest Calculation",
                desc: "1.5% APR accrual",
                icon: "📈",
              },
              {
                step: 6,
                name: "Sweep Threshold Check",
                desc: "Check $1B limit",
                icon: "⚠️",
              },
              {
                step: 7,
                name: "Audit Finalization",
                desc: "Write to blockchain",
                icon: "✍️",
              },
            ].map((item) => (
              <div key={item.step} className="step-card">
                <div className="step-number">{item.step}</div>
                <div className="step-content">
                  <h4>
                    {item.icon} {item.name}
                  </h4>
                  <p>{item.desc}</p>
                </div>
                {item.step < 7 && <div className="step-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Offset Matches */}
        <div className="panel offsets-panel">
          <h2>🔗 Offset Matches</h2>
          <div className="offsets-list">
            {offsets.map((offset, idx) => (
              <div key={idx} className="offset-card">
                <div className="offset-from">
                  <span className="label">From:</span>
                  <strong>
                    {entities.find((e) => e.id === offset.surplus_entity)?.name}
                  </strong>
                </div>
                <div className="offset-arrow">→</div>
                <div className="offset-to">
                  <span className="label">To:</span>
                  <strong>
                    {entities.find((e) => e.id === offset.deficit_entity)?.name}
                  </strong>
                </div>
                <div className="offset-amount">
                  <span className="amount">
                    {offset.amount.toLocaleString()} {offset.currency}
                  </span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(offset.status) }}
                  >
                    {offset.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CPI Chain Flow */}
      <div className="cpi-chain">
        <h2>🔗 Cross-Program Invocation Chain</h2>
        <div className="chain-flow">
          <div className="chain-box">
            <span className="chain-icon">1️⃣</span>
            <span className="chain-name">Entity Registry</span>
            <span className="chain-status">✅ Verify KYC</span>
          </div>
          <div className="chain-connector">→</div>

          <div className="chain-box">
            <span className="chain-icon">2️⃣</span>
            <span className="chain-name">Pooling Engine</span>
            <span className="chain-status">✅ Run Netting</span>
          </div>
          <div className="chain-connector">→</div>

          <div className="chain-box">
            <span className="chain-icon">3️⃣</span>
            <span className="chain-name">Compliance Hook</span>
            <span className="chain-status">✅ Validate Transfer</span>
          </div>
          <div className="chain-connector">→</div>

          <div className="chain-box">
            <span className="chain-icon">4️⃣</span>
            <span className="chain-name">FX Netting</span>
            <span className="chain-status">✅ Convert Currency</span>
          </div>
          <div className="chain-connector">→</div>

          <div className="chain-box">
            <span className="chain-icon">5️⃣</span>
            <span className="chain-name">Sweep Trigger</span>
            <span className="chain-status">✅ Create Loan</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Pool Value</h3>
          <p className="stat-value">$1,500,000</p>
          <span className="stat-change">+12.5% this week</span>
        </div>
        <div className="stat-card">
          <h3>Net Offset</h3>
          <p className="stat-value">$500,000</p>
          <span className="stat-change">67% virtual settlement</span>
        </div>
        <div className="stat-card">
          <h3>Active Entities</h3>
          <p className="stat-value">4/4</p>
          <span className="stat-change">All KYC verified</span>
        </div>
        <div className="stat-card">
          <h3>Interest Accrued</h3>
          <p className="stat-value">$1,250</p>
          <span className="stat-change">1.5% APR on surplus</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={async () => {
            const result = await nexusClient.runNettingCycle();
            if (result.success) {
              alert(`✅ Netting cycle executed!\nTx: ${result.transaction}`);
            } else {
              alert(`❌ Failed: ${result.error}`);
            }
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "▶️ Run Netting Cycle"}
        </button>
        <button className="btn btn-secondary">📊 View Analytics</button>
        <button className="btn btn-secondary">⚙️ Configure Settings</button>
        <button className="btn btn-secondary">📤 Export Report</button>
      </div>
    </div>
  );
};
