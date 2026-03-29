/* ============================================================
   PAGE 4 — Register Entity (4-step wizard)
   Steps: Basic Info -> Jurisdiction -> KYC -> Mandate Limits -> Review
   ============================================================ */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNexus } from "../../hooks/useNexus";
import { JURISDICTION_LABELS, JURISDICTION_FLAGS } from "../../types";
import { CURRENCIES, STABLECOINS } from "../../constants";
import {
  hashDocument,
  generateZKProof,
  verifyZKProof,
  getZKExplanation,
  ZKProof,
} from "../../services/zkService";
import DataNotification from "../../components/DataNotification";

const STEPS = [
  "Company Details",
  "Jurisdiction & Currency",
  "Compliance Setup",
  "Mandate Limits",
];

const ZK_STEPS = [
  { id: "hash", label: "Hashing document" },
  { id: "prove", label: "Generating proof" },
  { id: "verify", label: "Verifying proof" },
];

const RegisterEntity: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { registerEntity, addEntityToPool } = useNexus();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [zkVerified, setZkVerified] = useState(false);
  const [generatingZK, setGeneratingZK] = useState(false);
  const [zkStep, setZkStep] = useState<string | null>(null);
  const [zkError, setZkError] = useState<string | null>(null);
  const [showZKExplanation, setShowZKExplanation] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(false);
  const [zkExplanation] = useState(getZKExplanation());
  const [notification, setNotification] = useState<{
    message: string;
    type: "added" | "updated";
  } | null>(null);
  const [form, setForm] = useState({
    legalName: "",
    parentCompany: "TechCorp Global",
    jurisdiction: "CH",
    currency: "CHF",
    stablecoin: "USDC",
    documentType: "passport",
    documentNumber: "",
    companyRegNumber: "",
    addressCountry: "CH",
    maxSingleTransfer: 250000,
    maxDailyAggregate: 1000000,
    addToPool: true,
  });

  const [validation, setValidation] = useState<Record<string, string>>({});

  const set = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validateStep = () => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!form.legalName.trim()) errors.legalName = "Legal name is required";
      if (!form.parentCompany.trim())
        errors.parentCompany = "Parent company is required";
    } else if (step === 1) {
      if (!form.jurisdiction) errors.jurisdiction = "Jurisdiction is required";
      if (!form.currency) errors.currency = "Currency is required";
    } else if (step === 2) {
      if (!form.documentNumber.trim())
        errors.documentNumber = "Document number is required";
      if (!form.companyRegNumber.trim())
        errors.companyRegNumber = "Company registration number is required";
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const canNext = () => {
    if (step === 0)
      return (
        form.legalName.trim().length > 0 && form.parentCompany.trim().length > 0
      );
    if (step === 1) return form.jurisdiction && form.currency;
    if (step === 2)
      return (
        form.documentNumber.trim().length > 0 &&
        form.companyRegNumber.trim().length > 0
      );
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleGenerateZKProof = async () => {
    setGeneratingZK(true);
    setZkError(null);
    setZkStep("hash");

    try {
      await new Promise((r) => setTimeout(r, 500));
      setZkStep("prove");
      await new Promise((r) => setTimeout(r, 300));

      const proof = await generateZKProof({
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        companyRegNumber: form.companyRegNumber,
        addressCountry: form.addressCountry,
      });

      setZkStep("verify");
      await new Promise((r) => setTimeout(r, 300));

      const isValid = await verifyZKProof(proof, proof.documentHash);
      setZkVerified(isValid);
      setZkProof(proof);

      setNotification({
        message: "ZK Proof generated and verified",
        type: "added",
      });
    } catch (err) {
      setZkError(`ZK Proof generation failed: ${String(err)}`);
    } finally {
      setGeneratingZK(false);
      setZkStep(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({ message: "Copied to clipboard", type: "updated" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (zkProof) {
        console.log("ZK Proof for registration:", {
          documentHash: zkProof.documentHash,
          proof: zkProof.proof,
          publicSignals: zkProof.publicSignals,
          generatedAt: new Date(zkProof.generatedAt).toISOString(),
        });
      }
      const entity = await registerEntity({
        legalName: form.legalName,
        parentCompany: form.parentCompany,
        jurisdiction: form.jurisdiction,
        currency: form.currency,
        stablecoin: form.stablecoin,
        complianceOfficer: publicKey?.toBase58() || "",
        kycProvider: "zk-onchain",
        kycVerifiedDate: zkProof ? new Date().toISOString() : undefined,
        mandateLimits: {
          maxSingleTransfer: form.maxSingleTransfer,
          maxDailyAggregate: form.maxDailyAggregate,
          dailyUsed: 0,
          dayResetTimestamp: Date.now(),
        },
      });
      if (form.addToPool) {
        await addEntityToPool(entity.id, "pool-alpha");
      }
      setNotification({
        message: `${form.legalName} registered successfully`,
        type: "added",
      });
      setTimeout(() => navigate("/entities"), 1500);
    } catch (err) {
      setError(`Registration failed: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className="step-indicator-track">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`step-indicator-item ${i === step ? "active" : ""} ${
              i < step ? "completed" : ""
            }`}
          >
            <div className="step-indicator-dot">{i < step ? "✓" : i + 1}</div>
            <div className="step-indicator-label">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderZKProofSection = () => (
    <div
      className="card"
      style={{
        background: "rgba(139, 92, 246, 0.05)",
        border: "1px solid var(--accent-purple)",
        marginTop: 16,
        padding: 16,
      }}
    >
      <div className="flex-between mb-12">
        <div
          className="mono text-xs"
          style={{ color: "var(--accent-purple)", fontWeight: 600 }}
        >
          ZERO-KNOWLEDGE PROOF KYC
        </div>
        {zkVerified && (
          <span
            className="badge"
            style={{ background: "var(--accent-green)", color: "white" }}
          >
            Verified ✓
          </span>
        )}
      </div>

      {generatingZK && zkStep && (
        <div className="zk-progress">
          {ZK_STEPS.map((zstep, i) => (
            <div
              key={zstep.id}
              className={`zk-progress-step ${
                zkStep === zstep.id ? "active" : ""
              } ${
                ZK_STEPS.findIndex((z) => z.id === zkStep) > i ? "done" : ""
              }`}
            >
              <div className="zk-progress-dot">
                {ZK_STEPS.findIndex((z) => z.id === zkStep) > i ? "✓" : i + 1}
              </div>
              <div className="zk-progress-label">{zstep.label}</div>
            </div>
          ))}
        </div>
      )}

      {zkProof ? (
        <div>
          <div className="zk-proof-success">
            <div className="flex items-center gap-4 mb-8">
              <span
                className="badge"
                style={{ background: "var(--accent-green)", color: "white" }}
              >
                ✓ Generated
              </span>
              {zkVerified && (
                <span
                  className="badge"
                  style={{ background: "var(--accent-blue)", color: "white" }}
                >
                  Verified
                </span>
              )}
            </div>
            <div className="mono text-xs mb-4">
              <div className="flex-between">
                <span className="text-muted">Document Hash:</span>
                <span>{zkProof.documentHash.slice(0, 20)}...</span>
              </div>
            </div>

            <button
              className="btn small"
              onClick={() => setShowProofDetails(!showProofDetails)}
            >
              {showProofDetails ? "Hide" : "View"} Full Proof Details
            </button>

            {showProofDetails && (
              <div className="zk-proof-details mt-12">
                <div className="form-group">
                  <label>Document Hash</label>
                  <div className="flex items-center gap-4">
                    <input
                      className="input mono"
                      value={zkProof.documentHash}
                      readOnly
                      style={{ fontSize: 11 }}
                    />
                    <button
                      className="btn small"
                      onClick={() => copyToClipboard(zkProof.documentHash)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Proof</label>
                  <div className="flex items-center gap-4">
                    <input
                      className="input mono"
                      value={JSON.stringify(zkProof.proof)}
                      readOnly
                      style={{ fontSize: 11 }}
                    />
                    <button
                      className="btn small"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(zkProof.proof))
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label>Public Signals</label>
                  <div className="flex items-center gap-4">
                    <input
                      className="input mono"
                      value={zkProof.publicSignals.join(", ")}
                      readOnly
                      style={{ fontSize: 11 }}
                    />
                    <button
                      className="btn small"
                      onClick={() =>
                        copyToClipboard(zkProof.publicSignals.join(", "))
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <button
            className="btn primary mt-8"
            onClick={handleGenerateZKProof}
            disabled={
              generatingZK || !form.documentNumber || !form.companyRegNumber
            }
          >
            {generatingZK ? "Generating..." : "Generate ZK Proof"}
          </button>
          {(!form.documentNumber || !form.companyRegNumber) && (
            <div className="text-xs text-muted mt-8">
              Enter document details above first
            </div>
          )}
        </>
      )}

      {zkError && <div className="text-red mt-8 mono text-xs">{zkError}</div>}

      <button
        className="btn small mt-12"
        onClick={() => setShowZKExplanation(!showZKExplanation)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          color: "var(--accent-blue)",
        }}
      >
        {showZKExplanation ? "Hide" : "How does ZK-KYC work?"}
      </button>

      {showZKExplanation && (
        <div className="zk-explanation mt-12">
          <h4>{zkExplanation.title}</h4>
          <div className="step-list">
            {zkExplanation.steps.map((s, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{i + 1}</div>
                <div className="step-body">
                  <div className="step-name">{s.title}</div>
                  <div className="step-details">{s.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="zk-benefits mt-12">
            <strong>Benefits:</strong>
            <ul>
              {zkExplanation.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="review-card">
      <h3 className="mb-16">Review & Confirm</h3>
      <div className="review-section">
        <h4>Company Details</h4>
        <div className="review-grid">
          <div>
            <span className="text-muted">Legal Name:</span>{" "}
            <strong>{form.legalName}</strong>
          </div>
          <div>
            <span className="text-muted">Parent Company:</span>{" "}
            <strong>{form.parentCompany}</strong>
          </div>
        </div>
      </div>
      <div className="review-section">
        <h4>Jurisdiction & Currency</h4>
        <div className="review-grid">
          <div>
            <span className="text-muted">Jurisdiction:</span>{" "}
            {JURISDICTION_FLAGS[form.jurisdiction]} {form.jurisdiction}
          </div>
          <div>
            <span className="text-muted">Currency:</span> {form.currency}
          </div>
          <div>
            <span className="text-muted">Stablecoin:</span> {form.stablecoin}
          </div>
        </div>
      </div>
      <div className="review-section">
        <h4>Compliance</h4>
        <div className="review-grid">
          <div>
            <span className="text-muted">Document Type:</span>{" "}
            {form.documentType}
          </div>
          <div>
            <span className="text-muted">Document #:</span>{" "}
            {form.documentNumber}
          </div>
          <div>
            <span className="text-muted">ZK Proof:</span>{" "}
            {zkProof ? (
              <span
                className="badge"
                style={{ background: "var(--accent-green)", color: "white" }}
              >
                Generated
              </span>
            ) : (
              <span className="text-muted">Not generated</span>
            )}
          </div>
        </div>
      </div>
      <div className="review-section mb-0">
        <h4>Mandate Limits</h4>
        <div className="review-grid">
          <div>
            <span className="text-muted">Max Single Transfer:</span> $
            {form.maxSingleTransfer.toLocaleString()}
          </div>
          <div>
            <span className="text-muted">Max Daily Aggregate:</span> $
            {form.maxDailyAggregate.toLocaleString()}
          </div>
          <div>
            <span className="text-muted">Add to Pool:</span>{" "}
            {form.addToPool ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {notification && (
        <DataNotification
          message={notification.message}
          type={notification.type}
        />
      )}

      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">NEXUS</Link> / <Link to="/entities">Entities</Link> /
          Register New Entity
        </div>
        <h2>Register New Entity</h2>
      </div>

      <div className="page-body">
        {error && (
          <div
            className="card"
            style={{ borderColor: "var(--accent-red)", marginBottom: 16 }}
          >
            <div className="text-red mono text-sm">{error}</div>
          </div>
        )}

        {renderStepIndicator()}

        <div className="card" style={{ maxWidth: 700 }}>
          <h3>
            Step {step + 1}: {STEPS[step]}
          </h3>

          {step === 0 && (
            <>
              <div className="form-group">
                <label>
                  Legal Entity Name{" "}
                  {validation.legalName && <span className="text-red">*</span>}
                </label>
                <input
                  className={`input ${
                    validation.legalName ? "input-error" : ""
                  }`}
                  placeholder="e.g. TechCorp AG"
                  value={form.legalName}
                  onChange={(e) => set("legalName", e.target.value)}
                />
                {validation.legalName && (
                  <div className="field-error">{validation.legalName}</div>
                )}
              </div>
              <div className="form-group">
                <label>
                  Parent Company{" "}
                  {validation.parentCompany && (
                    <span className="text-red">*</span>
                  )}
                </label>
                <input
                  className={`input ${
                    validation.parentCompany ? "input-error" : ""
                  }`}
                  value={form.parentCompany}
                  onChange={(e) => set("parentCompany", e.target.value)}
                />
                {validation.parentCompany && (
                  <div className="field-error">{validation.parentCompany}</div>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="form-group">
                <label>Jurisdiction</label>
                <select
                  className="select"
                  value={form.jurisdiction}
                  onChange={(e) => set("jurisdiction", e.target.value)}
                >
                  {Object.entries(JURISDICTION_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {JURISDICTION_FLAGS[code]} {code} — {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Operating Currency</label>
                  <select
                    className="select"
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stablecoin</label>
                  <select
                    className="select"
                    value={form.stablecoin}
                    onChange={(e) => set("stablecoin", e.target.value)}
                  >
                    {STABLECOINS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Identity Document Type</label>
                <select
                  className="select"
                  value={form.documentType}
                  onChange={(e) => set("documentType", e.target.value)}
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Document Number{" "}
                  {validation.documentNumber && (
                    <span className="text-red">*</span>
                  )}
                </label>
                <input
                  className={`input ${
                    validation.documentNumber ? "input-error" : ""
                  }`}
                  placeholder="e.g. AB1234567"
                  value={form.documentNumber}
                  onChange={(e) => set("documentNumber", e.target.value)}
                />
                {validation.documentNumber && (
                  <div className="field-error">{validation.documentNumber}</div>
                )}
              </div>
              <div className="form-group">
                <label>
                  Company Registration Number{" "}
                  {validation.companyRegNumber && (
                    <span className="text-red">*</span>
                  )}
                </label>
                <input
                  className={`input ${
                    validation.companyRegNumber ? "input-error" : ""
                  }`}
                  placeholder="e.g. 202012345A"
                  value={form.companyRegNumber}
                  onChange={(e) => set("companyRegNumber", e.target.value)}
                />
                {validation.companyRegNumber && (
                  <div className="field-error">
                    {validation.companyRegNumber}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Proof of Address (Country)</label>
                <select
                  className="select"
                  value={form.addressCountry}
                  onChange={(e) => set("addressCountry", e.target.value)}
                >
                  {Object.entries(JURISDICTION_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {renderZKProofSection()}

              <div className="form-group mt-16">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.addToPool}
                    onChange={(e) => set("addToPool", e.target.checked)}
                  />
                  Add to TechCorp Global Pool after registration
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Max Single Transfer (USD)</label>
                <input
                  className="input"
                  type="number"
                  value={form.maxSingleTransfer}
                  onChange={(e) =>
                    set("maxSingleTransfer", Number(e.target.value))
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Daily Aggregate (USD)</label>
                <input
                  className="input"
                  type="number"
                  value={form.maxDailyAggregate}
                  onChange={(e) =>
                    set("maxDailyAggregate", Number(e.target.value))
                  }
                />
              </div>
              <div className="mono text-xs text-muted">
                These limits are enforced on-chain via the Compliance Hook
                program (Gate 5: Daily Limit, Gate 6: Single Transfer).
              </div>
            </>
          )}

          {step === 4 && renderReviewStep()}

          <div className="flex-between mt-20">
            <button
              className="btn"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn primary"
                disabled={!canNext()}
                onClick={handleNext}
              >
                Next
              </button>
            ) : step === 4 ? (
              <button
                className="btn primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Registering..." : "Confirm & Register"}
              </button>
            ) : (
              <button
                className="btn primary"
                disabled={!canNext() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Registering..." : "Register Entity"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterEntity;
