/* ============================================================
   PAGE 10 — Initiate Transfer (6-gate compliance)
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import { SOLANA_EXPLORER_URL } from "../../constants";
import type { Transfer } from "../../types";

const InitiateTransfer: React.FC = () => {
  const { entities, initiateTransfer, transfers, loading } = useNexus();
  const [form, setForm] = useState({
    fromEntityId: "",
    toEntityId: "",
    amount: 0,
    currency: "USD",
    memo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<Transfer | null>(null);

  if (loading) return <div className="loading-state">Loading...</div>;

  const verifiedEntities = entities.filter(
    (e) =>
      e.kycStatus === "verified" ||
      e.kycStatus === "suspended" ||
      e.kycStatus === "pending"
  );

  const set = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.fromEntityId || !form.toEntityId || form.amount <= 0) return;
    setSubmitting(true);
    setLastResult(null);
    const transfer = await initiateTransfer({
      fromEntityId: form.fromEntityId,
      toEntityId: form.toEntityId,
      amount: form.amount,
      currency: form.currency,
      memo: form.memo,
    });
    setLastResult(transfer);
    setSubmitting(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Transfers / Initiate Transfer
        </div>
        <h2>[//] Initiate Transfer</h2>
      </div>

      <div className="page-body">
        <div className="grid grid-2">
          {/* Transfer Form */}
          <div className="sketch-card">
            <h3>New Transfer</h3>

            <div className="form-group">
              <label>From Entity</label>
              <select
                className="sketch-select"
                value={form.fromEntityId}
                onChange={(e) => set("fromEntityId", e.target.value)}
              >
                <option value="">-- Select sender --</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.legalName} ({e.id}) [{e.kycStatus}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>To Entity</label>
              <select
                className="sketch-select"
                value={form.toEntityId}
                onChange={(e) => set("toEntityId", e.target.value)}
              >
                <option value="">-- Select receiver --</option>
                {entities
                  .filter((e) => e.id !== form.fromEntityId)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.legalName} ({e.id}) [{e.kycStatus}]
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  className="sketch-input"
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => set("amount", Number(e.target.value))}
                  placeholder="50000"
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  className="sketch-select"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CHF</option>
                  <option>SGD</option>
                  <option>AED</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Memo</label>
              <input
                className="sketch-input"
                value={form.memo}
                onChange={(e) => set("memo", e.target.value)}
                placeholder="e.g. Q1 operational funding"
              />
            </div>

            <button
              className="sketch-btn primary"
              disabled={
                submitting ||
                !form.fromEntityId ||
                !form.toEntityId ||
                form.amount <= 0
              }
              onClick={handleSubmit}
            >
              {submitting
                ? "Processing 6-gate compliance..."
                : "[x] Submit Transfer"}
            </button>

            {/* Sender info */}
            {form.fromEntityId && (
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 12,
                  padding: 8,
                  background: "var(--bg)",
                  border: "1px dashed var(--border-light)",
                }}
              >
                {(() => {
                  const e = entities.find((x) => x.id === form.fromEntityId);
                  if (!e) return "";
                  return `Sender limits: Single $${e.mandateLimits.maxSingleTransfer.toLocaleString()} | Daily $${e.mandateLimits.dailyUsed.toLocaleString()} / $${e.mandateLimits.maxDailyAggregate.toLocaleString()} | KYC: ${
                    e.kycStatus
                  }`;
                })()}
              </div>
            )}
          </div>

          {/* Result */}
          <div>
            {lastResult && (
              <div
                className={`sketch-card ${
                  lastResult.status === "completed" ? "highlight" : ""
                }`}
                style={{
                  borderColor:
                    lastResult.status === "blocked"
                      ? "var(--accent-red)"
                      : undefined,
                }}
              >
                <h3>
                  {lastResult.status === "completed"
                    ? "[x] Transfer Approved"
                    : "[!] Transfer Blocked"}
                </h3>

                <div
                  className={`mono ${
                    lastResult.status === "completed"
                      ? "text-green"
                      : "text-red"
                  }`}
                  style={{ fontSize: 14, marginBottom: 12 }}
                >
                  {lastResult.fromEntityId} ---&gt; {lastResult.toEntityId} | $
                  {lastResult.amount.toLocaleString()} {lastResult.currency}
                </div>

                {lastResult.blockReason && (
                  <div
                    className="mono text-red"
                    style={{
                      padding: 8,
                      background: "#ffebee",
                      border: "1px solid var(--accent-red)",
                      marginBottom: 12,
                      fontSize: 12,
                    }}
                  >
                    BLOCKED: {lastResult.blockReason}
                  </div>
                )}

                <h4>6-Gate Compliance Check</h4>
                <ul className="gate-list">
                  {lastResult.gateResults?.map((g, i) => (
                    <li key={i} className="gate-item">
                      <span
                        className={`gate-check ${g.passed ? "pass" : "fail"}`}
                      >
                        {g.passed ? "[x]" : "[ ]"}
                      </span>
                      <span style={{ flex: 1 }}>
                        Gate {i + 1}: {g.gate}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: g.passed
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                        }}
                      >
                        {g.details}
                      </span>
                    </li>
                  ))}
                </ul>

                {lastResult.transactionHash && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>
                      On-chain tx:
                    </span>
                    <a
                      href={`${SOLANA_EXPLORER_URL}/tx/${lastResult.transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      {lastResult.transactionHash.slice(0, 20)}…
                      {lastResult.transactionHash.slice(-8)} ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Recent transfers */}
            <div className="sketch-card">
              <h3>Recent Transfers</h3>
              {transfers.length === 0 ? (
                <div className="empty-state">No transfers yet.</div>
              ) : (
                <table className="sketch-table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th></th>
                      <th>To</th>
                      <th className="text-right">Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.slice(0, 10).map((t) => (
                      <tr key={t.id}>
                        <td className="mono">{t.fromEntityId}</td>
                        <td className="arrow">---&gt;</td>
                        <td className="mono">{t.toEntityId}</td>
                        <td className="text-right mono">
                          ${t.amount.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${t.status}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: 11 }}>
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          {t.transactionHash ? (
                            <a
                              href={`${SOLANA_EXPLORER_URL}/tx/${t.transactionHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mono"
                              style={{
                                fontSize: 10,
                                color: "var(--accent-blue)",
                              }}
                            >
                              {t.transactionHash.slice(0, 8)}… ↗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InitiateTransfer;
