/* ============================================================
   PAGE 2 — Home / Dashboard
   Four completely different role-specific dashboards.
   Each has its own stats, framing, and step-by-step action guide.
   ============================================================ */

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNexus } from "../hooks/useNexus";
import { Link, useNavigate } from "react-router-dom";
import { SOLANA_EXPLORER_URL, SOLANA_RPC_URL } from "../constants";
import { JURISDICTION_FLAGS } from "../types";
import type { UserRole } from "../types";

const LoadingSkeleton: React.FC = () => (
  <div className="card">
    <div className="skeleton skeleton-text short" />
    <div className="skeleton skeleton-text medium" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-box mt-12" />
  </div>
);

// ---------------------------------------------------------------------------
// Live On-Chain Transaction Feed
// Fetches recent confirmed signatures for the pooling-engine program
// directly from devnet RPC — no API key, fully public.
// ---------------------------------------------------------------------------

const POOLING_ENGINE_ID = "CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk";

interface SigEntry {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: unknown;
}

const OnChainTxFeed: React.FC = () => {
  const [sigs, setSigs] = useState<SigEntry[]>([]);
  const [fetching, setFetching] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchSigs = async () => {
    setFetching(true);
    try {
      const res = await fetch(SOLANA_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [POOLING_ENGINE_ID, { limit: 8, commitment: "confirmed" }],
        }),
      });
      const json = await res.json();
      if (json.result) {
        setSigs(json.result);
        setLastFetched(new Date());
      }
    } catch {
      // silently fail — devnet can be flaky
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSigs();
    const interval = setInterval(fetchSigs, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="flex-between mb-12">
        <h3 className="mt-0 mb-0">Live On-Chain Transactions</h3>
        <div className="flex items-center gap-4">
          {lastFetched && (
            <span className="mono text-xs text-muted">
              updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button className="btn small" onClick={fetchSigs} disabled={fetching}>
            {fetching ? "…" : "Refresh"}
          </button>
        </div>
      </div>
      <div className="mono text-xs text-muted mb-8">
        Pooling Engine · {POOLING_ENGINE_ID.slice(0, 8)}… · Solana Devnet ·
        auto-refreshes every 15s
      </div>
      {sigs.length === 0 ? (
        <div className="empty-state-cta">
          <div className="empty-icon">📡</div>
          <p>
            {fetching
              ? "Fetching from devnet…"
              : "No transactions found on devnet yet."}
          </p>
          {!fetching && (
            <div className="flex gap-8 justify-center">
              <Link to="/netting/run" className="btn primary">
                Run Netting Cycle
              </Link>
              <Link to="/transfers" className="btn">
                Initiate Transfer
              </Link>
            </div>
          )}
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Signature</th>
              <th>Slot</th>
              <th>Time</th>
              <th>Status</th>
              <th>Verify</th>
            </tr>
          </thead>
          <tbody>
            {sigs.map((s, i) => (
              <tr key={s.signature}>
                <td className="mono text-muted text-xs">{i + 1}</td>
                <td className="mono text-xs">
                  {s.signature.slice(0, 16)}…{s.signature.slice(-8)}
                </td>
                <td className="mono text-xs">{s.slot.toLocaleString()}</td>
                <td className="mono text-xs">
                  {s.blockTime
                    ? new Date(s.blockTime * 1000).toLocaleTimeString()
                    : "—"}
                </td>
                <td>
                  <span className={`badge ${s.err ? "blocked" : "live"}`}>
                    {s.err ? "failed" : "ok"}
                  </span>
                </td>
                <td>
                  <a
                    href={`${SOLANA_EXPLORER_URL}/tx/${s.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue text-xs"
                  >
                    ↗ Explorer
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

interface GuideStep {
  num: number;
  label: string;
  desc: string;
  to: string;
  cta: string;
  done?: boolean;
}

const ActionGuide: React.FC<{ steps: GuideStep[]; title: string }> = ({
  steps,
  title,
}) => {
  const [expanded, setExpanded] = useState<number | null>(0);
  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="card guide-card">
      <div className="guide-header">
        <h3>{title}</h3>
        <div className="guide-progress-badge">
          {completedSteps}/{steps.length} completed
        </div>
      </div>

      <div className="guide-progress-container">
        <div className="guide-progress-bar">
          <div
            className="guide-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="guide-progress-label">
          {progressPercent === 100
            ? "🎉 All steps completed!"
            : `${Math.round(progressPercent)}% complete`}
        </div>
      </div>

      <div className="guide-steps">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`guide-step${expanded === s.num - 1 ? " open" : ""}${
              s.done ? " done" : ""
            }`}
            onClick={() =>
              setExpanded(expanded === s.num - 1 ? null : s.num - 1)
            }
          >
            <div className="guide-step-header">
              <span className="guide-step-num mono">
                {s.done ? "✓" : s.num}
              </span>
              <span className="guide-step-label">{s.label}</span>
              <span className="guide-step-status">
                {s.done ? (
                  <span className="badge done">completed</span>
                ) : (
                  <span className="badge pending">pending</span>
                )}
              </span>
              <span className="guide-step-arrow mono">
                {expanded === s.num - 1 ? "▼" : "▶"}
              </span>
            </div>
            {expanded === s.num - 1 && (
              <div className="guide-step-body">
                <p className="guide-step-desc">{s.desc}</p>
                <Link to={s.to} className="btn primary guide-step-btn">
                  {s.cta} →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AMINA Bank Admin dashboard
// ---------------------------------------------------------------------------

const AminaAdminDashboard: React.FC = () => {
  const {
    entities,
    pool,
    loans,
    complianceEvents,
    kytAlerts,
    nettingHistory,
    layerStatus,
    fxRates,
    loading,
  } = useNexus();

  if (loading)
    return (
      <div className="page-body">
        <div className="stat-row">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );

  const verified = entities.filter((e) => e.kycStatus === "verified").length;
  const pending = entities.filter((e) => e.kycStatus === "pending").length;
  const suspended = entities.filter((e) => e.kycStatus === "suspended").length;
  const activeLoans = loans.filter((l) => l.status === "active");
  const blockedEvents = complianceEvents.filter(
    (e) => e.type === "blocked"
  ).length;
  const pendingKyt = kytAlerts.filter(
    (a) => a.status === "pending_review"
  ).length;

  const guideSteps: GuideStep[] = [
    {
      num: 1,
      label: "Register client entities",
      desc: "Onboard a new corporate client. Fill in legal name, jurisdiction (FINMA, MiCA, FCA…), stablecoin, and mandate limits. This writes a PDA to the L1 Entity Registry on-chain.",
      to: "/entities/register",
      cta: "Open Register Entity",
      done: entities.length > 0,
    },
    {
      num: 2,
      label: "Approve KYC submissions",
      desc: `${pending} entities are waiting for KYC approval. Verify documents, set expiry date, and approve. Entities cannot transact until KYC status is 'verified'.`,
      to: "/entities/kyc",
      cta: "Open KYC Management",
      done: pending === 0 && entities.length > 0,
    },
    {
      num: 3,
      label: "Review pool composition",
      desc: "Check net USD position, surplus/deficit split, and sweep threshold before triggering a netting cycle. All verified entities should be pool members.",
      to: "/pools",
      cta: "Open Pool Overview",
      done: (pool?.memberCount ?? 0) >= 2,
    },
    {
      num: 4,
      label: "Run a netting cycle",
      desc: "Trigger the 7-step on-chain netting algorithm. It snapshots positions, normalises FX via SIX rates, matches surpluses against deficits, accrues interest, and finalises the audit trail.",
      to: "/netting",
      cta: "Run Netting Cycle",
      done: nettingHistory.length > 0,
    },
    {
      num: 5,
      label: "Review KYT alerts",
      desc: `${pendingKyt} transaction alert${
        pendingKyt !== 1 ? "s" : ""
      } pending review via Chainalysis. Approve, escalate, or dismiss each one before exporting the audit report.`,
      to: "/compliance/kyt",
      cta: "Open KYT Alerts",
      done: pendingKyt === 0 && entities.length > 0,
    },
    {
      num: 6,
      label: "Export audit report",
      desc: "Generate a signed JSON/PDF audit export for regulators. Includes all compliance gate results, netting cycle history, and on-chain cert PDAs.",
      to: "/reports",
      cta: "Export Report",
      done: false,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">NEXUS / Dashboard</div>
        <h2>Platform Overview — AMINA Bank Admin</h2>
        <p className="page-subtitle">
          Full oversight of all client entities, pools, compliance, and
          reporting.
        </p>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">Total Entities</div>
            <div className="stat-value">{entities.length}</div>
            <div className="stat-sub">
              {verified} verified · {pending} pending · {suspended} suspended
            </div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Pool Net Position</div>
            <div className="stat-value">
              ${pool?.netPositionUsd.toLocaleString() ?? "0"}
            </div>
            <div className="stat-sub">
              {pool?.memberCount ?? 0} members · {pool?.name ?? "—"}
            </div>
          </div>
          <div className="stat-box orange">
            <div className="stat-label">Pending KYT Alerts</div>
            <div className="stat-value">{pendingKyt}</div>
            <div className="stat-sub">{blockedEvents} blocked events today</div>
          </div>
          <div className="stat-box red">
            <div className="stat-label">Active Loans</div>
            <div className="stat-value">{activeLoans.length}</div>
            <div className="stat-sub">
              $
              {activeLoans
                .reduce((s, l) => s + l.outstandingBalance, 0)
                .toLocaleString()}{" "}
              outstanding
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <ActionGuide
            title="Admin Workflow — Step by Step"
            steps={guideSteps}
          />

          <div className="card">
            <h3>Solana Program Status</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Program</th>
                  <th>ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {layerStatus.map((l) => (
                  <tr key={l.layer}>
                    <td className="mono">L{l.layer}</td>
                    <td>{l.name}</td>
                    <td className="mono">
                      <a
                        href={`${SOLANA_EXPLORER_URL}/address/${l.programId}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue"
                      >
                        {l.programId.slice(0, 8)}…
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${l.status}`}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Live FX Rates (SIX)</h4>
            <div className="flex flex-wrap gap-4">
              {fxRates.slice(0, 6).map((r) => (
                <div key={r.pair} className="layer-pill">
                  {r.pair}: {r.rate.toFixed(4)}{" "}
                  <span
                    className={r.change24h >= 0 ? "text-green" : "text-red"}
                  >
                    {r.change24h >= 0 ? "+" : ""}
                    {r.change24h.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>

            <h4 className="mt-16">On-Chain Proof</h4>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "SIX Oracle PDA",
                  addr: "EjfuHxMXdqijV2KE4DjHPawgTJJv6W4ZyeczeWfE47Dd",
                  type: "address",
                },
                {
                  label: "Oracle init tx",
                  addr: "3m94gXTJDyaWkrnERdeHU2CZBstSdax7Lb6SRPGw3fR57zgNyTWZsncrpRXRB93prtRkoE27Xsu8neG2RyjLpDjC",
                  type: "tx",
                },
                {
                  label: "First SIX rates tx",
                  addr: "3sR4LogysZSaKd23gU4WZNaX8vGSSXUvrHcrnEDrfeANmEzwBqzAYR1iUmNNMkMwRfmguRYq77KWrRn84JKvPKSW",
                  type: "tx",
                },
              ].map((item) => (
                <div
                  key={item.addr}
                  className="flex items-center gap-4 justify-between"
                >
                  <span className="text-xs text-muted">{item.label}</span>
                  <a
                    href={`${SOLANA_EXPLORER_URL}/${
                      item.type === "tx" ? "tx" : "address"
                    }/${item.addr}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-xs text-blue"
                  >
                    {item.addr.slice(0, 12)}… ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live on-chain transaction feed — only shown to AMINA admin */}
        <OnChainTxFeed />

        <div className="grid grid-2">
          <div className="card">
            <h3>Entity Registry</h3>
            {entities.length === 0 ? (
              <div className="empty-state">
                No entities yet.{" "}
                <Link to="/entities/register" className="btn primary mt-8">
                  Register First Entity →
                </Link>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Entity</th>
                    <th>KYC</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((e) => (
                    <tr key={e.id}>
                      <td>{JURISDICTION_FLAGS[e.jurisdiction] ?? ""}</td>
                      <td>
                        {e.legalName}
                        <br />
                        <span className="mono text-muted text-xs">
                          {e.jurisdiction}
                        </span>
                      </td>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3>Recent Compliance Events</h3>
            {complianceEvents.slice(0, 5).map((evt) => (
              <div className="event-item" key={evt.id}>
                <div className={`event-dot ${evt.type}`} />
                <div className="event-body">
                  <div className="event-title">{evt.title}</div>
                  <div className="event-detail">{evt.detail}</div>
                  <div className="event-time">
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            <Link to="/compliance" className="btn small mt-12">
              View All Events →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Corporate Treasury Admin dashboard
// ---------------------------------------------------------------------------

const CorporateTreasuryDashboard: React.FC = () => {
  const { entities, pool, loans, fxRates, nettingHistory, loading } =
    useNexus();

  if (loading)
    return (
      <div className="page-body">
        <div className="stat-row">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );

  const activeLoans = loans.filter((l) => l.status === "active");
  const surplusEntities = entities.filter((e) => e.balance > 0);
  const deficitEntities = entities.filter((e) => e.balance < 0);
  const lastCycle = nettingHistory[0];
  const totalSurplus = surplusEntities.reduce((s, e) => s + e.balance, 0);
  // Yield at 1.5% APR daily accrual on surplus
  const dailyYield = (totalSurplus * 0.015) / 365;

  const guideSteps: GuideStep[] = [
    {
      num: 1,
      label: "Register your subsidiaries",
      desc: "Add each legal entity that participates in your treasury pool. You'll need legal name, jurisdiction code, operating currency, and stablecoin. Takes 2 minutes per entity.",
      to: "/entities/register",
      cta: "Register Subsidiary",
      done: entities.length > 0,
    },
    {
      num: 2,
      label: "Set mandate limits",
      desc: "Control how much each subsidiary can transfer per day and per single transaction. These limits are enforced on-chain by the L3 Compliance Hook — no transfer can exceed them.",
      to: "/entities/mandates",
      cta: "Configure Mandates",
      done: entities.some((e) => e.mandateLimits.maxSingleTransfer > 0),
    },
    {
      num: 3,
      label: "Check FX rates before netting",
      desc: "NEXUS normalises all positions to USD using live SIX regulated rates. Check rates to understand the effective netting value before triggering a cycle.",
      to: "/fx",
      cta: "View FX Rates",
      done: fxRates.length > 0,
    },
    {
      num: 4,
      label: "Run a netting cycle",
      desc: "Trigger the 7-step algorithm. It will match your surplus entities against deficit ones, calculate FX-adjusted offsets, accrue interest, and record everything on-chain.",
      to: "/netting",
      cta: "Run Netting Cycle",
      done: nettingHistory.length > 0,
    },
    {
      num: 5,
      label: "Initiate a cross-border transfer",
      desc: "Send stablecoin between your entities. The transfer goes through 6 compliance gates (KYC, KYT/Chainalysis, AML, Travel Rule, daily limit, single limit) before execution.",
      to: "/transfers",
      cta: "Initiate Transfer",
      done: false,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">NEXUS / Dashboard</div>
        <h2>Treasury Dashboard — Corporate Treasury Admin</h2>
        <p className="page-subtitle">
          Manage your subsidiary pool, run netting cycles, and initiate
          cross-border transfers.
        </p>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">Subsidiaries</div>
            <div className="stat-value">{entities.length}</div>
            <div className="stat-sub">
              {surplusEntities.length} surplus · {deficitEntities.length}{" "}
              deficit
            </div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Total Surplus</div>
            <div className="stat-value">${totalSurplus.toLocaleString()}</div>
            <div className="stat-sub">
              Yield (1.5% APR):{" "}
              <span className="yield-accent">${dailyYield.toFixed(0)}/day</span>
              <span className="yield-pill">earning</span>
            </div>
          </div>
          <div className="stat-box blue">
            <div className="stat-label">Today's Offsets</div>
            <div className="stat-value">
              ${pool?.totalOffsetsToday.toLocaleString() ?? "0"}
            </div>
            <div className="stat-sub">
              Last cycle:{" "}
              {lastCycle
                ? new Date(lastCycle.timestamp).toLocaleTimeString()
                : "—"}
            </div>
          </div>
          <div className="stat-box orange">
            <div className="stat-label">Active Loans</div>
            <div className="stat-value">{activeLoans.length}</div>
            <div className="stat-sub">
              $
              {activeLoans
                .reduce((s, l) => s + l.outstandingBalance, 0)
                .toLocaleString()}{" "}
              outstanding
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <ActionGuide
            title="Treasury Workflow — Step by Step"
            steps={guideSteps}
          />

          <div className="card">
            <h3>Subsidiary Positions</h3>
            {entities.length === 0 ? (
              <div className="empty-state">
                No subsidiaries registered yet.{" "}
                <Link to="/entities/register" className="btn primary mt-8">
                  Add First Subsidiary →
                </Link>
              </div>
            ) : (
              <table className="table">
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
                  {entities.map((e) => (
                    <tr key={e.id}>
                      <td>{JURISDICTION_FLAGS[e.jurisdiction] ?? ""}</td>
                      <td>{e.legalName}</td>
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
                          <span className="yield-pill">+yield</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex flex-wrap gap-4 mt-16">
              <Link to="/netting" className="btn primary">
                Run Netting
              </Link>
              <Link to="/transfers" className="btn">
                Transfer
              </Link>
              <Link to="/fx" className="btn">
                FX Rates
              </Link>
            </div>
          </div>
        </div>

        <OnChainTxFeed />

        {nettingHistory.length > 0 && (
          <div className="card">
            <h3>Recent Netting Cycles</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Cycle ID</th>
                  <th>Timestamp</th>
                  <th>Entities</th>
                  <th>Offsets</th>
                  <th className="text-right">Total Offset USD</th>
                  <th>Sweep?</th>
                </tr>
              </thead>
              <tbody>
                {nettingHistory.slice(0, 4).map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.id}</td>
                    <td className="mono">
                      {new Date(c.timestamp).toLocaleString()}
                    </td>
                    <td>{c.entityCount}</td>
                    <td>{c.offsetCount}</td>
                    <td className="text-right mono text-green">
                      ${c.totalOffsetUsd.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.sweepRequired ? "warning" : "approved"
                        }`}
                      >
                        {c.sweepRequired ? "yes" : "no"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to="/netting/history" className="btn small mt-12">
              Full History →
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Subsidiary Finance Manager dashboard
// ---------------------------------------------------------------------------

const SubsidiaryDashboard: React.FC = () => {
  const { entities, complianceEvents, fxRates, loading } = useNexus();

  if (loading)
    return (
      <div className="page-body">
        <div className="stat-row">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );

  // In a real app this would filter to the logged-in entity.
  // For the demo, surface the first entity as "my entity".
  const myEntity = entities[0] ?? null;
  const myEvents = myEntity
    ? complianceEvents.filter((e) => e.entityId === myEntity.id).slice(0, 4)
    : complianceEvents.slice(0, 4);

  const mandateUsedPct = myEntity
    ? Math.min(
        100,
        Math.round(
          (myEntity.mandateLimits.dailyUsed /
            myEntity.mandateLimits.maxDailyAggregate) *
            100
        )
      )
    : 0;

  const guideSteps: GuideStep[] = [
    {
      num: 1,
      label: "View your entity details",
      desc: `Your entity is "${
        myEntity?.legalName ?? "not registered yet"
      }". Check KYC status (must be 'verified' to transact), jurisdiction, and current balance.`,
      to: "/entities",
      cta: "View Entity Details",
      done: !!myEntity,
    },
    {
      num: 2,
      label: "Check your mandate limits",
      desc: `You can transfer up to $${(
        myEntity?.mandateLimits.maxSingleTransfer ?? 0
      ).toLocaleString()} per transfer and $${(
        myEntity?.mandateLimits.maxDailyAggregate ?? 0
      ).toLocaleString()} per day. You've used $${(
        myEntity?.mandateLimits.dailyUsed ?? 0
      ).toLocaleString()} today.`,
      to: "/entities/mandates",
      cta: "View Mandate Limits",
      done: mandateUsedPct < 100,
    },
    {
      num: 3,
      label: "Initiate a transfer",
      desc: "Select your entity as the source, pick a destination, enter amount and memo. The system will run 6 compliance gates automatically. If all pass, the transfer executes on-chain.",
      to: "/transfers",
      cta: "Initiate Transfer",
      done: false,
    },
    {
      num: 4,
      label: "Track your compliance events",
      desc: "See which of your transfers were approved, blocked, or flagged. Each event shows the full gate-by-gate breakdown from the Chainalysis KYT check.",
      to: "/compliance",
      cta: "View Event Feed",
      done: false,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">NEXUS / Dashboard</div>
        <h2>My Entity Overview — Subsidiary Finance Manager</h2>
        <p className="page-subtitle">
          View your entity's position, initiate transfers, and monitor
          compliance events.
        </p>
      </div>

      <div className="page-body">
        {!myEntity ? (
          <div
            className="card highlight-card text-center"
            style={{ padding: "32px 24px" }}
          >
            <h3>Your entity hasn't been registered yet.</h3>
            <p className="text-muted mt-8">
              Ask your Corporate Treasury Admin to register your subsidiary
              first.
            </p>
          </div>
        ) : (
          <>
            <div className="card entity-spotlight">
              <div className="entity-spotlight-header">
                <span className="entity-spotlight-flag">
                  {JURISDICTION_FLAGS[myEntity.jurisdiction] ?? ""}
                </span>
                <div>
                  <div className="entity-spotlight-name">
                    {myEntity.legalName}
                  </div>
                  <div className="entity-spotlight-meta mono">
                    {myEntity.jurisdiction} · {myEntity.currency} ·{" "}
                    {myEntity.stablecoin}
                  </div>
                </div>
                <span className={`badge ${myEntity.kycStatus}`}>
                  {myEntity.kycStatus}
                </span>
              </div>

              <div className="stat-row mt-16">
                <div className="stat-box green">
                  <div className="stat-label">Balance</div>
                  <div
                    className={`stat-value ${
                      myEntity.balance >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    ${myEntity.balance.toLocaleString()}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Daily Limit Used</div>
                  <div className="stat-value">{mandateUsedPct}%</div>
                  <div className="stat-sub">
                    ${myEntity.mandateLimits.dailyUsed.toLocaleString()} / $
                    {myEntity.mandateLimits.maxDailyAggregate.toLocaleString()}
                  </div>
                </div>
                <div className="stat-box blue">
                  <div className="stat-label">Max Single Transfer</div>
                  <div className="stat-value">
                    ${myEntity.mandateLimits.maxSingleTransfer.toLocaleString()}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Pool</div>
                  <div className="stat-value">{myEntity.poolId}</div>
                  <div className="stat-sub">
                    Virtual offset: ${myEntity.virtualOffset.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="mono text-xs mb-4">
                  Daily limit utilisation: {mandateUsedPct}%
                </div>
                <div className="mandate-bar-track">
                  <div
                    className="mandate-bar-fill"
                    style={{
                      width: `${mandateUsedPct}%`,
                      background:
                        mandateUsedPct > 80
                          ? "var(--accent-red)"
                          : "var(--accent-green)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2">
              <ActionGuide
                title="What You Can Do — Step by Step"
                steps={guideSteps}
              />

              <div>
                <div className="card mb-16">
                  <h3>Quick Transfer</h3>
                  <p className="text-sm text-muted mb-12">
                    Send stablecoin from <strong>{myEntity.legalName}</strong>{" "}
                    to another entity in your pool. All 6 compliance gates run
                    automatically.
                  </p>
                  <Link to="/transfers" className="btn primary">
                    Initiate Transfer →
                  </Link>
                </div>

                <div className="card">
                  <h3>My Compliance Events</h3>
                  {myEvents.length === 0 ? (
                    <div className="empty-state">No events yet.</div>
                  ) : (
                    myEvents.map((evt) => (
                      <div className="event-item" key={evt.id}>
                        <div className={`event-dot ${evt.type}`} />
                        <div className="event-body">
                          <div className="event-title">{evt.title}</div>
                          <div className="event-detail">{evt.detail}</div>
                          <div className="event-time">
                            {new Date(evt.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Link to="/compliance" className="btn small mt-12">
                    Full Event Feed →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="card">
          <h3>Live FX Rates (SIX)</h3>
          <div className="flex flex-wrap gap-4">
            {fxRates.map((r) => (
              <div key={r.pair} className="layer-pill">
                {r.pair}: {r.rate.toFixed(4)}{" "}
                <span className={r.change24h >= 0 ? "text-green" : "text-red"}>
                  {r.change24h >= 0 ? "+" : ""}
                  {r.change24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Compliance Officer dashboard
// ---------------------------------------------------------------------------

const ComplianceDashboard: React.FC = () => {
  const { entities, complianceEvents, kytAlerts, layerStatus, loading } =
    useNexus();

  if (loading)
    return (
      <div className="page-body">
        <div className="stat-row">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );

  const pendingKyc = entities.filter((e) => e.kycStatus === "pending").length;
  const suspended = entities.filter((e) => e.kycStatus === "suspended").length;
  const blocked = complianceEvents.filter((e) => e.type === "blocked").length;
  const warnings = complianceEvents.filter((e) => e.type === "warning").length;
  const pendingKyt = kytAlerts.filter(
    (a) => a.status === "pending_review"
  ).length;
  const escalated = kytAlerts.filter((a) => a.status === "escalated").length;

  const guideSteps: GuideStep[] = [
    {
      num: 1,
      label: "Process pending KYC submissions",
      desc: `${pendingKyc} entr${
        pendingKyc !== 1 ? "ies" : "y"
      } awaiting KYC verification. Review each submission, check jurisdiction compliance, approve or reject, and set the expiry date. Entities are blocked from transacting until approved.`,
      to: "/entities/kyc",
      cta: `Review ${pendingKyc} Pending KYC`,
      done: pendingKyc === 0 && entities.length > 0,
    },
    {
      num: 2,
      label: "Check mandate controls",
      desc: "Review per-entity transfer limits. Flag any entity with limits that seem too high for their risk profile. Mandate changes take immediate effect on-chain.",
      to: "/entities/mandates",
      cta: "Review Mandate Limits",
      done: entities.some((e) => e.mandateLimits.maxSingleTransfer > 0),
    },
    {
      num: 3,
      label: "Monitor live compliance events",
      desc: `${blocked} transfer${
        blocked !== 1 ? "s" : ""
      } blocked today, ${warnings} warning${
        warnings !== 1 ? "s" : ""
      }. Each event shows the gate-by-gate Chainalysis KYT result. Drill in to understand rejection reasons.`,
      to: "/compliance",
      cta: "Open Event Feed",
      done: false,
    },
    {
      num: 4,
      label: "Action KYT alerts",
      desc: `${pendingKyt} alert${
        pendingKyt !== 1 ? "s" : ""
      } pending review, ${escalated} escalated. Chainalysis flags transactions that exceed risk thresholds. Approve, escalate, or dismiss each one.`,
      to: "/compliance/kyt",
      cta: `Action ${pendingKyt + escalated} Alerts`,
      done: pendingKyt === 0 && escalated === 0 && entities.length > 0,
    },
    {
      num: 5,
      label: "Export audit report",
      desc: "Generate a complete audit trail for regulators — all compliance gate results, KYC history, KYT decisions, and on-chain cert PDAs in a signed JSON/PDF export.",
      to: "/reports",
      cta: "Export Audit Report",
      done: false,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">NEXUS / Dashboard</div>
        <h2>Compliance Dashboard — Compliance Officer</h2>
        <p className="page-subtitle">
          KYC verification, KYT monitoring (Chainalysis), AML screening, and
          regulatory reporting.
        </p>
        <div className="kyt-provider-badge">
          <span className="kyt-provider-dot" />
          KYT powered by <strong>Chainalysis</strong> · every transaction
          screened · 6-gate enforcement
        </div>
      </div>

      <div className="page-body">
        <div className="stat-row">
          <div className="stat-box orange">
            <div className="stat-label">Pending KYC</div>
            <div className="stat-value">{pendingKyc}</div>
            <div className="stat-sub">
              {suspended} suspended · action required
            </div>
          </div>
          <div className="stat-box red">
            <div className="stat-label">Blocked Transfers</div>
            <div className="stat-value">{blocked}</div>
            <div className="stat-sub">{warnings} warnings today</div>
          </div>
          <div className="stat-box orange">
            <div className="stat-label">KYT Alerts</div>
            <div className="stat-value">{pendingKyt}</div>
            <div className="stat-sub">
              {escalated} escalated via Chainalysis
            </div>
          </div>
          <div className="stat-box green">
            <div className="stat-label">Approved Events</div>
            <div className="stat-value">
              {complianceEvents.filter((e) => e.type === "approved").length}
            </div>
            <div className="stat-sub">clean transfers today</div>
          </div>
        </div>

        <div className="grid grid-2">
          <ActionGuide
            title="Compliance Workflow — Step by Step"
            steps={guideSteps}
          />

          <div>
            <div className="card mb-16">
              <h3>Entities Needing Action</h3>
              {entities.filter((e) => e.kycStatus !== "verified").length ===
              0 ? (
                <div className="empty-state text-green">
                  All entities verified — no action required.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Entity</th>
                      <th>KYC Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities
                      .filter((e) => e.kycStatus !== "verified")
                      .map((e) => (
                        <tr key={e.id}>
                          <td>{JURISDICTION_FLAGS[e.jurisdiction] ?? ""}</td>
                          <td>{e.legalName}</td>
                          <td>
                            <span className={`badge ${e.kycStatus}`}>
                              {e.kycStatus}
                            </span>
                            {e.kycProvider === "zk-onchain" && (
                              <span
                                className="badge ml-4"
                                style={{
                                  background: "var(--accent-purple)",
                                  color: "white",
                                }}
                              >
                                ZK
                              </span>
                            )}
                          </td>
                          <td>
                            <Link to="/entities/kyc" className="btn small">
                              Review →
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3>L3 Compliance Hook — Gate Results</h3>
              {[
                "KYC Check",
                "KYT / Chainalysis",
                "AML Score",
                "Travel Rule",
                "Daily Limit",
                "Transfer Limit",
              ].map((gate, i) => (
                <div key={gate} className="gate-item">
                  <span className="gate-check pass">✓</span>
                  <span>{gate}</span>
                  <span className="mono text-muted text-xs">
                    Gate {i + 1}/6 · active
                  </span>
                </div>
              ))}
              <div className="mt-12">
                <span
                  className={`badge ${
                    layerStatus.find((l) => l.layer === 3)?.status ?? "live"
                  }`}
                >
                  L3 {layerStatus.find((l) => l.layer === 3)?.status ?? "live"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Recent Compliance Events</h3>
          {complianceEvents.slice(0, 6).map((evt) => (
            <div className="event-item" key={evt.id}>
              <div className={`event-dot ${evt.type}`} />
              <div className="event-body">
                <div className="flex-between">
                  <div className="event-title">{evt.title}</div>
                  <span className={`badge ${evt.type}`}>{evt.type}</span>
                </div>
                <div className="event-detail">{evt.detail}</div>
                <div className="event-time">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          <Link to="/compliance" className="btn small mt-12">
            View Full Feed →
          </Link>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Root — picks which dashboard to render
// ---------------------------------------------------------------------------

const DASHBOARDS: Record<UserRole, React.FC> = {
  amina_admin: AminaAdminDashboard,
  corporate_treasury: CorporateTreasuryDashboard,
  subsidiary_manager: SubsidiaryDashboard,
  compliance_officer: ComplianceDashboard,
};

const HomePage: React.FC = () => {
  const { role } = useAuth();
  const _navigate = useNavigate(); // keep import used

  if (!role) return null;

  const Dashboard = DASHBOARDS[role];
  return <Dashboard />;
};

export default HomePage;
