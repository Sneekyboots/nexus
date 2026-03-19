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
            {/* Logo + wordmark */}
            <div className="login-hero-brand">
              <div className="login-hero-logo-mark">N</div>
              <div>
                <div className="login-hero-title">NEXUS</div>
                <div className="login-hero-sub">
                  Notional Corporate Cash Pooling
                </div>
              </div>
            </div>

            <div className="login-hero-tagline">
              Rebuild corporate cash pooling with stablecoins —<br />
              <strong>no tokens move until you need them to.</strong>
            </div>

            {/* Core value prop */}
            <div className="login-hero-features">
              <div className="login-hero-feature">
                <span className="feature-num">01</span>
                <span className="feature-text">
                  Pool stablecoin balances across subsidiaries globally
                </span>
              </div>
              <div className="login-hero-feature">
                <span className="feature-num">02</span>
                <span className="feature-text">
                  Net surpluses against deficits — no tokens move
                </span>
              </div>
              <div className="login-hero-feature">
                <span className="feature-num">03</span>
                <span className="feature-text">
                  Convert currencies automatically via live SIX FX rates
                </span>
              </div>
              <div className="login-hero-feature">
                <span className="feature-num">04</span>
                <span className="feature-text">
                  Enforce KYC · KYT · AML · Travel Rule at token level
                </span>
              </div>
              <div className="login-hero-feature">
                <span className="feature-num">05</span>
                <span className="feature-text">
                  Settle physically via on-chain stablecoin sweep when needed
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="login-hero-stats">
              <div className="login-hero-stat">
                <span className="login-hero-stat-val">5</span>
                <span className="login-hero-stat-label">on-chain layers</span>
              </div>
              <div className="login-hero-stat">
                <span className="login-hero-stat-val">7</span>
                <span className="login-hero-stat-label">netting steps</span>
              </div>
              <div className="login-hero-stat">
                <span className="login-hero-stat-val">6</span>
                <span className="login-hero-stat-label">compliance gates</span>
              </div>
              <div className="login-hero-stat">
                <span className="login-hero-stat-val">&lt;5s</span>
                <span className="login-hero-stat-label">settlement</span>
              </div>
            </div>

            {/* Feature pills */}
            <div className="login-hero-pills">
              <span className="login-hero-pill">Notional Pooling</span>
              <span className="login-hero-pill">Chainalysis KYT</span>
              <span className="login-hero-pill">SIX Financial FX</span>
              <span className="login-hero-pill">Entra B2C</span>
              <span className="login-hero-pill">Travel Rule</span>
              <span className="login-hero-pill">Token-2022</span>
            </div>

            <div className="login-hero-network mono">
              ● Solana Devnet · 5 programs deployed · Live entity on-chain
            </div>

            {/* AMINA attribution */}
            <div className="login-hero-amina">
              <div className="login-hero-amina-logo">AMINA</div>
              <div className="login-hero-amina-text">
                Built for AMINA Bank · StableHacks 2026 · Track 2
              </div>
            </div>
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
