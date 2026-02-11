

# Project Structure: BluePilot — Hands-Free DeFi Trading

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

## Monorepo Organization

The BluePilot codebase is organized for hands-free, rule-based DeFi trading. Each package supports automation, policy enforcement, and mobile-first experience.

```mermaid
flowchart TD
  A[bluepilot/]
  A1[packages/]
  A2[.kiro/]
  A3[package.json]
  A --> A1
  A --> A2
  A --> A3
  A1a[contracts/\nSmart contracts (Hardhat)]
  A1b[agent/\nBluePilot agent API (Node.js/Express)]
  A1c[mobile/\nReact Native mobile app (Expo)]
  A1 --> A1a
  A1 --> A1b
  A1 --> A1c
  A2a[specs/]
  A2b[steering/]
  A2 --> A2a
  A2 --> A2b
  A2a1[bluepilot-defi-agent/]
  A2a --> A2a1
  A2a1a[requirements.md]
  A2a1b[design.md]
  A2a1c[tasks.md]
  A2a1 --> A2a1a
  A2a1 --> A2a1b
  A2a1 --> A2a1c
  A2b1[product.md]
  A2b2[tech.md]
  A2b3[structure.md]
  A2b --> A2b1
  A2b --> A2b2
  A2b --> A2b3
```

