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
          <h2>[$] FX Rates (SIX Financial)</h2>
          <div className="flex gap-8">
            <button className="sketch-btn small" onClick={() => refresh()}>
              Refresh Now
            </button>
            <button
              className={`sketch-btn small ${autoRefresh ? "primary" : ""}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto: ON (5s)" : "Auto: OFF"}
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="sketch-card">
          <h3>Currency Pairs</h3>
          <table className="sketch-table">
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
                  <td className="mono" style={{ fontSize: 11 }}>
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

        <div className="sketch-card dashed">
          <h3>FX Oracle (On-Chain)</h3>
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            FX rates are published to Solana devnet via the FX Netting program
            (Layer 4). The on-chain oracle stores rates with 6-decimal
            precision. Rates are sourced from SIX Financial Information AG and
            updated before each netting cycle.
          </div>
          <div className="mono" style={{ fontSize: 11, marginTop: 8 }}>
            PDA seeds: [b"fxrate", source_currency, target_currency]
          </div>
        </div>
      </div>
    </>
  );
};

export default FxRates;
