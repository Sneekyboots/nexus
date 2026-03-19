/* ============================================================
   NEXUS Protocol — Constants
   Program IDs, RPC config, navigation structure
   ============================================================ */

import type { NavItem } from "./types";

// Deployed program IDs on Solana devnet
// Source of truth: declare_id! in each program's src/lib.rs
export const PROGRAM_IDS = {
  entityRegistry: "HGng9ZUzYAZjXZRiBK4SZMBvGQr4AQ5HQdvFrewjoYvH",
  poolingEngine: "CrZx1Hu4FzSyzWyErTfXxp6SjvdVMqHczKhS4JZT3Uyk",
  complianceHook: "8pkK2b3z3snCMhPezxhBmzgrfTN3LoLqiseFxinCZzpM",
  fxNetting: "4qmYB7nEG4rebpXhaffnH5LvemGcxGVvN5LGjg4a78ej",
  sweepTrigger: "2p4tp4WxiaD3jNaBeVGJB9gwaBsfm7kSeLfeeVKz5DSk",
} as const;

export const SOLANA_RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";
export const FX_ORACLE_URL =
  import.meta.env.VITE_FX_ORACLE_URL || "http://localhost:7070";
export const SOLANA_EXPLORER_URL = "https://explorer.solana.com";

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "AED",
  "CHF",
  "HKD",
] as const;
export const STABLECOINS = ["USDC", "EURC", "GBPC"] as const;

// ---------------------------------------------------------------------------
// SVG icon helpers (inline, no external deps)
// Each returns a small 16×16 SVG string for dangerouslySetInnerHTML
// ---------------------------------------------------------------------------
const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

export const ICONS = {
  // Dashboard — grid of 4 squares
  dashboard: svg(
    "<rect x='3' y='3' width='7' height='7'/><rect x='14' y='3' width='7' height='7'/><rect x='14' y='14' width='7' height='7'/><rect x='3' y='14' width='7' height='7'/>"
  ),
  // Entities — people / org
  entities: svg(
    "<path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/>"
  ),
  // Register — plus in circle
  register: svg(
    "<circle cx='12' cy='12' r='9'/><line x1='12' y1='8' x2='12' y2='16'/><line x1='8' y1='12' x2='16' y2='12'/>"
  ),
  // KYC — shield with check
  kyc: svg(
    "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><polyline points='9 12 11 14 15 10'/>"
  ),
  // Mandates — sliders
  mandates: svg(
    "<line x1='4' y1='21' x2='4' y2='14'/><line x1='4' y1='10' x2='4' y2='3'/><line x1='12' y1='21' x2='12' y2='12'/><line x1='12' y1='8' x2='12' y2='3'/><line x1='20' y1='21' x2='20' y2='16'/><line x1='20' y1='12' x2='20' y2='3'/><line x1='1' y1='14' x2='7' y2='14'/><line x1='9' y1='8' x2='15' y2='8'/><line x1='17' y1='16' x2='23' y2='16'/>"
  ),
  // Pools — layers/stack
  pools: svg(
    "<polygon points='12 2 2 7 12 12 22 7 12 2'/><polyline points='2 17 12 22 22 17'/><polyline points='2 12 12 17 22 12'/>"
  ),
  // Netting — arrows forming a cycle
  netting: svg(
    "<polyline points='17 1 21 5 17 9'/><path d='M3 11V9a4 4 0 0 1 4-4h14'/><polyline points='7 23 3 19 7 15'/><path d='M21 13v2a4 4 0 0 1-4 4H3'/>"
  ),
  // Transfers — arrow right
  transfers: svg(
    "<line x1='5' y1='12' x2='19' y2='12'/><polyline points='12 5 19 12 12 19'/>"
  ),
  // Compliance — eye
  compliance: svg(
    "<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/>"
  ),
  // KYT Alerts — alert triangle
  kyt: svg(
    "<path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>"
  ),
  // FX Rates — dollar/currency
  fx: svg(
    "<line x1='12' y1='1' x2='12' y2='23'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/>"
  ),
  // Loans — credit card
  loans: svg(
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'/><line x1='1' y1='10' x2='23' y2='10'/>"
  ),
  // Reports — file with lines
  reports: svg(
    "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/>"
  ),
  // Sub-item arrow
  child: svg("<polyline points='9 18 15 12 9 6'/>"),
  // History clock
  history: svg(
    "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>"
  ),
};

