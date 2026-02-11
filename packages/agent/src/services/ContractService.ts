import { ethers, Contract } from "ethers";
import { Policy, SimulationData, TransactionData, NetworkConfig, NETWORKS } from "../types/index.js";
import VAULT_ROUTER_ABI from "../abis/VaultRouter.json" assert { type: "json" };
import TRADE_EXECUTOR_ABI from "../abis/TradeExecutor.json" assert { type: "json" };
import ERC20_ABI from "../abis/ERC20.json" assert { type: "json" };

/**
 * Service for interacting with BluePilot smart contracts
 */
export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private networkConfig: NetworkConfig;

  constructor(rpcUrl?: string, chainId?: number) {
    const resolvedChainId = chainId || 8453;
    this.networkConfig = NETWORKS[resolvedChainId] || NETWORKS[8453];
    this.provider = new ethers.JsonRpcProvider(rpcUrl || this.networkConfig.rpcUrl);
  }

  /**
   * Get the contract instance
   */
  private getContract(address: string, abi: any): Contract {
    return new Contract(address, abi, this.provider);
  }

  /**
   * Get a contract with signer
   */
  private getContractWithSigner(address: string, abi: any, signer: ethers.Wallet): Contract {
    return new Contract(address, abi, signer);
  }

  /**
   * Get user's vault balance
   */
  async getVaultBalance(
    vaultRouterAddress: string,
    userAddress: string,
    tokenAddress: string
  ): Promise<bigint> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const balance = await vaultRouter.vaultBalances(userAddress, tokenAddress);
    return BigInt(balance.toString());
  }

  /**
   * Get all vault balances for a user
   */
  async getVaultBalances(
    vaultRouterAddress: string,
    userAddress: string,
    tokens: string[]
  ): Promise<bigint[]> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const balances = await vaultRouter.getVaultBalances(userAddress, tokens);
    return balances.map((b: any) => BigInt(b.toString()));
  }

  /**
   * Get user's policy
   */
  async getPolicy(vaultRouterAddress: string, userAddress: string): Promise<Policy> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const policy = await vaultRouter.getPolicy(userAddress);

    return {
      maxSlippageBps: Number(policy.maxSlippageBps),
      maxTradeSize: policy.maxTradeSize.toString(),
      cooldownSeconds: Number(policy.cooldownSeconds),
      tokenAllowlist: policy.tokenAllowlist,
    };
  }

  /**
   * Simulate a trade
   */
  async simulateTrade(
    vaultRouterAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<SimulationData> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const amountInWei = ethers.parseEther(amountIn);

    // Get expected output
    const amountOut = await vaultRouter.simulateTrade(tokenIn, tokenOut, amountInWei);

    // Calculate price impact (simplified - would need DEX reserves for accurate calculation)
    const priceImpact = 0; // TODO: Implement accurate price impact calculation

    // Estimate gas
    let gasUsed = "200000"; // Default estimate

    try {
      const gasEstimate = await vaultRouter.executeTrade.estimateGas(
        tokenIn,
        tokenOut,
        amountInWei,
        amountOut
      );
      gasUsed = gasEstimate.toString();
    } catch {
      // Use default estimate
    }

    return {
      amounts: {
        tokenIn,
        tokenOut,
        amountIn: amountInWei.toString(),
        amountOut: amountOut.toString(),
      },
      priceImpact,
      gasUsed,
    };
  }

  /**
   * Generate transaction data for a trade
   */
  async generateTradeTransaction(
    vaultRouterAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string
  ): Promise<TransactionData> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const amountInWei = ethers.parseEther(amountIn);
    const minAmountOutWei = ethers.parseEther(minAmountOut);

    // Encode transaction data
    const data = vaultRouter.interface.encodeFunctionData("executeTrade", [
      tokenIn,
      tokenOut,
      amountInWei,
      minAmountOutWei,
    ]);

    return {
      to: vaultRouterAddress,
      data,
      value: "0",
    };
  }

  /**
   * Generate transaction data for deposit
   */
  generateDepositTransaction(
    vaultRouterAddress: string,
    tokenAddress: string,
    amount: string
  ): TransactionData {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const amountWei = ethers.parseEther(amount);

    if (tokenAddress === ethers.ZeroAddress) {
      // ETH deposit
      const data = vaultRouter.interface.encodeFunctionData("depositETH", []);
      return {
        to: vaultRouterAddress,
        data,
        value: amountWei.toString(),
      };
    } else {
      // ERC20 deposit
      const data = vaultRouter.interface.encodeFunctionData("depositToken", [
        tokenAddress,
        amountWei,
      ]);
      return {
        to: vaultRouterAddress,
        data,
        value: "0",
      };
    }
  }

  /**
   * Generate transaction data for withdrawal
   */
  generateWithdrawTransaction(
    vaultRouterAddress: string,
    tokenAddress: string,
    amount: string
  ): TransactionData {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);
    const amountWei = ethers.parseEther(amount);

    if (tokenAddress === ethers.ZeroAddress) {
      // ETH withdrawal
      const data = vaultRouter.interface.encodeFunctionData("withdrawETH", [amountWei]);
      return {
        to: vaultRouterAddress,
        data,
        value: "0",
      };
    } else {
      // ERC20 withdrawal
      const data = vaultRouter.interface.encodeFunctionData("withdrawToken", [
        tokenAddress,
        amountWei,
      ]);
      return {
        to: vaultRouterAddress,
        data,
        value: "0",
      };
    }
  }

  /**
   * Generate transaction data for setting policy
   */
  generatePolicyTransaction(
    vaultRouterAddress: string,
    userAddress: string,
    policy: Policy
  ): TransactionData {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);

    const data = vaultRouter.interface.encodeFunctionData("setPolicy", [
      userAddress,
      policy.maxSlippageBps,
      ethers.parseEther(policy.maxTradeSize),
      policy.cooldownSeconds,
      policy.tokenAllowlist,
    ]);

    return {
      to: vaultRouterAddress,
      data,
      value: "0",
    };
  }

  /**
   * Get token info
   */
  async getTokenInfo(tokenAddress: string): Promise<{
    symbol: string;
    name: string;
    decimals: number;
  }> {
    if (tokenAddress === ethers.ZeroAddress) {
      return {
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
      };
    }

    const token = this.getContract(tokenAddress, ERC20_ABI);
    const [symbol, name, decimals] = await Promise.all([
      token.symbol(),
      token.name(),
      token.decimals(),
    ]);

    return {
      symbol,
      name,
      decimals: Number(decimals),
    };
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    userAddress: string
  ): Promise<{ balance: bigint; decimals: number }> {
    if (tokenAddress === ethers.ZeroAddress) {
      const balance = await this.provider.getBalance(userAddress);
      return { balance, decimals: 18 };
    }

    const token = this.getContract(tokenAddress, ERC20_ABI);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals(),
    ]);

    return {
      balance: BigInt(balance.toString()),
      decimals: Number(decimals),
    };
  }

  /**
   * Get trade history events
   */
  async getTradeEvents(
    vaultRouterAddress: string,
    userAddress?: string,
    limit: number = 50
  ): Promise<any[]> {
    const vaultRouter = this.getContract(vaultRouterAddress, VAULT_ROUTER_ABI);

    const filter = vaultRouter.filters.TradeExecuted(
      userAddress || null,
      null,
      null
    );

    const events = await vaultRouter.queryFilter(filter, -limit);

    return events.map((event: any) => ({
      txHash: event.transactionHash,
      user: event.args.user,
      tokenIn: event.args.tokenIn,
      tokenOut: event.args.tokenOut,
      amountIn: event.args.amountIn.toString(),
      amountOut: event.args.amountOut.toString(),
      timestamp: event.args.timestamp,
      blockNumber: event.blockNumber,
    }));
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    from: string,
    value: string = "0"
  ): Promise<bigint> {
    try {
      const gas = await this.provider.estimateGas({
        to,
        data,
        from,
        value,
      });
      return gas;
    } catch (error) {
      // Return a safe default
      return 300000n;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 1000000000n; // 1 gwei default
  }

  /**
   * Get provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}

// Singleton instance
let contractServiceInstance: ContractService | null = null;

export function getContractService(rpcUrl?: string, chainId?: number): ContractService {
  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService(rpcUrl, chainId);
  }
  return contractServiceInstance;
}
