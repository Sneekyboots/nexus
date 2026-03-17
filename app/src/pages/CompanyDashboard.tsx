import React, { useState } from "react";
import "../styles/CompanyDashboard.css";

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed";
  timestamp: string;
}

interface ComplianceCheck {
  gate: string;
  passed: boolean;
  timestamp: string;
}

interface CompanyDashboardProps {
  walletAddress: string | null;
  onDisconnect: () => void;
  onSwitchToBank: () => void;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  walletAddress,
  onDisconnect,
  onSwitchToBank,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "txn-001",
      from: "Singapore Hub",
      to: "Dubai Ops",
      amount: 1200000,
      currency: "USD",
      status: "completed",
      timestamp: "2026-03-17 10:30 AM",
    },
    {
      id: "txn-002",
      from: "London Treasury",
      to: "Zurich HQ",
      amount: 1500000,
      currency: "USD",
      status: "completed",
      timestamp: "2026-03-17 10:32 AM",
    },
  ]);

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([
    {
      gate: "KYC Verification",
      passed: true,
      timestamp: "2026-03-17 10:25 AM",
    },
    {
      gate: "Know Your Transaction",
      passed: true,
      timestamp: "2026-03-17 10:26 AM",
    },
    {
      gate: "Anti-Money Laundering",
      passed: true,
      timestamp: "2026-03-17 10:27 AM",
    },
    {
      gate: "Travel Rule Compliance",
      passed: true,
      timestamp: "2026-03-17 10:28 AM",
    },
    {
      gate: "Daily Limit Check",
      passed: true,
      timestamp: "2026-03-17 10:29 AM",
    },
    {
      gate: "Single Transfer Limit",
      passed: true,
      timestamp: "2026-03-17 10:30 AM",
    },
  ]);

  const [executingNetting, setExecutingNetting] = useState(false);

  const handleRunNettingCycle = () => {
    setExecutingNetting(true);
    setTimeout(() => {
      // Add new transactions
      const newTxn: Transaction = {
        id: `txn-${Date.now()}`,
        from: "Singapore Hub",
        to: "Dubai Ops",
        amount: 2500000,
        currency: "USD",
        status: "completed",
        timestamp: new Date().toLocaleTimeString(),
      };
      setTransactions([newTxn, ...transactions]);
      setExecutingNetting(false);
    }, 2000);
  };

  const completedCount = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="company-dashboard">
      <div className="grid-background"></div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">💼 Treasury Company View</h1>
          <p className="header-subtitle">Real-Time Settlement Monitoring</p>
        </div>
        <div className="header-right">
          <div className="wallet-info">
            <span className="wallet-label">Wallet:</span>
            <span className="wallet-address">
              {walletAddress?.slice(0, 10)}...
            </span>
          </div>
          <button className="nav-button" onClick={onSwitchToBank}>
            🏦 Switch to Bank View
          </button>
          <button className="nav-button disconnect" onClick={onDisconnect}>
            ❌ Disconnect
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* KPIs */}
        <section className="kpi-section">
          <div className="kpi-card">
            <div className="kpi-label">Total Settled</div>
            <div className="kpi-value">
              ${(totalVolume / 1000000).toFixed(2)}M
            </div>
            <div className="kpi-trend">↑ This session</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Transactions</div>
            <div className="kpi-value">{completedCount}</div>
            <div className="kpi-trend">
              {completedCount > 0 ? "All completed" : "No transactions"}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Compliance Gates</div>
            <div className="kpi-value">
              {complianceChecks.filter((c) => c.passed).length}/6
            </div>
            <div className="kpi-trend">All passed</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Cost Saved</div>
            <div className="kpi-value highlight-savings">$4,200</div>
            <div className="kpi-trend">vs traditional banking</div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="two-column">
          {/* Left: Compliance */}
          <section className="compliance-section">
            <h2 className="section-title">6-Gate Compliance Check</h2>

            <div className="gates-list">
              {complianceChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={`gate-item ${check.passed ? "passed" : "failed"}`}
                >
                  <div className="gate-icon">{check.passed ? "✅" : "❌"}</div>
                  <div className="gate-info">
                    <div className="gate-name">{check.gate}</div>
                    <div className="gate-time">{check.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Netting Algorithm Visualization */}
            <div className="algorithm-section">
              <h3 className="subsection-title">7-Step Netting Algorithm</h3>
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
                  <div className="step-label">Surplus/Deficit</div>
                </div>
                <div className="step">
                  <div className="step-num">4</div>
                  <div className="step-label">Bilateral Matching</div>
                </div>
                <div className="step">
                  <div className="step-num">5</div>
                  <div className="step-label">Interest Calc</div>
                </div>
                <div className="step">
                  <div className="step-num">6</div>
                  <div className="step-label">Threshold Check</div>
                </div>
                <div className="step">
                  <div className="step-num">7</div>
                  <div className="step-label">Finalize</div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Transactions */}
          <section className="transactions-section">
            <div className="section-header">
              <h2 className="section-title">Recent Settlements</h2>
              <button
                className={`action-button ${executingNetting ? "loading" : ""}`}
                onClick={handleRunNettingCycle}
                disabled={executingNetting}
              >
                {executingNetting ? "⏳ Running..." : "▶ Run Netting Cycle"}
              </button>
            </div>

            <div className="transactions-list">
              {transactions.length > 0 ? (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className={`transaction-item ${txn.status}`}
                  >
                    <div className="txn-header">
                      <div className="txn-flow">
                        <span className="txn-from">{txn.from}</span>
                        <span className="txn-arrow">→</span>
                        <span className="txn-to">{txn.to}</span>
                      </div>
                      <span className={`txn-status ${txn.status}`}>
                        {txn.status === "completed" && "✓"}
                        {txn.status === "pending" && "⏳"}
                        {txn.status === "failed" && "✗"}
                      </span>
                    </div>
                    <div className="txn-body">
                      <div className="txn-amount">
                        ${txn.amount.toLocaleString()} {txn.currency}
                      </div>
                      <div className="txn-time">{txn.timestamp}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No settlements yet. Run netting cycle to begin.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Real-Time Analytics */}
        <section className="analytics-section">
          <h2 className="section-title">Analytics</h2>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h3 className="analytics-title">Settlement Flow</h3>
              <div className="flow-diagram">
                <div className="flow-entity surplus">
                  <span className="entity-emoji">🇸🇬</span>
                  <span className="entity-name">Singapore</span>
                  <span className="entity-balance">+$2.5M</span>
                </div>
                <div className="flow-connector">→</div>
                <div className="flow-entity deficit">
                  <span className="entity-emoji">🇦🇪</span>
                  <span className="entity-name">Dubai</span>
                  <span className="entity-balance">-$1.2M</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3 className="analytics-title">Cost Breakdown</h3>
              <div className="cost-comparison">
                <div className="cost-item">
                  <span className="cost-label">Traditional Banking:</span>
                  <span className="cost-value traditional">0.05%</span>
                </div>
                <div className="cost-item">
                  <span className="cost-label">NEXUS Protocol:</span>
                  <span className="cost-value nexus">0.02%</span>
                </div>
                <div className="cost-savings">
                  <strong>60% savings per transaction</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CompanyDashboard;
