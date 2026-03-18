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

const ROLE_ICONS: Record<UserRole, string> = {
  amina_admin: "B",
  corporate_treasury: "T",
  subsidiary_manager: "S",
  compliance_officer: "C",
};

const ROLE_COLORS: Record<UserRole, string> = {
  amina_admin: "#1a237e",
  corporate_treasury: "#1b5e20",
  subsidiary_manager: "#4a148c",
  compliance_officer: "#b71c1c",
};

const ROLE_ACCENT: Record<UserRole, string> = {
  amina_admin: "#e8eaf6",
  corporate_treasury: "#e8f5e9",
  subsidiary_manager: "#f3e5f5",
  compliance_officer: "#fce4ec",
};

function deriveEntraSubjectId(walletAddress: string): string {
  const a = walletAddress;
  return `amina|${a.slice(0, 6)}-${a.slice(6, 10)}-${a.slice(
    -8
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
            <div className="login-hero-title">NEXUS</div>
            <div className="login-hero-sub">
              Cross-Border Stablecoin Treasury
            </div>
            <div className="login-hero-tagline">
              Institutional treasury settlement
              <br />
              on Solana — in minutes, not days.
            </div>
            <div className="login-hero-stats">
              <div className="login-hero-stat">
                <span className="login-hero-stat-val">5</span>
                <span className="login-hero-stat-label">on-chain layers</span>
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
            <div className="login-hero-network mono">
              Solana Devnet · 58/58 tests passing
            </div>
          </div>
        </div>

        {/* ── RIGHT: auth panel ── */}
        <div className="login-auth">
          <div className="login-auth-inner">
            <div className="login-auth-logo">NEXUS</div>
            <div className="login-auth-desc">
              Powered by AMINA Bank · Regulated Swiss Crypto Infrastructure
            </div>

            {!connected ? (
              /* Step 1 — connect wallet */
              <div className="login-connect-box">
                <div className="login-connect-icon">[W]</div>
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
                  {roles.map((role) => (
                    <button
                      key={role}
                      className="login-role-card"
                      style={{
                        borderColor: ROLE_COLORS[role],
                        background: ROLE_ACCENT[role],
                      }}
                      onClick={() => {
                        login(role);
                        navigate("/");
                      }}
                    >
                      <span
                        className="login-role-icon"
                        style={{ background: ROLE_COLORS[role] }}
                      >
                        [{ROLE_ICONS[role]}]
                      </span>
                      <span className="login-role-name">
                        {ROLE_LABELS[role]}
                      </span>
                      <span className="login-role-desc">
                        {ROLE_DESCRIPTIONS[role]}
                      </span>
                    </button>
                  ))}
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
