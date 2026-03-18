/* ============================================================
   PAGE 5 — KYC Management
   Verify / suspend entities, view KYC details
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNexus } from "../../hooks/useNexus";
import { JURISDICTION_FLAGS } from "../../types";

const KycManagement: React.FC = () => {
  const { role } = useAuth();
  const { entities, verifyEntityKyc, suspendEntity, loading } = useNexus();
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="loading-state">Loading KYC data...</div>;

  const canManage = role === "amina_admin" || role === "compliance_officer";

  const handleVerify = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await verifyEntityKyc(id);
    } catch (err) {
      setError(`Failed to verify ${id}: ${String(err)}`);
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await suspendEntity(id, "Manual suspension by compliance officer");
    } catch (err) {
      setError(`Failed to suspend ${id}: ${String(err)}`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / <Link to="/entities">Entities</Link> / KYC
          Management
        </div>
        <h2>[?] KYC Management</h2>
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
        <div className="stat-row">
          <div className="stat-box green">
            <div className="stat-label">Verified</div>
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
          <div className="stat-box">
            <div className="stat-label">Revoked</div>
            <div className="stat-value">
              {entities.filter((e) => e.kycStatus === "revoked").length}
            </div>
          </div>
        </div>

        <div className="sketch-card">
          <h3>Entity KYC Status</h3>
          <table className="sketch-table">
            <thead>
              <tr>
                <th></th>
                <th>Entity</th>
                <th>ID</th>
                <th>Jurisdiction</th>
                <th>KYC Status</th>
                <th>Provider</th>
                <th>Verified Date</th>
                <th>Expiry</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id}>
                  <td>{JURISDICTION_FLAGS[e.jurisdiction] || ""}</td>
                  <td>{e.legalName}</td>
                  <td className="mono">{e.id}</td>
                  <td className="mono">{e.jurisdiction}</td>
                  <td>
                    <span className={`badge ${e.kycStatus}`}>
                      {e.kycStatus}
                    </span>
                  </td>
                  <td>{e.kycProvider || "—"}</td>
                  <td className="mono">
                    {e.kycVerifiedDate
                      ? new Date(e.kycVerifiedDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="mono">
                    {e.kycExpiry
                      ? new Date(e.kycExpiry).toLocaleDateString()
                      : "—"}
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-8">
                        {(e.kycStatus === "pending" ||
                          e.kycStatus === "suspended") && (
                          <button
                            className="sketch-btn small"
                            disabled={actionId === e.id}
                            onClick={() => handleVerify(e.id)}
                          >
                            {actionId === e.id ? "..." : "[x] Verify"}
                          </button>
                        )}
                        {e.kycStatus === "verified" && (
                          <button
                            className="sketch-btn small danger"
                            disabled={actionId === e.id}
                            onClick={() => handleSuspend(e.id)}
                          >
                            {actionId === e.id ? "..." : "[!] Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Suspended entity details */}
        {entities.filter((e) => e.suspendedReason).length > 0 && (
          <div
            className="sketch-card"
            style={{ borderColor: "var(--accent-red)" }}
          >
            <h3 className="text-red">Suspended Entity Details</h3>
            {entities
              .filter((e) => e.suspendedReason)
              .map((e) => (
                <div key={e.id} className="event-item">
                  <div className="event-dot blocked" />
                  <div className="event-body">
                    <div className="event-title">
                      {e.legalName} ({e.id})
                    </div>
                    <div className="event-detail">
                      Reason: {e.suspendedReason}
                    </div>
                    <div className="event-time">
                      Suspended:{" "}
                      {e.suspendedAt
                        ? new Date(e.suspendedAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
};

export default KycManagement;
