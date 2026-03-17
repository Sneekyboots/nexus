import React, { useState } from "react";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import BankDashboard from "./pages/BankDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";

type AppMode = "landing" | "bank" | "company";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>("landing");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnectWallet = () => {
    // Simulate wallet connection
    const mockAddress =
      "0x" + Math.random().toString(16).slice(2, 10).toUpperCase();
    setWalletConnected(true);
    setWalletAddress(mockAddress);
    setMode("bank");
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setMode("landing");
  };

  return (
    <div className="app">
      {mode === "landing" && <LandingPage onConnect={handleConnectWallet} />}
      {mode === "bank" && (
        <BankDashboard
          walletAddress={walletAddress}
          onDisconnect={handleDisconnect}
          onSwitchToCompany={() => setMode("company")}
        />
      )}
      {mode === "company" && (
        <CompanyDashboard
          walletAddress={walletAddress}
          onDisconnect={handleDisconnect}
          onSwitchToBank={() => setMode("bank")}
        />
      )}
    </div>
  );
};

export default App;
