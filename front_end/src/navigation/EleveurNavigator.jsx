// src/navigation/EleveurNavigator.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { COLORS } from '../models/utils/constants';

// ── Screens Éleveur
import AlertsScreen from '../views/screens/AlertsScreen';
import CameraScreen from '../views/screens/CameraScreen';
import CoopListScreen from '../views/screens/CoopListScreen';
import EquipmentScreen from '../views/screens/EquipmentScreen';
import FeedingScreen from '../views/screens/FeedingScreen';
import HealthScreen from '../views/screens/HealthScreen';
import HomeScreen from '../views/screens/HomeScreen';
import ProfileScreen from '../views/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─────────────────────────────────────────
// 🏠 BOTTOM TABS — après sélection d'une coop
// Home | Alertes | Équipements | Alimentation | Profil
// ─────────────────────────────────────────
const CoopTabs = () => {
  const unreadAlertsCount = useAppStore((s) => s.unreadAlertsCount);

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
        },
      }}
    >
      {/* TAB 1 : Dashboard coop */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="dashboard" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* TAB 2 : Alertes */}
      <Tab.Screen
        name="AlertsTab"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="notifications-active" size={24} color={color} />
              {unreadAlertsCount > 0 && <View style={styles.badgeDot} />}
            </View>
          ),
        }}
      />

      {/* TAB 3 : Équipements */}
      <Tab.Screen
        name="EquipmentTab"
        component={EquipmentScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="settings" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* TAB 4 : Alimentation */}
      <Tab.Screen
        name="FeedingTab"
        component={FeedingScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconBtn, focused && styles.iconBtnActive]}>
              <MaterialIcons name="restaurant" size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* TAB 5 : Profil */}
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

// ─────────────────────────────────────────
// 🏠 HOME STACK (dans le tab dashboard)
// Home → Camera (depuis HomeScreen)
// ─────────────────────────────────────────
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain"   component={HomeScreen} />
    <Stack.Screen name="CoopCamera" component={CameraScreen} />
    <Stack.Screen name="CoopHealth" component={HealthScreen} />
  </Stack.Navigator>
);

// ─────────────────────────────────────────
// 🗺️ ÉLEVEUR NAVIGATOR
// Étape 1 : CoopListScreen (SANS bottom nav)
// Étape 2 : CoopTabs (AVEC bottom nav) après sélection coop
// ─────────────────────────────────────────
const EleveurNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Page 1 : Liste des coops assignés — PAS de bottom nav */}
    <Stack.Screen name="CoopList" component={CoopListScreen} />

    {/* Page 2 : Dashboard + tabs — AVEC bottom nav */}
    <Stack.Screen name="CoopTabs" component={CoopTabs} />
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

export default EleveurNavigator;