/* ============================================================
   PAGE 13 — FX Rates
   ============================================================ */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNexus } from "../../hooks/useNexus";

const FxRates: React.FC = () => {
  const { fxRates, loading, refresh } = useNexus();
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => refresh(), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  if (loading) return <div className="loading-state">Loading FX rates...</div>;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / FX Rates
        </div>
        <div className="flex-between">
          <h2>FX Rates (SIX Financial)</h2>
          <div className="flex gap-8">
            <button className="btn small" onClick={() => refresh()}>
              Refresh Now
            </button>
            <button
              className={`btn small ${autoRefresh ? "primary" : ""}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto: ON (5s)" : "Auto: OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <h3>Currency Pairs</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Pair</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Bid</th>
                <th className="text-right">Ask</th>
                <th className="text-right">Spread</th>
                <th className="text-right">24h Change</th>
                <th>Source</th>
                <th>Last Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fxRates.map((r) => (
                <tr key={r.pair}>
                  <td>
                    <strong>{r.pair}</strong>
                  </td>
                  <td className="text-right mono">{r.rate.toFixed(4)}</td>
                  <td className="text-right mono text-muted">
                    {r.bid.toFixed(4)}
                  </td>
                  <td className="text-right mono text-muted">
                    {r.ask.toFixed(4)}
                  </td>
                  <td className="text-right mono">
                    {((r.ask - r.bid) * 10000).toFixed(1)} bps
                  </td>
                  <td
                    className={`text-right mono ${
                      r.change24h >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    {r.change24h >= 0 ? "+" : ""}
                    {r.change24h.toFixed(2)}%
                  </td>
                  <td>{r.source}</td>
                  <td className="mono text-xs">
                    {new Date(r.lastUpdated).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className={`badge ${r.stale ? "warning" : "live"}`}>
                      {r.stale ? "stale" : "live"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>On-Chain Proof — Solana Devnet</h3>
          <p className="text-sm text-muted mb-16">
            These are real transactions on Solana Devnet. Click any link to
            verify independently.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>What</th>
                <th>Address / Tx</th>
                <th>Verify</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SIX Oracle PDA</td>
                <td className="mono text-xs">
                  EjfuHxMXdqijV2KE4DjHPawgTJJv6W4ZyeczeWfE47Dd
                </td>
                <td>
                  <a
                    href="https://explorer.solana.com/address/EjfuHxMXdqijV2KE4DjHPawgTJJv6W4ZyeczeWfE47Dd?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn small"
                  >
                    View on Explorer ↗
                  </a>
                </td>
              </tr>
              <tr>
                <td>Oracle initialized</td>
                <td className="mono text-xs">
                  3m94gXTJDyaWkrnERdeHU2CZBstSdax7Lb6SRPGw3fR5…
                </td>
                <td>
                  <a
                    href="https://explorer.solana.com/tx/3m94gXTJDyaWkrnERdeHU2CZBstSdax7Lb6SRPGw3fR57zgNyTWZsncrpRXRB93prtRkoE27Xsu8neG2RyjLpDjC?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn small"
                  >
                    View on Explorer ↗
                  </a>
                </td>
              </tr>
              <tr>
                <td>First live SIX push</td>
                <td className="mono text-xs">
                  3sR4LogysZSaKd23gU4WZNaX8vGSSXUvrHcrnEDrfeAN…
                </td>
                <td>
                  <a
                    href="https://explorer.solana.com/tx/3sR4LogysZSaKd23gU4WZNaX8vGSSXUvrHcrnEDrfeANmEzwBqzAYR1iUmNNMkMwRfmguRYq77KWrRn84JKvPKSW?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn small"
                  >
                    View on Explorer ↗
                  </a>
                </td>
              </tr>
              <tr>
                <td>Pooling Engine program</td>
                <td className="mono text-xs">
                  CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk
                </td>
                <td>
                  <a
                    href="https://explorer.solana.com/address/CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn small"
                  >
                    View on Explorer ↗
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mono text-xs text-muted mt-12">
            Deployed March 19 2026 · Authority:
            A7eV2cdTrH56ktXH3ZaSk4kbsF2aguHvggeszcAUXc5o · BC=148 Forex Spot
            Rates
          </div>
        </div>
      </div>
    </>
  );
};

export default FxRates;
