/**
 * Bottom tab navigator for main app screens
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Text, View } from "react-native";

// Import screens
import { HomeScreen } from "@/screens/HomeScreen";
import { TradeScreen } from "@/screens/TradeScreen";
import { LaunchesScreen } from "@/screens/LaunchesScreen";
import { AutoTradingScreen } from "@/screens/AutoTradingScreen";
import { SocialTradingScreen } from "@/screens/SocialTradingScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const HomeIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const TradeIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M7 10h10" />
    <path d="M7 14h10" />
    <path d="M12 10v8" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const LaunchesIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const AutoIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <path d="M12 18h.01" />
  </svg>
);

const SocialIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const HistoryIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

export const BottomTabNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} focused />,
        }}
      />
      <Tab.Screen
        name="Trade"
        component={TradeScreen}
        options={{
          tabBarLabel: "Trade",
          tabBarIcon: ({ color, size }) => <TradeIcon color={color} size={size} focused />,
        }}
      />
      <Tab.Screen
        name="Launches"
        component={LaunchesScreen}
        options={{
          tabBarLabel: "Launches",
          tabBarIcon: ({ color, size }) => <LaunchesIcon color={color} size={size} focused />,
        }}
      />
      <Tab.Screen
        name="Auto"
        component={AutoTradingScreen}
        options={{
          tabBarLabel: "Auto",
          tabBarIcon: ({ color, size }) => <AutoIcon color={color} size={size} focused />,
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialTradingScreen}
        options={{
          tabBarLabel: "Social",
          tabBarIcon: ({ color, size }) => <SocialIcon color={color} size={size} focused />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => <HistoryIcon color={color} size={size} focused />,
        }}
      />
    </Tab.Navigator>
  );
};
