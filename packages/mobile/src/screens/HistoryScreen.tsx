/**
 * History Screen - Transaction history
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { Spacing, Typography, BorderRadius } from "@/constants";
import { shortenAddress, formatRelativeTime, formatDate } from "@/utils/formatting";

interface TradeEvent {
  txHash: string;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  blockNumber: number;
  status: "pending" | "confirmed" | "failed";
}

export const HistoryScreen: React.FC = () => {
  const { isConnected } = useWallet();
  const { colors } = useTheme();

  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "swap" | "deposit" | "withdraw">("all");

  useEffect(() => {
    if (isConnected) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [isConnected, filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      setTrades([
        {
          txHash: "0x" + Math.random().toString(16).slice(2, 66),
          user: "0x" + Math.random().toString(16).slice(2, 42),
          tokenIn: "0x0000000000000000000000000000000000000000",
          tokenOut: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
          amountIn: "1000000000000000000",
          amountOut: "3000000000",
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          blockNumber: 12345678,
          status: "confirmed",
        },
      ]);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = (address: string): string => {
    if (address === "0x0000000000000000000000000000000000000000") return "ETH";
    if (address === "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913") return "USDC";
    if (address === "0xd9aAEc86B65d86f6A7B5B1b0c42FFA531710b6CA") return "USDbC";
    return shortenAddress(address);
  };

  const formatAmount = (amount: string, decimals: number = 18): string => {
    const value = Number(amount) / 1e18;
    return value.toFixed(4);
  };

  const getStatusColor = (status: TradeEvent["status"]) => {
    switch (status) {
      case "confirmed":
        return Colors.semantic.success;
      case "pending":
        return Colors.semantic.warning;
      case "failed":
        return Colors.semantic.error;
    }
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Connect your wallet to view transaction history
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingIndicator fullScreen text="Loading history..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {(["all", "swap", "deposit", "withdraw"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trade List */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollPadding}
      >
        {trades.length === 0 ? (
          <Card variant="outlined" padding="lg">
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions found
            </Text>
          </Card>
        ) : (
          trades.map((trade) => (
            <Card key={trade.txHash} variant="outlined" padding="md" style={styles.tradeCard}>
              <View style={styles.tradeHeader}>
                <View style={styles.tradeType}>
                  <Text style={[styles.tradeTypeText, { color: colors.primary }]}>
                    {getTokenSymbol(trade.tokenIn)} → {getTokenSymbol(trade.tokenOut)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(trade.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(trade.status) },
                    ]}
                  >
                    {trade.status}
                  </Text>
                </View>
              </View>

              <View style={styles.tradeDetails}>
                <View style={styles.tradeDetail}>
                  <Text style={[styles.tradeDetailLabel, { color: colors.textSecondary }]}>
                    Amount In
                  </Text>
                  <Text style={[styles.tradeDetailValue, { color: colors.text }]}>
                    {formatAmount(trade.amountIn)} {getTokenSymbol(trade.tokenIn)}
                  </Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Text style={[styles.tradeDetailLabel, { color: colors.textSecondary }]}>
                    Amount Out
                  </Text>
                  <Text style={[styles.tradeDetailValue, { color: colors.text }]}>
                    {formatAmount(trade.amountOut, 6)} {getTokenSymbol(trade.tokenOut)}
                  </Text>
                </View>
              </View>

              <View style={styles.tradeFooter}>
                <Text style={[styles.tradeTime, { color: colors.textTertiary }]}>
                  {formatRelativeTime(trade.timestamp)}
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.tradeHash, { color: colors.primary }]}>
                    {shortenAddress(trade.txHash)}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  message: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
  filterScroll: {
    maxHeight: 48,
  },
  filterContainer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: Spacing.screenPaddingHorizontal,
    paddingBottom: 32,
  },
  tradeCard: {
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tradeType: {
    flex: 1,
  },
  tradeTypeText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.xs,
    textTransform: "capitalize",
  },
  tradeDetails: {
    gap: 8,
    marginBottom: 12,
  },
  tradeDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tradeDetailLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
  tradeDetailValue: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  tradeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  tradeTime: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.xs,
  },
  tradeHash: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.xs,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
});
