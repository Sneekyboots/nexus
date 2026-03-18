/* ============================================================
   PAGE 6 — Mandate Controls
   View & update per-entity transfer limits
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNexus } from "../../hooks/useNexus";

const MandateControls: React.FC = () => {
  const { role } = useAuth();
  const { entities, updateMandateLimits, loading } = useNexus();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    maxSingleTransfer: 0,
    maxDailyAggregate: 0,
  });
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="loading-state">Loading mandates...</div>;

  const canEdit = role === "amina_admin" || role === "corporate_treasury";

  const startEdit = (entityId: string) => {
    const e = entities.find((x) => x.id === entityId);
    if (!e) return;
    setEditing(entityId);
    setEditValues({
      maxSingleTransfer: e.mandateLimits.maxSingleTransfer,
      maxDailyAggregate: e.mandateLimits.maxDailyAggregate,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError(null);
    try {
      await updateMandateLimits(editing, editValues);
      setEditing(null);
    } catch (err) {
      setError(`Failed to update limits: ${String(err)}`);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / <Link to="/entities">Entities</Link> /
          Mandate Controls
        </div>
        <h2>[!] Mandate Controls</h2>
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
        <div className="sketch-card" style={{ marginBottom: 20 }}>
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            Mandate limits are enforced on-chain by the Compliance Hook program.
            Gate 5 checks daily aggregate limits. Gate 6 checks single transfer
            limits. Limits reset daily at 00:00 UTC.
          </div>
        </div>

        <div className="sketch-card">
          <h3>Entity Mandate Limits</h3>
          <table className="sketch-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>ID</th>
                <th className="text-right">Max Single Transfer</th>
                <th className="text-right">Max Daily Aggregate</th>
                <th className="text-right">Daily Used</th>
                <th className="text-right">% Used</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => {
                const pct =
                  e.mandateLimits.maxDailyAggregate > 0
                    ? Math.round(
                        (e.mandateLimits.dailyUsed /
                          e.mandateLimits.maxDailyAggregate) *
                          100
                      )
                    : 0;
                const isEditing = editing === e.id;
                return (
                  <tr key={e.id}>
                    <td>{e.legalName}</td>
                    <td className="mono">{e.id}</td>
                    <td className="text-right mono">
                      {isEditing ? (
                        <input
                          className="sketch-input"
                          type="number"
                          value={editValues.maxSingleTransfer}
                          onChange={(ev) =>
                            setEditValues((v) => ({
                              ...v,
                              maxSingleTransfer: Number(ev.target.value),
                            }))
                          }
                          style={{ width: 120, textAlign: "right" }}
                        />
                      ) : (
                        `$${e.mandateLimits.maxSingleTransfer.toLocaleString()}`
                      )}
                    </td>
                    <td className="text-right mono">
                      {isEditing ? (
                        <input
                          className="sketch-input"
                          type="number"
                          value={editValues.maxDailyAggregate}
                          onChange={(ev) =>
                            setEditValues((v) => ({
                              ...v,
                              maxDailyAggregate: Number(ev.target.value),
                            }))
                          }
                          style={{ width: 120, textAlign: "right" }}
                        />
                      ) : (
                        `$${e.mandateLimits.maxDailyAggregate.toLocaleString()}`
                      )}
                    </td>
                    <td className="text-right mono">
                      ${e.mandateLimits.dailyUsed.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <span
                        className={
                          pct > 80
                            ? "text-red"
                            : pct > 50
                            ? "text-orange"
                            : "text-green"
                        }
                      >
                        {pct}%
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        {isEditing ? (
                          <div className="flex gap-8">
                            <button
                              className="sketch-btn small"
                              onClick={saveEdit}
                            >
                              [x] Save
                            </button>
                            <button
                              className="sketch-btn small"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="sketch-btn small"
                            onClick={() => startEdit(e.id)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MandateControls;
