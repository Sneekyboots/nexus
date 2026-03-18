/* ============================================================
   PAGE 15 — Audit Export / Reports
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNexus } from "../../hooks/useNexus";

const AuditExport: React.FC = () => {
  const { role } = useAuth();
  const {
    entities,
    pool,
    loans,
    complianceEvents,
    nettingHistory,
    transfers,
    fxRates,
    layerStatus,
  } = useNexus();
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: role,
      summary: {
        totalEntities: entities.length,
        verifiedEntities: entities.filter((e) => e.kycStatus === "verified")
          .length,
        suspendedEntities: entities.filter((e) => e.kycStatus === "suspended")
          .length,
        poolNetPosition: pool?.netPositionUsd || 0,
        activeLoans: loans.filter((l) => l.status === "active").length,
        totalOutstanding: loans
          .filter((l) => l.status === "active")
          .reduce((s, l) => s + l.outstandingBalance, 0),
        totalInterestAccrued: loans.reduce((s, l) => s + l.interestAccrued, 0),
        nettingCyclesRun: nettingHistory.length,
        totalOffsetValue: nettingHistory.reduce(
          (s, c) => s + c.totalOffsetUsd,
          0
        ),
        totalTransfers: transfers.length,
        blockedTransfers: transfers.filter((t) => t.status === "blocked")
          .length,
        complianceEvents: complianceEvents.length,
      },
      entities,
      pool,
      loans,
      nettingHistory,
      transfers,
      complianceEvents,
      fxRates,
      layerStatus,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-audit-report-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Reports / Audit Export
        </div>
        <h2>[=] Audit Export</h2>
      </div>

      <div className="page-body">
        <div className="sketch-card" style={{ maxWidth: 700 }}>
          <h3>Report Summary</h3>
          <table className="sketch-table">
            <tbody>
              <tr>
                <td>Total Entities</td>
                <td className="mono">{entities.length}</td>
              </tr>
              <tr>
                <td>Verified / Pending / Suspended</td>
                <td className="mono">
                  <span className="text-green">
                    {entities.filter((e) => e.kycStatus === "verified").length}
                  </span>{" "}
                  /{" "}
                  <span className="text-orange">
                    {entities.filter((e) => e.kycStatus === "pending").length}
                  </span>{" "}
                  /{" "}
                  <span className="text-red">
                    {entities.filter((e) => e.kycStatus === "suspended").length}
                  </span>
                </td>
              </tr>
              <tr>
                <td>Pool Net Position</td>
                <td className="mono">
                  ${pool?.netPositionUsd.toLocaleString() || "0"}
                </td>
              </tr>
              <tr>
                <td>Active Loans</td>
                <td className="mono">
                  {loans.filter((l) => l.status === "active").length}
                </td>
              </tr>
              <tr>
                <td>Outstanding Balance</td>
                <td className="mono">
                  $
                  {loans
                    .filter((l) => l.status === "active")
                    .reduce((s, l) => s + l.outstandingBalance, 0)
                    .toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Total Interest Accrued</td>
                <td className="mono">
                  ${loans.reduce((s, l) => s + l.interestAccrued, 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>Netting Cycles Run</td>
                <td className="mono">{nettingHistory.length}</td>
              </tr>
              <tr>
                <td>Total Offset Value</td>
                <td className="mono text-green">
                  $
                  {nettingHistory
                    .reduce((s, c) => s + c.totalOffsetUsd, 0)
                    .toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Total Transfers</td>
                <td className="mono">{transfers.length}</td>
              </tr>
              <tr>
                <td>Blocked Transfers</td>
                <td className="mono text-red">
                  {transfers.filter((t) => t.status === "blocked").length}
                </td>
              </tr>
              <tr>
                <td>Compliance Events</td>
                <td className="mono">{complianceEvents.length}</td>
              </tr>
              <tr>
                <td>FX Rates Tracked</td>
                <td className="mono">{fxRates.length} pairs</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <button className="sketch-btn primary" onClick={handleExport}>
              {exported
                ? "[x] Downloaded!"
                : "[=] Export Full Audit Report (JSON)"}
            </button>
          </div>

          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 16,
            }}
          >
            The exported report includes all entities, pool state, loans,
            netting history, transfers, compliance events, FX rates, and program
            deployment status. Suitable for regulatory review by FINMA / MiCA /
            ADGM authorities.
          </div>
        </div>

        {/* Program deployment info for auditors */}
        <div className="sketch-card" style={{ maxWidth: 700 }}>
          <h3>Program Deployment (Solana Devnet)</h3>
          <table className="sketch-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Program</th>
                <th>Program ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {layerStatus.map((l) => (
                <tr key={l.layer}>
                  <td className="mono">L{l.layer}</td>
                  <td>{l.name}</td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {l.programId}
                  </td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AuditExport;
