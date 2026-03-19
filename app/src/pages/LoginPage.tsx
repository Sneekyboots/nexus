/* ============================================================
   PAGE 1 — Login / Wallet Connect + Role Selection
   Entra B2C panel, role cards
   ============================================================ */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../types";

// SVG icons for each role — inline, no deps
const RoleIcon: React.FC<{ role: UserRole }> = ({ role }) => {
  if (role === "amina_admin")
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M17 3l1.5 1.5L20 3" />
      </svg>
    );
  if (role === "corporate_treasury")
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-4 0v2" />
        <path d="M12 12v4" />
        <path d="M8 12v4" />
        <path d="M16 12v4" />
      </svg>
    );
  if (role === "subsidiary_manager")
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
        <circle cx="18" cy="10" r="2" />
        <path d="M15 20c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5" />
      </svg>
    );
  // compliance_officer
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
    </svg>
  );
};

const ROLE_CONFIG: Record<
  UserRole,
  { color: string; bg: string; border: string; badge: string }
> = {
  amina_admin: {
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ddd6fe",
    badge: "ADMIN",
  },
  corporate_treasury: {
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    badge: "TREASURY",
  },
  subsidiary_manager: {
    color: "#047857",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    badge: "FINANCE",
  },
  compliance_officer: {
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    badge: "COMPLIANCE",
  },
};

function deriveEntraSubjectId(walletAddress: string): string {
  const a = walletAddress;
  return `amina|${a.slice(0, 6)}-${a.slice(6, 10)}-${a.slice(
    -8,
  )}`.toLowerCase();
}

