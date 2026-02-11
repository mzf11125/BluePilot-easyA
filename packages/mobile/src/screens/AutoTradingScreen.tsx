/**
 * Auto Trading Screen - Configure auto-trading strategies
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { Spacing, Typography } from "@/constants";

type RiskLevel = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
type SignalType = "PRICE_SPIKE" | "VOLUME_SURGE" | "LAUNCH_MOMENTUM" | "WHALE_ACCUMULATION";

interface AutoTradeConfig {
  enabled: boolean;
  maxTradeSize: string;
  maxDailyVolume: string;
  minConfidence: number;
  allowedSignalTypes: SignalType[];
  riskLevel: RiskLevel;
  maxOpenPositions: number;
}

interface Position {
  token: string;
  amount: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  openedAt: number;
}

interface TradingSignal {
  id: string;
  type: SignalType;
  token: string;
  timestamp: number;
  confidence: number;
  action: "BUY" | "SELL" | "HOLD";
}

export const AutoTradingScreen: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { colors } = useTheme();

  const [config, setConfig] = useState<AutoTradeConfig>({
    enabled: false,
    maxTradeSize: "0.1",
    maxDailyVolume: "1.0",
    minConfidence: 70,
    allowedSignalTypes: ["LAUNCH_MOMENTUM", "GRADUATION_IMMINENT"],
    riskLevel: "MODERATE",
    maxOpenPositions: 5,
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "positions" | "signals">("config");

  useEffect(() => {
    if (isConnected && address) {
      loadConfig();
      loadPositions();
      loadSignals();
    }
  }, [isConnected, address]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/auto-trading/config?userId=${address}`);
      // const data = await response.json();
      // if (data.config) setConfig(data.config);
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/auto-trading/positions?userId=${address}`);
      // const data = await response.json();
      // setPositions(data.positions || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const loadSignals = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/auto-trading/signals`);
      // const data = await response.json();
      // setSignals(data.signals || []);
    } catch (error) {
      console.error("Failed to load signals:", error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // TODO: Replace with actual API call
      // await fetch("/api/auto-trading/config", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ...config, userId: address, walletAddress: address }),
      // });

      Alert.alert("Success", "Auto-trading configuration saved");
    } catch (error) {
      Alert.alert("Error", "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoTrading = async (enabled: boolean) => {
    try {
      const endpoint = enabled ? "/api/auto-trading/start" : "/api/auto-trading/stop";
      // TODO: Replace with actual API call
      // await fetch(endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: address }),
      // });

      setConfig({ ...config, enabled });
    } catch (error) {
      Alert.alert("Error", `Failed to ${enabled ? "start" : "stop"} auto-trading`);
    }
  };

  const closePosition = async (token: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch("/api/auto-trading/positions/close", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: address, token }),
      // });

      loadPositions();
      Alert.alert("Success", "Position closed");
    } catch (error) {
      Alert.alert("Error", "Failed to close position");
    }
  };

  const updateConfig = (key: keyof AutoTradeConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const toggleSignalType = (type: SignalType) => {
    const newTypes = config.allowedSignalTypes.includes(type)
      ? config.allowedSignalTypes.filter((t) => t !== type)
      : [...config.allowedSignalTypes, type];
    setConfig({ ...config, allowedSignalTypes: newTypes });
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>
            Connect your wallet to configure auto-trading
          </Text>
          <Button onPress={() => {}}>Connect Wallet</Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Auto Trading</Text>

        {/* Status Toggle */}
        <View style={[styles.statusRow, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.statusLabel, { color: colors.text }]}>
            {config.enabled ? "Active" : "Paused"}
          </Text>
          <Switch
            value={config.enabled}
            onValueChange={toggleAutoTrading}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["config", "positions", "signals"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary }
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === "config" && (
          <>
            {/* Risk Level */}
            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Risk Level</Text>
              <View style={styles.riskButtons}>
                {(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"] as RiskLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.riskButton,
                      config.riskLevel === level && { backgroundColor: colors.primary + "20" }
                    ]}
                    onPress={() => updateConfig("riskLevel", level)}
                  >
                    <Text
                      style={[
                        styles.riskButtonText,
                        { color: config.riskLevel === level ? colors.primary : colors.textSecondary }
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Trade Sizes */}
            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trade Limits</Text>

              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Max Trade Size (ETH)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                  value={config.maxTradeSize}
                  onChangeText={(text) => updateConfig("maxTradeSize", text)}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Max Daily Volume (ETH)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                  value={config.maxDailyVolume}
                  onChangeText={(text) => updateConfig("maxDailyVolume", text)}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Max Open Positions
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
                  value={config.maxOpenPositions.toString()}
                  onChangeText={(text) => updateConfig("maxOpenPositions", parseInt(text) || 1)}
                  keyboardType="number-pad"
                />
              </View>
            </Card>

            {/* Signal Types */}
            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Signal Types</Text>
              {([
                { type: "PRICE_SPIKE" as const, label: "Price Spike" },
                { type: "VOLUME_SURGE" as const, label: "Volume Surge" },
                { type: "LAUNCH_MOMENTUM" as const, label: "Launch Momentum" },
                { type: "WHALE_ACCUMULATION" as const, label: "Whale Accumulation" },
              ].map(({ type, label }) => (
                <TouchableOpacity
                  key={type}
                  style={styles.signalTypeRow}
                  onPress={() => toggleSignalType(type)}
                >
                  <Text style={[styles.signalTypeLabel, { color: colors.text }]}>{label}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      config.allowedSignalTypes.includes(type) && { backgroundColor: colors.primary }
                    ]}
                  >
                    {config.allowedSignalTypes.includes(type) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            {/* Minimum Confidence */}
            <Card variant="outlined" padding="md" style={styles.card}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Minimum Confidence</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>{config.minConfidence}%</Text>
              </View>
              {/* TODO: Add Slider component */}
            </Card>

            <Button
              variant="primary"
              size="large"
              onPress={saveConfig}
              loading={saving}
              fullWidth
              style={styles.saveButton}
            >
              Save Configuration
            </Button>
          </>
        )}

        {activeTab === "positions" && (
          <>
            {positions.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No open positions
                </Text>
              </View>
            ) : (
              positions.map((position, index) => (
                <Card key={index} variant="outlined" padding="md" style={styles.card}>
                  <View style={styles.positionHeader}>
                    <View>
                      <Text style={[styles.positionToken, { color: colors.text }]}>
                        {shortenAddress(position.token)}
                      </Text>
                      <Text style={[styles.positionAmount, { color: colors.textSecondary }]}>
                        {position.amount} tokens
                      </Text>
                    </View>
                    <View style={styles.positionPnl}>
                      <Text style={[styles.pnlLabel, { color: colors.textSecondary }]}>PnL</Text>
                      <Text
                        style={[
                          styles.pnlValue,
                          { color: position.pnl.startsWith("-") ? colors.error : colors.success }
                        ]}
                      >
                        {position.pnl}
                      </Text>
                    </View>
                  </View>
                  <Button
                    variant="secondary"
                    size="small"
                    onPress={() => closePosition(position.token)}
                  >
                    Close Position
                  </Button>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === "signals" && (
          <>
            {signals.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active signals
                </Text>
              </View>
            ) : (
              signals.map((signal) => (
                <Card key={signal.id} variant="outlined" padding="md" style={styles.card}>
                  <View style={styles.signalHeader}>
                    <View style={styles.signalTypeBadge}>
                      <Text style={[styles.signalTypeText, { color: colors.primary }]}>
                        {signal.type.replace(/_/g, " ")}
                      </Text>
                    </View>
                    <Text style={[styles.signalConfidence, { color: colors.textSecondary }]}>
                      {signal.confidence}% confidence
                    </Text>
                  </View>
                  <Text style={[styles.signalToken, { color: colors.text }]}>
                    {shortenAddress(signal.token)}
                  </Text>
                  <View style={styles.signalActionRow}>
                    <Text style={[styles.signalActionLabel, { color: colors.textSecondary }]}>
                      Suggested:
                    </Text>
                    <Text
                      style={[
                        styles.signalAction,
                        {
                          color:
                            signal.action === "BUY"
                              ? colors.success
                              : signal.action === "SELL"
                              ? colors.error
                              : colors.textSecondary
                        }
                      ]}
                    >
                      {signal.action}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  card: {
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
    marginBottom: 16,
  },
  riskButtons: {
    flexDirection: "row",
    gap: 8,
  },
  riskButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  riskButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.sm,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  signalTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  signalTypeLabel: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.base,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sliderValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  saveButton: {
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 24,
  },
  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  positionToken: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  positionAmount: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginTop: 4,
  },
  positionPnl: {
    alignItems: "flex-end",
  },
  pnlLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.xs,
  },
  pnlValue: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  signalTypeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  signalTypeText: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.xs,
  },
  signalConfidence: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.xs,
  },
  signalToken: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.base,
    marginBottom: 8,
  },
  signalActionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  signalActionLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
    marginRight: 8,
  },
  signalAction: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
  },
});
