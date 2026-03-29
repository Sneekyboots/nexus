/* ============================================================
   PAGE 3 — All Entities
   ============================================================ */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNexus } from "../../hooks/useNexus";
import { JURISDICTION_FLAGS, JURISDICTION_LABELS } from "../../types";

const AllEntities: React.FC = () => {
  const { role } = useAuth();
  const { entities, loading } = useNexus();

  if (loading) return <div className="loading-state">Loading entities...</div>;

  const canRegister = role === "amina_admin" || role === "corporate_treasury";

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Entities / All Entities
        </div>
        <div className="flex-between">
          <h2>All Entities</h2>
          {canRegister && (
            <Link to="/entities/register" className="btn primary">
              Register New Entity
            </Link>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">Total Entities</div>
            <div className="stat-value">{entities.length}</div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">KYC Verified</div>
            <div className="stat-value">
              {entities.filter((e) => e.kycStatus === "verified").length}
            </div>
          </div>
          <div className="stat-box orange">
            <div className="stat-label">Pending</div>
            <div className="stat-value">
              {entities.filter((e) => e.kycStatus === "pending").length}
            </div>
          </div>
          <div className="stat-box red">
            <div className="stat-label">Suspended</div>
            <div className="stat-value">
              {entities.filter((e) => e.kycStatus === "suspended").length}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Entity Registry</h3>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Legal Name</th>
                <th>Jurisdiction</th>
                <th>KYC Status</th>
                <th>Currency</th>
                <th>Pool</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Daily Used / Limit</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id}>
                  <td>{JURISDICTION_FLAGS[e.jurisdiction] || ""}</td>
                  <td className="mono">{e.id}</td>
                  <td>{e.legalName}</td>
                  <td className="mono">
                    {e.jurisdiction}
                    <span className="text-muted text-xs">
                      {" "}
                      {JURISDICTION_LABELS[e.jurisdiction]
                        ? `(${
                            JURISDICTION_LABELS[e.jurisdiction].split("(")[1]
                          }`
                        : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${e.kycStatus}`}>
                      {e.kycStatus}
                    </span>
                  </td>
                  <td className="mono">{e.currency}</td>
                  <td className="mono">{e.poolId || "—"}</td>
                  <td
                    className={`text-right mono ${
                      e.balance >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    ${e.balance.toLocaleString()}
                  </td>
                  <td className="text-right mono">
                    ${e.mandateLimits.dailyUsed.toLocaleString()} / $
                    {e.mandateLimits.maxDailyAggregate.toLocaleString()}
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

export default AllEntities;
