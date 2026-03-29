/* ============================================================
   Login Page — NEXUS Protocol
   ============================================================ */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../types";

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
    -8
  )}`.toLowerCase();
}

// ---------------------------------------------------------------------------
// Hero Section - Clean & Punchy
// ---------------------------------------------------------------------------
const HeroSection: React.FC = () => {
  return (
    <div className="hero-content">
      {/* Track */}
      <div className="hero-track">
        TRACK 2 · NOTIONAL CORPORATE CASH POOLING
      </div>

      {/* Logo + Title */}
      <div className="hero-brand">
        <div className="hero-logo">N</div>
        <div>
          <div className="hero-title">NEXUS</div>
          <div className="hero-tagline">Corporate Cash Pooling on Solana</div>
        </div>
      </div>

      {/* The Problem - BIG */}
      <div className="hero-problem">
        <div className="problem-label">THE PROBLEM</div>
        <div className="problem-text">
          Signature Bank collapsed. 3-5 days. $8-15 per payment.
        </div>
        <div className="problem-sub">
          Correspondent banking is broken for crypto.
        </div>
      </div>

      {/* The Solution - BIG */}
      <div className="hero-solution">
        <div className="solution-label">THE SOLUTION</div>
        <div className="solution-big">
          <span className="solution-num">&lt;5s</span>
          <span className="solution-unit">on-chain settlement</span>
        </div>
        <div className="solution-cost">
          ~$0.001 per transfer · No intermediaries
        </div>
      </div>

      {/* How */}
      <div className="hero-how">
        <div className="how-title">HOW IT WORKS</div>
        <div className="how-flow">
          <div className="how-step">
            <span className="step-n">1</span>
            <span>Pool</span>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="step-n">2</span>
            <span>Net</span>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="step-n">3</span>
            <span>FX</span>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="step-n">4</span>
            <span>Comply</span>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <span className="step-n">5</span>
            <span>Settle</span>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="hero-stats">
        <div className="stat-item">
          <div className="stat-val">$2.4M</div>
          <div className="stat-lbl">saved / $1B / year</div>
        </div>
        <div className="stat-div">·</div>
        <div className="stat-item">
          <div className="stat-val">6</div>
          <div className="stat-lbl">compliance gates</div>
        </div>
        <div className="stat-div">·</div>
        <div className="stat-item">
          <div className="stat-val">Live</div>
          <div className="stat-lbl">on Solana Devnet</div>
        </div>
      </div>

      {/* Tech */}
      <div className="hero-tech">
        <span>Solana</span>
        <span>·</span>
        <span>Chainalysis</span>
        <span>·</span>
        <span>SIX Financial</span>
        <span>·</span>
        <span>Entra B2C</span>
      </div>

      {/* Partner */}
      <div className="hero-partner">
        Built for <strong>AMINA Bank</strong> · Swiss Crypto Infrastructure
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Login Page
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
        {/* ── LEFT: hero ── */}
        <div className="login-hero">
          <HeroSection />
        </div>

        {/* ── RIGHT: auth ── */}
        <div className="login-auth">
          <div className="login-auth-inner">
            <div className="login-auth-header">
              <div className="login-auth-logo">NEXUS</div>
              <div className="login-auth-desc">Powered by AMINA Bank</div>
            </div>

            {!connected ? (
              <div className="login-connect-box">
                <div className="login-connect-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <path d="M16 12h.01" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
                <h2 className="login-connect-heading">Connect Your Wallet</h2>
                <p className="login-connect-desc">
                  Authenticate via Microsoft Entra B2C with your Solana wallet.
                </p>
                <button
                  className="btn primary login-connect-btn"
                  onClick={() => setVisible(true)}
                >
                  Connect Wallet →
                </button>
                <div className="login-connect-hint mono">Solana Devnet</div>

                <div className="login-demo-divider">
                  <span>or demo access</span>
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
              </div>
            ) : (
              <>
                <div className="wallet-connected-bar mb-16">
                  <span className="wallet-connected-dot" />
                  <span className="mono">{truncatedAddress}</span>
                  <span className="wallet-connected-label">Connected</span>
                  <button
                    className="btn small wallet-disconnect-btn"
                    onClick={() => disconnect().catch(() => {})}
                  >
                    Disconnect
                  </button>
                </div>

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
                    <span>Wallet</span>
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

                <p className="login-role-prompt">Select your role:</p>
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
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="login-footer mono">StableHacks 2026 · Track 2</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
