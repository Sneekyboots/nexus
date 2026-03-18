/* ============================================================
   PAGE 9 — Cycle History
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import type { NettingCycle } from "../../types";

const CycleHistory: React.FC = () => {
  const { nettingHistory, loading } = useNexus();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <div className="loading-state">Loading history...</div>;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Netting / Cycle History
        </div>
        <h2>[H] Cycle History</h2>
      </div>

      <div className="page-body">
        {nettingHistory.length === 0 ? (
          <div className="empty-state">
            No netting cycles have been run yet. Go to Run Cycle to start one.
          </div>
        ) : (
          nettingHistory.map((cycle) => (
            <div className="sketch-card" key={cycle.id}>
              <div className="flex-between">
                <h3
                  style={{
                    borderBottom: "none",
                    paddingBottom: 0,
                    marginBottom: 0,
                  }}
                >
                  {cycle.id}
                </h3>
                <span className="badge completed">completed</span>
              </div>
              <div
                className="mono text-muted"
                style={{ fontSize: 12, marginBottom: 12 }}
              >
                {new Date(cycle.timestamp).toLocaleString()} | Pool:{" "}
                {cycle.poolId} | Duration: {cycle.durationMs}ms
              </div>

              <div className="stat-row">
                <div
                  className="stat-box"
                  style={{ padding: "8px 12px", minWidth: "auto" }}
                >
                  <div className="stat-label">Entities</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    {cycle.entityCount}
                  </div>
                </div>
                <div
                  className="stat-box"
                  style={{ padding: "8px 12px", minWidth: "auto" }}
                >
                  <div className="stat-label">Offsets</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    {cycle.offsetCount}
                  </div>
                </div>
                <div
                  className="stat-box green"
                  style={{ padding: "8px 12px", minWidth: "auto" }}
                >
                  <div className="stat-label">Total Offset</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    ${cycle.totalOffsetUsd.toLocaleString()}
                  </div>
                </div>
                <div
                  className="stat-box blue"
                  style={{ padding: "8px 12px", minWidth: "auto" }}
                >
                  <div className="stat-label">Interest</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    ${cycle.interestAccrued.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                className="sketch-btn small"
                onClick={() =>
                  setExpanded(expanded === cycle.id ? null : cycle.id)
                }
              >
                {expanded === cycle.id ? "Hide Details" : "Show Details"}
              </button>

              {expanded === cycle.id && (
                <div style={{ marginTop: 16 }}>
                  <h4>7-Step Execution</h4>
                  <ol className="step-list">
                    {cycle.steps.map((s) => (
                      <li key={s.step} className={`step-item ${s.status}`}>
                        <div className="step-number">
                          {s.status === "completed" ? "x" : s.step}
                        </div>
                        <div className="step-body">
                          <div className="step-name">{s.name}</div>
                          <div className="step-details">
                            {s.details.map((d, i) => (
                              <div key={i}>{d}</div>
                            ))}
                          </div>
                          {s.durationMs && (
                            <div
                              className="mono"
                              style={{
                                fontSize: 10,
                                color: "var(--accent-green)",
                              }}
                            >
                              {s.durationMs}ms
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {cycle.offsets.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 16 }}>Offset Matches</h4>
                      <table className="sketch-table">
                        <thead>
                          <tr>
                            <th>Surplus</th>
                            <th></th>
                            <th>Deficit</th>
                            <th className="text-right">Net (USD)</th>
                            <th>FX Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycle.offsets.map((o) => (
                            <tr key={o.id}>
                              <td className="mono text-green">
                                {o.surplusEntity} ({o.surplusCurrency})
                              </td>
                              <td className="arrow">---&gt;</td>
                              <td className="mono text-red">
                                {o.deficitEntity} ({o.deficitCurrency})
                              </td>
                              <td className="text-right mono">
                                ${o.netOffsetUsd.toLocaleString()}
                              </td>
                              <td className="mono">
                                {o.fxRateUsed?.toFixed(4) || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  <div
                    className="mono text-muted"
                    style={{ fontSize: 11, marginTop: 12 }}
                  >
                    Tx: {cycle.transactionHash}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default CycleHistory;
