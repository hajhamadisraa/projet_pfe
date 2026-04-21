// src/navigation/MainNavigator.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { COLORS, ROUTES } from '../models/utils/constants';

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
// 🐔 COOPS STACK
// ─────────────────────────────────────────
const CoopsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.COOP_LIST} component={CoopListScreen} />
    <Stack.Screen name={ROUTES.HOME}      component={HomeScreen} />
    <Stack.Screen name={ROUTES.FEEDING}   component={FeedingScreen} />
    <Stack.Screen name={ROUTES.CAMERA}    component={CameraScreen} />
    <Stack.Screen name={ROUTES.SETTINGS}  component={EquipmentScreen} />
    <Stack.Screen name={ROUTES.HEALTH}    component={HealthScreen} />
    <Stack.Screen name={ROUTES.PROFILE}   component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 👥 USERS STACK
// ─────────────────────────────────────────
const UsersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.USER_MANAGEMENT} component={UserManagementScreen} />
    <Stack.Screen name={ROUTES.PROFILE}         component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🗺️ MAIN NAVIGATOR
// ─────────────────────────────────────────
const MainNavigator = () => {
  const unreadAlertsCount = useAppStore((s) => s.unreadAlertsCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:            false,
        tabBarShowLabel:        false,  // ✅ Pas de labels
        tabBarActiveTintColor:  COLORS.white,
        tabBarInactiveTintColor:'rgba(236,253,245,0.45)',
        tabBarStyle: {
          position:              'absolute',
          bottom:                0,
          left:                  0,
          right:                 0,
          height:                Platform.OS === 'ios' ? 80 : 64,
          paddingBottom:         Platform.OS === 'ios' ? 24 : 0,
          paddingTop:            0,
          backgroundColor:       'rgba(2,44,29,0.97)',
          borderTopWidth:        0,
          borderTopLeftRadius:   24,
          borderTopRightRadius:  24,
          elevation:             20,
          shadowColor:           '#000',
          shadowOffset:          { width: 0, height: -4 },
          shadowOpacity:         0.3,
          shadowRadius:          16,
        },
        tabBarItemStyle: {
          flex:            1,
          alignItems:      'center',
          justifyContent:  'center',
          height:          '100%',
          paddingVertical: 0,
        },
      }}
    >
      {/* ── Tab 1 : Poulaillers */}
      <Tab.Screen
        name="CoopsTab"
        component={CoopsStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="grid-view" size={26} color={color} />
            </View>
          ),
        }}
      />

      {/* ── Tab 2 : Alertes */}
      <Tab.Screen
        name={ROUTES.ALERTS}
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="notifications-active" size={26} color={color} />
              {unreadAlertsCount > 0 && (
                <View style={styles.badge} />
              )}
            </View>
          ),
        }}
      />

      {/* ── Tab 3 : Utilisateurs */}
      <Tab.Screen
        name="UsersTab"
        component={UsersStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="group" size={26} color={color} />
            </View>
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
  // Cercle autour de l'icône active
  iconBtn: {
    width:           52,
    height:          52,
    borderRadius:    26,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  iconBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  // Point rouge alertes non lues
  badge: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           9,
    height:          9,
    borderRadius:    5,
    backgroundColor: COLORS.error,
    borderWidth:     1.5,
    borderColor:     'rgba(2,44,29,0.97)',
  },
});

export default MainNavigator;