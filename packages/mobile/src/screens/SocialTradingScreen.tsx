/**
 * Social Trading Screen - Top traders and copy trading
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { Spacing, Typography } from "@/constants";
import { shortenAddress, formatAmount } from "@/utils/formatting";

interface TraderProfile {
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  stats: {
    totalTrades: number;
    winningTrades: number;
    volumeTraded: string;
    roi: number;
    avgHoldTime: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  preferences: {
    allowCopyTrading: boolean;
    copyTradingFee?: number;
  };
  tags: string[];
}

interface CopyTradeConfig {
  enabled: boolean;
  allocationPercentage: number;
  maxTradeSize: string;
}

type Period = "24H" | "7D" | "30D" | "ALL";

export const SocialTradingScreen: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { colors } = useTheme();

  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [copyConfigs, setCopyConfigs] = useState<Map<string, CopyTradeConfig>>(new Map());
  const [period, setPeriod] = useState<Period>("7D");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLeaderboard();
    if (isConnected && address) {
      loadCopyConfigs();
    }
  }, [period, isConnected, address]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/social/leaderboard?period=${period}`);
      // const data = await response.json();
      // setTraders(data.leaderboard.map((e: any) => e.trader));

      // Mock data
      setTraders([]);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCopyConfigs = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/social/copy/${address}`);
      // const data = await response.json();
      // const configs = new Map();
      // data.configs.forEach((c: CopyTradeConfig) => {
      //   configs.set(c.traderAddress.toLowerCase(), c);
      // });
      // setCopyConfigs(configs);
    } catch (error) {
      console.error("Failed to load copy configs:", error);
    }
  };

  const setupCopyTrading = async (trader: TraderProfile) => {
    if (!isConnected) {
      Alert.alert("Connect Wallet", "Please connect your wallet first");
      return;
    }

    const existingConfig = copyConfigs.get(trader.address.toLowerCase());

    try {
      // TODO: Replace with actual API call
      // await fetch("/api/social/copy", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     copierAddress: address,
      //     traderAddress: trader.address,
      //     enabled: !existingConfig?.enabled ?? true,
      //     allocationPercentage: 10,
      //     maxTradeSize: "0.5",
      //     copySellTrades: true,
      //   }),
      // });

      const newConfigs = new Map(copyConfigs);
      newConfigs.set(trader.address.toLowerCase(), {
        enabled: !existingConfig?.enabled ?? true,
        allocationPercentage: 10,
        maxTradeSize: "0.5",
      });
      setCopyConfigs(newConfigs);

      Alert.alert(
        "Success",
        existingConfig
          ? "Copy trading updated"
          : `You are now copying ${trader.username || shortenAddress(trader.address)}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to setup copy trading");
    }
  };

  const filteredTraders = traders.filter((trader) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trader.username?.toLowerCase().includes(query) ||
      trader.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>
            Connect your wallet to browse top traders
          </Text>
          <Button onPress={() => {}}>Connect Wallet</Button>
        </View>
      </View>
    );
  }

  if (selectedTrader) {
    return (
      <TraderDetailScreen
        trader={selectedTrader}
        isCopying={!!copyConfigs.get(selectedTrader.address.toLowerCase())?.enabled}
        onBack={() => setSelectedTrader(null)}
        onCopy={() => setupCopyTrading(selectedTrader)}
        colors={colors}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Social Trading</Text>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search traders..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(["24H", "7D", "30D", "ALL"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && { backgroundColor: colors.primary + "20" }
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: period === p ? colors.primary : colors.textSecondary }
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingIndicator />
      ) : (
        <ScrollView style={styles.content}>
          {filteredTraders.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No traders found
              </Text>
            </View>
          ) : (
            filteredTraders.map((trader, index) => (
              <TraderCard
                key={trader.address}
                trader={trader}
                rank={index + 1}
                isCopying={!!copyConfigs.get(trader.address.toLowerCase())?.enabled}
                onPress={() => setSelectedTrader(trader)}
                onCopy={() => setupCopyTrading(trader)}
                colors={colors}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

interface TraderCardProps {
  trader: TraderProfile;
  rank: number;
  isCopying: boolean;
  onPress: () => void;
  onCopy: () => void;
  colors: any;
}

const TraderCard: React.FC<TraderCardProps> = ({ trader, rank, isCopying, onPress, onCopy, colors }) => {
  const winRate = (trader.stats.winningTrades / trader.stats.totalTrades) * 100;

  return (
    <Card
      variant="outlined"
      padding="md"
      style={[styles.traderCard, { marginHorizontal: Spacing.screenPaddingHorizontal }]}
      onPress={onPress}
    >
      <View style={styles.traderHeader}>
        <View style={styles.traderInfo}>
          {/* Rank */}
          <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>

          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.avatarText}>
              {trader.username?.[0].toUpperCase() || trader.address[2].toUpperCase()}
            </Text>
          </View>

          {/* Name */}
          <View style={styles.nameSection}>
            <Text style={[styles.traderName, { color: colors.text }]}>
              {trader.username || shortenAddress(trader.address)}
            </Text>
            <Text style={[styles.traderBio, { color: colors.textSecondary }]} numberOfLines={1}>
              {trader.bio || "Crypto trader"}
            </Text>
          </View>
        </View>

        {/* Copy Button */}
        <TouchableOpacity
          style={[
            styles.copyButton,
            isCopying ? { backgroundColor: colors.success + "20" } : { backgroundColor: colors.backgroundSecondary }
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onCopy();
          }}
        >
          <Text
            style={[styles.copyButtonText, { color: isCopying ? colors.success : colors.primary }]}
          >
            {isCopying ? "Copying" : "Copy"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {trader.stats.roi / 100}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ROI</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{winRate.toFixed(0)}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Win Rate</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {trader.stats.sharpeRatio.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sharpe</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {trader.stats.totalTrades}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trades</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {trader.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

interface TraderDetailScreenProps {
  trader: TraderProfile;
  isCopying: boolean;
  onBack: () => void;
  onCopy: () => void;
  colors: any;
}

const TraderDetailScreen: React.FC<TraderDetailScreenProps> = ({
  trader,
  isCopying,
  onBack,
  onCopy,
  colors,
}) => {
  const winRate = (trader.stats.winningTrades / trader.stats.totalTrades) * 100;

  return (
    <ScrollView style={[styles.detailContainer, { backgroundColor: colors.background }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back to traders</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={[styles.detailHeader, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.detailAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.detailAvatarText}>
            {trader.username?.[0].toUpperCase() || "T"}
          </Text>
        </View>
        <Text style={[styles.detailName, { color: colors.text }]}>
          {trader.username || shortenAddress(trader.address)}
        </Text>
        <Text style={[styles.detailBio, { color: colors.textSecondary }]}>{trader.bio || ""}</Text>

        <Button
          variant={isCopying ? "secondary" : "primary"}
          size="large"
          onPress={onCopy}
          fullWidth
          style={styles.detailCopyButton}
        >
          {isCopying ? "Edit Copy Settings" : "Copy Trader"}
        </Button>
      </View>

      {/* Stats Grid */}
      <Card variant="outlined" padding="md" style={styles.detailCard}>
        <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Performance</Text>
        <View style={styles.detailStatsGrid}>
          <View style={styles.detailStat}>
            <Text style={[styles.detailStatValue, { color: colors.text }]}>
              {trader.stats.roi / 100}%
            </Text>
            <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>ROI</Text>
          </View>
          <View style={styles.detailStat}>
            <Text style={[styles.detailStatValue, { color: colors.text }]}>{winRate}%</Text>
            <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>Win Rate</Text>
          </View>
          <View style={styles.detailStat}>
            <Text style={[styles.detailStatValue, { color: colors.text }]}>
              {formatAmount(trader.stats.volumeTraded, 18)} ETH
            </Text>
            <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>Volume</Text>
          </View>
          <View style={styles.detailStat}>
            <Text style={[styles.detailStatValue, { color: colors.text }]}>
              {trader.stats.maxDrawdown / 100}%
            </Text>
            <Text style={[styles.detailStatLabel, { color: colors.textSecondary }]}>Max Drawdown</Text>
          </View>
        </View>
      </Card>

      {/* Copy Trading Info */}
      {trader.preferences.allowCopyTrading && trader.preferences.copyTradingFee && (
        <Card variant="outlined" padding="md" style={styles.detailCard}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Copy Trading Fee</Text>
          <Text style={[styles.feeText, { color: colors.textSecondary }]}>
            {trader.preferences.copyTradingFee / 100}% of profits
          </Text>
        </Card>
      )}
    </ScrollView>
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
  notConnectedText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  traderCard: {
    marginBottom: 12,
    marginTop: 12,
  },
  traderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  traderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize.sm,
    color: "#FFFFFF",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontFamily: "Inter-Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  nameSection: {
    flex: 1,
  },
  traderName: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  traderBio: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  copyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  statLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.xs,
  },
  detailContainer: {
    flex: 1,
  },
  backButton: {
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 16,
  },
  backButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  detailHeader: {
    alignItems: "center",
    padding: 32,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: 8,
    borderRadius: 16,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  detailAvatarText: {
    fontFamily: "Inter-Bold",
    fontSize: 36,
    color: "#FFFFFF",
  },
  detailName: {
    fontFamily: "Inter-Bold",
    fontSize: Typography.fontSize.xl,
  },
  detailBio: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  detailCopyButton: {
    maxWidth: 200,
  },
  detailCard: {
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
    marginBottom: 16,
  },
  detailStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  detailStat: {
    width: "50%",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  detailStatValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.lg,
  },
  detailStatLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  feeText: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
});
