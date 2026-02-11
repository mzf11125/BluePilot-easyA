import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Environment-based deployment script for BluePilot contracts
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx hardhat run scripts/deploy-env.ts --network baseSepolia
 *
 * Or with a cast wallet:
 *   cast wallet private <wallet-name> | grep -v 'Password:' > /tmp/pk.txt
 *   PRIVATE_KEY=$(cat /tmp/pk.txt) npx hardhat run scripts/deploy-env.ts --network baseSepolia
 *   rm /tmp/pk.txt
 */

interface DeploymentConfig {
  weth: string;
  uniswapRouter: string;
  uniswapFactory: string;
  feeRecipient: string;
  protocolFeeBps: number;
  owner: string;
}

// Base Sepolia addresses
const BASE_SEPOLIA: DeploymentConfig = {
  weth: "0x4200000000000000000000000000000000000006",
  uniswapRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  uniswapFactory: "0x890bD8Ccb19263D40f043aEC1fc679e3DEf04C7C",
  feeRecipient: "0x0000000000000000000000000000000000000000",
  protocolFeeBps: 10,
  owner: "0x0000000000000000000000000000000000000000",
};

const DEPLOYMENTS_DIR = join(__dirname, "..", "deployments");

function saveDeployment(networkName: string, contractName: string, address: string, args: any[]) {
  const deploymentPath = join(DEPLOYMENTS_DIR, `${networkName}.json`);
  let deployments: any = {};

  try {
    const existing = require(deploymentPath);
    deployments = existing;
  } catch {}

  deployments[contractName] = {
    address,
    args,
    deployedAt: new Date().toISOString(),
  };

  mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
  console.log(`\n✓ Saved deployment to ${deploymentPath}`);
}

async function main() {
  console.log("=== BluePilot Contract Deployment ===");

  // Get deployer from environment variable
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is not set. Please run with: PRIVATE_KEY=0x... npx hardhat run ...");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${ethers.network.name} (chain ID: ${ethers.network.chainId})`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const config = BASE_SEPOLIA;

  // Override owner/fee recipient with deployer if not set
  const owner = config.owner === ethers.ZeroAddress ? deployer.address : config.owner;
  const feeRecipient = config.feeRecipient === ethers.ZeroAddress ? deployer.address : config.feeRecipient;

  console.log("\n--- Deploying Core Contracts ---");

  // Deploy TradeExecutor
  console.log("\n1. Deploying TradeExecutor...");
  const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
  const tradeExecutor = await TradeExecutor.deploy(
    config.uniswapRouter,
    config.weth,
    owner,
    ethers.ZeroAddress // robinPumpRouter (to be set later)
  );
  await tradeExecutor.waitForDeployment();
  const tradeExecutorAddress = await tradeExecutor.getAddress();
  console.log(`   TradeExecutor deployed to: ${tradeExecutorAddress}`);
  saveDeployment(ethers.network.name, "TradeExecutor", tradeExecutorAddress, [
    config.uniswapRouter,
    config.weth,
    owner,
    ethers.ZeroAddress,
  ]);

  // Deploy VaultRouter
  console.log("\n2. Deploying VaultRouter...");
  const VaultRouter = await ethers.getContractFactory("VaultRouter");
  const vaultRouter = await VaultRouter.deploy(
    config.uniswapRouter,
    config.weth,
    tradeExecutorAddress,
    feeRecipient,
    config.protocolFeeBps,
    owner,
    ethers.ZeroAddress // robinPumpRouter (to be set later)
  );
  await vaultRouter.waitForDeployment();
  const vaultRouterAddress = await vaultRouter.getAddress();
  console.log(`   VaultRouter deployed to: ${vaultRouterAddress}`);
  saveDeployment(ethers.network.name, "VaultRouter", vaultRouterAddress, [
    config.uniswapRouter,
    config.weth,
    tradeExecutorAddress,
    feeRecipient,
    config.protocolFeeBps,
    owner,
    ethers.ZeroAddress,
  ]);

  // Verify deployment
  console.log("\n--- Verifying Deployment ---");
  const tradeExecutorOwner = await tradeExecutor.owner();
  const vaultRouterOwner = await vaultRouter.owner();
  console.log(`TradeExecutor owner: ${tradeExecutorOwner}`);
  console.log(`VaultRouter owner: ${vaultRouterOwner}`);
  console.log(`VaultRouter protocolFeeBps: ${await vaultRouter.protocolFeeBps()}`);
  console.log(`VaultRouter feeRecipient: ${await vaultRouter.feeRecipient()}`);

  // Generate environment file content
  const envContent = `
# Contract Addresses - Base Sepolia
TRADE_EXECUTOR_ADDRESS=${tradeExecutorAddress}
VAULT_ROUTER_ADDRESS=${vaultRouterAddress}

# Note: PolicyGuard is a library, not a deployable contract
# The TradeExecutor and VaultRouter use the PolicyGuard library internally
`.trim();

  console.log("\n=== Deployment Complete ===");
  console.log("\nAdd this to packages/agent/.env:");
  console.log(envContent);

  // Also save to a file
  const envPath = join(DEPLOYMENTS_DIR, `baseSepolia.env`);
  writeFileSync(envPath, envContent + "\n");
  console.log(`\n✓ Environment file saved to ${envPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
