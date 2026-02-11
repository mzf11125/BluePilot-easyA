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
import { PolicyScreen } from "@/screens/PolicyScreen";
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

const PolicyIcon: React.FC<TabIconProps> = ({ focused, color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
          fontSize: 12,
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
        name="Policy"
        component={PolicyScreen}
        options={{
          tabBarLabel: "Policy",
          tabBarIcon: ({ color, size }) => <PolicyIcon color={color} size={size} focused />,
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
