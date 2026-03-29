/* ============================================================
   PAGE 10 — Initiate Transfer (6-gate compliance)
   ============================================================ */

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import { SOLANA_EXPLORER_URL } from "../../constants";
import type { Transfer, Entity } from "../../types";
import DataNotification from "../../components/DataNotification";

const GATES = [
  { name: "KYC Check", description: "Entity KYC verification" },
  { name: "KYT / Chainalysis", description: "Transaction screening" },
  { name: "AML Score", description: "Anti-money laundering" },
  { name: "Travel Rule", description: "Travel rule compliance" },
  { name: "Daily Limit", description: "Mandate daily aggregate" },
  { name: "Transfer Limit", description: "Single transfer cap" },
];

const preflightCheck = (entity: Entity | undefined, amount: number) => {
  if (!entity) return GATES.map((g) => ({ ...g, status: "pending" as const }));

  const kycPass = entity.kycStatus === "verified";
  const dailyUsed = entity.mandateLimits.dailyUsed + amount;
  const dailyPass = dailyUsed <= entity.mandateLimits.maxDailyAggregate;
  const singlePass = amount <= entity.mandateLimits.maxSingleTransfer;

  return GATES.map((g, i) => {
    let status: "pass" | "fail" | "pending" = "pending";
    if (entity.kycStatus === "suspended") {
      status = "fail";
    } else if (i === 0) {
      status = kycPass ? "pass" : "fail";
    } else if (i === 4) {
      status = dailyPass ? "pass" : "fail";
    } else if (i === 5) {
      status = singlePass ? "pass" : "fail";
    } else {
      status = kycPass ? "pass" : "fail";
    }
    return { ...g, status };
  });
};

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
  const [notification, setNotification] = useState<{
    message: string;
    type: "added" | "updated";
  } | null>(null);

  const set = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const sender = entities.find((e) => e.id === form.fromEntityId);
  const dailyUsage = sender
    ? ((sender.mandateLimits.dailyUsed + form.amount) /
        sender.mandateLimits.maxDailyAggregate) *
      100
    : 0;
  const limitWarning =
    dailyUsage > 100 ? "danger" : dailyUsage > 80 ? "warning" : "";

  const gates = useMemo(
    () => preflightCheck(sender, form.amount),
    [sender, form.amount]
  );

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
    if (transfer.status === "completed") {
      setNotification({
        message: `Transfer of $${form.amount.toLocaleString()} ${
          form.currency
        } completed`,
        type: "added",
      });
    } else {
      setNotification({
        message: `Transfer blocked: ${transfer.blockReason}`,
        type: "updated",
      });
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <>
      {notification && (
        <DataNotification
          message={notification.message}
          type={notification.type}
        />
      )}

      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Transfers / Initiate Transfer
        </div>
        <h2>Initiate Transfer</h2>
      </div>

      <div className="page-body">
        <div className="grid grid-2">
          <div className="card">
            <h3>New Transfer</h3>

            <div className="form-group">
              <label>From Entity</label>
              <select
                className="select"
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
                className="select"
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
                <label>Amount ({form.currency})</label>
                <input
                  className="input"
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => set("amount", Number(e.target.value))}
                  placeholder="50000"
                />
                {sender && form.amount > 0 && (
                  <div className="amount-limit-bar">
                    <div className="flex-between text-xs text-muted mb-4">
                      <span>Daily limit usage</span>
                      <span>
                        $
                        {(
                          sender.mandateLimits.dailyUsed + form.amount
                        ).toLocaleString()}{" "}
                        / $
                        {sender.mandateLimits.maxDailyAggregate.toLocaleString()}
                      </span>
                    </div>
                    <div className="amount-limit-bar-track">
                      <div
                        className={`amount-limit-bar-fill ${limitWarning}`}
                        style={{ width: `${Math.min(dailyUsage, 100)}%` }}
                      />
                    </div>
                    {limitWarning && (
                      <div className="amount-warning">
                        ⚠ Approaching or exceeding daily limit
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  className="select"
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
                className="input"
                value={form.memo}
                onChange={(e) => set("memo", e.target.value)}
                placeholder="e.g. Q1 operational funding"
              />
            </div>

            {form.fromEntityId && sender && (
              <div className="mono text-xs text-muted mb-12">
                <div className="flex-between mb-4">
                  <span>Single limit:</span>
                  <span>
                    ${sender.mandateLimits.maxSingleTransfer.toLocaleString()}
                  </span>
                </div>
                <div className="flex-between">
                  <span>Daily used:</span>
                  <span>
                    ${sender.mandateLimits.dailyUsed.toLocaleString()} / $
                    {sender.mandateLimits.maxDailyAggregate.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {form.fromEntityId && form.amount > 0 && (
              <div className="preflight-card">
                <div className="preflight-header">
                  <h4>6-Gate Preflight Check</h4>
                  <span
                    className={`badge ${
                      gates.every((g) => g.status !== "fail")
                        ? "verified"
                        : "suspended"
                    }`}
                  >
                    {gates.filter((g) => g.status === "pass").length}/
                    {gates.length} ready
                  </span>
                </div>
                {gates.map((gate, i) => (
                  <div key={i} className="preflight-gate">
                    <div className={`preflight-gate-status ${gate.status}`}>
                      {gate.status === "pass"
                        ? "✓"
                        : gate.status === "fail"
                        ? "✗"
                        : "?"}
                    </div>
                    <div>
                      <div className="text-sm">{gate.name}</div>
                      <div className="text-xs text-muted">
                        {gate.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn primary"
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
                : "Submit Transfer"}
            </button>
          </div>

          <div>
            {lastResult && (
              <div
                className={`card ${
                  lastResult.status === "blocked" ? "" : "highlight-card"
                }`}
              >
                <h3>
                  {lastResult.status === "completed"
                    ? "Transfer Approved"
                    : "Transfer Blocked"}
                </h3>

                <div
                  className={`mono text-sm mb-12 ${
                    lastResult.status === "completed"
                      ? "text-green"
                      : "text-red"
                  }`}
                >
                  {lastResult.fromEntityId} → {lastResult.toEntityId} | $
                  {lastResult.amount.toLocaleString()} {lastResult.currency}
                </div>

                {lastResult.blockReason && (
                  <div className="mono text-red text-sm mb-12">
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
                        {g.passed ? "✓" : "✗"}
                      </span>
                      <span className="flex-1">
                        Gate {i + 1}: {g.gate}
                      </span>
                      <span className="mono text-xs">{g.details}</span>
                    </li>
                  ))}
                </ul>

                {lastResult.transactionHash && (
                  <div className="mono text-xs mt-12 flex items-center gap-4">
                    <span className="text-muted">On-chain tx:</span>
                    <a
                      href={`${SOLANA_EXPLORER_URL}/tx/${lastResult.transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue"
                    >
                      {lastResult.transactionHash.slice(0, 20)}…
                      {lastResult.transactionHash.slice(-8)} ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <h3>Recent Transfers</h3>
              {transfers.length === 0 ? (
                <div className="empty-state-cta">
                  <div className="empty-icon">↗</div>
                  <p>
                    No transfers yet. Run a netting cycle or initiate your first
                    transfer.
                  </p>
                  <Link to="/netting/run" className="btn primary">
                    Run Netting Cycle
                  </Link>
                </div>
              ) : (
                <table className="table">
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
                        <td className="arrow">→</td>
                        <td className="mono">{t.toEntityId}</td>
                        <td className="text-right mono">
                          ${t.amount.toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${t.status}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="mono text-xs">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          {t.transactionHash ? (
                            <a
                              href={`${SOLANA_EXPLORER_URL}/tx/${t.transactionHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mono text-xs text-blue"
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
