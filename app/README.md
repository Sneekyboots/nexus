# NEXUS Dashboard - React App

A beautiful, interactive dashboard for the NEXUS 5-layer on-chain corporate cash pooling protocol on Solana Devnet.

## Overview

This React application provides a visual interface for monitoring and interacting with all 5 deployed NEXUS programs:

1. **Entity Registry** - KYC verification and entity management
2. **Pooling Engine** - 7-step netting algorithm execution
3. **Compliance Hook** - 6-gate compliance enforcement
4. **FX Netting** - Multi-currency support and conversion
5. **Sweep Trigger** - Intercompany loan settlement

## Architecture

```
app/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main React component
│   │   └── Dashboard.css          # Beautiful styling
│   ├── services/
│   │   ├── solanaClient.ts        # Devnet integration
│   │   └── demoClient.ts          # End-to-end demo client
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── vite.config.ts                 # Vite bundler config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Browser with modern JavaScript support
- Solana wallet (for production use)

### Installation

```bash
cd app
npm install
```

### Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` with hot module reloading.

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Features

### Dashboard UI

**Layer Navigation** - Switch between all 5 protocol layers with clean tabs

**Entity Registry Display**

- View all registered entities with their status
- Shows balance (surplus/deficit) and KYC verification status
- Color-coded status indicators

**7-Step Netting Algorithm Visualization**

- Interactive visualization of the core algorithm
- Shows each step with description and status
- The algorithm is THE MOAT - our key innovation

**Offset Matches**

- Display bilateral offset matching results
- Shows surplus entity → deficit entity flows
- Current settlement status (pending/executed/settled)

**CPI Chain Flow**

- Beautiful visualization of how all 5 programs interact
- Shows data flow from Layer 1 → Layer 5
- Each program's role in the complete flow

**Statistics Dashboard**

- Total pool value across all entities
- Net offset amount (virtual settlement amount)
- Active entities count
- Accrued interest on surplus balances

**Interactive Controls**

- "Run Netting Cycle" button to trigger algorithm on devnet
- View Analytics, Settings, and Export options
- Real-time devnet connection status indicator

## Services

### solanaClient.ts

High-level Solana integration client for devnet:

```typescript
import { nexusClient } from "./services/solanaClient";

// Get devnet connection status
const status = await nexusClient.getStatus();

// Fetch entities from on-chain
const entities = await nexusClient.getEntities();

// Get offset matching results
const matches = await nexusClient.getOffsetMatches();

// Run netting cycle
const result = await nexusClient.runNettingCycle();

// Get pool statistics
const stats = await nexusClient.getPoolStatistics();

// Verify all programs deployed
const deploymentStatus = await nexusClient.verifyDeployment();
```

### demoClient.ts

Comprehensive client library showing how to interact with all 5 programs:

```typescript
import { demoClient } from "./services/demoClient";

// Display deployment information
demoClient.displayDeploymentInfo();

// Execute complete end-to-end flow
await demoClient.executeCompleteFlow(payerPublicKey);

// Access individual layer clients
demoClient.entityRegistry.getEntities();
demoClient.poolingEngine.run7StepNettingAlgorithm();
demoClient.complianceHook.validate6Gates(transferData);
demoClient.fxNetting.performMultiCurrencyNetting(positions);
demoClient.sweepTrigger.createSweepLoan(debtor, creditor, amount);
```

## Devnet Programs

All programs are deployed to Solana Devnet:

| Layer | Program         | Address                                        |
| ----- | --------------- | ---------------------------------------------- |
| 1     | Entity Registry | `4eb3xfVvFtKnzDYrcaMjjZ5MESpmfyyfXVgUR2kkGjPa` |
| 2     | Pooling Engine  | `67LiTobujmghnHLR812SUUD4juuA37j7ENsSMaZGjNCb` |
| 3     | Compliance Hook | `FMjNbWedkgYovqpqHS2PojwFeVma2zVAup32j9VGVbpo` |
| 4     | FX Netting      | `6EU43gqjMV4WRjwwGYaxBAHcMUxUPTKUoK5wkBbb1Ayy` |
| 5     | Sweep Trigger   | `81CJwxHEpWiY8j9c8qfLoru3edWKF2AjVZ3cUrHYU6CZ` |

## Design

The dashboard uses a modern, production-ready design with:

- **Dark theme** with gradient backgrounds
- **Professional color scheme** (emerald, blue, amber, red)
- **Smooth animations** and transitions
- **Responsive layout** optimized for desktop
- **Clear visual hierarchy** with proper spacing and typography

### Color Scheme

- **Success/Verified**: `#10b981` (Emerald)
- **Primary**: `#3b82f6` (Blue)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Neutral**: `#6b7280` (Gray)

## Running Tests

```bash
npm run test
```

(Test suite can be added - currently has UI and services)

## Deployment

### To Vercel

```bash
vercel
```

### To Netlify

```bash
npm run build
# Deploy dist/ folder to Netlify
```

## Integration with Solana Wallet

For production use with real wallets:

```typescript
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

// Wrap Dashboard with WalletProvider
<WalletProvider wallets={[new PhantomWalletAdapter()]}>
  <Dashboard />
</WalletProvider>;
```

## Production Checklist

- [ ] Install and build successfully
- [ ] Verify Devnet connection
- [ ] Test "Run Netting Cycle" button
- [ ] Verify all entities load from on-chain
- [ ] Test FX conversions
- [ ] Verify CPI chain visualization
- [ ] Security audit of wallet integration
- [ ] Performance testing on mainnet

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast bundler
- **Solana Web3.js** - Blockchain interaction
- **@coral-xyz/anchor** - Program client library
- **CSS3** - Beautiful styling

## Development

### File Structure

```
src/
├── components/      # React components
│   ├── Dashboard.tsx
│   └── Dashboard.css
├── services/       # Solana integration
│   ├── solanaClient.ts
│   └── demoClient.ts
├── main.tsx        # React root
└── index.css       # Global styles
```

### Adding New Features

1. Create component in `src/components/`
2. Create service in `src/services/` if needed
3. Import and use in Dashboard.tsx
4. Style with CSS modules or inline styles

## Support

For issues or questions:

1. Check the main NEXUS documentation in `../docs/`
2. Review devnet deployment info: `../DEVNET_DEPLOYMENT_COMPLETE.md`
3. Report issues at: https://github.com/anomalyco/opencode

## License

ISC

## Notes

- Currently uses mock/simulated data for demonstration
- In production, data would be fetched directly from on-chain programs
- All 5 programs are deployed and functional on Devnet
- The 7-step netting algorithm is THE MOAT - our key innovation
- Built for StableHacks 2026 submission and AMINA Bank partnership
