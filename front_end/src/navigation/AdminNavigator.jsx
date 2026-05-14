// src/navigation/AdminNavigator.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { COLORS } from '../models/utils/constants';

// ── Screens Admin
import AdminCoopScreen from '../views/screens/AdminCoopScreen';
import AlertsScreen from '../views/screens/AlertsScreen';
import CameraScreen from '../views/screens/CameraScreen';
import EquipmentScreen from '../views/screens/EquipmentScreen';
import FeedingScreen from '../views/screens/FeedingScreen';
import HealthScreen from '../views/screens/HealthScreen';
import HomeScreen from '../views/screens/HomeScreen';
import ProfileScreen from '../views/screens/ProfileScreen';
import UserManagementScreen from '../views/screens/UserManagementScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─────────────────────────────────────────
// 📋 ADMIN COOPS STACK
// ─────────────────────────────────────────
const AdminCoopStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminCoopMain"  component={AdminCoopScreen} />
    <Stack.Screen name="CoopDashboard"  component={HomeScreen} />
    <Stack.Screen name="CoopFeeding"    component={FeedingScreen} />
    <Stack.Screen name="CoopCamera"     component={CameraScreen} />
    <Stack.Screen name="CoopEquipment"  component={EquipmentScreen} />
    <Stack.Screen name="CoopHealth"     component={HealthScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 👥 USERS STACK
// ✅ ProfileScreen retiré du Stack — il causait un crash
//    car React Navigation le pré-montait avant que le store
//    soit prêt. Le profil admin est accessible via le Tab dédié.
// ─────────────────────────────────────────
const UsersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UsersMain" component={UserManagementScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🔔 ALERTS STACK
// ─────────────────────────────────────────
const AlertsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AlertsMain" component={AlertsScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🗺️ ADMIN NAVIGATOR — 4 TABS
// ─────────────────────────────────────────
const AdminNavigator = () => {
  const unreadAlertsCount = useAppStore((s) => s.unreadAlertsCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarShowLabel:         false,
        tabBarActiveTintColor:   COLORS.white,
        tabBarInactiveTintColor: 'rgba(236,253,245,0.45)',
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
        },
      }}
    >
      {/* TAB 1 : Gestion Poulaillers */}
      <Tab.Screen
        name="AdminCoopsTab"
        component={AdminCoopStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="home-work" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* TAB 2 : Alertes */}
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="notifications-active" size={24} color={color} />
              {unreadAlertsCount > 0 && <View style={styles.badgeDot} />}
            </View>
          ),
        }}
      />

      {/* TAB 3 : Utilisateurs */}
      <Tab.Screen
        name="UsersTab"
        component={UsersStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="manage-accounts" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* TAB 4 : Profil Admin
          ✅ Monté comme Tab direct (comme EleveurNavigator)
          pour éviter le crash de pré-montage en Stack */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="person" size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

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
  badgeDot: {
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

export default AdminNavigator;