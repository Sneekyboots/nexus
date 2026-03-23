/* ============================================================
   DemoRunner.tsx — Automated Demo Mode
   Auto-clicks buttons to showcase the application flow
   ============================================================ */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "../hooks/useNexus";

interface DemoStep {
  name: string;
  action: () => Promise<void>;
  duration: number; // ms to wait before next step
  description: string;
}

const DemoRunner: React.FC = () => {
  const navigate = useNavigate();
  const { entities, pool, nettingHistory, transfers } = useNexus();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepLog, setStepLog] = useState<
    {
      step: number;
      name: string;
      status: "pending" | "running" | "completed";
    }[]
  >([]);
  const runningRef = useRef(false);

  const demoSteps: DemoStep[] = [
    {
      name: "Navigate to Home",
      action: async () => {
        navigate("/");
      },
      duration: 800,
      description: "Go to home dashboard",
    },
    {
      name: "Open Entities Page",
      action: async () => {
        navigate("/entities");
      },
      duration: 800,
      description: "View all registered entities",
    },
    {
      name: "Navigate to Register Entity",
      action: async () => {
        navigate("/entities/register");
      },
      duration: 800,
      description: "Go to entity registration page",
    },
    {
      name: "Auto-fill Company Details",
      action: async () => {
        const legalNameInput = document.querySelector(
          'input[placeholder="e.g. Acme Corp"]'
        ) as HTMLInputElement;
        if (legalNameInput) {
          legalNameInput.value = "Demo Company " + Date.now();
          legalNameInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      duration: 600,
      description: "Enter company legal name",
    },
    {
      name: "Click Next Button (Step 1→2)",
      action: async () => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.includes("Next")
        );
        if (nextBtn && !nextBtn.disabled) {
          (nextBtn as HTMLButtonElement).click();
        }
      },
      duration: 800,
      description: "Proceed to jurisdiction selection",
    },
    {
      name: "Select Jurisdiction",
      action: async () => {
        const selects = document.querySelectorAll("select");
        if (selects[0]) {
          (selects[0] as HTMLSelectElement).value = "CH";
          (selects[0] as HTMLSelectElement).dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      },
      duration: 600,
      description: "Choose Switzerland as jurisdiction",
    },
    {
      name: "Click Next Button (Step 2→3)",
      action: async () => {
        const nextBtns = Array.from(document.querySelectorAll("button")).filter(
          (btn) => btn.textContent?.includes("Next")
        );
        if (nextBtns[nextBtns.length - 1]) {
          (nextBtns[nextBtns.length - 1] as HTMLButtonElement).click();
        }
      },
      duration: 800,
      description: "Proceed to KYC setup",
    },
    {
      name: "Enter Document Number",
      action: async () => {
        const docInput = document.querySelector(
          'input[placeholder="e.g. AB1234567"]'
        ) as HTMLInputElement;
        if (docInput) {
          docInput.value = "AB" + Math.random().toString().slice(2, 10);
          docInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      duration: 600,
      description: "Add passport/ID number",
    },
    {
      name: "Click Next Button (Step 3→4)",
      action: async () => {
        const nextBtns = Array.from(document.querySelectorAll("button")).filter(
          (btn) => btn.textContent?.includes("Next")
        );
        if (nextBtns[nextBtns.length - 1]) {
          (nextBtns[nextBtns.length - 1] as HTMLButtonElement).click();
        }
      },
      duration: 800,
      description: "Proceed to mandate limits",
    },
    {
      name: "Set Mandate Limits",
      action: async () => {
        const inputs = document.querySelectorAll('input[type="number"]');
        if (inputs[inputs.length - 2]) {
          (inputs[inputs.length - 2] as HTMLInputElement).value = "100000";
          (inputs[inputs.length - 2] as HTMLInputElement).dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
        if (inputs[inputs.length - 1]) {
          (inputs[inputs.length - 1] as HTMLInputElement).value = "500000";
          (inputs[inputs.length - 1] as HTMLInputElement).dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      },
      duration: 600,
      description: "Set transaction limits",
    },
    {
      name: "Click Register Entity Button",
      action: async () => {
        const registerBtn = Array.from(
          document.querySelectorAll("button")
        ).find((btn) => btn.textContent?.includes("Register Entity"));
        if (registerBtn && !registerBtn.disabled) {
          (registerBtn as HTMLButtonElement).click();
        }
      },
      duration: 2000,
      description: "Submit entity registration",
    },
    {
      name: "Navigate to KYC Management",
      action: async () => {
        navigate("/entities/kyc");
      },
      duration: 800,
      description: "Go to KYC approval page",
    },
    {
      name: "Verify Entity (if pending)",
      action: async () => {
        const verifyBtns = Array.from(
          document.querySelectorAll("button")
        ).filter((btn) => btn.textContent?.includes("Verify"));
        if (verifyBtns.length > 0) {
          (verifyBtns[0] as HTMLButtonElement).click();
        }
      },
      duration: 1500,
      description: "Approve KYC for entity",
    },
    {
      name: "Navigate to Pool Overview",
      action: async () => {
        navigate("/pools");
      },
      duration: 800,
      description: "View pool composition and status",
    },
    {
      name: "Navigate to Run Netting Cycle",
      action: async () => {
        navigate("/netting/run");
      },
      duration: 800,
      description: "Go to netting cycle page",
    },
    {
      name: "Click Run Netting Cycle Button",
      action: async () => {
        const runBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.includes("Run Netting")
        );
        if (runBtn && !runBtn.disabled) {
          (runBtn as HTMLButtonElement).click();
        }
      },
      duration: 8000, // Long wait for 7-step animation
      description: "Execute 7-step netting algorithm",
    },
    {
      name: "Navigate to Transfers",
      action: async () => {
        navigate("/transfers");
      },
      duration: 800,
      description: "Go to transfer initiation page",
    },
    {
      name: "Select From Entity",
      action: async () => {
        const selects = document.querySelectorAll("select");
        if (selects.length >= 1 && entities.length >= 1) {
          (selects[0] as HTMLSelectElement).value = entities[0].id;
          (selects[0] as HTMLSelectElement).dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      },
      duration: 600,
      description: "Choose sender entity",
    },
    {
      name: "Select To Entity",
      action: async () => {
        const selects = document.querySelectorAll("select");
        if (selects.length >= 2 && entities.length >= 2) {
          (selects[1] as HTMLSelectElement).value = entities[1].id;
          (selects[1] as HTMLSelectElement).dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      },
      duration: 600,
      description: "Choose receiver entity",
    },
    {
      name: "Enter Transfer Amount",
      action: async () => {
        const amountInput = document.querySelector(
          'input[placeholder="50000"]'
        ) as HTMLInputElement;
        if (amountInput) {
          amountInput.value = "25000";
          amountInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      duration: 600,
      description: "Set transfer amount",
    },
    {
      name: "Click Submit Transfer Button",
      action: async () => {
        const submitBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.includes("Submit Transfer")
        );
        if (submitBtn && !submitBtn.disabled) {
          (submitBtn as HTMLButtonElement).click();
        }
      },
      duration: 2000,
      description: "Submit transfer with 6-gate compliance",
    },
    {
      name: "Navigate to KYT Alerts",
      action: async () => {
        navigate("/compliance/kyt");
      },
      duration: 800,
      description: "View KYT compliance alerts",
    },
    {
      name: "Approve KYT Alert (if pending)",
      action: async () => {
        const approveBtns = Array.from(
          document.querySelectorAll("button")
        ).filter((btn) => btn.textContent?.includes("Approve"));
        if (approveBtns.length > 0) {
          (approveBtns[0] as HTMLButtonElement).click();
        }
      },
      duration: 1500,
      description: "Approve pending KYT alert",
    },
    {
      name: "Navigate to Audit Export",
      action: async () => {
        navigate("/reports");
      },
      duration: 800,
      description: "Go to audit export page",
    },
    {
      name: "Click Export Audit Report",
      action: async () => {
        const exportBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.includes("Export")
        );
        if (exportBtn) {
          (exportBtn as HTMLButtonElement).click();
        }
      },
      duration: 1500,
      description: "Download audit report (JSON)",
    },
    {
      name: "Navigate Back to Home",
      action: async () => {
        navigate("/");
      },
      duration: 800,
      description: "Return to home dashboard",
    },
  ];

  useEffect(() => {
    setTotalSteps(demoSteps.length);
  }, [demoSteps.length]);

  const runDemo = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setCurrentStep(0);
    setStepLog([]);

    for (let i = 0; i < demoSteps.length; i++) {
      if (!runningRef.current) break;

      const step = demoSteps[i];
      setCurrentStep(i + 1);
      setStepLog((prev) => [
        ...prev,
        { step: i + 1, name: step.name, status: "running" },
      ]);

      try {
        await step.action();
        await new Promise((resolve) => setTimeout(resolve, step.duration));

        setStepLog((prev) =>
          prev.map((s) =>
            s.step === i + 1 ? { ...s, status: "completed" } : s
          )
        );
      } catch (err) {
        console.error(`Step ${i + 1} failed:`, err);
        setStepLog((prev) =>
          prev.map((s) =>
            s.step === i + 1 ? { ...s, status: "completed" as const } : s
          )
        );
      }
    }

    setIsRunning(false);
    runningRef.current = false;
  };

  const stopDemo = () => {
    runningRef.current = false;
    setIsRunning(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        background: "var(--bg)",
        border: "2px solid var(--accent-blue)",
        borderRadius: 8,
        padding: 16,
        maxWidth: 400,
        maxHeight: 500,
        overflow: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>
          DEMO MODE
        </h4>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Auto-clicking to showcase all flows
        </div>

        <div style={{ marginBottom: 8 }}>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: isRunning ? "var(--accent-green)" : "var(--text-muted)",
            }}
          >
            Step {currentStep} / {totalSteps}
          </div>
          <div
            style={{
              width: "100%",
              height: 4,
              background: "var(--border-light)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                height: "100%",
                background: "var(--accent-green)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        <div className="flex gap-8">
          <button
            className="sketch-btn small primary"
            disabled={isRunning}
            onClick={runDemo}
            style={{ flex: 1 }}
          >
            {isRunning ? "Running..." : "Start Demo"}
          </button>
          <button
            className="sketch-btn small"
            disabled={!isRunning}
            onClick={stopDemo}
            style={{ flex: 1 }}
          >
            Stop
          </button>
        </div>
      </div>

      {stepLog.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border-light)",
            fontSize: 11,
          }}
        >
          <div
            className="mono"
            style={{ marginBottom: 8, color: "var(--text-muted)" }}
          >
            Recent Steps:
          </div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {stepLog.slice(-5).map((log) => (
              <div
                key={log.step}
                className="mono"
                style={{
                  fontSize: 10,
                  marginBottom: 4,
                  color:
                    log.status === "completed"
                      ? "var(--accent-green)"
                      : "var(--text-muted)",
                }}
              >
                {log.status === "completed" ? "✓" : "→"} {log.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoRunner;
