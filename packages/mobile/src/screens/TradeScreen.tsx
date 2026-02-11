/**
 * Trade Screen - Token swap interface
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spacing, Typography } from "@/constants";
import { formatAmount, shortenAddress } from "@/utils/formatting";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
}

const COMMON_TOKENS: Token[] = [
  { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ether", decimals: 18 },
  { address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA", symbol: "USDbC", name: "USD Base", decimals: 6 },
];

export const TradeScreen: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const { colors } = useTheme();

  const [tokenIn, setTokenIn] = useState<Token>(COMMON_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(COMMON_TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState(3); // 3%
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Simulate swap rate
  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0) {
      // Mock calculation: 1 ETH = 3000 USDC
      const input = parseFloat(amountIn);
      const output = tokenIn.symbol === "ETH" ? input * 3000 : input / 3000;
      setAmountOut(output.toFixed(6));
    } else {
      setAmountOut("");
    }
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn(amountOut);
    setAmountOut("");
  };

  const handleSetPercentage = (percent: number) => {
    setAmountIn(percent.toString());
  };

  const executeTrade = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate trade execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form
      setAmountIn("");
      setAmountOut("");
    } catch (err: any) {
      setError(err.message || "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notConnected}>
          <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>
            Connect your wallet to start trading
          </Text>
          <Button onPress={connect}>Connect Wallet</Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: colors.text }]}>Swap Tokens</Text>

      {/* From Token */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <View style={styles.tokenRow}>
          <View style={styles.tokenInput}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>From</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0.0"
              placeholderTextColor={colors.textTertiary}
              value={amountIn}
              onChangeText={setAmountIn}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.tokenSelector, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Text style={[styles.tokenSymbol, { color: colors.text }]}>{tokenIn.symbol}</Text>
          </TouchableOpacity>
        </View>
        {tokenIn.balance && (
          <Text style={[styles.balance, { color: colors.textSecondary }]}>
            Balance: {formatAmount(tokenIn.balance, tokenIn.decimals)}
          </Text>
        )}
      </Card>

      {/* Swap Button */}
      <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
        <View style={[styles.swapIcon, { backgroundColor: colors.primary }]}>
          <Text style={styles.arrow}>↓</Text>
        </View>
      </TouchableOpacity>

      {/* To Token */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <View style={styles.tokenRow}>
          <View style={styles.tokenInput}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>To</Text>
            <Text style={[styles.input, { color: colors.text }]}>
              {amountOut || "0.0"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.tokenSelector, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Text style={[styles.tokenSymbol, { color: colors.text }]}>{tokenOut.symbol}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Slippage Settings */}
      <View style={styles.slippageContainer}>
        <Text style={[styles.slippageLabel, { color: colors.textSecondary }]}>
          Max Slippage
        </Text>
        <View style={styles.slippageButtons}>
          {[0.5, 1, 3].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.slippageButton,
                slippage === s && { backgroundColor: colors.primary + "20" },
              ]}
              onPress={() => setSlippage(s)}
            >
              <Text
                style={[
                  styles.slippageButtonText,
                  { color: slippage === s ? colors.primary : colors.textSecondary },
                ]}
              >
                {s}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount Presets */}
      <View style={styles.presets}>
        {[25, 50, 100].map((percent) => (
          <TouchableOpacity
            key={percent}
            style={[styles.presetButton, { borderColor: colors.border }]}
            onPress={() => handleSetPercentage(percent)}
          >
            <Text style={[styles.presetText, { color: colors.textSecondary }]}>
              {percent}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trade Summary */}
      {amountIn && amountOut && (
        <Card variant="outlined" padding="md">
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rate</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              1 {tokenIn.symbol} ≈ {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(4)} {tokenOut.symbol}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Slippage Tolerance</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{slippage}%</Text>
          </View>
        </Card>
      )}

      {error && <ErrorMessage message={error} />}

      <Button
        variant="primary"
        size="large"
        onPress={executeTrade}
        disabled={!amountIn || loading}
        loading={loading}
        fullWidth
      >
        {isConnected ? "Swap" : "Connect Wallet"}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.screenPaddingVertical,
  },
  notConnected: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  notConnectedText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
    marginBottom: 24,
    textAlign: "center",
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize["2xl"],
    marginBottom: 24,
  },
  card: {
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenInput: {
    flex: 1,
  },
  label: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
    marginBottom: 4,
  },
  input: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.xl,
  },
  tokenSelector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tokenSymbol: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  balance: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 8,
  },
  swapButton: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: -10,
    zIndex: 1,
  },
  swapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.dark.bg,
  },
  arrow: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  slippageContainer: {
    marginVertical: 16,
  },
  slippageLabel: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
    marginBottom: 8,
  },
  slippageButtons: {
    flexDirection: "row",
    gap: 8,
  },
  slippageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  slippageButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  presets: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  presetText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
  summaryValue: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
});
