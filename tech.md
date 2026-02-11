


# Technology Stack: BluePilot — Hands-Free DeFi Trading

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

BluePilot is built for hands-free, rule-based DeFi trading. The stack supports automation, on-chain policy enforcement, and a mobile-first experience.

## Smart Contracts

- **Language:** Solidity 0.8.x
- **Framework:** Hardhat + TypeScript
- **Libraries:** OpenZeppelin (ReentrancyGuard, Ownable, SafeERC20)
- **Network:** Base L2 (Mainnet 8453, Sepolia 84532)
- **DEX:** Uniswap V2 Router (0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24)
- **Testing:** Hardhat, ethers.js, fast-check

### Example: Contract Import
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PolicyGuard.sol";
```

## OpenClaw Agent

- **Runtime:** Node.js (Express)
- **Language:** TypeScript
- **Web3:** ethers.js v6
- **Protocol:** Gateway Protocol
- **Testing:** Jest, fast-check

### Example: API Endpoint
```ts
// POST /api/agent/simulate
app.post('/api/agent/simulate', async (req, res) => { /* ... */ });
```

## Mobile Application

- **Framework:** React Native 0.73+ (Expo SDK 50+)
- **Language:** TypeScript
- **Wallets:** WalletConnect v2, Coinbase Wallet SDK
- **State:** React Context API, AsyncStorage
- **Navigation:** React Navigation v6
- **Testing:** Jest, React Native Testing Library, fast-check

### Example: WalletConnect Integration
```ts
import { WalletConnectProvider } from '@walletconnect/react-native-dapp';
```

## Design System

- **Typography:** Inter Bold (headers), Inter Regular (body), Roboto Mono (addresses/hashes)
- **Colors:** Primary #0052FF, Background #0A0B0D, Surface #1A1B1F
- **Spacing:** 48px button, 64px nav, 12px/16px radius
- **Accessibility:** 44x44px min touch targets, alt text for all images

## Network Configuration

- **Base Mainnet:** https://mainnet.base.org (Chain ID 8453)
- **Base Sepolia:** https://sepolia.base.org (Chain ID 84532)

---
All code/config examples and headings are formatted for accessibility.
- **Block Explorer**: https://basescan.org

## Common Commands

### Smart Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run property tests
npx hardhat test --grep "Property"

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network base-sepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.ts --network base-mainnet

# Verify contracts on Basescan
npx hardhat verify --network base-mainnet <CONTRACT_ADDRESS>

# Gas report
REPORT_GAS=true npx hardhat test
```

### OpenClaw Agent

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run property tests
npm test -- --grep "Property"

# Build for production
npm run build

# Start production server
npm start
```

### Mobile App

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run tests
npm test

# Build for iOS (requires EAS account)
eas build --platform ios

# Build for Android
eas build --platform android

# Build PWA
npx expo export:web

# Build TWA (requires Bubblewrap)
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build
```

## Testing Strategy

### Dual Testing Approach

- **Unit Tests**: Specific examples, edge cases, integration points
- **Property Tests**: Universal invariants across randomized inputs (minimum 100 iterations)

### Coverage Goals

- Smart Contracts: 100% line and branch coverage
- Agent API: 90%+ line coverage
- Mobile App: 80%+ line coverage

### Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run property tests only
npm test -- --grep "Property"

# Run E2E tests (mobile)
detox test
```

## Gas Optimization Patterns

- Use `calldata` instead of `memory` for array parameters
- Pack struct variables to minimize storage slots
- Use custom errors instead of string revert messages
- Cache state variables in memory when reading multiple times
- Avoid unbounded loops
