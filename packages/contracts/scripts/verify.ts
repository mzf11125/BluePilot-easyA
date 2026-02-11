import { run, ethers } from "hardhat";
import { existsSync } from "fs";
import { join } from "path";

const DEPLOYMENTS_DIR = join(__dirname, "..", "deployments");

/**
 * Verification script for BluePilot contracts on Base L2
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network base
 *   npx hardhat run scripts/verify.ts --network baseSepolia
 */

interface DeploymentInfo {
  address: string;
  args: any[];
  deployedAt: string;
}

interface NetworkDeployments {
  [contractName: string]: DeploymentInfo;
}

async function verifyContract(
  address: string,
  constructorArgs: any[],
  contractPath?: string
) {
  console.log(`Verifying ${address}...`);

  try {
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
      contract: contractPath,
    });
    console.log(`✓ Verified ${address}`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`✓ Already verified: ${address}`);
    } else {
      console.error(`✗ Verification failed for ${address}:`, error.message);
    }
  }
}

async function main() {
  const network = ethers.network.name;
  console.log(`=== Verifying Contracts on ${network} ===`);

  const deploymentPath = join(DEPLOYMENTS_DIR, `${network}.json`);

  if (!existsSync(deploymentPath)) {
    console.error(`No deployment file found at ${deploymentPath}`);
    console.log("Run the deploy script first:");
    console.log("  npx hardhat run scripts/deploy.ts --network <network>");
    process.exit(1);
  }

  const deployments: NetworkDeployments = require(deploymentPath);

  // Verify in dependency order

  // 1. MockWETH (if deployed)
  if (deployments.MockWETH) {
    await verifyContract(deployments.MockWETH.address, deployments.MockWETH.args);
  }

  // 2. MockUniswapRouter (if deployed)
  if (deployments.MockUniswapRouter) {
    await verifyContract(
      deployments.MockUniswapRouter.address,
      deployments.MockUniswapRouter.args
    );
  }

  // 3. TradeExecutor
  if (deployments.TradeExecutor) {
    await verifyContract(
      deployments.TradeExecutor.address,
      deployments.TradeExecutor.args,
      "contracts/TradeExecutor.sol:TradeExecutor"
    );
  }

  // 4. VaultRouter
  if (deployments.VaultRouter) {
    await verifyContract(
      deployments.VaultRouter.address,
      deployments.VaultRouter.args,
      "contracts/VaultRouter.sol:VaultRouter"
    );
  }

  console.log("\n=== Verification Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
