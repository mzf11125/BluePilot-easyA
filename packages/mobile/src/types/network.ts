export type NetworkType = 'base' | 'base-sepolia' | 'localhost';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}
