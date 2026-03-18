/* ============================================================
   PAGE 14 — Active Loans
   ============================================================ */

import React from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";

const ActiveLoans: React.FC = () => {
  const { loans, entities, loading } = useNexus();

  if (loading) return <div className="loading-state">Loading loans...</div>;

  const getName = (id: string) => {
    const e = entities.find((x) => x.id === id);
    return e ? e.legalName : id;
  };

  const totalOutstanding = loans
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + l.outstandingBalance, 0);
  const totalInterest = loans
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + l.interestAccrued, 0);

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Loans / Active Loans
        </div>
        <h2>[%] Active Loans</h2>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">Total Loans</div>
            <div className="stat-value">{loans.length}</div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Active</div>
            <div className="stat-value">
              {loans.filter((l) => l.status === "active").length}
            </div>
          </div>
          <div className="stat-box blue">
            <div className="stat-label">Outstanding Balance</div>
            <div className="stat-value">
              ${totalOutstanding.toLocaleString()}
            </div>
          </div>
          <div className="stat-box orange">
            <div className="stat-label">Accrued Interest</div>
            <div className="stat-value">${totalInterest.toFixed(2)}</div>
          </div>
        </div>

        <div className="sketch-card">
          <h3>Intercompany Loans (90-day, 1.5% APR)</h3>
          <table className="sketch-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Lender</th>
                <th></th>
                <th>Borrower</th>
                <th className="text-right">Principal</th>
                <th>Rate</th>
                <th>Term</th>
                <th className="text-right">Days Out</th>
                <th className="text-right">Interest</th>
                <th className="text-right">Total Due</th>
                <th>Maturity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.id}</td>
                  <td>
                    {getName(l.lenderEntityId)}
                    <div className="mono text-muted" style={{ fontSize: 10 }}>
                      {l.lenderEntityId}
                    </div>
                  </td>
                  <td className="arrow">---&gt;</td>
                  <td>
                    {getName(l.borrowerEntityId)}
                    <div className="mono text-muted" style={{ fontSize: 10 }}>
                      {l.borrowerEntityId}
                    </div>
                  </td>
                  <td className="text-right mono">
                    ${l.principal.toLocaleString()} {l.currency}
                  </td>
                  <td className="mono">{l.interestRateApr}%</td>
                  <td className="mono">{l.termDays}d</td>
                  <td className="text-right mono">{l.daysOutstanding}</td>
                  <td className="text-right mono text-orange">
                    ${l.interestAccrued.toFixed(2)}
                  </td>
                  <td className="text-right mono">
                    ${l.totalDue.toLocaleString()}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {new Date(l.maturityDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sketch-card dashed">
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            Intercompany loans are created automatically by the Sweep Trigger
            program (Layer 5) when netting cycles identify net deficit
            positions. All loans carry standard terms: 90-day maturity, 1.5%
            APR, with interest calculated daily. AMINA Bank acts as the
            intermediary and record-keeper.
          </div>
          {loans[0]?.aminaRef && (
            <div className="mono" style={{ fontSize: 11, marginTop: 8 }}>
              AMINA Reference: {loans[0].aminaRef}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActiveLoans;
