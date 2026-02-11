/**
 * Wallet context for managing wallet connection and state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";


interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  connector: any;
}

interface Transaction {
  hash: string;
  from: string;
  to?: string;
  value?: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
}

interface WalletContextType {
  // State
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  pendingTransactions: Transaction[];

  // Methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (to: string, data: string, value?: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;

  // Utilities
  shortenAddress: (address: string) => string;
  formatBalance: (balance: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_STORAGE_KEY = "bluepilot_wallet";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState("0");
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  // Load saved wallet state on mount
  useEffect(() => {
    loadWalletState();
  }, []);

  // Poll balance when connected
  useEffect(() => {
    if (isConnected && address) {
      updateBalance();
      const interval = setInterval(updateBalance, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const loadWalletState = async () => {
    try {
      const saved = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.address) {
          setAddress(state.address);
          setIsConnected(true);
          setChainId(state.chainId || 8453);
        }
      }
    } catch (error) {
      console.error("Failed to load wallet state:", error);
    }
  };

  const saveWalletState = async (state: Partial<WalletState>) => {
    try {
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save wallet state:", error);
    }
  };

  const updateBalance = async () => {
    if (!address || !chainId) return;

    try {
      const provider = new ethers.JsonRpcProvider(getRpcUrl(chainId));
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const connect = async () => {
    try {
      // This would integrate with WalletConnect
      // For now, using a mock implementation
      const mockAddress = "0x" + Math.random().toString(16).slice(2, 42);
      setAddress(mockAddress);
      setIsConnected(true);
      setChainId(8453); // Base mainnet

      await saveWalletState({
        isConnected: true,
        address: mockAddress,
        chainId: 8453,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      setIsConnected(false);
      setAddress(null);
      setChainId(null);
      setBalance("0");
      setPendingTransactions([]);

      await AsyncStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const switchChain = async (targetChainId: number) => {
    // Would implement chain switching via WalletConnect
    setChainId(targetChainId);
  };

  const sendTransaction = async (to: string, data: string, value: string = "0"): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const tx: Transaction = {
      hash: "0x" + Math.random().toString(16).slice(2, 66),
      from: address,
      to,
      value,
      status: "pending",
      timestamp: Date.now(),
    };

    setPendingTransactions((prev) => [...prev, tx]);

    // Simulate transaction - in production, this would use WalletConnect
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setPendingTransactions((prev) =>
          prev.map((t) => (t.hash === tx.hash ? { ...t, status: "confirmed" } : t))
        );
        resolve(tx.hash);
      }, 2000);
    });
  };

  const signMessage = async (message: string): Promise<string> => {
    // Would implement signing via WalletConnect
    return "0x" + Math.random().toString(16).slice(2, 130);
  };

  const shortenAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string): string => {
    const num = parseFloat(bal);
    if (num < 0.001) return "<0.001";
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toFixed(1);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        chainId,
        balance,
        pendingTransactions,
        connect,
        disconnect,
        switchChain,
        sendTransaction,
        signMessage,
        shortenAddress,
        formatBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

function getRpcUrl(chainId: number): string {
  const urls: Record<number, string> = {
    8453: "https://mainnet.base.org",
    84532: "https://sepolia.base.org",
    1: "https://eth.llamarpc.com",
  };
  return urls[chainId] || urls[8453];
}
