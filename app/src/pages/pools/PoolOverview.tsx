/* ============================================================
   PAGE 7 — Pool Overview
   ============================================================ */

import React from "react";
import { useNexus } from "../../hooks/useNexus";
import { Link } from "react-router-dom";
import { JURISDICTION_FLAGS } from "../../types";

const PoolOverview: React.FC = () => {
  const { entities, pool, loans, nettingHistory, loading } = useNexus();

  if (loading) return <div className="loading-state">Loading pool data...</div>;
  if (!pool) return <div className="empty-state">No pool configured.</div>;

  const members = entities.filter((e) => pool.entityIds.includes(e.id));
  const surplus = members.filter((e) => e.balance > 0);
  const deficit = members.filter((e) => e.balance < 0);
  const totalSurplus = surplus.reduce((s, e) => s + e.balance, 0);
  const totalDeficit = deficit.reduce((s, e) => s + e.balance, 0);

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Pools / Pool Overview
        </div>
        <h2>
          {"{}"} Pool Overview: {pool.name}
        </h2>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">Pool Members</div>
            <div className="stat-value">{pool.memberCount}</div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Total Surplus</div>
            <div className="stat-value">${totalSurplus.toLocaleString()}</div>
          </div>
          <div className="stat-box red">
            <div className="stat-label">Total Deficit</div>
            <div className="stat-value">
              ${Math.abs(totalDeficit).toLocaleString()}
            </div>
          </div>
          <div className="stat-box blue">
            <div className="stat-label">Net Position</div>
            <div className="stat-value">
              ${pool.netPositionUsd.toLocaleString()}
            </div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Surplus Yield</div>
            <div className="stat-value yield-accent">
              {pool.interestRateApr}% APR
            </div>
            <div className="stat-sub">
              on ${totalSurplus.toLocaleString()} surplus
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="sketch-card">
            <h3>Pool Configuration</h3>
            <table className="sketch-table">
              <tbody>
                <tr>
                  <td>Pool ID</td>
                  <td className="mono">{pool.id}</td>
                </tr>
                <tr>
                  <td>Admin</td>
                  <td className="mono">{pool.admin}</td>
                </tr>
                <tr>
                  <td>Interest Rate</td>
                  <td>{pool.interestRateApr}% APR</td>
                </tr>
                <tr>
                  <td>Netting Frequency</td>
                  <td>{pool.nettingFrequency}</td>
                </tr>
                <tr>
                  <td>Sweep Threshold</td>
                  <td className="mono">
                    ${pool.sweepThreshold.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td>Last Netting</td>
                  <td className="mono">
                    {new Date(pool.lastNettingTimestamp).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td>Active Loans</td>
                  <td>{pool.activeLoans}</td>
                </tr>
                <tr>
                  <td>Today's Offsets</td>
                  <td className="mono">
                    ${pool.totalOffsetsToday.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sketch-card">
            <h3>Pool Members</h3>
            <table className="sketch-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Entity</th>
                  <th>Currency</th>
                  <th>KYC</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {members.map((e) => (
                  <tr key={e.id}>
                    <td>{JURISDICTION_FLAGS[e.jurisdiction] || ""}</td>
                    <td>
                      {e.legalName}
                      <span className="mono text-muted"> ({e.id})</span>
                    </td>
                    <td className="mono">{e.currency}</td>
                    <td>
                      <span className={`badge ${e.kycStatus}`}>
                        {e.kycStatus}
                      </span>
                    </td>
                    <td
                      className={`text-right mono ${
                        e.balance >= 0 ? "text-green" : "text-red"
                      }`}
                    >
                      ${e.balance.toLocaleString()}
                      {e.balance > 0 && (
                        <span className="yield-pill">
                          +{pool.interestRateApr}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Non-pool entities */}
            {entities.filter((e) => !pool.entityIds.includes(e.id)).length >
              0 && (
              <>
                <h4 style={{ marginTop: 16 }}>Not in Pool</h4>
                {entities
                  .filter((e) => !pool.entityIds.includes(e.id))
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex-between"
                      style={{ padding: "4px 0" }}
                    >
                      <span>
                        {JURISDICTION_FLAGS[e.jurisdiction]} {e.legalName}{" "}
                        <span className="mono text-muted">({e.id})</span>
                      </span>
                      <span className={`badge ${e.kycStatus}`}>
                        {e.kycStatus}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-16" style={{ marginTop: 8 }}>
          <Link to="/netting" className="sketch-btn primary">
            [&lt;&gt;] Run Netting Cycle
          </Link>
          <Link to="/netting/history" className="sketch-btn">
            [H] View Cycle History
          </Link>
        </div>
      </div>
    </>
  );
};

export default PoolOverview;
