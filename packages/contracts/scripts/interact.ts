import { ethers } from "hardhat";

/**
 * Interaction script for BluePilot contracts
 *
 * Usage:
 *   npx hardhat run scripts/interact.ts --network <network>
 */

interface ContractAddresses {
  tradeExecutor: string;
  vaultRouter: string;
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("=== BluePilot Contract Interaction ===");
  console.log(`Signer: ${signer.address}`);
  console.log(`Network: ${ethers.network.name} (${ethers.network.chainId})`);

  // Contract addresses (update these after deployment)
  const addresses: ContractAddresses = {
    tradeExecutor: process.env.TRADE_EXECUTOR_ADDRESS || ethers.ZeroAddress,
    vaultRouter: process.env.VAULT_ROUTER_ADDRESS || ethers.ZeroAddress,
  };

  if (addresses.tradeExecutor === ethers.ZeroAddress) {
    console.error("\nPlease set contract addresses in environment variables or .env file:");
    console.error("  TRADE_EXECUTOR_ADDRESS=0x...");
    console.error("  VAULT_ROUTER_ADDRESS=0x...");
    process.exit(1);
  }

  // Get contract instances
  const tradeExecutor = await ethers.getContractAt("TradeExecutor", addresses.tradeExecutor);
  const vaultRouter = await ethers.getContractAt("VaultRouter", addresses.vaultRouter);

  console.log("\n--- TradeExecutor State ---");
  console.log(`Router: ${await tradeExecutor.router()}`);
  console.log(`WETH: ${await tradeExecutor.WETH()}`);
  console.log(`Owner: ${await tradeExecutor.owner()}`);
  console.log(`Deadline Buffer: ${await tradeExecutor.deadlineBuffer()} seconds`);
  console.log(`Min Trade Amount: ${await tradeExecutor.minTradeAmount()} wei`);

  console.log("\n--- VaultRouter State ---");
  console.log(`Router: ${await vaultRouter.router()}`);
  console.log(`WETH: ${await vaultRouter.WETH()}`);
  console.log(`Owner: ${await vaultRouter.owner()}`);
  console.log(`TradeExecutor: ${await vaultRouter.tradeExecutor()}`);
  console.log(`Protocol Fee: ${await vaultRouter.protocolFeeBps()} bps`);
  console.log(`Fee Recipient: ${await vaultRouter.feeRecipient()}`);

  // Check user vault balance
  const userBalance = await vaultRouter.getVaultBalance(signer.address, ethers.ZeroAddress);
  console.log(`\n--- User State ---`);
  console.log(`ETH Vault Balance: ${ethers.formatEther(userBalance)} ETH`);

  // Get user policy
  const policy = await vaultRouter.getPolicy(signer.address);
  console.log(`\n--- User Policy ---`);
  console.log(`Max Slippage: ${policy[0]} bps`);
  console.log(`Max Trade Size: ${ethers.formatEther(policy[1])} ETH`);
  console.log(`Cooldown: ${policy[2]} seconds`);
  console.log(`Last Trade: ${policy[3]}`);
  console.log(`Allowlist: ${policy[4].length} tokens`);

  console.log("\n=== Interaction Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
