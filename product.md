# Product Overview

Percolator is a mobile-first DeFi trading copilot that enables secure, policy-controlled token trading on Base L2. The system combines smart contracts, an AI agent interface, and a React Native mobile app to provide conversational trading with on-chain risk management.

## Core Value Proposition

Users can execute DeFi trades through natural language commands while maintaining full control over their funds and risk parameters. All trades are validated against user-defined policies (max slippage, trade size limits, cooldown periods, token allowlists) enforced at the smart contract level.

## Key Components

1. **Smart Contracts (Base L2)**: Three modular Solidity contracts manage vault deposits/withdrawals, execute DEX trades via Uniswap V2, and enforce risk policies on-chain
2. **OpenClaw Agent**: Natural language interface using Gateway Protocol to parse trading intents, simulate outcomes, and generate unsigned transactions
3. **Mobile App**: React Native + Expo cross-platform app with wallet integration, trade execution, policy management, and transaction history

## User Experience

- Deposit funds into secure on-chain vault
- Configure personal risk policies (slippage tolerance, trade size limits, cooldown periods, allowed tokens)
- Execute trades via mobile UI or conversational commands
- Simulate trades before execution to preview outcomes and verify policy compliance
- View transaction history with blockchain verification links
- Install as native Android app via Trusted Web Activity (TWA)

## Security Model

- Users maintain full custody of funds and private keys
- All transactions require user signing via WalletConnect or Coinbase Wallet
- Risk policies are enforced on-chain, not just in the UI
- Agent never accesses or stores private keys
- Smart contracts follow OpenZeppelin security patterns (ReentrancyGuard, SafeERC20, Ownable)
