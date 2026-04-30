// src/navigation/MainNavigator.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { COLORS } from '../models/utils/constants';

// ── Screens
import AdminCoopScreen from '../views/screens/AdminCoopScreen';
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
// 🔑 VÉRIFICATION DU RÔLE
// ─────────────────────────────────────────
const isAdmin = (user) => {
  const role = user?.role || user?.roleBadgeType || '';
  return (
    role === 'ADMIN' ||
    role === 'Administrateur Régional' ||
    role === 'Gestionnaire de Ferme'
  );
};

// ─────────────────────────────────────────
// 🐔 ADMIN STACK
// Admin → page gestion globale des poulaillers
// ─────────────────────────────────────────
const AdminCoopsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminCoopMain"   component={AdminCoopScreen} />
    <Stack.Screen name="CoopDashboard"   component={HomeScreen} />
    <Stack.Screen name="CoopFeeding"     component={FeedingScreen} />
    <Stack.Screen name="CoopCamera"      component={CameraScreen} />
    <Stack.Screen name="CoopEquipment"   component={EquipmentScreen} />
    <Stack.Screen name="CoopHealth"      component={HealthScreen} />
    <Stack.Screen name="CoopProfile"     component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🐔 ÉLEVEUR STACK
// Éleveur → page ses poulaillers assignés
// ─────────────────────────────────────────
const EleveurCoopsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoopListMain"  component={CoopListScreen} />
    <Stack.Screen name="CoopDashboard" component={HomeScreen} />
    <Stack.Screen name="CoopFeeding"   component={FeedingScreen} />
    <Stack.Screen name="CoopCamera"    component={CameraScreen} />
    <Stack.Screen name="CoopEquipment" component={EquipmentScreen} />
    <Stack.Screen name="CoopHealth"    component={HealthScreen} />
    <Stack.Screen name="CoopProfile"   component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 👥 USERS STACK
// ─────────────────────────────────────────
const UsersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UsersMain"    component={UserManagementScreen} />
    <Stack.Screen name="UsersProfile" component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🗺️ MAIN NAVIGATOR — NAVIGATION SELON RÔLE
// ─────────────────────────────────────────
const MainNavigator = () => {
  const user              = useAppStore((s) => s.user);
  const unreadAlertsCount = useAppStore((s) => s.unreadAlertsCount);

  // Détermine si l'utilisateur est admin
  const userIsAdmin = isAdmin(user);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:            false,
        tabBarShowLabel:        false,
        tabBarActiveTintColor:  COLORS.white,
        tabBarInactiveTintColor:'rgba(236,253,245,0.45)',
        tabBarStyle: {
          position:             'absolute',
          bottom:               0,
          left:                 0,
          right:                0,
          height:               Platform.OS === 'ios' ? 80 : 64,
          paddingBottom:        Platform.OS === 'ios' ? 24 : 0,
          paddingTop:           0,
          backgroundColor:      'rgba(2,44,29,0.97)',
          borderTopWidth:       0,
          borderTopLeftRadius:  24,
          borderTopRightRadius: 24,
          elevation:            20,
          shadowColor:          '#000',
          shadowOffset:         { width: 0, height: -4 },
          shadowOpacity:        0.3,
          shadowRadius:         16,
        },
        tabBarItemStyle: {
          flex:           1,
          alignItems:     'center',
          justifyContent: 'center',
          height:         '100%',
          paddingVertical:0,
        },
      }}
    >
      {/* ════════════════════════════════════
          TAB 1 : POULAILLERS
          → AdminCoopScreen  si admin
          → CoopListScreen   si éleveur
      ════════════════════════════════════ */}
      <Tab.Screen
        name="CoopsTab"
        component={userIsAdmin ? AdminCoopsStack : EleveurCoopsStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons
                name={userIsAdmin ? 'admin-panel-settings' : 'grid-view'}
                size={24}
                color={color}
              />
              {/* Point indicateur rôle */}
              <View style={[
                styles.roleIndicator,
                { backgroundColor: userIsAdmin ? '#FF6B35' : COLORS.emerald400 },
              ]} />
            </View>
          ),
        }}
      />

      {/* ════════════════════════════════════
          TAB 2 : ALERTES
      ════════════════════════════════════ */}
      <Tab.Screen
        name="AlertsTab"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="notifications-active" size={24} color={color} />
              {unreadAlertsCount > 0 && (
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* ════════════════════════════════════
          TAB 3 : ÉQUIPE (admin uniquement)
                  PROFIL (éleveur)
      ════════════════════════════════════ */}
      <Tab.Screen
        name="UsersTab"
        component={userIsAdmin ? UsersStack : ProfileStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons
                name={userIsAdmin ? 'group' : 'person'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─────────────────────────────────────────
// 👤 PROFIL STACK (pour éleveur tab 3)
// ─────────────────────────────────────────
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  iconBtn: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  iconBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  // Point rouge alertes
  badge: {
    position:        'absolute',
    top:             8,
    right:           8,
  },
  badgeDot: {
    width:           9,
    height:          9,
    borderRadius:    5,
    backgroundColor: COLORS.error,
    borderWidth:     1.5,
    borderColor:     'rgba(2,44,29,0.97)',
  },
  // Petit indicateur de rôle sous l'icône
  roleIndicator: {
    position:        'absolute',
    bottom:          6,
    width:           4,
    height:          4,
    borderRadius:    2,
  },
});

export default MainNavigator;