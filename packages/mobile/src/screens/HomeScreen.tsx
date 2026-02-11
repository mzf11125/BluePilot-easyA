/**
 * Home Screen - Portfolio overview and recent activity
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { Spacing, Typography, Colors } from "@/constants";
import { formatAmount, formatUSD, shortenAddress } from "@/utils/formatting";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUsd?: number;
  address: string;
}

interface PortfolioData {
  totalValue: number;
  change24h: number;
  tokens: TokenBalance[];
}

export const HomeScreen: React.FC = () => {
  const { address, balance, isConnected, connect } = useWallet();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalValue: 0,
    change24h: 0,
    tokens: [],
  });

  useEffect(() => {
    loadPortfolio();
  }, [address, isConnected]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isConnected) {
        setPortfolio({
          totalValue: parseFloat(balance) * 3000, // Mock ETH price
          change24h: 2.34,
          tokens: [
            {
              symbol: "ETH",
              name: "Ether",
              balance,
              decimals: 18,
              priceUsd: 3000,
              address: "0x0000000000000000000000000000000000000000",
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to load portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notConnectedContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to BluePilot</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your AI-powered DeFi trading copilot on Base
          </Text>
          <View style={styles illustration}>
            <View style={[styles.illustrationCircle, { borderColor: colors.primary }]}>
              <Text style={[styles.illustrationIcon]}>⚡</Text>
            </View>
          </View>
          <Button onPress={connect} size="large">
            Connect Wallet to Get Started
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingIndicator fullScreen text="Loading portfolio..." />
      </View>
    );
  }

  const changeColor = portfolio.change24h >= 0 ? Colors.semantic.success : Colors.semantic.error;
  const changePrefix = portfolio.change24h >= 0 ? "+" : "";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Portfolio Value Card */}
      <Card variant="elevated" padding="lg">
        <Text style={[styles.label, { color: colors.textSecondary }]}>Total Portfolio Value</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {formatUSD(portfolio.totalValue)}
        </Text>
        <View style={styles.changeContainer}>
          <View style={[styles.changeBadge, { backgroundColor: changeColor + "20" }]}>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changePrefix}{portfolio.change24h.toFixed(2)}%
            </Text>
          </View>
          <Text style={[styles.changeLabel, { color: colors.textTertiary }]}>24h</Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Button
          variant="outline"
          style={styles.actionButton}
          onPress={() => {/* Navigate to deposit */}}
        >
          Deposit
        </Button>
        <Button
          variant="outline"
          style={styles.actionButton}
          onPress={() => {/* Navigate to trade */}}
        >
          Trade
        </Button>
        <Button
          variant="outline"
          style={styles.actionButton}
          onPress={() => {/* Navigate to withdraw */}}
        >
          Withdraw
        </Button>
      </View>

      {/* Token Balances */}
      <CardHeader title="Your Assets" style={styles.sectionHeader} />
      <Card variant="outlined" padding="none">
        {portfolio.tokens.map((token) => (
          <TouchableOpacity
            key={token.symbol}
            style={[styles.tokenItem, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.tokenIcon, { backgroundColor: colors.primary + "20" }]}>
              <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
            </View>
            <View style={styles.tokenInfo}>
              <Text style={[styles.tokenSymbol, { color: colors.text }]}>{token.symbol}</Text>
              <Text style={[styles.tokenName, { color: colors.textTertiary }]}>
                {formatAmount(token.balance, token.decimals)}
              </Text>
            </View>
            <View style={styles.tokenValue}>
              <Text style={[styles.tokenPrice, { color: colors.text }]}>
                {token.priceUsd ? formatUSD(token.priceUsd * parseFloat(token.balance)) : "-"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {portfolio.tokens.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No assets yet. Deposit to get started.
            </Text>
          </View>
        )}
      </Card>

      {/* Recent Activity */}
      <CardHeader title="Recent Activity" style={styles.sectionHeader} />
      <Card variant="outlined" padding="md">
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No recent activity
          </Text>
        </View>
      </Card>
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
  notConnectedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize["3xl"],
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: 40,
  },
  illustration: {
    marginBottom: 40,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationIcon: {
    fontSize: 48,
  },
  label: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
    marginBottom: 8,
  },
  value: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize["4xl"],
    marginBottom: 12,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  changeText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  changeLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 24,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tokenIconText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    color: Colors.primary[500],
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  tokenName: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  tokenValue: {
    alignItems: "flex-end",
  },
  tokenPrice: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
});
