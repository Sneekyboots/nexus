/* ============================================================
   PAGE 8 — Run Netting Cycle (animated 7-step)
   ============================================================ */

import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";
import { SOLANA_EXPLORER_URL } from "../../constants";
import type { NettingCycle, NettingStep } from "../../types";

const STEP_NAMES = [
  "Position Snapshot",
  "Currency Normalization",
  "Surplus/Deficit Classification",
  "Bilateral Offset Matching",
  "FX Rate Application",
  "Compliance Validation",
  "Settlement & Audit",
];

const RunCycle: React.FC = () => {
  const { pool, runNettingCycle, loading } = useNexus();
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps, setSteps] = useState<NettingStep[]>(
    STEP_NAMES.map((name, i) => ({
      step: i + 1,
      name,
      status: "pending",
      details: [],
    }))
  );
  const [result, setResult] = useState<NettingCycle | null>(null);

  const stepDetails: string[][] = [
    ["Aggregating entity positions from pool..."],
    ["Converting SGD, GBP, EUR, AED, CHF ---> USD via SIX rates"],
    ["Classifying entities as surplus or deficit"],
    ["Running greedy bilateral offset matching algorithm"],
    ["Applying FX rates from SIX Financial oracle"],
    ["Validating all offsets through 6-gate compliance"],
    ["Creating intercompany loans, writing audit trail to chain"],
  ];

  const handleRun = useCallback(async () => {
    if (!pool) return;
    setRunning(true);
    setResult(null);
    setCurrentStep(-1);

    setSteps(
      STEP_NAMES.map((name, i) => ({
        step: i + 1,
        name,
        status: "pending",
        details: [],
      }))
    );

    for (let i = 0; i < 7; i++) {
      setCurrentStep(i);
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? { ...s, status: "running", details: stepDetails[i] }
            : idx < i
            ? { ...s, status: "completed" }
            : s
        )
      );

      const delays = [500, 400, 300, 900, 500, 1100, 1400];
      await new Promise((r) => setTimeout(r, delays[i]));

      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                status: "completed",
                durationMs: delays[i],
              }
            : s
        )
      );
    }

    const cycle = await runNettingCycle(pool.id);
    setResult(cycle);
    setRunning(false);
  }, [pool, runNettingCycle]);

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / Netting / Run Cycle
        </div>
        <h2>Run Netting Cycle</h2>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 700 }}>
          <h3>7-Step Netting Algorithm (THE MOAT)</h3>
          <div className="mono text-xs text-muted mb-12">
            Pool: {pool?.name || "—"} | Members: {pool?.memberCount || 0} |
            Interest: {pool?.interestRateApr || 0}% APR
          </div>

          <ol className="step-list">
            {steps.map((s, i) => (
              <li key={s.step} className={`step-item ${s.status}`}>
                <div className="step-number">
                  {s.status === "completed"
                    ? "x"
                    : s.status === "running"
                    ? "~"
                    : s.step}
                </div>
                <div className="step-body">
                  <div className="step-name">
                    Step {s.step}: {s.name}
                  </div>
                  {s.details.length > 0 && (
                    <div className="step-details">
                      {s.details.map((d, di) => (
                        <div key={di}>{d}</div>
                      ))}
                    </div>
                  )}
                  {s.durationMs && (
                    <div className="mono text-xs text-green">
                      completed in {s.durationMs}ms
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-20">
            <button
              className="btn primary"
              disabled={running || !pool}
              onClick={handleRun}
            >
              {running
                ? `Running step ${currentStep + 1}/7...`
                : "Run Netting Cycle"}
            </button>
          </div>
        </div>

        {result && (
          <div className="card highlight mt-20" style={{ maxWidth: 700 }}>
            <h3>Cycle Result</h3>
            <table className="table">
              <tbody>
                <tr>
                  <td>Cycle ID</td>
                  <td className="mono">{result.id}</td>
                </tr>
                <tr>
                  <td>Entities Processed</td>
                  <td>{result.entityCount}</td>
                </tr>
                <tr>
                  <td>Offsets Created</td>
                  <td>{result.offsetCount}</td>
                </tr>
                <tr>
                  <td>Total Offset Value</td>
                  <td className="mono text-green">
                    ${result.totalOffsetUsd.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td>Interest Accrued</td>
                  <td className="mono">${result.interestAccrued.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Sweep Required</td>
                  <td>{result.sweepRequired ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td>Transaction Hash</td>
                  <td className="mono text-xs">
                    {result.transactionHash ? (
                      <a
                        href={`${SOLANA_EXPLORER_URL}/tx/${result.transactionHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue"
                        style={{ wordBreak: "break-all" }}
                      >
                        {result.transactionHash.slice(0, 20)}…
                        {result.transactionHash.slice(-8)} ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {result.offsets.length > 0 && (
              <>
                <h4 className="mt-16">Offset Matches</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Surplus</th>
                      <th></th>
                      <th>Deficit</th>
                      <th className="text-right">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.offsets.map((o) => (
                      <tr key={o.id}>
                        <td className="mono text-green">{o.surplusEntity}</td>
                        <td className="arrow">---&gt;</td>
                        <td className="mono text-red">{o.deficitEntity}</td>
                        <td className="text-right mono">
                          ${o.netOffsetUsd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default RunCycle;
