import React, { useState } from "react";
import "../styles/BankDashboard.css";

interface Subsidiary {
  id: string;
  name: string;
  jurisdiction: string;
  balance: number;
  currency: string;
  status: "active" | "pending" | "suspended";
}

interface BankDashboardProps {
  walletAddress: string | null;
  onDisconnect: () => void;
  onSwitchToCompany: () => void;
}

const BankDashboard: React.FC<BankDashboardProps> = ({
  walletAddress,
  onDisconnect,
  onSwitchToCompany,
}) => {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([
    {
      id: "sub-sg",
      name: "AMINA Singapore",
      jurisdiction: "SG",
      balance: 2500000,
      currency: "SGD",
      status: "active",
    },
    {
      id: "sub-ae",
      name: "AMINA Dubai",
      jurisdiction: "AE",
      balance: -1200000,
      currency: "AED",
      status: "active",
    },
    {
      id: "sub-uk",
      name: "AMINA London",
      jurisdiction: "UK",
      balance: 1800000,
      currency: "GBP",
      status: "active",
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    jurisdiction: "",
    initialBalance: "",
    currency: "USD",
  });

  const handleCreateSubsidiary = () => {
    if (formData.name && formData.jurisdiction && formData.initialBalance) {
      const newSubsidiary: Subsidiary = {
        id: `sub-${Date.now()}`,
        name: formData.name,
        jurisdiction: formData.jurisdiction,
        balance: parseFloat(formData.initialBalance),
        currency: formData.currency,
        status: "pending",
      };
      setSubsidiaries([...subsidiaries, newSubsidiary]);
      setFormData({
        name: "",
        jurisdiction: "",
        initialBalance: "",
        currency: "USD",
      });
      setShowCreateForm(false);
    }
  };

  const totalBalance = subsidiaries.reduce((sum, sub) => sum + sub.balance, 0);

  return (
    <div className="bank-dashboard">
      <div className="grid-background"></div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">🏦 AMINA Bank</h1>
          <p className="header-subtitle">Treasury Management Portal</p>
        </div>
        <div className="header-right">
          <div className="wallet-info">
            <span className="wallet-label">Connected:</span>
            <span className="wallet-address">
              {walletAddress?.slice(0, 10)}...
            </span>
          </div>
          <button className="nav-button" onClick={onSwitchToCompany}>
            💼 Switch to Company View
          </button>
          <button className="nav-button disconnect" onClick={onDisconnect}>
            ❌ Disconnect
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Summary Cards */}
        <section className="summary-section">
          <div className="summary-card">
            <div className="card-label">Total Pool Value</div>
            <div className="card-value">
              ${(totalBalance / 1000000).toFixed(2)}M
            </div>
            <div className="card-sublabel">
              Across {subsidiaries.length} entities
            </div>
          </div>

          <div className="summary-card">
            <div className="card-label">Active Subsidiaries</div>
            <div className="card-value">
              {subsidiaries.filter((s) => s.status === "active").length}
            </div>
            <div className="card-sublabel">KYC Verified</div>
          </div>

          <div className="summary-card">
            <div className="card-label">Net Position</div>
            <div className="card-value highlight-positive">
              ${Math.abs(totalBalance).toLocaleString()}
            </div>
            <div className="card-sublabel">
              {totalBalance > 0 ? "Surplus" : "Deficit"}
            </div>
          </div>

          <div className="summary-card action-card">
            <button
              className="add-subsidiary-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              ➕ Create Subsidiary
            </button>
          </div>
        </section>

        {/* Create Subsidiary Form */}
        {showCreateForm && (
          <section className="create-form-section">
            <h2 className="form-title">Create New Subsidiary</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Subsidiary Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., AMINA Zurich"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jurisdiction</label>
                <select
                  className="form-input"
                  value={formData.jurisdiction}
                  onChange={(e) =>
                    setFormData({ ...formData, jurisdiction: e.target.value })
                  }
                >
                  <option value="">Select Jurisdiction</option>
                  <option value="CH">Switzerland (CH)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="FR">France (FR)</option>
                  <option value="US">United States (US)</option>
                  <option value="JP">Japan (JP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Balance</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Amount in USD"
                  value={formData.initialBalance}
                  onChange={(e) =>
                    setFormData({ ...formData, initialBalance: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  className="form-input"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="SGD">SGD</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="form-button primary"
                onClick={handleCreateSubsidiary}
              >
                ✓ Create Subsidiary
              </button>
              <button
                className="form-button secondary"
                onClick={() => setShowCreateForm(false)}
              >
                ✗ Cancel
              </button>
            </div>
          </section>
        )}

        {/* Subsidiaries Table */}
        <section className="subsidiaries-section">
          <h2 className="section-title">Your Subsidiaries</h2>

          <div className="subsidiaries-grid">
            {subsidiaries.map((sub) => (
              <div
                key={sub.id}
                className={`subsidiary-card ${sub.status} ${
                  sub.balance > 0 ? "surplus" : "deficit"
                }`}
              >
                <div className="card-header">
                  <h3 className="sub-name">{sub.name}</h3>
                  <span
                    className={`jurisdiction-badge ${sub.jurisdiction.toLowerCase()}`}
                  >
                    {sub.jurisdiction}
                  </span>
                </div>

                <div className="card-body">
                  <div className="balance-display">
                    <span className="balance-label">Balance</span>
                    <span
                      className={`balance-amount ${
                        sub.balance > 0 ? "positive" : "negative"
                      }`}
                    >
                      {sub.balance > 0 ? "+" : ""}
                      {sub.balance.toLocaleString()}
                    </span>
                    <span className="balance-currency">{sub.currency}</span>
                  </div>

                  <div className="status-display">
                    <span className={`status-badge ${sub.status}`}>
                      {sub.status === "active" && "✓ Active"}
                      {sub.status === "pending" && "⏳ Pending"}
                      {sub.status === "suspended" && "⚠ Suspended"}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="action-btn small">Edit</button>
                  <button className="action-btn small">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2 className="section-title">Actions</h2>

          <div className="actions-grid">
            <button className="action-card primary">
              <span className="action-icon">▶️</span>
              <span className="action-label">Run Netting Cycle</span>
              <span className="action-desc">Execute 7-step algorithm</span>
            </button>

            <button className="action-card">
              <span className="action-icon">💸</span>
              <span className="action-label">Execute Transfer</span>
              <span className="action-desc">Cross-border settlement</span>
            </button>

            <button className="action-card">
              <span className="action-icon">📊</span>
              <span className="action-label">View Reports</span>
              <span className="action-desc">Treasury analytics</span>
            </button>

            <button className="action-card">
              <span className="action-icon">🔒</span>
              <span className="action-label">Compliance Check</span>
              <span className="action-desc">6-gate validation</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BankDashboard;