### Key Directories
- **contracts/**: Solidity smart contracts (VaultRouter, TradeExecutor, PolicyGuard) for rule-based automation
- **agent/**: BluePilot agent API (Node.js/Express) for hands-free, intent-based trading
- **mobile/**: React Native mobile app (Expo, TWA) for user interface and wallet integration
- **.kiro/**: Specs, design, and steering docs

---
All diagrams include alt text and clear headings for accessibility. See [README.md](../README.md) for a high-level overview.
```

## Smart Contracts Package (`packages/contracts/`)

```
contracts/
├── contracts/
│   ├── VaultRouter.sol         # Main vault and policy management
│   ├── TradeExecutor.sol       # DEX integration and swaps
│   ├── PolicyGuard.sol         # Risk policy validation
│   └── interfaces/
│       └── IUniswapV2Router02.sol
├── test/
│   ├── VaultRouter.test.ts     # Unit tests
│   ├── TradeExecutor.test.ts
│   ├── PolicyGuard.test.ts
│   └── properties/             # Property-based tests
│       ├── VaultRouter.property.test.ts
│       ├── TradeExecutor.property.test.ts
│       └── PolicyGuard.property.test.ts
├── scripts/
│   ├── deploy.ts               # Deployment script
│   └── verify.ts               # Contract verification
├── hardhat.config.ts
├── tsconfig.json
└── package.json
```

### Contract Naming Conventions

- Contracts: PascalCase (e.g., `VaultRouter.sol`)
- Functions: camelCase (e.g., `executeTrade()`)
- State variables: camelCase (e.g., `vaultBalances`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_SLIPPAGE_BPS`)
- Custom errors: PascalCase (e.g., `TradeSizeExceeded`)
- Events: PascalCase (e.g., `TradeExecuted`)

## Agent Package (`packages/agent/`)

```
agent/
├── src/
│   ├── index.ts                # Express app entry point
│   ├── routes/
│   │   └── agent.ts            # Agent API routes
│   ├── services/
│   │   ├── CommandParser.ts    # Parse natural language commands
│   │   ├── ContractService.ts  # Contract interaction layer
│   │   └── GatewayService.ts   # Gateway Protocol integration
│   ├── utils/
│   │   ├── errors.ts           # Error handling utilities
│   │   └── validation.ts       # Input validation
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── test/
│   ├── unit/
│   │   ├── CommandParser.test.ts
│   │   └── ContractService.test.ts
│   └── properties/
│       └── agent.property.test.ts
├── tsconfig.json
└── package.json
```

### Agent Naming Conventions

- Classes: PascalCase (e.g., `CommandParser`)
- Functions: camelCase (e.g., `parseSimulateCommand()`)
- Interfaces: PascalCase with `I` prefix (e.g., `ISimulationResult`)
- Types: PascalCase (e.g., `TransactionData`)
- Constants: UPPER_SNAKE_CASE (e.g., `BASE_MAINNET_RPC`)

## Mobile Package (`packages/mobile/`)

```
mobile/
├── src/
│   ├── App.tsx                 # Root component
│   ├── navigation/
│   │   └── BottomTabNavigator.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── TradeScreen.tsx
│   │   ├── PolicyScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── components/
│   │   ├── WalletConnectButton.tsx
│   │   ├── TradeSimulator.tsx
│   │   ├── TransactionCard.tsx
│   │   ├── NetworkGuard.tsx
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── LoadingIndicator.tsx
│   │       └── ErrorMessage.tsx
│   ├── contexts/
│   │   ├── WalletContext.tsx   # Wallet state management
│   │   └── TransactionContext.tsx
│   ├── contracts/              # Contract integration layer
│   │   ├── VaultRouterContract.ts
│   │   ├── TradeExecutorContract.ts
│   │   ├── PolicyGuardContract.ts
│   │   └── abis/               # Contract ABIs
│   │       ├── VaultRouter.json
│   │       ├── TradeExecutor.json
│   │       └── PolicyGuard.json
│   ├── utils/
│   │   ├── ErrorHandler.ts     # Error message mapping
│   │   ├── retry.ts            # Retry logic with backoff
│   │   ├── offlineQueue.ts     # Offline action queue
│   │   └── formatting.ts       # Address/amount formatting
│   ├── constants/
│   │   ├── networks.ts         # Network configurations
│   │   ├── colors.ts           # Design system colors
│   │   ├── typography.ts       # Font styles
│   │   └── spacing.ts          # Layout constants
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── test/
│   ├── unit/
│   │   ├── screens/
│   │   ├── components/
│   │   └── utils/
│   └── properties/
│       └── mobile.property.test.ts
├── app.json                    # Expo configuration
├── tsconfig.json
└── package.json
```

### Mobile Naming Conventions

- Components: PascalCase (e.g., `TradeScreen.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useWallet()`)
- Contexts: PascalCase with `Context` suffix (e.g., `WalletContext`)
- Utilities: camelCase (e.g., `formatAddress()`)
- Constants: UPPER_SNAKE_CASE (e.g., `BASE_MAINNET`)
- Types/Interfaces: PascalCase (e.g., `UserPolicy`, `Transaction`)

## File Organization Principles

### Smart Contracts

- One contract per file
- Interfaces in separate `interfaces/` directory
- Test files mirror contract structure
- Property tests in dedicated `properties/` subdirectory

### Agent

- Services handle business logic
- Routes handle HTTP endpoints
- Utils contain pure functions
- Types centralized in `types/` directory

### Mobile

- Screens represent full-page views
- Components are reusable UI elements
- Contexts manage global state
- Contract wrappers abstract blockchain interaction
- Constants separated by concern (colors, typography, networks)

## Import Conventions

### Absolute Imports

Configure TypeScript path aliases for cleaner imports:

```typescript
// Instead of: import { Button } from '../../../components/ui/Button'
// Use: import { Button } from '@/components/ui/Button'
```

### Import Order

1. External dependencies (React, ethers, etc.)
2. Internal absolute imports (@/...)
3. Relative imports (../, ./)
4. Type imports (import type { ... })
5. CSS/style imports

Example:
```typescript
import React, { useState } from 'react';
import { ethers } from 'ethers';

import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';

import { formatAddress } from '../utils/formatting';

import type { UserPolicy } from '@/types';
```

## Testing File Conventions

- Unit test files: `*.test.ts` or `*.test.tsx`
- Property test files: `*.property.test.ts`
- Test files co-located with source files or in `test/` directory
- Property tests include feature name and property number in comments:
  ```typescript
  // Feature: percolator-defi-agent, Property 1: Deposit increases vault balance
  ```

## Configuration Files

- `hardhat.config.ts`: Hardhat configuration for contracts
- `tsconfig.json`: TypeScript configuration (one per package)
- `app.json`: Expo configuration for mobile app
- `.env`: Environment variables (never commit, use `.env.example`)
- `package.json`: Dependencies and scripts (one per package + root)

## Documentation

- Spec files in `.kiro/specs/percolator-defi-agent/`
- Steering rules in `.kiro/steering/`
- Contract NatSpec comments in Solidity files
- JSDoc comments for complex functions
- README.md in each package directory
