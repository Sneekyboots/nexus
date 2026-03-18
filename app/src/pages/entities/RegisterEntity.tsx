/* ============================================================
   PAGE 4 — Register Entity (4-step wizard)
   Steps: Basic Info -> Jurisdiction -> KYC -> Mandate Limits
   ============================================================ */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import { JURISDICTION_LABELS, JURISDICTION_FLAGS } from "../../types";
import { CURRENCIES, STABLECOINS } from "../../constants";

const STEPS = [
  "Company Details",
  "Jurisdiction & Currency",
  "Compliance Setup",
  "Mandate Limits",
];

const RegisterEntity: React.FC = () => {
  const navigate = useNavigate();
  const { registerEntity, addEntityToPool } = useNexus();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    legalName: "",
    parentCompany: "TechCorp Global",
    jurisdiction: "CH",
    currency: "CHF",
    stablecoin: "USDC",
    kycProvider: "SumSub",
    complianceOfficer: "CompO9x...CompOfficer",
    maxSingleTransfer: 250000,
    maxDailyAggregate: 1000000,
    addToPool: true,
  });

  const set = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canNext =
    step === 0
      ? form.legalName.trim().length > 0
      : step === 1
      ? form.jurisdiction && form.currency
      : step === 2
      ? form.kycProvider
      : form.maxSingleTransfer > 0 && form.maxDailyAggregate > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const entity = await registerEntity({
        legalName: form.legalName,
        parentCompany: form.parentCompany,
        jurisdiction: form.jurisdiction,
        currency: form.currency,
        stablecoin: form.stablecoin,
        complianceOfficer: form.complianceOfficer,
        mandateLimits: {
          maxSingleTransfer: form.maxSingleTransfer,
          maxDailyAggregate: form.maxDailyAggregate,
          dailyUsed: 0,
          dayResetTimestamp: Date.now(),
        },
      });
      if (form.addToPool) {
        await addEntityToPool(entity.id, "pool-alpha");
      }
      navigate("/entities");
    } catch (err) {
      setError(`Registration failed: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / <Link to="/entities">Entities</Link> /
          Register New Entity
        </div>
        <h2>[+] Register New Entity</h2>
      </div>

      <div className="page-body">
        {error && (
          <div
            className="sketch-card"
            style={{ borderColor: "var(--accent-red)", marginBottom: 16 }}
          >
            <div className="text-red mono" style={{ fontSize: 13 }}>
              [!] {error}
            </div>
          </div>
        )}
        {/* Step indicator */}
        <div className="sketch-card" style={{ padding: "12px 20px" }}>
          <div className="flex gap-16">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="flex-center gap-8"
                style={{
                  opacity: i <= step ? 1 : 0.4,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                }}
              >
                <span
                  className="step-number"
                  style={{
                    width: 24,
                    height: 24,
                    fontSize: 12,
                    background:
                      i < step
                        ? "var(--accent-green)"
                        : i === step
                        ? "var(--highlight-strong)"
                        : "var(--bg)",
                    color: i < step ? "white" : "var(--text)",
                    borderColor:
                      i < step
                        ? "var(--accent-green)"
                        : i === step
                        ? "var(--border)"
                        : "var(--border-light)",
                  }}
                >
                  {i < step ? "x" : i + 1}
                </span>
                {s}
                {i < STEPS.length - 1 && (
                  <span className="arrow" style={{ marginLeft: 8 }}>
                    ---&gt;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sketch-card" style={{ maxWidth: 600 }}>
          <h3>
            Step {step + 1}: {STEPS[step]}
          </h3>

          {step === 0 && (
            <>
              <div className="form-group">
                <label>Legal Entity Name</label>
                <input
                  className="sketch-input"
                  placeholder="e.g. TechCorp AG"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Parent Company</label>
                <input
                  className="sketch-input"
                  value={form.parentCompany}
                  onChange={(e) => set("parentCompany", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="form-group">
                <label>Jurisdiction</label>
                <select
                  className="sketch-select"
                  value={form.jurisdiction}
                  onChange={(e) => set("jurisdiction", e.target.value)}
                >
                  {Object.entries(JURISDICTION_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {JURISDICTION_FLAGS[code]} {code} — {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Operating Currency</label>
                  <select
                    className="sketch-select"
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stablecoin</label>
                  <select
                    className="sketch-select"
                    value={form.stablecoin}
                    onChange={(e) => set("stablecoin", e.target.value)}
                  >
                    {STABLECOINS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>KYC Provider</label>
                <select
                  className="sketch-select"
                  value={form.kycProvider}
                  onChange={(e) => set("kycProvider", e.target.value)}
                >
                  <option value="SumSub">SumSub</option>
                  <option value="Onfido">Onfido</option>
                  <option value="Jumio">Jumio</option>
                </select>
              </div>
              <div className="form-group">
                <label>Compliance Officer Wallet</label>
                <input
                  className="sketch-input"
                  value={form.complianceOfficer}
                  onChange={(e) => set("complianceOfficer", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.addToPool}
                    onChange={(e) => set("addToPool", e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Add to TechCorp Global Pool after registration
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Max Single Transfer (USD)</label>
                <input
                  className="sketch-input"
                  type="number"
                  value={form.maxSingleTransfer}
                  onChange={(e) =>
                    set("maxSingleTransfer", Number(e.target.value))
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Daily Aggregate (USD)</label>
                <input
                  className="sketch-input"
                  type="number"
                  value={form.maxDailyAggregate}
                  onChange={(e) =>
                    set("maxDailyAggregate", Number(e.target.value))
                  }
                />
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                These limits are enforced on-chain via the Compliance Hook
                program (Gate 5: Daily Limit, Gate 6: Single Transfer).
              </div>
            </>
          )}

          <div className="flex-between" style={{ marginTop: 20 }}>
            <button
              className="sketch-btn"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              &lt;-- Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="sketch-btn primary"
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
              >
                Next --&gt;
              </button>
            ) : (
              <button
                className="sketch-btn primary"
                disabled={!canNext || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Registering..." : "[x] Register Entity"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterEntity;
