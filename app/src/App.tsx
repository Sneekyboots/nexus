/* ============================================================
   App.tsx — React Router routes
   ============================================================ */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AllEntities from "./pages/entities/AllEntities";
import RegisterEntity from "./pages/entities/RegisterEntity";
import KycManagement from "./pages/entities/KycManagement";
import MandateControls from "./pages/entities/MandateControls";
import PoolOverview from "./pages/pools/PoolOverview";
import RunCycle from "./pages/netting/RunCycle";
import CycleHistory from "./pages/netting/CycleHistory";
import InitiateTransfer from "./pages/transfers/InitiateTransfer";
import LiveEventFeed from "./pages/compliance/LiveEventFeed";
import KytAlerts from "./pages/compliance/KytAlerts";
import FxRates from "./pages/fx/FxRates";
import ActiveLoans from "./pages/loans/ActiveLoans";
import AuditExport from "./pages/reports/AuditExport";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/entities" element={<AllEntities />} />
        <Route path="/entities/register" element={<RegisterEntity />} />
        <Route path="/entities/kyc" element={<KycManagement />} />
        <Route path="/entities/mandates" element={<MandateControls />} />
        <Route path="/pools" element={<PoolOverview />} />
        <Route path="/netting" element={<RunCycle />} />
        <Route path="/netting/run" element={<RunCycle />} />
        <Route path="/netting/history" element={<CycleHistory />} />
        <Route path="/transfers" element={<InitiateTransfer />} />
        <Route path="/compliance" element={<LiveEventFeed />} />
        <Route path="/compliance/kyt" element={<KytAlerts />} />
        <Route path="/fx" element={<FxRates />} />
        <Route path="/fx-rates" element={<FxRates />} />
        <Route path="/loans" element={<ActiveLoans />} />
        <Route path="/reports" element={<AuditExport />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
