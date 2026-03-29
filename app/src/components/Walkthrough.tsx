/* ============================================================
   Walkthrough — Role-specific first-time onboarding overlay
   Each role gets its own step-by-step guided flow.
   Dismissal is stored per-role in localStorage.
   Page-link spans are real buttons: clicking navigates and
   closes the overlay immediately.
   ============================================================ */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WalkthroughStep {
  title: string;
  body: (navAndClose: (path: string) => void) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Shared helper — renders a pill button that navigates + closes
// ---------------------------------------------------------------------------

function PageLink({
  label,
  path,
  onClick,
}: {
  label: string;
  path: string;
  onClick: (path: string) => void;
}) {
  return (
    <button
      className="walkthrough-page-link"
      onClick={() => onClick(path)}
      title={`Go to ${label}`}
    >
      {label} →
    </button>
  );
}

// ---------------------------------------------------------------------------
// AMINA Bank Admin — 5 steps
// ---------------------------------------------------------------------------

const AMINA_STEPS: WalkthroughStep[] = [
  {
    title: "Welcome, AMINA Bank Admin",
    body: () => (
      <>
        <div className="walkthrough-role-badge">AMINA Bank Admin</div>
        <p>
          You have <strong>full platform oversight</strong> — from onboarding
          clients all the way through regulatory reporting. This guide walks you
          through the complete NEXUS demo flow.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          In Demo Mode you'll see 6 pre-registered entities, 2 active loans, and
          8 compliance events. Toggle to Live Mode anytime to start fresh.
        </p>
      </>
    ),
  },
  {
    title: "Step 1 — Onboard Client Entities",
    body: (nav) => (
      <>
        <p>
          Start by reviewing (or registering) entities. As the bank admin you
          approve all KYC requests and set mandate limits.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Open{" "}
            <PageLink
              label="Entities / All Entities"
              path="/entities"
              onClick={nav}
            />{" "}
            to view the registry
          </li>
          <li>
            Use{" "}
            <PageLink
              label="Register New Entity"
              path="/entities/register"
              onClick={nav}
            />{" "}
            to onboard a client company (4-step form)
          </li>
          <li>
            Approve KYC submissions under{" "}
            <PageLink
              label="KYC Management"
              path="/entities/kyc"
              onClick={nav}
            />
          </li>
          <li>
            Set per-entity transfer limits under{" "}
            <PageLink
              label="Mandate Controls"
              path="/entities/mandates"
              onClick={nav}
            />
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 2 — Manage the Liquidity Pool",
    body: (nav) => (
      <>
        <p>
          All verified entities are grouped into a shared liquidity pool. Review
          net positions and utilisation before running netting.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Navigate to{" "}
            <PageLink
              label="Pools / Pool Overview"
              path="/pools"
              onClick={nav}
            />
          </li>
          <li>Check the pool's net USD position and sweep threshold</li>
          <li>Confirm all members are KYC-verified before proceeding</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 3 — Run a Netting Cycle",
    body: (nav) => (
      <>
        <p>
          Trigger the 7-step on-chain netting algorithm. This settles
          cross-entity obligations and accrues interest via the Pooling Engine.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Go to{" "}
            <PageLink
              label="Netting / Run Cycle"
              path="/netting/run"
              onClick={nav}
            />
          </li>
          <li>Watch each of the 7 animated steps complete on-chain</li>
          <li>
            Review results in{" "}
            <PageLink
              label="Cycle History"
              path="/netting/history"
              onClick={nav}
            />
          </li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          Program: <span className="mono">fx-netting</span> L4
        </p>
      </>
    ),
  },
  {
    title: "Step 4 — Compliance & Reporting",
    body: (nav) => (
      <>
        <p>
          Monitor all activity through the compliance dashboard and generate the
          final audit export for regulators.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Check{" "}
            <PageLink
              label="Compliance / Live Event Feed"
              path="/compliance/events"
              onClick={nav}
            />{" "}
            for gate results
          </li>
          <li>
            Review flagged addresses in{" "}
            <PageLink label="KYT Alerts" path="/compliance/kyt" onClick={nav} />
          </li>
          <li>
            Export the full audit trail from{" "}
            <PageLink
              label="Reports / Audit Export"
              path="/reports/audit"
              onClick={nav}
            />
          </li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          You're ready — press <strong>Start</strong> to enter the dashboard.
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Corporate Treasury Admin — 5 steps
// ---------------------------------------------------------------------------

const CORPORATE_STEPS: WalkthroughStep[] = [
  {
    title: "Welcome, Corporate Treasury Admin",
    body: () => (
      <>
        <div className="walkthrough-role-badge">Corporate Treasury Admin</div>
        <p>
          You manage your company's entire NEXUS setup — registering
          subsidiaries, configuring mandate limits, running netting cycles, and
          initiating cross-border transfers.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Demo Mode shows sample entities and activity. Switch to Live Mode when
          you're ready to register your real subsidiaries.
        </p>
      </>
    ),
  },
  {
    title: "Step 1 — Register Your Subsidiaries",
    body: (nav) => (
      <>
        <p>
          Each legal entity that participates in treasury netting must be
          registered and KYC-verified.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Go to{" "}
            <PageLink
              label="Entities / Register New Entity"
              path="/entities/register"
              onClick={nav}
            />
          </li>
          <li>
            Complete the 4-step registration form (legal details, jurisdiction,
            stablecoin, mandate)
          </li>
          <li>
            Track KYC status in{" "}
            <PageLink
              label="KYC Management"
              path="/entities/kyc"
              onClick={nav}
            />
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 2 — Configure Mandate Limits",
    body: (nav) => (
      <>
        <p>
          Mandate limits control the maximum single transfer and daily aggregate
          allowed per entity — enforced on-chain by the Compliance Hook.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Open{" "}
            <PageLink
              label="Entities / Mandate Controls"
              path="/entities/mandates"
              onClick={nav}
            />
          </li>
          <li>
            Set <span className="mono">maxSingleTransfer</span> per entity
          </li>
          <li>
            Set <span className="mono">maxDailyAggregate</span> per entity
          </li>
          <li>Review current daily usage before changing limits</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 3 — Initiate Transfers",
    body: (nav) => (
      <>
        <p>
          Send stablecoin transfers between your entities or external
          counterparties. Every transfer is screened through the 6-gate
          compliance check before execution.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Navigate to{" "}
            <PageLink
              label="Transfers / Initiate Transfer"
              path="/transfers"
              onClick={nav}
            />
          </li>
          <li>Select source and destination entity</li>
          <li>Enter amount, currency, and memo</li>
          <li>Confirm the compliance gate results before submitting</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 4 — Monitor FX & Run Netting",
    body: (nav) => (
      <>
        <p>
          NEXUS nets your cross-currency obligations automatically using live FX
          rates. Check rates before triggering a cycle.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Review live rates on{" "}
            <PageLink label="FX Rates" path="/fx-rates" onClick={nav} />
          </li>
          <li>
            Trigger a cycle from{" "}
            <PageLink
              label="Netting / Run Cycle"
              path="/netting/run"
              onClick={nav}
            />
          </li>
          <li>
            Review settlement history in{" "}
            <PageLink
              label="Cycle History"
              path="/netting/history"
              onClick={nav}
            />
          </li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          You're all set — press <strong>Start</strong> to open the dashboard.
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Subsidiary Finance Manager — 4 steps
// ---------------------------------------------------------------------------

const SUBSIDIARY_STEPS: WalkthroughStep[] = [
  {
    title: "Welcome, Subsidiary Finance Manager",
    body: () => (
      <>
        <div className="walkthrough-role-badge">Subsidiary Finance Manager</div>
        <p>
          You have visibility into your entity's treasury position and can
          initiate transfers within your mandate limits. This short guide shows
          you where everything is.
        </p>
      </>
    ),
  },
  {
    title: "Step 1 — View Your Entity",
    body: (nav) => (
      <>
        <p>
          Check your entity's current balance, KYC status, and pool membership
          from the Entities section.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Go to{" "}
            <PageLink
              label="Entities / All Entities"
              path="/entities"
              onClick={nav}
            />
          </li>
          <li>Find your entity and click to expand details</li>
          <li>
            Verify KYC status is <span className="mono">verified</span> before
            transacting
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 2 — Initiate a Transfer",
    body: (nav) => (
      <>
        <p>
          You can send stablecoin transfers up to your mandate limits. The
          system will automatically check compliance before execution.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Navigate to{" "}
            <PageLink
              label="Transfers / Initiate Transfer"
              path="/transfers"
              onClick={nav}
            />
          </li>
          <li>Select your entity as the source</li>
          <li>Choose a destination and enter the amount</li>
          <li>
            Check your daily remaining limit under{" "}
            <PageLink
              label="Mandate Controls"
              path="/entities/mandates"
              onClick={nav}
            />
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 3 — Track Compliance & Dashboard",
    body: (nav) => (
      <>
        <p>
          Use the dashboard and compliance feed to monitor events related to
          your entity.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            View summary metrics on the{" "}
            <PageLink label="Dashboard" path="/" onClick={nav} />
          </li>
          <li>
            See events for your entity in{" "}
            <PageLink
              label="Compliance / Live Event Feed"
              path="/compliance/events"
              onClick={nav}
            />
          </li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          You're ready — press <strong>Start</strong> to open the dashboard.
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Compliance Officer — 5 steps
// ---------------------------------------------------------------------------

const COMPLIANCE_STEPS: WalkthroughStep[] = [
  {
    title: "Welcome, Compliance Officer",
    body: () => (
      <>
        <div className="walkthrough-role-badge">Compliance Officer</div>
        <p>
          You own KYC verification, AML monitoring, entity suspension, and
          regulatory reporting. This guide walks through your primary workflows
          in NEXUS.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          The Compliance Hook smart contract (L3) enforces 6 gates on every
          transfer — your dashboard reflects all gate outcomes in real time.
        </p>
      </>
    ),
  },
  {
    title: "Step 1 — Process KYC Submissions",
    body: (nav) => (
      <>
        <p>
          Entities cannot transact until their KYC is verified. Review pending
          submissions and approve or reject them here.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Open{" "}
            <PageLink
              label="Entities / KYC Management"
              path="/entities/kyc"
              onClick={nav}
            />
          </li>
          <li>Review pending submissions and supporting documents</li>
          <li>Approve, reject, or request more information</li>
          <li>Set KYC expiry date and assign the verification provider</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 2 — Set & Review Mandate Limits",
    body: (nav) => (
      <>
        <p>
          Mandate limits are a compliance control. Ensure all entities have
          limits appropriate to their risk profile.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Navigate to{" "}
            <PageLink
              label="Entities / Mandate Controls"
              path="/entities/mandates"
              onClick={nav}
            />
          </li>
          <li>Review single transfer and daily aggregate caps</li>
          <li>Flag any entity with unusually high limits for review</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 3 — Monitor the Live Event Feed",
    body: (nav) => (
      <>
        <p>
          Every transfer and netting action emits a compliance event. The feed
          shows gate-level results so you can see exactly what passed or was
          blocked.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Open{" "}
            <PageLink
              label="Compliance / Live Event Feed"
              path="/compliance/events"
              onClick={nav}
            />
          </li>
          <li>Filter by event type: approved / blocked / warning</li>
          <li>Drill into any event to see all 6 gate results</li>
          <li>Expand blocked events to understand the rejection reason</li>
        </ul>
      </>
    ),
  },
  {
    title: "Step 4 — KYT Alerts & Audit Export",
    body: (nav) => (
      <>
        <p>
          Know-Your-Transaction alerts flag anomalies for manual review. Once
          resolved, export the full audit trail for regulators.
        </p>
        <ul className="walkthrough-checklist">
          <li>
            Check{" "}
            <PageLink
              label="Compliance / KYT Alerts"
              path="/compliance/kyt"
              onClick={nav}
            />{" "}
            for pending reviews
          </li>
          <li>Approve, escalate, or dismiss each alert</li>
          <li>
            Generate a signed PDF/JSON audit report from{" "}
            <PageLink
              label="Reports / Audit Export"
              path="/reports/audit"
              onClick={nav}
            />
          </li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          You're all set — press <strong>Start</strong> to open the dashboard.
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Map role → steps
// ---------------------------------------------------------------------------

const ROLE_STEPS: Record<UserRole, WalkthroughStep[]> = {
  amina_admin: AMINA_STEPS,
  corporate_treasury: CORPORATE_STEPS,
  subsidiary_manager: SUBSIDIARY_STEPS,
  compliance_officer: COMPLIANCE_STEPS,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Walkthrough: React.FC = () => {
  const { isFirstVisit, markWalkthroughDone, role } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!isFirstVisit || !role) return null;

  const steps = ROLE_STEPS[role];
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  /** Navigate to a page AND close the walkthrough immediately. */
  const navAndClose = (path: string) => {
    markWalkthroughDone();
    navigate(path);
  };

  const handleNext = () => {
    if (isLast) {
      markWalkthroughDone();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const handleSkip = () => {
    markWalkthroughDone();
  };

  return (
    <div className="walkthrough-overlay">
      <div className="walkthrough-card">
        {/* Step counter */}
        <div className="walkthrough-step-counter">
          STEP {currentStep + 1} OF {steps.length}
        </div>

        {/* Step indicator dots */}
        <div className="walkthrough-step-indicator">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`walkthrough-dot${
                i === currentStep
                  ? " active"
                  : i < currentStep
                  ? " completed"
                  : ""
              }`}
            />
          ))}
        </div>

        <h2 className="walkthrough-title">{step.title}</h2>
        <div className="walkthrough-body">{step.body(navAndClose)}</div>

        <div className="walkthrough-actions">
          <button className="walkthrough-skip" onClick={handleSkip}>
            Skip walkthrough
          </button>
          <div className="flex gap-4">
            {!isFirst && (
              <button
                className="btn small walkthrough-nav-btn"
                onClick={handlePrev}
              >
                Back
              </button>
            )}
            <button
              className="btn primary walkthrough-nav-btn"
              onClick={handleNext}
            >
              {isLast ? "Start" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Walkthrough;
