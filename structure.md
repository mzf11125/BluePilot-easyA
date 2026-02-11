# Project Structure

## Monorepo Organization

The project uses a monorepo structure with three main packages:

```
percolator/
├── packages/
│   ├── contracts/          # Smart contracts (Hardhat)
│   ├── agent/              # OpenClaw agent API (Node.js/Express)
│   └── mobile/             # React Native mobile app (Expo)
├── .kiro/
│   ├── specs/
│   │   └── percolator-defi-agent/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│       ├── product.md
│       ├── tech.md
│       └── structure.md
└── package.json            # Root package.json for workspace
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
