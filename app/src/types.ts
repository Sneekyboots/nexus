/* ============================================================
   NEXUS Protocol — Core TypeScript Types
   Mirrors Rust on-chain account structs
   ============================================================ */

// --- Enums ---

export type KycStatus = "pending" | "verified" | "suspended" | "revoked";

export type JurisdictionCode =
  | "FINMA"
  | "MICA"
  | "SFC"
  | "FCA"
  | "ADGM"
  | "MAS"
  | "RBI";

export const JURISDICTION_LABELS: Record<string, string> = {
  CH: "Switzerland (FINMA)",
  AT: "Austria (FMA/MiCA)",
  DE: "Germany (BaFin/MiCA)",
  HK: "Hong Kong (SFC)",
  AE: "UAE (ADGM)",
  UK: "United Kingdom (FCA)",
  SG: "Singapore (MAS)",
  US: "United States",
  JP: "Japan",
  IN: "India (RBI)",
  FR: "France (AMF/MiCA)",
  NL: "Netherlands (DNB/MiCA)",
};

export const JURISDICTION_FLAGS: Record<string, string> = {
  CH: "🇨🇭",
  AT: "🇦🇹",
  DE: "🇩🇪",
  HK: "🇭🇰",
  AE: "🇦🇪",
  UK: "🇬🇧",
  SG: "🇸🇬",
  US: "🇺🇸",
  JP: "🇯🇵",
  IN: "🇮🇳",
  FR: "🇫🇷",
  NL: "🇳🇱",
};

export type LoanStatus =
  | "active"
  | "matured"
  | "repaid"
  | "defaulted"
  | "cancelled";

export type TransferStatus =
  | "pending"
  | "executing"
  | "completed"
  | "failed"
  | "blocked";

export type NettingStepStatus = "pending" | "running" | "completed" | "failed";

export type ComplianceEventType = "approved" | "blocked" | "warning" | "info";

// --- Roles ---

export type UserRole =
  | "amina_admin"
  | "corporate_treasury"
  | "subsidiary_manager"
  | "compliance_officer";

export const ROLE_LABELS: Record<UserRole, string> = {
  amina_admin: "AMINA Bank Admin",
  corporate_treasury: "Corporate Treasury Admin",
  subsidiary_manager: "Subsidiary Finance Manager",
  compliance_officer: "Compliance Officer",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  amina_admin:
    "Full platform oversight — onboard clients, manage all pools, run netting, generate reports",
  corporate_treasury:
    "Manage your company's NEXUS setup — add subsidiaries, set limits, run netting cycles",
  subsidiary_manager:
    "View your entity's position, initiate transfers, check compliance status",
  compliance_officer:
    "Verify KYC, monitor AML alerts, freeze entities, generate regulatory reports",
};

// --- Data Structures ---

export interface MandateLimits {
  maxSingleTransfer: number;
  maxDailyAggregate: number;
  dailyUsed: number;
  dayResetTimestamp: number;
}

export interface Entity {
  id: string;
  legalName: string;
  jurisdiction: string;
  kycStatus: KycStatus;
  kycExpiry: string;
  kycProvider?: string;
  kycVerifiedDate?: string;
  currency: string;
  stablecoin: string;
  balance: number;
  virtualOffset: number;
  effectivePosition: number;
  poolId: string;
  parentCompany: string;
  complianceOfficer: string;
  mandateLimits: MandateLimits;
  createdAt: string;
  lastVerified?: string;
  suspendedReason?: string;
  suspendedAt?: string;
  pdaAddress?: string;
}

export interface Pool {
  id: string;
  name: string;
  admin: string;
  memberCount: number;
  entityIds: string[];
  netPositionUsd: number;
  totalVirtualOffsets: number;
  sweepThreshold: number;
  interestRateApr: number;
  nettingFrequency: string;
  lastNettingTimestamp: string;
  totalOffsetsToday: number;
  activeLoans: number;
}

export interface OffsetMatch {
  id: string;
  surplusEntity: string;
  deficitEntity: string;
  surplusCurrency: string;
  deficitCurrency: string;
  surplusAmount: number;
  deficitAmount: number;
  netOffsetUsd: number;
  fxRateUsed?: number;
  timestamp: string;
  pdaAddress?: string;
}

export interface NettingStep {
  step: number;
  name: string;
  status: NettingStepStatus;
  details: string[];
  durationMs?: number;
}

export interface NettingCycle {
  id: string;
  poolId: string;
  timestamp: string;
  entityCount: number;
  offsetCount: number;
  totalOffsetUsd: number;
  interestAccrued: number;
  sweepRequired: boolean;
  steps: NettingStep[];
  offsets: OffsetMatch[];
  transactionHash?: string;
  durationMs?: number;
}

export interface ComplianceGate {
  gate: string;
  passed: boolean;
  details: string;
}

export interface ComplianceEvent {
  id: string;
  timestamp: string;
  type: ComplianceEventType;
  title: string;
  detail: string;
  entityId?: string;
  from?: string;
  to?: string;
  amount?: number;
  gateResults?: ComplianceGate[];
  certPda?: string;
}

export interface KytAlert {
  id: string;
  entityId: string;
  entityName: string;
  timestamp: string;
  issue: string;
  detail: string;
  currentValue: number;
  threshold: number;
  status: "pending_review" | "approved" | "escalated" | "dismissed";
}

export interface Transfer {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  amount: number;
  currency: string;
  amountUsd: number;
  memo: string;
  reference: string;
  status: TransferStatus;
  timestamp: string;
  gateResults?: ComplianceGate[];
  transactionHash?: string;
  blockReason?: string;
}

export interface FxRate {
  pair: string;
  rate: number;
  bid: number;
  ask: number;
  change24h: number;
  lastUpdated: string;
  stale: boolean;
  source: string;
}

export interface FxRateHistory {
  pair: string;
  timestamp: string;
  rate: number;
}

export interface Loan {
  id: string;
  lenderEntityId: string;
  borrowerEntityId: string;
  principal: number;
  currency: string;
  interestRateBps: number;
  interestRateApr: number;
  termDays: number;
  originationDate: string;
  maturityDate: string;
  daysOutstanding: number;
  interestAccrued: number;
  totalDue: number;
  outstandingBalance: number;
  status: LoanStatus;
  complianceCertPda?: string;
  aminaRef?: string;
  transactionHash?: string;
}

export interface LayerStatus {
  layer: number;
  name: string;
  programId: string;
  status: "live" | "degraded" | "down";
  detail: string;
}

// --- Navigation ---

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
  roles?: UserRole[];
}
