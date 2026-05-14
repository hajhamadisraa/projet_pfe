// src/views/screens/ProfileScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import api from '../../models/services/apiService';
import { authService } from '../../models/services/authService';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  GRADIENTS, LAYOUT, RADIUS, SHADOWS, SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 🔧 HELPER — convertir URI local → base64
// ─────────────────────────────────────────
const uriToBase64 = async (uri) => {
  try {
    // Si c'est déjà une chaîne base64 ou une URL distante, on retourne tel quel
    if (!uri || uri.startsWith('data:') || uri.startsWith('http')) return uri;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Détecter le type MIME depuis l'extension
    const ext  = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png'
               : ext === 'gif' ? 'image/gif'
               : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    console.error('[uriToBase64]', err);
    return uri; // fallback : envoyer l'URI brute
  }
};

// ─────────────────────────────────────────
// 🧩 POULAILLER TAG
// ─────────────────────────────────────────
const PoulaillerTag = ({ name, secteur }) => (
  <View style={styles.poulaillerTag}>
    <MaterialIcons name="home" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.poulaillerTagName}>{name}</Text>
      {secteur ? <Text style={styles.poulaillerTagSecteur}>{secteur}</Text> : null}
    </View>
  </View>
);

// ─────────────────────────────────────────
// 🧩 CHAMP LECTURE SEULE
// ─────────────────────────────────────────
const ReadOnlyField = ({ label, value }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldInputWrapper, styles.fieldInputWrapperReadOnly]}>
      <Text style={styles.fieldReadOnlyText}>{value || '—'}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────
// 🧩 CHAMP ÉDITABLE
// ─────────────────────────────────────────
const EditableField = ({
  label, value, onChangeText, icon,
  secureEntry, toggleSecure, keyboardType,
}) => (
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
        <TouchableOpacity onPress={toggleSecure} style={styles.fieldIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name={icon} size={20} color={COLORS.outline} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─────────────────────────────────────────
// 🧩 MODAL MOT DE PASSE
// ─────────────────────────────────────────
const ChangePasswordModal = ({ visible, onClose, onSave, loading }) => {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showCon,  setShowCon]  = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrent(''); setNext(''); setConfirm('');
      setShowCur(false); setShowNext(false); setShowCon(false);
    }
  }, [visible]);

  const handleSave = () => {
    if (!current) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe actuel.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    onSave({ currentPassword: current, newPassword: next });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="lock-outline" size={22} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Modifier le Mot de Passe</Text>
              <TouchableOpacity onPress={onClose} disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <EditableField label="Mot de passe actuel" value={current}
                onChangeText={setCurrent} secureEntry={!showCur}
                icon={showCur ? 'visibility-off' : 'visibility'}
                toggleSecure={() => setShowCur(v => !v)} />
              <EditableField label="Nouveau mot de passe" value={next}
                onChangeText={setNext} secureEntry={!showNext}
                icon={showNext ? 'visibility-off' : 'visibility'}
                toggleSecure={() => setShowNext(v => !v)} />
              <EditableField label="Confirmer le nouveau mot de passe" value={confirm}
                onChangeText={setConfirm} secureEntry={!showCon}
                icon={showCon ? 'visibility-off' : 'visibility'}
                toggleSecure={() => setShowCon(v => !v)} />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}
                activeOpacity={0.8} disabled={loading}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, loading && { opacity: 0.6 }]}
                onPress={handleSave} activeOpacity={0.85} disabled={loading}>
                <Text style={styles.modalSaveText}>
                  {loading ? 'En cours...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────
// 🧩 SNACKBAR
// ─────────────────────────────────────────
const AppSnackbar = ({ visible, message, isError }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.snackbar, isError && styles.snackbarError, { opacity }]}>
      <View style={[styles.snackbarDot, isError && styles.snackbarDotError]} />
      <Text style={styles.snackbarText}>{message}</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// 📱 PROFILE SCREEN
