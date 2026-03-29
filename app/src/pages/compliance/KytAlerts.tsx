/* ============================================================
   PAGE 12 — KYT Alerts
   ============================================================ */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNexus } from "../../hooks/useNexus";

const KytAlerts: React.FC = () => {
  const { role } = useAuth();
  const { kytAlerts, updateKytAlertStatus, loading } = useNexus();

  if (loading) return <div className="loading-state">Loading alerts...</div>;

  const canAction = role === "amina_admin" || role === "compliance_officer";

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Compliance / KYT Alerts
        </div>
        <h2>KYT Alerts</h2>
        <div className="kyt-provider-badge">
          <span className="kyt-provider-dot" />
          KYT powered by <strong>Chainalysis</strong> · every transaction
          screened
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box orange">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">
              {kytAlerts.filter((a) => a.status === "pending_review").length}
            </div>
          </div>
          <div className="stat-box red">
            <div className="stat-label">Escalated</div>
            <div className="stat-value">
              {kytAlerts.filter((a) => a.status === "escalated").length}
            </div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Approved</div>
            <div className="stat-value">
              {kytAlerts.filter((a) => a.status === "approved").length}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Dismissed</div>
            <div className="stat-value">
              {kytAlerts.filter((a) => a.status === "dismissed").length}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Active Alerts</h3>
          {kytAlerts.length === 0 ? (
            <div className="empty-state">No KYT alerts.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Entity</th>
                  <th>Issue</th>
                  <th>Detail</th>
                  <th>Value / Threshold</th>
                  <th>Status</th>
                  {canAction && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {kytAlerts.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.id}</td>
                    <td>
                      {a.entityName}
                      <span className="mono text-muted"> ({a.entityId})</span>
                    </td>
                    <td>
                      <strong>{a.issue}</strong>
                    </td>
                    <td className="text-sm" style={{ maxWidth: 250 }}>
                      {a.detail}
                    </td>
                    <td className="mono">
                      <span className="text-red">
                        {typeof a.currentValue === "number" &&
                        a.currentValue > 1000
                          ? `$${a.currentValue.toLocaleString()}`
                          : a.currentValue}
                      </span>{" "}
                      /{" "}
                      <span className="text-muted">
                        {typeof a.threshold === "number" && a.threshold > 1000
                          ? `$${a.threshold.toLocaleString()}`
                          : a.threshold}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                    </td>
                    {canAction && (
                      <td>
                        <div className="flex gap-8">
                          {a.status === "pending_review" && (
                            <>
                              <button
                                className="btn small"
                                onClick={() =>
                                  updateKytAlertStatus(a.id, "approved")
                                }
                              >
                                Approve
                              </button>
                              <button
                                className="btn small danger"
                                onClick={() =>
                                  updateKytAlertStatus(a.id, "escalated")
                                }
                              >
                                Escalate
                              </button>
                            </>
                          )}
                          {a.status === "escalated" && (
                            <button
                              className="btn small"
                              onClick={() =>
                                updateKytAlertStatus(a.id, "dismissed")
                              }
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default KytAlerts;
