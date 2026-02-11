import { ethers, upgrades } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Deployment script for BluePilot contracts on Base L2
 *
 * Deploys in order:
 * 1. MockToken (for testing)
 * 2. MockWETH (for testing)
 * 3. MockUniswapRouter (for testing)
 * 4. PolicyGuardTest (for testing)
 * 5. TradeExecutor
 * 6. VaultRouter
 */

interface DeploymentConfig {
  weth: string;
  uniswapRouter: string;
  uniswapFactory: string;
  feeRecipient: string;
  protocolFeeBps: number;
  owner: string;
}

const DEPLOYMENTS_DIR = join(__dirname, "..", "deployments");

// Base Mainnet addresses
const BASE_MAINNET: DeploymentConfig = {
  weth: "0x4200000000000000000000000000000000000006",
  uniswapRouter: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  uniswapFactory: "0x420ddd06267114ef9c2aa4af7ca253872243e5c1",
  feeRecipient: "0x0000000000000000000000000000000000000000", // Set to actual address
  protocolFeeBps: 10, // 0.1%
  owner: "0x0000000000000000000000000000000000000000", // Set to actual owner
};

// Base Sepolia addresses
const BASE_SEPOLIA: DeploymentConfig = {
  weth: "0x4200000000000000000000000000000000000006",
  uniswapRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Uniswap V2 Router on Base Sepolia
  uniswapFactory: "0x890bD8Ccb19263D40f043aEC1fc679e3DEf04C7C", // Uniswap V2 Factory on Base Sepolia
  feeRecipient: "0x0000000000000000000000000000000000000000",
  protocolFeeBps: 10,
  owner: "0x0000000000000000000000000000000000000000",
};

// Local testing addresses
const LOCALHOST: DeploymentConfig = {
  weth: "0x0000000000000000000000000000000000000000", // Will be deployed
  uniswapRouter: "0x0000000000000000000000000000000000000000", // Will be deployed
  uniswapFactory: "0x0000000000000000000000000000000000000000",
  feeRecipient: "0x0000000000000000000000000000000000000000",
  protocolFeeBps: 10,
  owner: "0x0000000000000000000000000000000000000000",
};

function getConfig(): DeploymentConfig {
  const network = ethers.provider.network;
  const chainId = Number(network.chainId);

  switch (chainId) {
    case 8453:
      return BASE_MAINNET;
    case 84532:
      return BASE_SEPOLIA;
    case 31337:
      return LOCALHOST;
    default:
      throw new Error(`Unknown chain ID: ${chainId}`);
  }
}

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
  console.log(`✓ Saved deployment to ${deploymentPath}`);
}

async function deployMocks(config: DeploymentConfig) {
  console.log("\n--- Deploying Mock Contracts ---");

  // Deploy MockWETH if not using real WETH
  let wethAddress = config.weth;
  if (wethAddress === ethers.ZeroAddress) {
    console.log("Deploying MockWETH...");
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const mockWETH = await MockWETH.deploy();
    await mockWETH.waitForDeployment();
    wethAddress = await mockWETH.getAddress();
    console.log(`MockWETH deployed to: ${wethAddress}`);
    saveDeployment(ethers.network.name, "MockWETH", wethAddress, []);
  } else {
    console.log(`Using existing WETH: ${wethAddress}`);
  }

  // Deploy MockUniswapRouter if not using real router
  let routerAddress = config.uniswapRouter;
  if (routerAddress === ethers.ZeroAddress) {
    console.log("Deploying MockUniswapRouter...");
    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    const mockRouter = await MockRouter.deploy(wethAddress);
    await mockRouter.waitForDeployment();
    routerAddress = await mockRouter.getAddress();
    console.log(`MockUniswapRouter deployed to: ${routerAddress}`);
    saveDeployment(ethers.network.name, "MockUniswapRouter", routerAddress, [wethAddress]);
  } else {
    console.log(`Using existing UniswapRouter: ${routerAddress}`);
  }

  return { wethAddress, routerAddress };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== BluePilot Contract Deployment ===");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${ethers.network.name} (chain ID: ${ethers.network.chainId})`);
  console.log(`Balance: ${await ethers.provider.getBalance(deployer.address)} wei`);

  const config = getConfig();

  // Override owner/fee recipient with deployer if not set
  if (config.owner === ethers.ZeroAddress) {
    config.owner = deployer.address;
  }
  if (config.feeRecipient === ethers.ZeroAddress) {
    config.feeRecipient = deployer.address;
  }

  // Deploy mocks for local testing
  const { wethAddress, routerAddress } = await deployMocks(config);

  console.log("\n--- Deploying Core Contracts ---");

  // Deploy TradeExecutor
  console.log("\nDeploying TradeExecutor...");
  const TradeExecutor = await ethers.getContractFactory("TradeExecutor");
  const tradeExecutor = await TradeExecutor.deploy(
    routerAddress,
    wethAddress,
    config.owner,
    ethers.ZeroAddress // robinPumpRouter (to be set later)
  );
  await tradeExecutor.waitForDeployment();
  const tradeExecutorAddress = await tradeExecutor.getAddress();
  console.log(`TradeExecutor deployed to: ${tradeExecutorAddress}`);
  saveDeployment(ethers.network.name, "TradeExecutor", tradeExecutorAddress, [
    routerAddress,
    wethAddress,
    config.owner,
    ethers.ZeroAddress,
  ]);

  // Deploy VaultRouter
  console.log("\nDeploying VaultRouter...");
  const VaultRouter = await ethers.getContractFactory("VaultRouter");
  const vaultRouter = await VaultRouter.deploy(
    routerAddress,
    wethAddress,
    tradeExecutorAddress,
    config.feeRecipient,
    config.protocolFeeBps,
    config.owner,
    ethers.ZeroAddress // robinPumpRouter (to be set later)
  );
  await vaultRouter.waitForDeployment();
  const vaultRouterAddress = await vaultRouter.getAddress();
  console.log(`VaultRouter deployed to: ${vaultRouterAddress}`);
  saveDeployment(ethers.network.name, "VaultRouter", vaultRouterAddress, [
    routerAddress,
    wethAddress,
    tradeExecutorAddress,
    config.feeRecipient,
    config.protocolFeeBps,
    config.owner,
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

  // Generate environment file
  const envContent = `
# Contract Addresses - ${ethers.network.name}
POLICY_GUARD_ADDRESS=${tradeExecutorAddress}
TRADE_EXECUTOR_ADDRESS=${tradeExecutorAddress}
VAULT_ROUTER_ADDRESS=${vaultRouterAddress}

# Update these values in your .env file
`.trim();

  console.log("\n=== Deployment Complete ===");
  console.log("\nAdd this to your .env file:");
  console.log(envContent);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
