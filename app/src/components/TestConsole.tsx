/* ============================================================
   TestConsole.tsx — Manual Test Runner UI
   Accessible from developer tools / console
   ============================================================ */

import React, { useState } from "react";
import { allTestScenarios, runTestScenario } from "../utils/testScenarios";

const TestConsole: React.FC = () => {
  const [showConsole, setShowConsole] = useState(false);
  const [selectedTest, setSelectedTest] = useState(0);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const startTest = async () => {
    setRunning(true);
    setLogs([]);

    const scenario = allTestScenarios[selectedTest];
    const originalLog = console.log;

    // Capture console logs
    console.log = (...args: any[]) => {
      setLogs((prev) => [
        ...prev,
        args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
      ]);
      originalLog(...args);
    };

    try {
      await runTestScenario(scenario);
    } catch (err) {
      console.log("Test error:", err);
    } finally {
      console.log = originalLog;
      setRunning(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setShowConsole(!showConsole)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 9998,
          padding: "8px 12px",
          background: "var(--accent-blue)",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        TEST CONSOLE
      </button>

      {/* Console panel */}
      {showConsole && (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            left: 20,
            zIndex: 9998,
            width: 450,
            maxHeight: 500,
            background: "#1a1a1a",
            border: "2px solid var(--accent-blue)",
            borderRadius: 8,
            padding: 16,
            color: "#ccc",
            fontFamily: "monospace",
            fontSize: 11,
            overflow: "auto",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <h4
              style={{
                margin: 0,
                marginBottom: 8,
                color: "var(--accent-blue)",
              }}
            >
              Automated Test Runner
            </h4>

            <div style={{ marginBottom: 8 }}>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(Number(e.target.value))}
                disabled={running}
                style={{
                  width: "100%",
                  padding: 6,
                  marginBottom: 8,
                  background: "#222",
                  color: "#ccc",
                  border: "1px solid var(--border-light)",
                  borderRadius: 4,
                }}
              >
                {allTestScenarios.map((test, idx) => (
                  <option key={idx} value={idx}>
                    {idx + 1}. {test.name}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>
                {allTestScenarios[selectedTest]?.description}
              </div>
            </div>

            <button
              onClick={startTest}
              disabled={running}
              style={{
                width: "100%",
                padding: 8,
                background: running ? "#333" : "var(--accent-green)",
                color: running ? "#888" : "#1a1a1a",
                border: "none",
                borderRadius: 4,
                cursor: running ? "not-allowed" : "pointer",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {running ? "Running..." : "Run Test"}
            </button>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border-light)",
              paddingTop: 8,
              maxHeight: 300,
              overflow: "auto",
            }}
          >
            <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
              LOG ({logs.length}):
            </div>
            {logs.length === 0 ? (
              <div style={{ color: "#666" }}>Ready to run tests...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  style={{ marginBottom: 3, wordBreak: "break-word" }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TestConsole;
