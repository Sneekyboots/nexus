/* ============================================================
   NexusContext — Global data store
   All page components read data from here (not hardcoded).
   Calls nexusService for all data operations.
   Supports DEMO MODE (seed data) vs LIVE MODE (empty/real).
   ============================================================ */

import React, { createContext, useState, useEffect, useCallback } from "react";
import { nexusService } from "../services/nexusService";
import type {
  Entity,
  Pool,
  FxRate,
  Loan,
  ComplianceEvent,
  KytAlert,
  NettingCycle,
  Transfer,
  LayerStatus,
} from "../types";

const LS_DEMO_MODE_KEY = "nexus_demo_mode";

export interface NexusState {
  entities: Entity[];
  pool: Pool | null;
  fxRates: FxRate[];
  loans: Loan[];
  complianceEvents: ComplianceEvent[];
  kytAlerts: KytAlert[];
  nettingHistory: NettingCycle[];
  transfers: Transfer[];
  layerStatus: LayerStatus[];
  solanaStatus: { connected: boolean; rpc: string; network: string } | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

export interface NexusContextValue extends NexusState {
  toggleDemoMode: () => void;
  refresh: () => Promise<void>;
  registerEntity: (data: Partial<Entity>) => Promise<Entity>;
  verifyEntityKyc: (entityId: string) => Promise<Entity | undefined>;
  suspendEntity: (
    entityId: string,
    reason: string
  ) => Promise<Entity | undefined>;
  addEntityToPool: (
    entityId: string,
    poolId: string
  ) => Promise<Entity | undefined>;
  updateMandateLimits: (
    entityId: string,
    limits: Partial<Entity["mandateLimits"]>
  ) => Promise<Entity | undefined>;
  runNettingCycle: (poolId: string) => Promise<NettingCycle>;
  initiateTransfer: (data: {
    fromEntityId: string;
    toEntityId: string;
    amount: number;
    currency: string;
    memo: string;
  }) => Promise<Transfer>;
  updateKytAlertStatus: (
    alertId: string,
    status: KytAlert["status"]
  ) => Promise<KytAlert | undefined>;
}

function getInitialDemoMode(): boolean {
  const saved = localStorage.getItem(LS_DEMO_MODE_KEY);
  // Default to DEMO MODE on first visit so judges see a populated dashboard
  return saved === null ? true : saved === "true";
}

const INITIAL_STATE: NexusState = {
  entities: [],
  pool: null,
  fxRates: [],
  loans: [],
  complianceEvents: [],
  kytAlerts: [],
  nettingHistory: [],
  transfers: [],
  layerStatus: [],
  solanaStatus: null,
  loading: true,
  error: null,
  isDemoMode: true,
};

export const NexusContext = createContext<NexusContextValue>({
  ...INITIAL_STATE,
  toggleDemoMode: () => {},
  refresh: async () => {},
  registerEntity: async () => ({} as Entity),
  verifyEntityKyc: async () => undefined,
  suspendEntity: async () => undefined,
  addEntityToPool: async () => undefined,
  updateMandateLimits: async () => undefined,
  runNettingCycle: async () => ({} as NettingCycle),
  initiateTransfer: async () => ({} as Transfer),
  updateKytAlertStatus: async () => undefined,
});

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(getInitialDemoMode);
  const [state, setState] = useState<NexusState>({
    ...INITIAL_STATE,
    isDemoMode: getInitialDemoMode(),
  });

