/* ============================================================
   AppLayout — Sidebar nav + header bar + content area
   Role-differentiated sidebar: each role sees only their pages,
   with a distinct role badge and colour.
   ============================================================ */

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNexus } from "../hooks/useNexus";
import { NAV_ITEMS, SOLANA_EXPLORER_URL } from "../constants";
import type { NavItem, UserRole } from "../types";
import Walkthrough from "../components/Walkthrough";
import DemoRunner from "../components/DemoRunner";
import TestConsole from "../components/TestConsole";

// ---------------------------------------------------------------------------
// Role metadata — badge colour + short label + description shown in sidebar
// ---------------------------------------------------------------------------

const ROLE_META: Record<
  UserRole,
  { color: string; bg: string; label: string; scope: string }
> = {
  amina_admin: {
    color: "#1a1a2e",
    bg: "#ffd166",
    label: "AMINA Admin",
    scope: "Full platform access",
  },
  corporate_treasury: {
    color: "#fff",
    bg: "#2563eb",
    label: "Corp Treasury",
    scope: "Entities · Pools · Netting",
  },
  subsidiary_manager: {
    color: "#fff",
    bg: "#059669",
    label: "Subsidiary Mgr",
    scope: "Transfers · Compliance",
  },
  compliance_officer: {
    color: "#fff",
    bg: "#7c3aed",
    label: "Compliance",
    scope: "KYC · AML · Reports",
  },
};

// ---------------------------------------------------------------------------
// Icon renderer — icons are SVG strings, render via innerHTML
// ---------------------------------------------------------------------------

const NavIcon: React.FC<{ svg: string; label: string }> = ({ svg, label }) => (
  <span
    className="nav-icon"
    aria-label={label}
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: svg }}
  />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AppLayout: React.FC = () => {
  const { role, displayName, walletAddress, logout } = useAuth();
  const { solanaStatus, layerStatus, isDemoMode, toggleDemoMode } = useNexus();
  const navigate = useNavigate();

  // Start with all groups open
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(NAV_ITEMS.filter((n) => n.children).map((n) => n.path))
  );

  const toggleGroup = (path: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  const explorerUrl = walletAddress
    ? `${SOLANA_EXPLORER_URL}/address/${walletAddress}?cluster=devnet`
    : null;

  const meta = role ? ROLE_META[role] : null;

  // Returns true if this role is allowed to see this nav item
  const roleCanSee = (item: NavItem) =>
    !item.roles ||
    item.roles.length === 0 ||
    !role ||
    item.roles.includes(role);

  const renderNavItem = (item: NavItem, isChild = false): React.ReactNode => {
    if (!roleCanSee(item)) return null;

    if (item.children && !isChild) {
      const isExpanded = expandedGroups.has(item.path);
      const visibleChildren = item.children.filter(roleCanSee);
      if (visibleChildren.length === 0) return null;

      return (
        <div className="nav-group" key={item.path}>
          <button
            className="nav-item nav-group-toggle"
            onClick={() => toggleGroup(item.path)}
            type="button"
          >
            <NavIcon svg={item.icon} label={item.label} />
            <span className="nav-label">{item.label}</span>
            <span className="nav-chevron">{isExpanded ? "▾" : "▸"}</span>
          </button>
          {isExpanded && (
            <div className="nav-children">
              {visibleChildren.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end
        className={({ isActive }) =>
          `nav-item${isChild ? " nav-child-item" : ""}${
            isActive ? " active" : ""
          }`
        }
      >
        <NavIcon svg={item.icon} label={item.label} />
        <span className="nav-label">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="app-layout">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <h1>NEXUS</h1>
          <div className="subtitle">Cross-Border Treasury</div>
        </div>

        {/* Role badge — unique per role */}
        {meta && (
          <div
            className="sidebar-role-badge"
            style={{ background: meta.bg, color: meta.color }}
          >
            <span className="sidebar-role-badge-label">{meta.label}</span>
            <span className="sidebar-role-badge-scope">{meta.scope}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => renderNavItem(item))}
        </nav>

        {/* Wallet + logout */}
        <div className="sidebar-user">
          <div className="sidebar-display-name">{displayName}</div>
          {truncatedWallet && (
            <div className="sidebar-wallet-row">
              <span className="wallet-connected-dot" />
              {explorerUrl ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono sidebar-wallet-addr"
                  title={walletAddress ?? ""}
                >
                  {truncatedWallet}
                </a>
              ) : (
                <span className="mono sidebar-wallet-addr">
                  {truncatedWallet}
                </span>
              )}
            </div>
          )}
          <button
            className="sketch-btn small"
            style={{ marginTop: 8, width: "100%" }}
            onClick={handleLogout}
          >
            Switch Role / Logout
          </button>
        </div>

        {/* Layer status pills */}
        <div className="sidebar-footer">
          <div className="layer-bar">
            {layerStatus.slice(0, 5).map((l) => (
              <span className="layer-pill" key={l.layer} title={l.name}>
                <span className={`layer-dot ${l.status}`} />L{l.layer}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11 }}>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: solanaStatus?.connected ? "#66bb6a" : "#ef5350",
                marginRight: 4,
                verticalAlign: "middle",
              }}
            />
            {solanaStatus?.connected ? "Devnet Connected" : "Disconnected"}
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="main-content">
        {/* Header bar */}
        <div className="header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className={`status-dot ${
                solanaStatus?.connected ? "connected" : "disconnected"
              }`}
            />
            <span style={{ fontSize: 13 }}>
              {solanaStatus?.network || "Connecting..."}
            </span>
          </div>

          <div className="header-wallet-info">
            {/* Demo / Live toggle */}
            <div
              className="demo-mode-toggle"
              title={
                isDemoMode
                  ? "Switch to Live Mode — start with empty state"
                  : "Switch to Demo Mode — view sample data"
              }
            >
              <span
                className={`demo-toggle-label ${!isDemoMode ? "active" : ""}`}
              >
                LIVE
              </span>
              <button
                className={`demo-toggle-track ${isDemoMode ? "demo" : "live"}`}
                onClick={toggleDemoMode}
                type="button"
                aria-label="Toggle demo/live mode"
              >
                <span className="demo-toggle-thumb" />
              </button>
              <span
                className={`demo-toggle-label ${isDemoMode ? "active" : ""}`}
              >
                DEMO
              </span>
            </div>

            {truncatedWallet && (
              <span className="header-wallet-badge">
                <span className="wallet-connected-dot" />
                <span className="mono">{truncatedWallet}</span>
              </span>
            )}

            {/* Role chip in header */}
            {meta && (
              <span
                className="header-role-chip"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            )}
          </div>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="demo-mode-banner">
            <span className="mono">[DEMO]</span> Showing sample data — 6
            entities, 2 loans, 8 compliance events.{" "}
            <button className="demo-banner-link" onClick={toggleDemoMode}>
              Switch to LIVE MODE
            </button>{" "}
            to start fresh.
          </div>
        )}

        <Outlet />
      </div>

      {/* First-time walkthrough overlay */}
      <Walkthrough />

      {/* Demo runner widget */}
      <DemoRunner />

      {/* Test console for manual testing */}
      <TestConsole />
    </div>
  );
};

export default AppLayout;
