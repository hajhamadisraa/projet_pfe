// src/navigation/MainNavigator.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import {
  COLORS,
  FONT_WEIGHTS,
  RADIUS,
  ROUTES,
  SPACING,
} from '../models/utils/constants';

// ── Screens
import AlertsScreen from '../views/screens/AlertsScreen';
import CameraScreen from '../views/screens/CameraScreen';
import CoopListScreen from '../views/screens/CoopListScreen';
import EquipmentScreen from '../views/screens/EquipmentScreen';
import FeedingScreen from '../views/screens/FeedingScreen';
import HealthScreen from '../views/screens/HealthScreen';
import HomeScreen from '../views/screens/HomeScreen';
import ProfileScreen from '../views/screens/ProfileScreen';
import UserManagementScreen from '../views/screens/UserManagementScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────
// 🏠 HOME STACK
// Contient : Home + tous les écrans détail
// accessibles depuis Home
// ─────────────────────────────────────────
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain"                component={HomeScreen} />
    <Stack.Screen name={ROUTES.PROFILE}          component={ProfileScreen} />
    <Stack.Screen name={ROUTES.USER_MANAGEMENT}  component={UserManagementScreen} />
    <Stack.Screen name={ROUTES.FEEDING}          component={FeedingScreen} />
    <Stack.Screen name={ROUTES.CAMERA}           component={CameraScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🐔 COOPS STACK
// ─────────────────────────────────────────
const CoopsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.COOP_LIST} component={CoopListScreen} />
    <Stack.Screen name={ROUTES.CAMERA}    component={CameraScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// ⚙️ SETTINGS STACK
// ─────────────────────────────────────────
const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EquipmentMain"          component={EquipmentScreen} />
    <Stack.Screen name={ROUTES.PROFILE}         component={ProfileScreen} />
    <Stack.Screen name={ROUTES.USER_MANAGEMENT} component={UserManagementScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🎨 ICÔNE TAB
// ─────────────────────────────────────────
const TabIcon = ({ iconName, label, focused, badge }) => (
  <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
    <View style={styles.iconRow}>
      <MaterialIcons
        name={iconName}
        size={22}
        color={focused ? COLORS.white : 'rgba(236,253,245,0.5)'}
      />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.label, focused && styles.labelActive]}>
      {label}
    </Text>
  </View>
);

// ─────────────────────────────────────────
// 🗺️ MAIN NAVIGATOR
// ─────────────────────────────────────────
const MainNavigator = () => {
  const unreadAlertsCount = useAppStore((s) => s.unreadAlertsCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:      false,
        tabBarShowLabel:  false,
        tabBarStyle:      styles.tabBar,
        tabBarItemStyle:  styles.tabItem,
      }}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="dashboard" label="Home" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.COOPS}
        component={CoopsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="grid-view" label="Coops" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.HEALTH}
        component={HealthScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="health-and-safety" label="Health" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.ALERTS}
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="notifications-active"
              label="Alerts"
              focused={focused}
              badge={unreadAlertsCount}
            />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.SETTINGS}
        component={SettingsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="settings" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(2,44,29,0.96)',
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 2,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
  },
  iconRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: 'rgba(236,253,245,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: COLORS.error,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(2,44,29,0.96)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default MainNavigator;