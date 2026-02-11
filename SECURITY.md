
# Security Policy

[!IMPORTANT]
**BluePilot: Anti-loss AI + Hands-free trading**

Set your rules once—trade automatically and safely within them. BluePilot combines anti-loss AI, secure smart contracts, and a mobile-first experience for effortless, policy-driven DeFi trading.

## Overview
Percolator follows best practices for smart contract and application security. All contracts use OpenZeppelin libraries, are protected against reentrancy, and are verified on Basescan.

## Responsible Disclosure
If you discover a vulnerability, please report it via [email or issue tracker] and do not disclose it publicly until resolved.

## Key Practices
- Contracts inherit from OpenZeppelin's ReentrancyGuard and Ownable
- ERC20 transfers use SafeERC20
- PolicyGuard validates all parameters
- All user actions require explicit signature
- No private keys are ever stored or accessed by the agent

## Audit
Audit status and reports will be published here.