// ---------------------------------------------------------------------------
// Navigation — role-gated, every item has a proper SVG icon
//
// Roles:
//   amina_admin          — full access
//   corporate_treasury   — entities, pools, netting, transfers, fx, loans
//   subsidiary_manager   — entities (read), transfers, compliance feed, dashboard
//   compliance_officer   — entities (kyc+mandates), compliance, reports
// ---------------------------------------------------------------------------

export const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: ICONS.dashboard,
    // all roles see the dashboard
  },
  {
    path: "/entities",
    label: "Entities",
    icon: ICONS.entities,
    children: [
      {
        path: "/entities",
        label: "All Entities",
        icon: ICONS.child,
        // all roles
      },
      {
        path: "/entities/register",
        label: "Register New",
        icon: ICONS.register,
        roles: ["amina_admin", "corporate_treasury"],
      },
      {
        path: "/entities/kyc",
        label: "KYC Management",
        icon: ICONS.kyc,
        roles: ["amina_admin", "compliance_officer"],
      },
      {
        path: "/entities/mandates",
        label: "Mandate Controls",
        icon: ICONS.mandates,
        roles: ["amina_admin", "corporate_treasury", "compliance_officer"],
      },
    ],
  },
  {
    path: "/pools",
    label: "Pools",
    icon: ICONS.pools,
    roles: ["amina_admin", "corporate_treasury"],
    children: [
      {
        path: "/pools",
        label: "Pool Overview",
        icon: ICONS.child,
        roles: ["amina_admin", "corporate_treasury"],
      },
    ],
  },
  {
    path: "/netting",
    label: "Netting",
    icon: ICONS.netting,
    roles: ["amina_admin", "corporate_treasury"],
    children: [
      {
        path: "/netting/run",
        label: "Run Cycle",
        icon: ICONS.child,
        roles: ["amina_admin", "corporate_treasury"],
      },
      {
        path: "/netting/history",
        label: "Cycle History",
        icon: ICONS.history,
        roles: ["amina_admin", "corporate_treasury"],
      },
    ],
  },
  {
    path: "/transfers",
    label: "Transfers",
    icon: ICONS.transfers,
    roles: ["amina_admin", "corporate_treasury", "subsidiary_manager"],
    children: [
      {
        path: "/transfers",
        label: "Initiate Transfer",
        icon: ICONS.child,
        roles: ["amina_admin", "corporate_treasury", "subsidiary_manager"],
      },
    ],
  },
  {
    path: "/compliance",
    label: "Compliance",
    icon: ICONS.compliance,
    roles: ["amina_admin", "compliance_officer", "subsidiary_manager"],
    children: [
      {
        path: "/compliance",
        label: "Live Event Feed",
        icon: ICONS.child,
        roles: ["amina_admin", "compliance_officer", "subsidiary_manager"],
      },
      {
        path: "/compliance/kyt",
        label: "KYT Alerts",
        icon: ICONS.kyt,
        roles: ["amina_admin", "compliance_officer"],
      },
    ],
  },
  {
    path: "/fx",
    label: "FX Rates",
    icon: ICONS.fx,
    roles: ["amina_admin", "corporate_treasury"],
  },
  {
    path: "/loans",
    label: "Loans",
    icon: ICONS.loans,
    roles: ["amina_admin", "corporate_treasury"],
    children: [
      {
        path: "/loans",
        label: "Active Loans",
        icon: ICONS.child,
        roles: ["amina_admin", "corporate_treasury"],
      },
    ],
  },
  {
    path: "/reports",
    label: "Reports",
    icon: ICONS.reports,
    roles: ["amina_admin", "compliance_officer"],
  },
];