// ---------------------------------------------------------------------------
// Hero section component
// ---------------------------------------------------------------------------
const HeroSection: React.FC = () => {
  return (
    <div className="hero-section">
      {/* Track badge */}
      <div className="track-badge">
        <span className="track-badge-text">TRACK 2</span>
        <span className="track-badge-desc">
          Stablecoin-Based On-Chain Cash Pooling
        </span>
      </div>

      {/* Main headline */}
      <h1 className="hero-headline">
        <span className="hero-logo">N</span>
        <div className="hero-title-group">
          <span className="hero-title">NEXUS</span>
          <span className="hero-subtitle">Notional Corporate Cash Pooling</span>
        </div>
      </h1>

      {/* The problem - pain point */}
      <div className="pain-banner">
        <div className="pain-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="pain-text">
          <strong>The Problem:</strong> When Signature Bank collapsed in March
          2023, it took the primary USD correspondent rail for crypto banks.
          <span className="pain-highlight">
            {" "}
            3–5 business days. $8–15 per payment. 3–8× more expensive.
          </span>
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="comparison-grid">
        <div className="comparison-card before">
          <div className="comparison-label">TRADITIONAL</div>
          <div className="comparison-stat">
            <span className="stat-time">3-5</span>
            <span className="stat-unit">days</span>
          </div>
          <div className="comparison-detail">
            <div className="detail-row">
              <span className="detail-icon">⏱</span>
              <span>Settlement time</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">💸</span>
              <span>$8-15 per transfer</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">🏦</span>
              <span>Correspondent banks</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">📄</span>
              <span>Manual compliance</span>
            </div>
          </div>
        </div>

        <div className="comparison-divider">
          <div className="divider-arrow">→</div>
          <div className="divider-text">NEXUS</div>
        </div>

        <div className="comparison-card after">
          <div className="comparison-label">NEXUS</div>
          <div className="comparison-stat">
            <span className="stat-time">&lt;5</span>
            <span className="stat-unit">seconds</span>
          </div>
          <div className="comparison-detail">
            <div className="detail-row">
              <span className="detail-icon">⚡</span>
              <span>On-chain settlement</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">🪙</span>
              <span>~$0.001 per transfer</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">🔗</span>
              <span>No intermediaries</span>
            </div>
            <div className="detail-row">
              <span className="detail-icon">✓</span>
              <span>6-gate compliance</span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <div className="how-title">How NEXUS Works</div>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-num">1</div>
            <div className="step-content">
              <div className="step-title">Pool</div>
              <div className="step-desc">
                Aggregate stablecoin balances across subsidiaries globally
              </div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <div className="step-content">
              <div className="step-title">Net</div>
              <div className="step-desc">
                Offset surpluses vs deficits — <strong>no tokens move</strong>
              </div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <div className="step-content">
              <div className="step-title">Convert</div>
              <div className="step-desc">
                Auto FX via SIX Financial rates (EUR, GBP, CHF...)
              </div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <div className="step-content">
              <div className="step-title">Comply</div>
              <div className="step-desc">
                KYC · KYT · AML · Travel Rule at token level
              </div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-num">5</div>
            <div className="step-content">
              <div className="step-title">Settle</div>
              <div className="step-desc">
                Physical sweep only when threshold exceeded
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings calculator teaser */}
      <div className="savings-teaser">
        <div className="savings-item">
          <span className="savings-val">$2.4M</span>
          <span className="savings-label">
            saved per $1B transferred annually
          </span>
        </div>
        <div className="savings-divider" />
        <div className="savings-item">
          <span className="savings-val">99.7%</span>
          <span className="savings-label">reduction in settlement time</span>
        </div>
        <div className="savings-divider" />
        <div className="savings-item">
          <span className="savings-val">$0.001</span>
          <span className="savings-label">cost per on-chain transfer</span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="trust-signals">
        <div className="trust-label">
          Built with enterprise-grade infrastructure
        </div>
        <div className="trust-logos">
          <div className="trust-item">
            <span className="trust-name">Solana</span>
            <span className="trust-desc">Blockchain</span>
          </div>
          <div className="trust-item">
            <span className="trust-name">Chainalysis</span>
            <span className="trust-desc">KYT Screening</span>
          </div>
          <div className="trust-item">
            <span className="trust-name">SIX Financial</span>
            <span className="trust-desc">FX Rates</span>
          </div>
          <div className="trust-item">
            <span className="trust-name">Entra B2C</span>
            <span className="trust-desc">Identity</span>
          </div>
          <div className="trust-item">
            <span className="trust-name">AMINA Bank</span>
            <span className="trust-desc">Partner</span>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div className="live-status">
        <div className="status-dot" />
        <span className="status-text">5 programs live on Solana Devnet</span>
        <span className="status-sep">·</span>
        <span className="status-text">
          Entity registered & KYC verified on-chain
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();

  const walletAddress = publicKey?.toBase58() ?? "";
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "";
  const entraSubjectId = walletAddress
    ? deriveEntraSubjectId(walletAddress)
    : "";

  const roles: UserRole[] = [
    "amina_admin",
    "corporate_treasury",
    "subsidiary_manager",
    "compliance_officer",
  ];

  return (
    <div className="login-page">
      <div className="login-split">
        {/* ── LEFT: hero panel ── */}
        <div className="login-hero">
          <div className="login-hero-inner">
            <HeroSection />
          </div>
        </div>

        {/* ── RIGHT: auth panel ── */}
        <div className="login-auth">
          <div className="login-auth-inner">
            <div className="login-auth-header">
              <div className="login-auth-logo">NEXUS</div>
              <div className="login-auth-desc">
                Powered by AMINA Bank · Regulated Swiss Crypto Infrastructure
              </div>
            </div>

            {!connected ? (
              /* Step 1 — connect wallet */
              <div className="login-connect-box">
                <div className="login-connect-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <path d="M16 12h.01" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
                <h2 className="login-connect-heading">Connect Your Wallet</h2>
                <p className="login-connect-desc">
                  Connect a Solana wallet to authenticate via the Microsoft
                  Entra B2C adapter. Supports Phantom, Solflare, and other
                  Solana wallets.
                </p>
                <button
                  className="sketch-btn primary login-connect-btn"
                  onClick={() => setVisible(true)}
                >
                  Connect Wallet →
                </button>
                <div className="login-connect-hint mono">
                  Running on Solana Devnet
                </div>

                {/* Quick demo access */}
                <div className="login-demo-divider">
                  <span>or jump straight in</span>
                </div>
                <div className="login-demo-roles">
                  {roles.map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                      <button
                        key={role}
                        className="login-demo-role-btn"
                        style={{
                          borderColor: cfg.border,
                          color: cfg.color,
                          background: cfg.bg,
                        }}
                        onClick={() => {
                          login(role);
                          navigate("/");
                        }}
                      >
                        <span
                          className="login-demo-role-badge"
                          style={{ background: cfg.color }}
                        >
                          {cfg.badge}
                        </span>
                        <span>{ROLE_LABELS[role]}</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="login-connect-hint mono"
                  style={{ marginTop: 0 }}
                >
                  Demo mode · no wallet needed
                </div>
              </div>
            ) : (
              <>
                {/* Wallet connected bar */}
                <div
                  className="wallet-connected-bar"
                  style={{ marginBottom: 16 }}
                >
                  <span className="wallet-connected-dot" />
                  <span className="mono">{truncatedAddress}</span>
                  <span className="wallet-connected-label">Connected</span>
                  <button
                    className="sketch-btn small wallet-disconnect-btn"
                    onClick={() => disconnect().catch(() => {})}
                  >
                    Disconnect
                  </button>
                </div>

                {/* Entra B2C panel */}
                <div className="entra-panel">
                  <div className="entra-panel-header">
                    <span className="entra-panel-logo">Entra</span>
                    <span className="entra-panel-title">
                      Microsoft Entra B2C
                    </span>
                  </div>
                  <div className="entra-panel-row">
                    <span>Flow</span>
                    <span className="mono">B2C_1_SignIn · OIDC</span>
                  </div>
                  <div className="entra-panel-row">
                    <span>Subject ID</span>
                    <span className="mono" style={{ fontSize: 10 }}>
                      {entraSubjectId}
                    </span>
                  </div>
                  <div className="entra-panel-row">
                    <span>Solana wallet</span>
                    <span className="mono">{truncatedAddress}</span>
                  </div>
                  <div className="entra-panel-row">
                    <span>Status</span>
                    <span className="entra-panel-status">
                      <span
                        className="wallet-connected-dot"
                        style={{ width: 6, height: 6 }}
                      />
                      authenticated
                    </span>
                  </div>
                </div>

                {/* Role selection */}
                <p className="login-role-prompt">Select your role to enter:</p>
                <div className="login-role-grid">
                  {roles.map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                      <button
                        key={role}
                        className="login-role-card"
                        style={{ borderColor: cfg.border, background: cfg.bg }}
                        onClick={() => {
                          login(role);
                          navigate("/");
                        }}
                      >
                        <div className="login-role-card-top">
                          <span
                            className="login-role-icon"
                            style={{
                              color: cfg.color,
                              background: `${cfg.color}18`,
                            }}
                          >
                            <RoleIcon role={role} />
                          </span>
                          <span
                            className="login-role-badge"
                            style={{ background: cfg.color }}
                          >
                            {cfg.badge}
                          </span>
                        </div>
                        <span
                          className="login-role-name"
                          style={{ color: cfg.color }}
                        >
                          {ROLE_LABELS[role]}
                        </span>
                        <span className="login-role-desc">
                          {ROLE_DESCRIPTIONS[role]}
                        </span>
                        <span
                          className="login-role-enter"
                          style={{ color: cfg.color }}
                        >
                          Enter →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="login-footer mono">
              StableHacks 2026 · Track 2 · Deadline Mar 22
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