  const loadAll = useCallback(async (demoMode: boolean) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      nexusService.setDemoMode(demoMode);
      const [
        entities,
        pool,
        fxRates,
        loans,
        complianceEvents,
        kytAlerts,
        nettingHistory,
        transfers,
        layerStatus,
        solanaStatus,
      ] = await Promise.all([
        nexusService.getEntities(),
        nexusService.getPool(),
        nexusService.getFxRates(),
        nexusService.getLoans(),
        nexusService.getComplianceEvents(),
        nexusService.getKytAlerts(),
        nexusService.getNettingHistory(),
        nexusService.getTransfers(),
        nexusService.getLayerStatus(),
        nexusService.getSolanaStatus(),
      ]);
      setState({
        entities,
        pool,
        fxRates,
        loans,
        complianceEvents,
        kytAlerts,
        nettingHistory,
        transfers,
        layerStatus,
        solanaStatus,
        loading: false,
        error: null,
        isDemoMode: demoMode,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: String(err),
      }));
    }
  }, []);

  useEffect(() => {
    loadAll(isDemoMode);
  }, [isDemoMode, loadAll]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem(LS_DEMO_MODE_KEY, String(next));
      return next;
    });
  }, []);

  // --- mutation wrappers (mutate + refresh local state) ---

  const registerEntity = useCallback(async (data: Partial<Entity>) => {
    const entity = await nexusService.registerEntity(data);
    const [entities, complianceEvents] = await Promise.all([
      nexusService.getEntities(),
      nexusService.getComplianceEvents(),
    ]);
    setState((s) => ({ ...s, entities, complianceEvents }));
    return entity;
  }, []);

  const verifyEntityKyc = useCallback(async (entityId: string) => {
    const entity = await nexusService.verifyEntityKyc(entityId);
    const [entities, complianceEvents] = await Promise.all([
      nexusService.getEntities(),
      nexusService.getComplianceEvents(),
    ]);
    setState((s) => ({ ...s, entities, complianceEvents }));
    return entity;
  }, []);

  const suspendEntity = useCallback(
    async (entityId: string, reason: string) => {
      const entity = await nexusService.suspendEntity(entityId, reason);
      const [entities, complianceEvents] = await Promise.all([
        nexusService.getEntities(),
        nexusService.getComplianceEvents(),
      ]);
      setState((s) => ({ ...s, entities, complianceEvents }));
      return entity;
    },
    []
  );

  const addEntityToPool = useCallback(
    async (entityId: string, poolId: string) => {
      const entity = await nexusService.addEntityToPool(entityId, poolId);
      const [entities, pool, complianceEvents] = await Promise.all([
        nexusService.getEntities(),
        nexusService.getPool(),
        nexusService.getComplianceEvents(),
      ]);
      setState((s) => ({ ...s, entities, pool, complianceEvents }));
      return entity;
    },
    []
  );

  const updateMandateLimits = useCallback(
    async (entityId: string, limits: Partial<Entity["mandateLimits"]>) => {
      const entity = await nexusService.updateMandateLimits(entityId, limits);
      const [entities, complianceEvents] = await Promise.all([
        nexusService.getEntities(),
        nexusService.getComplianceEvents(),
      ]);
      setState((s) => ({ ...s, entities, complianceEvents }));
      return entity;
    },
    []
  );

  const runNettingCycle = useCallback(async (poolId: string) => {
    const cycle = await nexusService.runNettingCycle(poolId);
    const [nettingHistory, complianceEvents, loans, entities, pool] =
      await Promise.all([
        nexusService.getNettingHistory(),
        nexusService.getComplianceEvents(),
        nexusService.getLoans(),
        nexusService.getEntities(),
        nexusService.getPool(),
      ]);
    setState((s) => ({
      ...s,
      nettingHistory,
      complianceEvents,
      loans,
      entities,
      pool,
    }));
    return cycle;
  }, []);

  const initiateTransfer = useCallback(
    async (data: {
      fromEntityId: string;
      toEntityId: string;
      amount: number;
      currency: string;
      memo: string;
    }) => {
      const transfer = await nexusService.initiateTransfer(data);
      const [transfers, complianceEvents, entities, pool] = await Promise.all([
        nexusService.getTransfers(),
        nexusService.getComplianceEvents(),
        nexusService.getEntities(),
        nexusService.getPool(),
      ]);
      setState((s) => ({
        ...s,
        transfers,
        complianceEvents,
        entities,
        pool,
      }));
      return transfer;
    },
    []
  );

  const updateKytAlertStatus = useCallback(
    async (alertId: string, status: KytAlert["status"]) => {
      const alert = await nexusService.updateKytAlertStatus(alertId, status);
      const kytAlerts = await nexusService.getKytAlerts();
      setState((s) => ({ ...s, kytAlerts }));
      return alert;
    },
    []
  );

  return (
    <NexusContext.Provider
      value={{
        ...state,
        isDemoMode,
        toggleDemoMode,
        refresh: () => loadAll(isDemoMode),
        registerEntity,
        verifyEntityKyc,
        suspendEntity,
        addEntityToPool,
        updateMandateLimits,
        runNettingCycle,
        initiateTransfer,
        updateKytAlertStatus,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};
