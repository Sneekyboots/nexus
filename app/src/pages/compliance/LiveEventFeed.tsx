/* ============================================================
   PAGE 11 — Live Compliance Event Feed
   ============================================================ */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import type { ComplianceEventType } from "../../types";

const FILTERS: { label: string; value: ComplianceEventType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Blocked", value: "blocked" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const LiveEventFeed: React.FC = () => {
  const { complianceEvents, loading } = useNexus();
  const [filter, setFilter] = useState<ComplianceEventType | "all">("all");

  if (loading) return <div className="loading-state">Loading events...</div>;

  const filtered =
    filter === "all"
      ? complianceEvents
      : complianceEvents.filter((e) => e.type === filter);

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Compliance / Live Event Feed
        </div>
        <h2>() Live Compliance Feed</h2>
        <div className="kyt-provider-badge">
          <span className="kyt-provider-dot" />
          L3 Compliance Hook · KYT via <strong>Chainalysis</strong> · 6-gate
          enforcement
        </div>
      </div>

      <div className="page-body">
        <div className="flex gap-8 mb-16">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sketch-btn small ${
                filter === f.value ? "primary" : ""
              }`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}{" "}
              {f.value !== "all" && (
                <span className="mono">
                  ({complianceEvents.filter((e) => e.type === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="sketch-card">
          <h3>Events ({filtered.length})</h3>

          {filtered.length === 0 ? (
            <div className="empty-state">No events matching filter.</div>
          ) : (
            filtered.map((evt) => (
              <div className="event-item" key={evt.id}>
                <div className={`event-dot ${evt.type}`} />
                <div className="event-body">
                  <div className="flex-between">
                    <div className="event-title">{evt.title}</div>
                    <span className={`badge ${evt.type}`}>{evt.type}</span>
                  </div>
                  <div className="event-detail">{evt.detail}</div>

                  {/* Show gate results if present */}
                  {evt.gateResults && evt.gateResults.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <ul className="gate-list">
                        {evt.gateResults.map((g, i) => (
                          <li key={i} className="gate-item">
                            <span
                              className={`gate-check ${
                                g.passed ? "pass" : "fail"
                              }`}
                            >
                              {g.passed ? "[x]" : "[ ]"}
                            </span>
                            {g.gate}
                            <span
                              className="mono text-muted"
                              style={{ fontSize: 11, marginLeft: "auto" }}
                            >
                              {g.details}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="event-time">
                    {new Date(evt.timestamp).toLocaleString()}
                    {evt.entityId && (
                      <span className="mono"> | Entity: {evt.entityId}</span>
                    )}
                    {evt.certPda && (
                      <span className="mono text-blue">
                        {" "}
                        | Cert: {evt.certPda}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default LiveEventFeed;