// ─────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const user  = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);
  const { logout, setUser } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);

  // Champs en cours d'édition
  const [name,      setName]      = useState(user?.name  || '');
  const [email,     setEmail]     = useState(user?.email || '');
  // avatarUri = URI local temporaire (avant sauvegarde)
  const [avatarUri, setAvatarUri] = useState(null);

  // Valeurs confirmées (affichées + pour Annuler)
  const [savedName,   setSavedName]   = useState(user?.name   || '');
  const [savedEmail,  setSavedEmail]  = useState(user?.email  || '');
  // savedAvatar = base64 ou URL distante (après sauvegarde)
  const [savedAvatar, setSavedAvatar] = useState(user?.avatar || null);

  // Poulaillers
  const [poulaillers,        setPoulaillers]        = useState([]);
  const [poulaállersLoading, setPoulaállersLoading] = useState(true);

  // UI
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackError,   setSnackError]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  // Charger poulaillers au montage
  useEffect(() => {
    (async () => {
      try {
        setPoulaállersLoading(true);
        const res  = await api.get('/coops/my');
        const list = (res.data || []).map((c) => ({
          id:      c._id,
          nom:     c.name   || 'Poulailler sans nom',
          secteur: c.sector || null,
        }));
        setPoulaillers(list);
      } catch (err) {
        console.error('[ProfileScreen] fetchCoops:', err);
        const fallback = (user?.assignedCoops || []).map((c) => ({
          id: c.id, nom: c.name || String(c.id), secteur: c.sector || null,
        }));
        setPoulaillers(fallback);
      } finally {
        setPoulaállersLoading(false);
      }
    })();
  }, []);

  const showSnack = (msg, error = false) => {
    setSnackMessage(msg);
    setSnackError(error);
    setSnackVisible(false);
    setTimeout(() => setSnackVisible(true), 30);
  };

  // ── Choisir photo → stocke URI local uniquement
  const handlePickAvatar = async () => {
    if (!isEditing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.6, // 0.6 pour réduire la taille base64
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri); // URI temporaire pour l'aperçu
    }
  };

  // ── Annuler → restaurer
  const handleCancelEdit = () => {
    setName(savedName);
    setEmail(savedEmail);
    setAvatarUri(null); // effacer l'URI temporaire
    setIsEditing(false);
  };

  // ── Sauvegarder profil → PUT /auth/updateprofile
  // Avatar converti en base64 avant envoi
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }
    setLoading(true);
    try {
      // ✅ Convertir l'URI local en base64 si une nouvelle photo a été choisie
      let avatarBase64 = savedAvatar; // garder l'ancienne par défaut
      if (avatarUri) {
        avatarBase64 = await uriToBase64(avatarUri);
      }

      const data = await authService.updateProfile(token, {
        name:   name.trim(),
        email:  email.trim(),
        avatar: avatarBase64,  // ✅ envoyé en base64
      });

      // Mettre à jour le store avec les données retournées par le backend
      const serverUser = data.user;
      const updatedUser = {
        ...user,
        name:   serverUser?.name   ?? name.trim(),
        email:  serverUser?.email  ?? email.trim(),
        avatar: serverUser?.avatar ?? avatarBase64,
      };

      setUser(updatedUser);
      setSavedName(updatedUser.name);
      setSavedEmail(updatedUser.email);
      setSavedAvatar(updatedUser.avatar);
      setAvatarUri(null); // effacer l'URI temporaire

      setIsEditing(false);
      showSnack('Profil mis à jour avec succès ✓');
    } catch (err) {
      console.error('[ProfileScreen] updateProfile:', err);
      showSnack(err.message || 'Erreur lors de la mise à jour', true);
    } finally {
      setLoading(false);
    }
  };

  // ── Modifier mot de passe → PUT /auth/updatepassword
  const handlePasswordSave = async ({ currentPassword, newPassword }) => {
    setPwdLoading(true);
    try {
      await authService.updatePassword(token, currentPassword, newPassword);
      setShowPwdModal(false);
      showSnack('Mot de passe mis à jour avec succès ✓');
    } catch (err) {
      console.error('[ProfileScreen] updatePassword:', err);
      showSnack(err.message || 'Mot de passe actuel incorrect', true);
      // Modal reste ouvert pour correction
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); };

  // Source d'image à afficher dans l'avatar
  // Priorité : URI temporaire (aperçu) > base64 sauvegardé
  const displayAvatar = avatarUri || savedAvatar || null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mon Profil</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={COLORS.emerald400} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}>

            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}
              activeOpacity={isEditing ? 0.85 : 1}>
              <View style={styles.avatarWrapper}>
                {displayAvatar ? (
                  <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {savedName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'JP'}
                    </Text>
                  </View>
                )}
              </View>
              {isEditing && (
                <>
                  <View style={styles.avatarOverlay}>
                    <MaterialIcons name="camera-alt" size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.editAvatarBtn}>
                    <MaterialIcons name="edit" size={14} color={COLORS.primary} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{savedName || 'Utilisateur'}</Text>
              <Text style={styles.heroRole}>{user?.role || ''}</Text>
              {isEditing && (
                <View style={styles.editingBadge}>
                  <MaterialIcons name="edit" size={12} color={COLORS.white} />
                  <Text style={styles.editingBadgeText}>Mode édition</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Informations personnelles */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Informations Personnelles</Text>
            </View>
            {isEditing ? (
              <>
                <EditableField label="Nom Complet"   value={name}  onChangeText={setName} />
                <EditableField label="Adresse Email" value={email} onChangeText={setEmail}
                  keyboardType="email-address" />
              </>
            ) : (
              <>
                <ReadOnlyField label="Nom Complet"   value={savedName} />
                <ReadOnlyField label="Adresse Email" value={savedEmail} />
              </>
            )}
          </View>

          {/* Poulaillers affectés */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="home" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Poulaillers Affectés</Text>
            </View>

            {poulaállersLoading ? (
              <View style={styles.coopEmpty}>
                <MaterialIcons name="hourglass-empty" size={18} color={COLORS.onSurfaceVariant} />
                <Text style={styles.coopEmptyText}>Chargement...</Text>
              </View>
            ) : poulaillers.length > 0 ? (
              <View style={styles.poulaillerList}>
                {poulaillers.map((p, i) => (
                  <PoulaillerTag key={p.id || i} name={p.nom} secteur={p.secteur} />
                ))}
              </View>
            ) : (
              <View style={styles.coopEmpty}>
                <MaterialIcons name="info-outline" size={18} color={COLORS.onSurfaceVariant} />
                <Text style={styles.coopEmptyText}>Aucun poulailler affecté</Text>
              </View>
            )}

            <View style={styles.readOnlyNotice}>
              <MaterialIcons name="lock-outline" size={13} color={COLORS.onSurfaceVariant} />
              <Text style={styles.readOnlyNoticeText}>
                Géré par l'administrateur · non modifiable
              </Text>
            </View>
          </View>

          {/* Boutons */}
          <View style={styles.footerBtns}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}
                  activeOpacity={0.8} disabled={loading}>
                  <MaterialIcons name="close" size={18} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                  onPress={handleSave} activeOpacity={0.85} disabled={loading}>
                  <MaterialIcons name="check" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editProfileBtn}
                onPress={() => setIsEditing(true)} activeOpacity={0.85}>
                <MaterialIcons name="edit" size={18} color={COLORS.white} />
                <Text style={styles.editProfileBtnText}>Modifier le Profil</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.pwdBtn}
              onPress={() => setShowPwdModal(true)} activeOpacity={0.8}>
              <MaterialIcons name="lock-outline" size={18} color={COLORS.primary} />
              <Text style={styles.pwdBtnText}>Modifier le mot de passe</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: SPACING['4xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChangePasswordModal
        visible={showPwdModal}
        onClose={() => { if (!pwdLoading) setShowPwdModal(false); }}
        onSave={handlePasswordSave}
        loading={pwdLoading}
      />

      <AppSnackbar visible={snackVisible} message={snackMessage} isError={snackError} />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.emerald900 + 'CC',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  backBtn:  { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.white10 },
  topBarTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, letterSpacing: -0.3,
  },
  logoutBtn: { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.white10 },

  scroll: { flex: 1 },
  scrollContent: { gap: SPACING.lg, paddingBottom: SPACING['2xl'] },

  hero: {
    padding: SPACING['3xl'], flexDirection: 'row',
    alignItems: 'center', gap: SPACING.xl, flexWrap: 'wrap',
  },
  avatarContainer: { position: 'relative', alignSelf: 'flex-start' },
  avatarWrapper: {
    width: 112, height: 112, borderRadius: 56, overflow: 'hidden',
    borderWidth: 4, borderColor: COLORS.primaryContainer, ...SHADOWS.xl,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%', height: '100%', backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white,
  },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, width: 112, height: 112,
    borderRadius: 56, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
    borderRadius: 14, backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  heroInfo: { flex: 1, minWidth: 140 },
  heroName: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white,
    letterSpacing: -0.5, marginBottom: 4,
  },
  heroRole: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm,
    color: COLORS.white60, fontWeight: FONT_WEIGHTS.medium,
  },
  editingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md, paddingVertical: 3,
    borderRadius: RADIUS.full, alignSelf: 'flex-start',
  },
  editingBadgeText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    color: COLORS.white, fontWeight: FONT_WEIGHTS.bold,
  },

  card: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: RADIUS.xl,
    padding: SPACING['2xl'], marginHorizontal: SPACING['2xl'],
    gap: SPACING.xl, ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, letterSpacing: -0.3,
  },

  fieldGroup: { gap: SPACING.sm },
  fieldLabel: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: SPACING.xs,
  },
  fieldInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldInputWrapperReadOnly: {
    backgroundColor: COLORS.surfaceContainerHighest + '80',
  },
  fieldInput: {
    flex: 1, fontFamily: FONTS.inter, fontSize: FONT_SIZES.md,
    color: COLORS.onSurface, fontWeight: FONT_WEIGHTS.medium,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  fieldReadOnlyText: {
    flex: 1, fontFamily: FONTS.inter, fontSize: FONT_SIZES.md,
    color: COLORS.onSurfaceVariant, fontWeight: FONT_WEIGHTS.medium,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  fieldIconBtn: { padding: SPACING.sm },

  poulaillerList: { gap: SPACING.md },
  poulaillerTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  poulaillerTagName: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary,
  },
  poulaillerTagSecteur: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant, marginTop: 2,
  },
  readOnlyNotice: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -SPACING.sm },
  readOnlyNoticeText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant, fontStyle: 'italic',
  },
  coopEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm,
  },
  coopEmptyText: {
    fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant, fontStyle: 'italic',
  },

  footerBtns: { paddingHorizontal: SPACING['2xl'], gap: SPACING.md, marginTop: SPACING.md },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.secondaryContainer,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.xl, ...SHADOWS.secondary,
  },
  editProfileBtnText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: 0.3,
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.lg, paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.outline + '60', backgroundColor: COLORS.surfaceContainerHigh,
  },
  cancelBtnText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondaryContainer,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.xl, ...SHADOWS.secondary,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white, letterSpacing: 0.3,
  },
  pwdBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.lg, paddingHorizontal: SPACING['2xl'],
    borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.primary + '60', backgroundColor: COLORS.primary + '0D',
  },
  pwdBtnText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING['2xl'], gap: SPACING.xl, ...SHADOWS.xl,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  modalTitle: {
    flex: 1, fontFamily: FONTS.manrope, fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, letterSpacing: -0.3,
  },
  modalBody:   { gap: SPACING.xl },
  modalFooter: {
    flexDirection: 'row', gap: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING['2xl'] : SPACING.md,
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', backgroundColor: COLORS.surfaceContainerHigh,
  },
  modalCancelText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.onSurfaceVariant,
  },
  modalSaveBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg,
    alignItems: 'center', backgroundColor: COLORS.secondaryContainer, ...SHADOWS.secondary,
  },
  modalSaveText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.extraBold, color: COLORS.white,
  },

  snackbar: {
    position: 'absolute', bottom: SPACING['3xl'],
    left: SPACING['2xl'], right: SPACING['2xl'],
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.lg, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg,
    ...SHADOWS.xl, borderWidth: 1, borderColor: COLORS.white10,
  },
  snackbarError:    { backgroundColor: '#B71C1C' },
  snackbarDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.statusHealthy },
  snackbarDotError: { backgroundColor: '#FF8A80' },
  snackbarText: {
    fontFamily: FONTS.manrope, fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, flex: 1,
  },
});

export default ProfileScreen;