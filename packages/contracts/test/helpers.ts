import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BigNumber } from "ethers";

/**
 * Test utilities and constants
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ONE_ETH = ethers.parseEther("1");
export const ONE_TOKEN = ethers.parseEther("1");
export const MAX_UINT256 = ethers.MaxUint256;

// Base Mainnet addresses for forking
export const BASE_ADDRESSES = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  USDbC: "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA",
  UNISWAP_ROUTER: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  UNISWAP_FACTORY: "0x420ddd06267114ef9c2aa4af7ca253872243e5c1",
} as const;

/**
 * Converts basis points to decimal (e.g., 100 bps = 0.01 = 1%)
 */
export function bpsToDecimal(bps: number): number {
  return bps / 10000;
}

/**
 * Converts decimal to basis points
 */
export function decimalToBps(decimal: number): number {
  return Math.floor(decimal * 10000);
}

/**
 * Gets the current timestamp
 */
export async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}

/**
 * Increases time by seconds
 */
export async function increaseTime(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Sets the next block timestamp
 */
export async function setTimestamp(timestamp: number): Promise<void> {
  await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
}

/**
 * Expects a transaction to revert with a specific error
 */
export async function expectRevert(
  promise: Promise<any>,
  expectedError?: string
): Promise<void> {
  if (expectedError) {
    await expect(promise).to.be.revertedWithCustomError(
      // @ts-ignore - Dynamic contract type
      { contract: promise },
      expectedError
    );
  } else {
    await expect(promise).to.be.reverted;
  }
}

/**
 * Creates a signature for permit functionality
 */
export async function createPermitSignature(
  signer: SignerWithAddress,
  token: any,
  spender: string,
  amount: BigNumber,
  deadline: number
): Promise<string> {
  const domain = {
    name: await token.name(),
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await token.getAddress(),
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const values = {
    owner: signer.address,
    spender,
    value: amount,
    nonce: await token.nonces(signer.address),
    deadline,
  };

  return signer.signTypedData(domain, types, values);
}

/**
 * Deploys a mock ERC20 token for testing
 */
export async function deployMockToken(
  name: string,
  symbol: string,
  initialSupply: BigNumber = ONE_TOKEN.mul(1000000)
): Promise<any> {
  const MockTokenFactory = await ethers.getContractFactory("MockToken");
  return await MockTokenFactory.deploy(name, symbol, initialSupply);
}

/**
 * Deploys a mock WETH for testing
 */
export async function deployMockWETH(): Promise<any> {
  const MockWETHFactory = await ethers.getContractFactory("MockWETH");
  return await MockWETHFactory.deploy();
}
