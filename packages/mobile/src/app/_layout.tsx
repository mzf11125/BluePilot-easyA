/**
 * Root layout for Expo Router
 */

import { Stack } from "expo-router";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <NetworkGuard>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" redirect to="/home" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </NetworkGuard>
      </WalletProvider>
    </ThemeProvider>
  );
}
