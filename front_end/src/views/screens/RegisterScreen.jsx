// src/views/screens/RegisterScreen.jsx
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
import {
    API,
    COLORS,
    FONTS,
    FONT_SIZES,
    FONT_WEIGHTS,
    RADIUS,
    SHADOWS,
    SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🔒 VALIDATION
// ─────────────────────────────────────────
const validate = (name, email, password, confirmPassword) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Le nom est requis';
  } else if (name.trim().length < 2) {
    errors.name = 'Minimum 2 caractères';
  }

  if (!email.trim()) {
    errors.email = "L'adresse e-mail est requise";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Format d'e-mail invalide";
  }

  if (!password) {
    errors.password = 'Le mot de passe est requis';
  } else if (password.length < 6) {
    errors.password = 'Minimum 6 caractères';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  return errors;
};

// ─────────────────────────────────────────
// ⏳ ÉCRAN EN ATTENTE DE VALIDATION
// ─────────────────────────────────────────
const PendingScreen = ({ navigation, userName }) => (
  <SafeAreaView style={pendingStyles.safe}>
    <View style={pendingStyles.container}>
      {/* Icône animée */}
      <View style={pendingStyles.iconWrapper}>
        <MaterialIcons name="hourglass-top" size={56} color={COLORS.secondary} />
      </View>

      {/* Textes */}
      <Text style={pendingStyles.title}>Demande envoyée !</Text>
      <Text style={pendingStyles.subtitle}>
        Bonjour <Text style={pendingStyles.name}>{userName}</Text>,{'\n'}
        votre demande a été transmise à l'administrateur.
      </Text>

      {/* Étapes */}
      <View style={pendingStyles.stepsCard}>
        <View style={pendingStyles.step}>
          <View style={[pendingStyles.stepDot, { backgroundColor: COLORS.secondary }]}>
            <MaterialIcons name="check" size={14} color={COLORS.white} />
          </View>
          <Text style={pendingStyles.stepText}>Compte créé avec succès</Text>
        </View>
        <View style={pendingStyles.stepLine} />
        <View style={pendingStyles.step}>
          <View style={[pendingStyles.stepDot, { backgroundColor: COLORS.warning }]}>
            <MaterialIcons name="schedule" size={14} color={COLORS.white} />
          </View>
          <Text style={pendingStyles.stepText}>Validation par l'administrateur</Text>
        </View>
        <View style={pendingStyles.stepLine} />
        <View style={pendingStyles.step}>
          <View style={[pendingStyles.stepDot, { backgroundColor: COLORS.outlineVariant }]}>
            <MaterialIcons name="login" size={14} color={COLORS.white} />
          </View>
          <Text style={[pendingStyles.stepText, { color: COLORS.onSurfaceVariant }]}>
            Connexion à votre compte
          </Text>
        </View>
      </View>

      <Text style={pendingStyles.hint}>
        Vous recevrez une notification une fois votre compte activé.
      </Text>

      {/* Bouton retour */}
      <TouchableOpacity
        style={pendingStyles.btn}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.primaryLight, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={pendingStyles.btnGradient}
        >
          <MaterialIcons name="arrow-back" size={18} color={COLORS.white} />
          <Text style={pendingStyles.btnText}>Retour à la connexion</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const pendingStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    gap: SPACING.xl,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(254, 106, 52, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(254, 106, 52, 0.20)',
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.md,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  name: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS['2xl'],
    padding: SPACING['2xl'],
    ...SHADOWS.sm,
    gap: 0,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.outlineVariant,
    marginLeft: 13,
    marginVertical: 4,
  },
  stepText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurface,
  },
  hint: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  btn: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
  },
  btnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────
// 📱 REGISTER SCREEN
// ─────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const { login } = useAppStore();

  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [errors, setErrors]                   = useState({});
  const [loading, setLoading]                 = useState(false);
  const [globalError, setGlobalError]         = useState('');
  const [pending, setPending]                 = useState(false);
  const [registeredName, setRegisteredName]   = useState('');

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

  const handleRegister = async () => {
    setGlobalError('');
    const validationErrors = validate(name, email, password, confirmPassword);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shake();
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      if (API.USE_MOCK) {
        // ── Mode mock : simule un compte PENDING
        await new Promise((r) => setTimeout(r, 900));
        setRegisteredName(name.trim());
        setPending(true);

      } else {
        const { authService } = await import('../../models/services/authService');
        const data = await authService.register(name.trim(), email.trim(), password);

        if (data.status === 'PENDING' || !data.token) {
          // ── Compte créé mais en attente de validation admin
          setRegisteredName(name.trim());
          setPending(true);
        } else {
          // ── Compte actif directement (approbation automatique configurée)
          await login(data.user, data.token);
        }
      }
    } catch (err) {
      setGlobalError(err?.message || "Erreur lors de la création du compte. Veuillez réessayer.");
      shake();
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) =>
    setErrors((prev) => ({ ...prev, [field]: '' }));

  // ── Afficher l'écran d'attente si la demande est soumise
  if (pending) {
    return <PendingScreen navigation={navigation} userName={registeredName} />;
  }

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
          {/* ── Bouton retour moderne (pill) */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back-ios" size={14} color={COLORS.primary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

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
            <Text style={styles.appName}>Smart Poulailler</Text>

            {/* ── Badge orange "Créer un compte" */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <MaterialIcons name="person-add" size={13} color={COLORS.secondary} />
                <Text style={styles.badgeText}>Créer un compte</Text>
              </View>
            </View>
          </View>

          {/* ── Carte formulaire */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={styles.welcomeTitle}>Inscription</Text>

            
            {/* Erreur globale */}
            {globalError ? (
              <View style={styles.globalErrorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.globalErrorText}>{globalError}</Text>
              </View>
            ) : null}

            {/* ── Champ Nom */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
                <MaterialIcons
                  name="person-outline"
                  size={20}
                  color={errors.name ? COLORS.error : COLORS.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor={COLORS.outlineVariant}
                  value={name}
                  onChangeText={(text) => { setName(text); clearError('name'); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

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
                  onChangeText={(text) => { setEmail(text); clearError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
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
                  onChangeText={(text) => { setPassword(text); clearError('password'); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
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
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* ── Champ Confirmer Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={errors.confirmPassword ? COLORS.error : COLORS.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.outlineVariant}
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); clearError('confirmPassword'); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.visibilityBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={showConfirm ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={COLORS.outline}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* ── Bouton Créer le compte (orange) */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF8C5A', COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>Envoyer ma demande</Text>
                    <MaterialIcons name="send" size={18} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Footer : Déjà un compte */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerLink}>Se connecter</Text>
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

  // ── Bouton retour moderne (pill)
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(1, 45, 29, 0.07)',
    marginBottom: SPACING.xl,
  },
  backText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },

  // ── Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
  },
  logoWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  appName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
    letterSpacing: -1,
  },

  // ── Badge orange
  badgeRow: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(254, 106, 52, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(254, 106, 52, 0.25)',
  },
  badgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.secondary,
    letterSpacing: 0.5,
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
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
  },

  // ── Info box (validation requise)
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.emerald50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.emerald100,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 18,
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

  // ── Bouton inscription (orange)
  registerBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
  },
  registerBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
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

export default RegisterScreen;