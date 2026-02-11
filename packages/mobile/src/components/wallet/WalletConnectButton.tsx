/**
 * WalletConnect button component
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, BorderRadius } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";

export const WalletConnectButton: React.FC<{ style?: any }> = ({ style }) => {
  const { isConnected, address, balance, connect, disconnect, shortenAddress, formatBalance } =
    useWallet();
  const { colors } = useTheme();

  if (isConnected && address) {
    return (
      <TouchableOpacity
        style={[styles.connectedButton, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }, style]}
        onPress={disconnect}
        activeOpacity={0.8}
      >
        <View style={styles.addressContainer}>
          <View style={[styles.balanceDot, { backgroundColor: Colors.semantic.success }]} />
          <Text style={[styles.address, { color: colors.text }]}>
            {shortenAddress(address)}
          </Text>
          <Text style={[styles.balance, { color: colors.textSecondary }]}>
            {formatBalance(balance)} ETH
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Button
      variant="primary"
      onPress={connect}
      style={style}
      icon={<ConnectIcon color="#FFFFFF" />}
    >
      Connect Wallet
    </Button>
  );
};

const ConnectIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={styles.icon}>
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M10 2V4M10 16V18M18 10H16M4 10H2M15.6569 4.34315L14.2426 5.75736M5.75736 14.2426L4.34315 15.6569M15.6569 15.6569L14.2426 14.2426M5.75736 5.75736L4.34315 4.34315"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  </View>
);

const styles = StyleSheet.create({
  connectedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    minHeight: 44,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  address: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  balance: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
