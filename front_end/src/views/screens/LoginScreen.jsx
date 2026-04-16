// src/views/screens/LoginScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import { API, COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS, RADIUS, SHADOWS, SPACING } from '../../models/utils/constants';
import { MOCK_USER } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 🔒 VALIDATION
// ─────────────────────────────────────────
const validate = (email, password) => {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'L\'adresse e-mail est requise';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format d\'e-mail invalide';
  }
  if (!password) {
    errors.password = 'Le mot de passe est requis';
  } else if (password.length < 6) {
    errors.password = 'Minimum 6 caractères';
  }
  return errors;
};

// ─────────────────────────────────────────
// 📱 LOGIN SCREEN
// ─────────────────────────────────────────
const LoginScreen = () => {
  const { login } = useAppStore();

  // ── État formulaire
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [globalError, setGlobalError] = useState('');

  // ── Animation shake sur erreur
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Soumission
  const handleLogin = async () => {
    setGlobalError('');
    const validationErrors = validate(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shake();
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      if (API.USE_MOCK) {
        // Simule un délai réseau
        await new Promise((r) => setTimeout(r, 900));
        // Accepte n'importe quel email/password en mode mock
        await login(MOCK_USER, 'mock-token-dev-12345');
      } else {
        const { authService } = await import('../../models/services/authService');
        const data = await authService.login(email.trim(), password);
        await login(data.user, data.token);
      }
    } catch (err) {
      setGlobalError(err?.message || 'Identifiants incorrects. Veuillez réessayer.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Décorations fond */}
      <View style={styles.decoTopRight} />
      <View style={styles.decoBottomLeft} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                defaultSource={{ uri: 'https://via.placeholder.com/128x128/012D1D/FFFFFF?text=P' }}
              />
            </View>
            <Text style={styles.appName}>PoulIA</Text>
            <Text style={styles.tagline}>Digital Agronomist</Text>
          </View>

          {/* ── Carte formulaire */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={styles.welcomeTitle}>Bienvenue</Text>

            {/* Erreur globale */}
            {globalError ? (
              <View style={styles.globalErrorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.globalErrorText}>{globalError}</Text>
              </View>
            ) : null}

            {/* ── Champ Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse e-mail</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={errors.email ? COLORS.error : COLORS.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="agronome@poulia.com"
                  placeholderTextColor={COLORS.outlineVariant}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((e) => ({ ...e, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* ── Champ Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={errors.password ? COLORS.error : COLORS.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.outlineVariant}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((e) => ({ ...e, password: '' }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.visibilityBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={COLORS.outline}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* ── Bouton Se connecter */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Se connecter</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Mot de passe oublié */}
            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Footer : Créer un compte */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nouveau dans le domaine ? </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* ── Séparateur décoratif */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <MaterialIcons name="grass" size={18} color={COLORS.outlineVariant} />
            <View style={styles.dividerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['4xl'],
  },

  // ── Décorations fond
  decoTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(1, 45, 29, 0.04)',
  },
  decoBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(254, 106, 52, 0.04)',
  },

  // ── Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },

  // ── Carte
  card: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['3xl'],
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(202, 196, 208, 0.15)',
  },
  welcomeTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING['2xl'],
    letterSpacing: -0.5,
  },

  // ── Erreur globale
  globalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorContainer,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  globalErrorText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Champs
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: SPACING.lg,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorContainer,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.md,
    color: COLORS.onSurface,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  inputPassword: {
    paddingRight: SPACING.xl,
  },
  visibilityBtn: {
    padding: SPACING.xs,
  },
  errorText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },

  // ── Bouton connexion
  loginBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
  },
  loginBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Mot de passe oublié
  forgotBtn: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  forgotText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING['3xl'],
  },
  footerText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
  },
  footerLink: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // ── Séparateur
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING['3xl'],
    opacity: 0.4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
});

export default LoginScreen;