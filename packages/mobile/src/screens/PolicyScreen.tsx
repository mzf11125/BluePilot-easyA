/**
 * Policy Screen - Trading policy configuration
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
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spacing, Typography, BorderRadius } from "@/constants";
import { percentageToBps, bpsToPercentage } from "@/utils/formatting";

interface Policy {
  maxSlippageBps: number;
  maxTradeSize: string;
  cooldownSeconds: number;
  tokenAllowlist: string[];
}

const DEFAULT_POLICY: Policy = {
  maxSlippageBps: 300, // 3%
  maxTradeSize: "10", // 10 ETH
  cooldownSeconds: 60, // 1 minute
  tokenAllowlist: [],
};

export const PolicyScreen: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const { colors } = useTheme();

  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const [maxSlippage, setMaxSlippage] = useState("3");
  const [maxTradeSize, setMaxTradeSize] = useState("10");
  const [cooldown, setCooldown] = useState("60");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadPolicy();
    }
  }, [isConnected]);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPolicy(DEFAULT_POLICY);
      setMaxSlippage(bpsToPercentage(DEFAULT_POLICY.maxSlippageBps).toString());
      setMaxTradeSize(DEFAULT_POLICY.maxTradeSize);
      setCooldown(DEFAULT_POLICY.cooldownSeconds.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    setSaving(true);
    setError(null);

    try {
      const slippageBps = percentageToBps(parseFloat(maxSlippage));
      const newPolicy: Policy = {
        maxSlippageBps: Math.min(Math.max(slippageBps, 0), 10000),
        maxTradeSize,
        cooldownSeconds: parseInt(cooldown, 10),
        tokenAllowlist: [],
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPolicy(newPolicy);
    } catch (err: any) {
      setError(err.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Connect your wallet to configure trading policies
          </Text>
          <Button onPress={connect}>Connect Wallet</Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingIndicator fullScreen text="Loading policy..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <CardHeader
        title="Trading Policy"
        subtitle="Configure safety limits for your trades"
      />

      {/* Policy Summary */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Settings</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Max Slippage</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {bpsToPercentage(policy.maxSlippageBps).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Max Trade Size</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {policy.maxTradeSize} ETH
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cooldown</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCooldown(policy.cooldownSeconds)}
          </Text>
        </View>
      </Card>

      {/* Edit Policy */}
      <CardHeader title="Update Policy" style={styles.sectionHeader} />
      <Card variant="outlined" padding="md">
        <Text style={[styles.label, { color: colors.text }]}>Max Slippage (%)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
          value={maxSlippage}
          onChangeText={setMaxSlippage}
          keyboardType="decimal-pad"
          placeholder="3.0"
        />
        <Text style={[styles.helper, { color: colors.textTertiary }]}>
          Maximum price slippage allowed per trade (0.1% - 100%)
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Max Trade Size (ETH)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
          value={maxTradeSize}
          onChangeText={setMaxTradeSize}
          keyboardType="decimal-pad"
          placeholder="10"
        />
        <Text style={[styles.helper, { color: colors.textTertiary }]}>
          Maximum amount per trade
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Cooldown (seconds)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
          value={cooldown}
          onChangeText={setCooldown}
          keyboardType="number-pad"
          placeholder="60"
        />
        <Text style={[styles.helper, { color: colors.textTertiary }]}>
          Minimum time between trades (0 = no cooldown)
        </Text>
      </Card>

      {/* Presets */}
      <CardHeader title="Presets" style={styles.sectionHeader} />
      <View style={styles.presets}>
        {getPresetOptions().map((preset) => (
          <TouchableOpacity
            key={preset.name}
            style={[styles.presetCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
            onPress={() => {
              setMaxSlippage(preset.slippage.toString());
              setMaxTradeSize(preset.tradeSize);
              setCooldown(preset.cooldown.toString());
            }}
          >
            <Text style={[styles.presetName, { color: colors.text }]}>{preset.name}</Text>
            <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
              {preset.slippage}% slippage • {preset.tradeSize} ETH max • {formatCooldown(preset.cooldown)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorMessage message={error} />}

      <Button
        variant="primary"
        size="large"
        onPress={handleSavePolicy}
        loading={saving}
        disabled={saving}
        fullWidth
      >
        Save Policy
      </Button>
    </ScrollView>
  );
};

function formatCooldown(seconds: number): string {
  if (seconds === 0) return "No cooldown";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function getPresetOptions() {
  return [
    { name: "Conservative", slippage: 0.5, tradeSize: "5", cooldown: 300 },
    { name: "Balanced", slippage: 3, tradeSize: "10", cooldown: 60 },
    { name: "Aggressive", slippage: 5, tradeSize: "50", cooldown: 0 },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.screenPaddingVertical,
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
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.lg,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
  summaryValue: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  label: {
    fontFamily: "Inter-Medium",
    fontSize: Typography.fontSize.sm,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.base,
  },
  helper: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  presets: {
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    padding: 16,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  presetName: {
    fontFamily: "Inter-SemiBold",
    fontSize: Typography.fontSize.base,
    marginBottom: 4,
  },
  presetDesc: {
    fontFamily: "Inter-Regular",
    fontSize: Typography.fontSize.sm,
  },
});
