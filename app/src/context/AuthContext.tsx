/* ============================================================
   AuthContext — Real wallet + role selection + localStorage persistence
   ============================================================ */

import React, { createContext, useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { UserRole } from "../types";

const LS_ROLE_KEY = "nexus_role";
const LS_WALLET_KEY = "nexus_wallet";

/** Per-role walkthrough key — each role gets its own dismissal flag */
const walkthroughKey = (role: string) => `nexus_walkthrough_done_${role}`;

export interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  walletAddress: string | null;
  displayName: string;
  walletConnected: boolean;
  isFirstVisit: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  markWalkthroughDone: () => void;
}

const ROLE_NAMES: Record<UserRole, string> = {
  amina_admin: "AMINA Bank Admin",
  corporate_treasury: "Corporate Treasury Admin",
  subsidiary_manager: "Subsidiary Finance Manager",
  compliance_officer: "Compliance Officer",
};

function truncateWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  role: null,
  walletAddress: null,
  displayName: "",
  walletConnected: false,
  isFirstVisit: true,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  markWalkthroughDone: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { publicKey, connected, disconnect } = useWallet();

  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(LS_ROLE_KEY);
    return saved ? (saved as UserRole) : null;
  });

  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    const saved = localStorage.getItem(LS_ROLE_KEY);
    if (!saved) return true; // no role yet — will re-evaluate after role is set
    return !localStorage.getItem(walkthroughKey(saved));
  });

  // Derive wallet address from real wallet connection
  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;

  // User is logged in when wallet is connected AND role is selected
  const isLoggedIn = connected && !!walletAddress && !!role;

  const displayName = role ? ROLE_NAMES[role] : "";

  // Persist wallet address to localStorage when connected
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem(LS_WALLET_KEY, walletAddress);
    }
  }, [walletAddress]);

  // If wallet disconnects externally, clear persisted state
  useEffect(() => {
    if (!connected) {
      localStorage.removeItem(LS_WALLET_KEY);
    }
  }, [connected]);

  const login = useCallback((selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem(LS_ROLE_KEY, selectedRole);
    // Show walkthrough if this role hasn't dismissed it yet
    setIsFirstVisit(!localStorage.getItem(walkthroughKey(selectedRole)));
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    localStorage.removeItem(LS_ROLE_KEY);
    localStorage.removeItem(LS_WALLET_KEY);
    disconnect().catch(() => {});
  }, [disconnect]);

  const switchRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(LS_ROLE_KEY, newRole);
    // Show walkthrough if this role hasn't dismissed it yet
    setIsFirstVisit(!localStorage.getItem(walkthroughKey(newRole)));
  }, []);

  const markWalkthroughDone = useCallback(() => {
    setIsFirstVisit(false);
    if (role) {
      localStorage.setItem(walkthroughKey(role), "true");
    }
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        role,
        walletAddress,
        displayName,
        walletConnected: connected,
        isFirstVisit,
        login,
        logout,
        switchRole,
        markWalkthroughDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
