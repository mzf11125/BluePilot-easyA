/**
 * Launches Screen - Browse live token launches and buy new tokens
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spacing, Typography } from "@/constants";
import { formatAmount, shortenAddress } from "@/utils/formatting";

interface TokenLaunch {
  token: string;
  creator: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  createdAt: number;
  raisedAmount: string;
  marketCap: string;
  graduated: boolean;
  bondingCurve: boolean;
}

interface BondingCurveInfo {
  totalSupply: string;
  raisedAmount: string;
  graduationPoint: string;
  progress: number;
}

export const LaunchesScreen: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { colors } = useTheme();

  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"active" | "trending">("active");
  const [selectedLaunch, setSelectedLaunch] = useState<TokenLaunch | null>(null);
  const [bondingCurve, setBondingCurve] = useState<BondingCurveInfo | null>(null);

  useEffect(() => {
    loadLaunches();
  }, [selectedTab]);

  const loadLaunches = async () => {
    setLoading(true);
    try {
      const endpoint = selectedTab === "trending"
        ? "/api/launches/trending"
        : "/api/launches";
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE}${endpoint}`);
      // const data = await response.json();
      // setLaunches(data.launches);

      // Mock data for now
      setLaunches([]);
    } catch (error) {
      console.error("Failed to load launches:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLaunches();
    setRefreshing(false);
  };

  const selectLaunch = async (launch: TokenLaunch) => {
    setSelectedLaunch(launch);
    // Load bonding curve info
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/launches/${launch.token}`);
      // const data = await response.json();
      // setBondingCurve(data.bondingCurve);
    } catch (error) {
      console.error("Failed to load launch details:", error);
    }
  };

  const handleBuy = () => {
    if (!selectedLaunch) return;
    // Navigate to trade screen with pre-filled data
    // TODO: Implement navigation
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notConnected}>
          <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>
            Connect your wallet to browse token launches
          </Text>
          <Button onPress={() => {}}>Connect Wallet</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Token Launches</Text>

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "active" && { backgroundColor: colors.primary + "20" }
            ]}
            onPress={() => setSelectedTab("active")}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === "active" ? colors.primary : colors.textSecondary }
            ]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === "trending" && { backgroundColor: colors.primary + "20" }
            ]}
            onPress={() => setSelectedTab("trending")}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === "trending" ? colors.primary : colors.textSecondary }
            ]}>
              Trending
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {selectedLaunch ? (
        // Launch Detail View
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Back Button */}
          <TouchableOpacity onPress={() => setSelectedLaunch(null)} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back to launches</Text>
          </TouchableOpacity>

          {/* Token Header */}
          <View style={styles.tokenHeader}>
            <View style={[styles.tokenIcon, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={styles.tokenIconText}>{selectedLaunch.symbol[0]}</Text>
            </View>
            <View style={styles.tokenInfo}>
              <Text style={[styles.tokenName, { color: colors.text }]}>
                {selectedLaunch.name} ({selectedLaunch.symbol})
              </Text>
              <Text style={[styles.tokenAddress, { color: colors.textSecondary }]}>
                {shortenAddress(selectedLaunch.token)}
              </Text>
            </View>
            {selectedLaunch.graduated && (
              <View style={[styles.graduatedBadge, { backgroundColor: colors.success + "20" }]}>
                <Text style={[styles.graduatedText, { color: colors.success }]}>Graduated</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Card variant="outlined" padding="md" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {selectedLaunch.description || "No description available."}
            </Text>
          </Card>

          {/* Bonding Curve Progress */}
          {selectedLaunch.bondingCurve && bondingCurve && (
            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Graduation Progress</Text>
              <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${bondingCurve.progress / 100}%` }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {bondingCurve.progress / 100}% to graduation
              </Text>
            </Card>
          )}

          {/* Stats */}
          <Card variant="outlined" padding="md" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Raised</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatAmount(selectedLaunch.raisedAmount, 18)} ETH
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Market Cap</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatAmount(selectedLaunch.marketCap, 18)} ETH
                </Text>
              </View>
            </View>
          </Card>

          {/* Buy Button */}
          <Button
            variant="primary"
            size="large"
            onPress={handleBuy}
            fullWidth
            disabled={selectedLaunch.graduated}
          >
            {selectedLaunch.graduated ? "Trade on DEX" : "Buy Tokens"}
          </Button>
        </ScrollView>
      ) : (
        // Launch List View
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : launches.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active launches
              </Text>
            </View>
          ) : (
            launches.map((launch) => (
              <Card
                key={launch.token}
                variant="outlined"
                padding="md"
                style={styles.launchCard}
                onPress={() => selectLaunch(launch)}
              >
                <View style={styles.launchHeader}>
                  <View style={[styles.launchIcon, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={styles.launchIconText}>{launch.symbol[0]}</Text>
                  </View>
                  <View style={styles.launchInfo}>
                    <Text style={[styles.launchName, { color: colors.text }]}>
                      {launch.name}
                    </Text>
                    <Text style={[styles.launchSymbol, { color: colors.textSecondary }]}>
                      {launch.symbol}
                    </Text>
                  </View>
                  <View style={styles.launchMeta}>
                    <Text style={[styles.launchRaised, { color: colors.text }]}>
                      {formatAmount(launch.raisedAmount, 18)} ETH
                    </Text>
                    {launch.graduated && (
                      <View style={[styles.miniBadge, { backgroundColor: colors.success + "20" }]}>
                        <Text style={[styles.miniBadgeText, { color: colors.success }]}>Grad</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize["2xl"],
    marginBottom: 16,
  },
  tabSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  content: {
    flex: 1,
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
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
  },
  launchCard: {
    marginBottom: 12,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: 12,
  },
  launchHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  launchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  launchIconText: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  launchInfo: {
    flex: 1,
  },
  launchName: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  launchSymbol: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  launchMeta: {
    alignItems: "flex-end",
  },
  launchRaised: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  miniBadgeText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.xs,
  },
  backButton: {
    paddingVertical: 16,
  },
  backButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  tokenHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  tokenIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  tokenIconText: {
    fontFamily: "Inter-Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize.xl,
  },
  tokenAddress: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 4,
  },
  graduatedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  graduatedText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.xs,
  },
  card: {
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
    marginBottom: 12,
  },
  description: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
});
