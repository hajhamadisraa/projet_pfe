// src/views/screens/ProfileScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS,
  LAYOUT,
  RADIUS, SHADOWS,
  SPACING,
  USER_ROLES,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🧩 COOPERATIVE TAG (pill supprimable)
// ─────────────────────────────────────────
const CoopTag = ({ name, onRemove }) => (
  <View style={styles.coopTag}>
    <Text style={styles.coopTagText}>{name}</Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <MaterialIcons name="close" size={14} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────
// 🧩 CHAMP INPUT ÉDITABLE
// ─────────────────────────────────────────
const EditableField = ({ label, value, onChangeText, icon, secureEntry, toggleSecure, keyboardType }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInputWrapper}>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={COLORS.outlineVariant}
      />
      {icon && (
        <TouchableOpacity
          onPress={toggleSecure}
          style={styles.fieldIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name={icon} size={20} color={COLORS.outline} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─────────────────────────────────────────
// 🧩 SNACKBAR SUCCÈS
// ─────────────────────────────────────────
const SuccessSnackbar = ({ visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.snackbar, { opacity }]}>
      <View style={styles.snackbarDot} />
      <Text style={styles.snackbarText}>Modifications synchronisées avec l'IA</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// 📱 PROFILE SCREEN
// ─────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const user      = useAppStore((s) => s.user);
  const { logout, setUser } = useAppStore();

  // ── État formulaire
  const [name,          setName]          = useState(user?.name     || '');
  const [email,         setEmail]         = useState(user?.email    || '');
  const [password,      setPassword]      = useState('••••••••••••');
  const [showPassword,  setShowPassword]  = useState(false);
  const [role,          setRole]          = useState(user?.role     || USER_ROLES.ADMIN);
  const [accountActive, setAccountActive] = useState(true);
  const [cooperatives,  setCooperatives]  = useState(
    user?.cooperatives?.map((c) => (typeof c === 'string' ? c : c.name)) || []
  );
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [loading,       setLoading]       = useState(false);

  const roleOptions = Object.values(USER_ROLES);

  // ── Supprimer une coopérative
  const removeCooperative = (index) => {
    setCooperatives((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Ajouter coopérative (placeholder)
  const addCooperative = () => {
    setCooperatives((prev) => [...prev, `Coop ${prev.length + 1}`]);
  };

  // ── Sauvegarder
  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setUser({ ...user, name, email, role, cooperatives });
    setLoading(false);
    setShowSuccess(true);
  };

  // ── Déconnexion
  const handleLogout = async () => {
    await logout();
  };

  // ─────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mon Profil</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.emerald400} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero gradient */}
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'JP'}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
                <MaterialIcons name="edit" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Infos hero */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{name || 'Utilisateur'}</Text>
              <Text style={styles.heroRole}>{role}</Text>
            </View>

            {/* Badge abonnement */}
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeContent}>
                <Text style={styles.heroBadgeLabel}>Status de l'Abonnement</Text>
                <Text style={styles.heroBadgeValue}>
                  {user?.subscription || 'Premium Enterprise'}
                </Text>
              </View>
              <View style={styles.heroBadgeBar} />
            </View>
          </LinearGradient>

          {/* ── Informations personnelles */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Informations Personnelles</Text>
            </View>

            <EditableField
              label="Nom Complet"
              value={name}
              onChangeText={setName}
            />
            <EditableField
              label="Adresse Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="mail-outline"
            />
            <EditableField
              label="Mot de Passe"
              value={password}
              onChangeText={setPassword}
              secureEntry={!showPassword}
              icon={showPassword ? 'visibility-off' : 'visibility'}
              toggleSecure={() => setShowPassword(!showPassword)}
            />
          </View>

          {/* ── Rôle & Accès */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="shield" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Rôle & Accès</Text>
            </View>

            {/* Sélecteur de rôle (pills) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rôle Utilisateur</Text>
              <View style={styles.rolePillsWrapper}>
                {roleOptions.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePill, role === r && styles.rolePillActive]}
                    onPress={() => setRole(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toggle statut compte */}
            <View style={styles.accountStatusRow}>
              <View style={styles.accountStatusInfo}>
                <Text style={styles.accountStatusLabel}>Statut du Compte</Text>
                <Text style={styles.accountStatusSubtitle}>Actif et opérationnel</Text>
              </View>
              <Switch
                value={accountActive}
                onValueChange={setAccountActive}
                trackColor={{
                  false: COLORS.surfaceContainerHigh,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.surfaceContainerHigh}
              />
            </View>
          </View>

          {/* ── Coopératives */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="corporate-fare" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Coopératives</Text>
            </View>

            <View style={styles.coopTagsWrapper}>
              {cooperatives.map((coop, index) => (
                <CoopTag
                  key={index}
                  name={coop}
                  onRemove={() => removeCooperative(index)}
                />
              ))}
              <TouchableOpacity
                style={styles.addCoopBtn}
                onPress={addCooperative}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Footer boutons */}
          <View style={styles.footerBtns}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Annuler les modifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnLoading]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: SPACING['4xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Snackbar succès */}
      <SuccessSnackbar visible={showSuccess} />
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
  flex: { flex: 1 },

  // ── Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.emerald900 + 'CC',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  backBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white10,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  logoutBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white10,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    gap: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },

  // ── Hero
  hero: {
    padding: SPACING['3xl'],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xl,
    flexWrap: 'wrap',
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  avatarWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    ...SHADOWS.xl,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  heroInfo: {
    flex: 1,
    minWidth: 140,
  },
  heroName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroRole: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white60,
    fontWeight: FONT_WEIGHTS.medium,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white10,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    width: '100%',
  },
  heroBadgeContent: { flex: 1 },
  heroBadgeLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white60,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroBadgeValue: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  heroBadgeBar: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.statusHealthy,
    borderRadius: RADIUS.full,
    opacity: 0.7,
  },

  // ── Cards
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    marginHorizontal: SPACING['2xl'],
    gap: SPACING.xl,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },

  // ── Fields
  fieldGroup: { gap: SPACING.sm },
  fieldLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: SPACING.xs,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldInput: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.md,
    color: COLORS.onSurface,
    fontWeight: FONT_WEIGHTS.medium,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  fieldIconBtn: {
    padding: SPACING.sm,
  },

  // ── Rôle pills
  rolePillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  rolePill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rolePillActive: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '60',
  },
  rolePillText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
  },
  rolePillTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // ── Account status toggle
  accountStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  accountStatusInfo: { flex: 1 },
  accountStatusLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  accountStatusSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },

  // ── Coop tags
  coopTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  coopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  coopTagText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addCoopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Footer boutons
  footerBtns: {
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  saveBtn: {
    backgroundColor: COLORS.secondaryContainer,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.secondary,
  },
  saveBtnLoading: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Snackbar
  snackbar: {
    position: 'absolute',
    bottom: SPACING['3xl'],
    left: SPACING['2xl'],
    right: SPACING['2xl'],
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    ...SHADOWS.xl,
    borderWidth: 1,
    borderColor: COLORS.white10,
  },
  snackbarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.statusHealthy,
  },
  snackbarText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    flex: 1,
  },
});

export default ProfileScreen;