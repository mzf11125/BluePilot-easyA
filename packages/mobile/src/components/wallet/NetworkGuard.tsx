/**
 * Network guard component - ensures user is on correct network
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useWallet } from "@/contexts/WalletContext";
import { Colors, Spacing, BorderRadius } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";

const REQUIRED_CHAIN_ID = 8453; // Base Mainnet

interface NetworkGuardProps {
  children: React.ReactNode;
  requiredChainId?: number;
}

export const NetworkGuard: React.FC<NetworkGuardProps> = ({
  children,
  requiredChainId = REQUIRED_CHAIN_ID,
}) => {
  const { chainId, switchChain, isConnected } = useWallet();
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const isCorrectNetwork = chainId === requiredChainId;
  const shouldShowWarning = isConnected && !isCorrectNetwork;

  const handleSwitchNetwork = async () => {
    try {
      await switchChain(requiredChainId);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <>
      {shouldShowWarning && (
        <View style={[styles.warningBanner, { backgroundColor: Colors.semantic.warning + "20" }]}>
          <Text style={[styles.warningText, { color: Colors.semantic.warning }]}>
            Wrong network. Please switch to Base.
          </Text>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={[styles.switchText, { color: colors.primary }]}>Switch</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Switch Network</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              BluePilot requires you to be on the Base network. Would you like to switch now?
            </Text>
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSwitchNetwork}
                style={styles.modalButton}
              >
                Switch to Base
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
      {children}
    </>
  );
};

const styles = StyleSheet.create({
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  warningText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    flex: 1,
  },
  switchText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    marginBottom: 8,
  },
  modalText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
