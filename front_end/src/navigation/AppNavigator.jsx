// src/navigation/AppNavigator.jsx
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import useAppStore from '../controllers/context/AppStore';
import { apiEvents } from '../models/services/apiService';
import { COLORS } from '../models/utils/constants';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// ⚠️ NavigationContainer RETIRÉ — Expo Router en fournit déjà un automatiquement.
// L'ajouter ici causait l'erreur "nested NavigationContainer".

const AppNavigator = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isAppReady      = useAppStore((s) => s.isAppReady);
  const { initializeApp, logout } = useAppStore();

  // ── Initialisation au démarrage
  useEffect(() => {
    initializeApp();
  }, []);

  // ── Écoute le 401 de l'intercepteur → déconnexion auto
  useEffect(() => {
    const handleUnauthorized = () => logout();
    apiEvents.on('unauthorized', handleUnauthorized);
    return () => apiEvents.off('unauthorized', handleUnauthorized);
  }, []);

  // ── Splash / chargement initial
  if (!isAppReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
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