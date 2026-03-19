/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_FX_ORACLE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
