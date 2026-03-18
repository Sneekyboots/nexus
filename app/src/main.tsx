import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { SOLANA_RPC_URL } from "./constants";
import { AuthProvider } from "./context/AuthContext";
import { NexusProvider } from "./context/NexusContext";
import App from "./App";
import "./index.css";
import "./styles/sketch.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const Root: React.FC = () => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <AuthProvider>
              <NexusProvider>
                <App />
              </NexusProvider>
            </AuthProvider>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
