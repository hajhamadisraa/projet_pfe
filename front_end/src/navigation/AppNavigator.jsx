// src/navigation/AppNavigator.jsx
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { apiEvents } from '../models/services/apiService';
import { COLORS } from '../models/utils/constants';

import SetPasswordScreen from '../views/screens/SetPasswordScreen';
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';
import EleveurNavigator from './EleveurNavigator';

const Stack = createStackNavigator();

const isAdminUser = (user) => {
  const role = (user?.role || user?.roleBadgeType || '').toLowerCase();
  return (
    role === 'admin' ||
    role === 'administrateur régional' ||
    role === 'gestionnaire de ferme'
  );
};

const AppNavigator = () => {
  const isAuthenticated        = useAppStore((s) => s.isAuthenticated);
  const isAppReady             = useAppStore((s) => s.isAppReady);
  const user                   = useAppStore((s) => s.user);
  const { initializeApp, logout } = useAppStore();

  const navigationRef = useRef(null);
  const pendingUrl    = useRef(null);

  useEffect(() => { initializeApp(); }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    apiEvents.on('unauthorized', handleUnauthorized);
    return () => apiEvents.off('unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) pendingUrl.current = url;
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      if (navigationRef.current?.isReady()) {
        setTimeout(() => handleDeepLink(url), 300);
      } else {
        pendingUrl.current = url;
      }
    });

    return () => sub.remove();
  }, []);

  const onNavigatorReady = () => {
    if (pendingUrl.current) {
      const url = pendingUrl.current;
      pendingUrl.current = null;
      setTimeout(() => handleDeepLink(url), 300);
    }
  };

  const handleDeepLink = (url) => {
  if (!url || !navigationRef.current?.isReady()) return;
  console.log('[DeepLink] URL reçue:', url); // ✅ debug
  try {
    const parsed   = new URL(url);
    const fullPath = parsed.pathname || '';
    const isExpUrl = url.startsWith('exp://');
    const path     = isExpUrl
      ? fullPath.replace(/^\/--\//, '')
      : parsed.hostname + fullPath;

    const token = parsed.searchParams.get('token');

    console.log('[DeepLink] path:', path, '| token:', token); // ✅ debug

    if (path.includes('set-password') && token) {
      navigationRef.current.dispatch(
        CommonActions.navigate('SetPassword', { token })
      );
    }
  } catch (e) {
    console.warn('[DeepLink] Erreur parsing URL:', e);
  }
};

  if (!isAppReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    // Dans le return de AppNavigator, mettre Auth AVANT SetPassword
<NavigationContainer ref={navigationRef} onReady={onNavigatorReady}>
  <Stack.Navigator screenOptions={{ headerShown: false }}>

    {/* ✅ Les screens conditionnels EN PREMIER = écran initial correct */}
    {!isAuthenticated ? (
      <Stack.Screen name="Auth"    component={AuthNavigator} />
    ) : isAdminUser(user) ? (
      <Stack.Screen name="Admin"   component={AdminNavigator} />
    ) : (
      <Stack.Screen name="Eleveur" component={EleveurNavigator} />
    )}

    {/* ✅ SetPassword EN DERNIER = pushed par dessus Auth via deep link */}
    <Stack.Screen name="SetPassword" component={SetPasswordScreen} />

  </Stack.Navigator>
</NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;