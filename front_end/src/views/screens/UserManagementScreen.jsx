// src/views/screens/UserManagementScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  LAYOUT,
  RADIUS, SHADOWS,
  SPACING
} from '../../models/utils/constants';
import { MOCK_USERS } from '../../models/utils/mockData';

// ─────────────────────────────────────────
// 📋 RÔLES DISPONIBLES
// ─────────────────────────────────────────
const ROLES = [
  { key: 'ADMIN',    label: 'Admin',     color: COLORS.primary,       bg: COLORS.primary + '20' },
  { key: 'OPERATOR', label: 'Opérateur', color: '#1D4ED8',            bg: '#EFF6FF' },
  { key: 'TECHNICIAN',label: 'Technicien',color: COLORS.statusHealthy, bg: COLORS.statusHealthyBg },
  { key: 'READER',   label: 'Lecteur',   color: COLORS.onSurfaceVariant, bg: COLORS.surfaceContainerHigh },
];

const getRoleConfig = (roleKey) =>
  ROLES.find((r) => r.key === roleKey) || ROLES[3];

// ─────────────────────────────────────────
// 🧩 BADGE RÔLE
// ─────────────────────────────────────────
const RoleBadge = ({ roleKey }) => {
  const config = getRoleConfig(roleKey);
  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.roleBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 USER CARD
// ─────────────────────────────────────────
const UserCard = ({ user, currentUser, onEdit, onDelete, onToggle }) => {
  const isSelf      = user.id === currentUser?.id;
  const isLastAdmin = user.roleBadgeType === 'ADMIN'; // sera vérifié dans la logique

  return (
    <View style={styles.userCard}>
      <View style={styles.userCardLeft}>
        {/* Avatar + présence */}
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
          )}
          <View style={[
            styles.presenceDot,
            { backgroundColor: user.isOnline ? COLORS.statusHealthy : COLORS.outlineVariant },
          ]} />
        </View>

        {/* Infos */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.name}</Text>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>Moi</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          <View style={styles.userMetaRow}>
            <RoleBadge roleKey={user.roleBadgeType} />
            <View style={[
              styles.statusDot,
              { backgroundColor: user.isActive ? COLORS.statusHealthy : COLORS.error },
            ]} />
            <Text style={[
              styles.statusText,
              { color: user.isActive ? COLORS.statusHealthy : COLORS.error },
            ]}>
              {user.isActive ? 'Actif' : 'Suspendu'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.userActions}>
        {/* Toggle actif/suspendu — bloqué si c'est soi-même */}
        <Switch
          value={user.isActive}
          onValueChange={() => !isSelf && onToggle(user.id)}
          trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primary + '70' }}
          thumbColor={COLORS.white}
          ios_backgroundColor={COLORS.surfaceContainerHigh}
          disabled={isSelf}
          style={styles.switch}
        />
        {/* Éditer */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(user)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="edit" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        {/* Supprimer — bloqué si c'est soi-même ou si c'est le dernier admin */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.deleteBtn,
            isSelf && styles.actionBtnDisabled,
          ]}
          onPress={() => !isSelf && onDelete(user)}
          activeOpacity={isSelf ? 1 : 0.8}
          disabled={isSelf}
        >
          <MaterialIcons
            name="delete-outline"
            size={18}
            color={isSelf ? COLORS.outlineVariant : COLORS.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 MODAL AJOUT / ÉDITION
// ─────────────────────────────────────────
const UserFormModal = ({ visible, user, onClose, onSave }) => {
  const isEdit = !!user;

  const [name,     setName]     = useState(user?.name     || '');
  const [email,    setEmail]    = useState(user?.email    || '');
  const [role,     setRole]     = useState(user?.roleBadgeType || 'OPERATOR');
  const [sector,   setSector]   = useState(user?.sector   || '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [errors,   setErrors]   = useState({});

  React.useEffect(() => {
    if (visible) {
      setName(user?.name     || '');
      setEmail(user?.email   || '');
      setRole(user?.roleBadgeType || 'OPERATOR');
      setSector(user?.sector || '');
      setIsActive(user?.isActive ?? true);
      setErrors({});
    }
  }, [visible, user]);

  const validate = () => {
    const e = {};
    if (!name.trim())  e.name  = 'Le nom est requis';
    if (!email.trim()) e.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      id:            user?.id || `u${Date.now()}`,
      name:          name.trim(),
      email:         email.trim(),
      roleBadgeType: role,
      role:          getRoleConfig(role).label,
      sector:        sector.trim() || null,
      lastSeen:      sector.trim() || 'Nouveau membre',
      isOnline:      false,
      isActive,
      avatar:        user?.avatar || null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.formSheet}>
          {/* Header */}
          <View style={styles.formSheetHeader}>
            <Text style={styles.formSheetTitle}>
              {isEdit ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.formSheetClose}>
              <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nom */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nom complet *</Text>
              <TextInput
                style={[styles.formInput, errors.name && styles.formInputError]}
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
                placeholder="Jean Dupont"
                placeholderTextColor={COLORS.outlineVariant}
                autoCapitalize="words"
              />
              {errors.name ? <Text style={styles.formError}>{errors.name}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Adresse email *</Text>
              <TextInput
                style={[styles.formInput, errors.email && styles.formInputError]}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
                placeholder="jean@poulia.com"
                placeholderTextColor={COLORS.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? <Text style={styles.formError}>{errors.email}</Text> : null}
            </View>

            {/* Secteur */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Secteur / Poulailler assigné</Text>
              <TextInput
                style={styles.formInput}
                value={sector}
                onChangeText={setSector}
                placeholder="ex: Secteur B, Coop Delta-4"
                placeholderTextColor={COLORS.outlineVariant}
              />
            </View>

            {/* Rôle */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Rôle</Text>
              <View style={styles.rolesGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.rolePill,
                      role === r.key && { backgroundColor: r.bg, borderColor: r.color },
                    ]}
                    onPress={() => setRole(r.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rolePillDot, { backgroundColor: r.color }]} />
                    <Text style={[
                      styles.rolePillText,
                      role === r.key && { color: r.color, fontWeight: FONT_WEIGHTS.bold },
                    ]}>
                      {r.label}
                    </Text>
                    {role === r.key && (
                      <MaterialIcons name="check" size={14} color={r.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Statut actif */}
            <View style={styles.formField}>
              <View style={styles.formSwitchRow}>
                <View>
                  <Text style={styles.formLabel}>Compte actif</Text>
                  <Text style={styles.formSwitchSubtitle}>
                    L'utilisateur peut se connecter
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primary + '70' }}
                  thumbColor={COLORS.white}
                  ios_backgroundColor={COLORS.surfaceContainerHigh}
                />
              </View>
            </View>

            {/* Note rôle admin */}
            {role === 'ADMIN' && (
              <View style={styles.adminNote}>
                <MaterialIcons name="info" size={16} color={COLORS.primary} />
                <Text style={styles.adminNoteText}>
                  Les administrateurs ont accès à toutes les fonctionnalités et ne peuvent pas être supprimés par d'autres admins.
                </Text>
              </View>
            )}

            {/* Boutons */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelFormBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelFormBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFormBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <MaterialIcons name={isEdit ? 'save' : 'person-add'} size={18} color={COLORS.white} />
                <Text style={styles.saveFormBtnText}>
                  {isEdit ? 'Enregistrer' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────
// 📱 USER MANAGEMENT SCREEN
// ─────────────────────────────────────────
const UserManagementScreen = ({ navigation }) => {
  const currentUser = useAppStore((s) => s.user);

  const [users,       setUsers]       = useState(
    MOCK_USERS.map((u) => ({ ...u, email: u.email || `${u.name.toLowerCase().replace(' ', '.')}@poulia.com` }))
  );
  const [search,      setSearch]      = useState('');
  const [filterRole,  setFilterRole]  = useState('ALL');
  const [filterStatus,setFilterStatus]= useState('ALL'); // ALL | ACTIVE | SUSPENDED
  const [modalVisible,setModalVisible]= useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // ── Compteurs
  const adminCount     = users.filter((u) => u.roleBadgeType === 'ADMIN').length;
  const activeCount    = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;

  // ── Filtrage
  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    if (filterRole !== 'ALL') {
      result = result.filter((u) => u.roleBadgeType === filterRole);
    }
    if (filterStatus === 'ACTIVE')    result = result.filter((u) => u.isActive);
    if (filterStatus === 'SUSPENDED') result = result.filter((u) => !u.isActive);
    return result;
  }, [users, search, filterRole, filterStatus]);

  // ── Toggle actif / suspendu
  const handleToggle = (userId) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u)
    );
  };

  // ── Ouvrir formulaire ajout
  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  // ── Ouvrir formulaire édition
  const handleEdit = (user) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  // ── Sauvegarder (ajout ou édition)
  const handleSave = (userData) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.id === userData.id);
      if (exists) return prev.map((u) => u.id === userData.id ? userData : u);
      return [userData, ...prev];
    });
    setModalVisible(false);
  };

  // ── Supprimer avec règles logiques
  const handleDelete = (user) => {
    const isSelf = user.id === currentUser?.id;

    if (isSelf) {
      Alert.alert('Action impossible', 'Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    if (user.roleBadgeType === 'ADMIN' && adminCount <= 1) {
      Alert.alert(
        'Action impossible',
        'Il doit rester au moins un administrateur dans le système.',
        [{ text: 'Compris', style: 'default' }]
      );
      return;
    }
    if (user.roleBadgeType === 'ADMIN') {
      Alert.alert(
        'Supprimer un administrateur ?',
        `Êtes-vous sûr de vouloir supprimer "${user.name}" ? Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => setUsers((prev) => prev.filter((u) => u.id !== user.id)),
          },
        ]
      );
      return;
    }
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer "${user.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setUsers((prev) => prev.filter((u) => u.id !== user.id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Gestion des Utilisateurs</Text>
        {/* Bouton Ajouter */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <MaterialIcons name="person-add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: COLORS.statusHealthy }]}>
            <Text style={styles.kpiLabel}>Actifs</Text>
            <Text style={styles.kpiValue}>{activeCount}</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: COLORS.error }]}>
            <Text style={styles.kpiLabel}>Suspendus</Text>
            <Text style={styles.kpiValue}>{suspendedCount}</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.kpiLabel}>Total</Text>
            <Text style={styles.kpiValue}>{users.length}</Text>
          </View>
        </View>

        {/* ── Barre de recherche */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={COLORS.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom ou email..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filtres rôles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {/* Filtre statut */}
          {[
            { key: 'ALL',       label: 'Tous' },
            { key: 'ACTIVE',    label: 'Actifs' },
            { key: 'SUSPENDED', label: 'Suspendus' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, filterStatus === f.key && styles.filterPillActive]}
              onPress={() => setFilterStatus(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filterStatus === f.key && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterSep} />

          {/* Filtre rôle */}
          {[{ key: 'ALL', label: 'Tous rôles' }, ...ROLES.map((r) => ({ key: r.key, label: r.label }))].map((f) => (
            <TouchableOpacity
              key={f.key + '_role'}
              style={[styles.filterPill, filterRole === f.key && styles.filterPillActive]}
              onPress={() => setFilterRole(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filterRole === f.key && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Note admin */}
        <View style={styles.adminRuleCard}>
          <MaterialIcons name="shield" size={16} color={COLORS.primary} />
          <Text style={styles.adminRuleText}>
            Les administrateurs ne peuvent pas être supprimés s'ils sont les derniers admins du système.
          </Text>
        </View>

        {/* ── Liste */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucun utilisateur trouvé</Text>
            <Text style={styles.emptySubtitle}>Modifiez votre recherche ou réinitialisez les filtres.</Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
            >
              <Text style={styles.emptyResetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userList}>
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUser={currentUser}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </View>
        )}

        <View style={{ height: LAYOUT.bottomNavHeight + SPACING['2xl'] }} />
      </ScrollView>

      {/* ── Modal Formulaire */}
      <UserFormModal
        visible={modalVisible}
        user={editingUser}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },

  // ── Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    height: LAYOUT.topBarHeight,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.secondary,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    gap: SPACING.lg,
  },

  // ── KPI
  kpiRow: { flexDirection: 'row', gap: SPACING.md },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
    alignItems: 'center',
  },
  kpiLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primary,
  },

  // ── Recherche
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurface,
    paddingVertical: SPACING.lg,
  },

  // ── Filtres
  filtersRow: {
    gap: SPACING.sm,
    paddingRight: SPACING['2xl'],
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '50',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  filterSep: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.outlineVariant + '60',
    marginHorizontal: SPACING.xs,
  },

  // ── Note admin
  adminRuleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  adminRuleText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    lineHeight: 16,
  },

  // ── User Card
  userList: { gap: SPACING.md },
  userCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatarWrapper: {
    width: 48, height: 48,
    position: 'relative',
  },
  avatar: {
    width: 48, height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  avatarFallback: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 1, right: 1,
    width: 12, height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerLow,
  },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  userName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  selfBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  selfBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  userEmail: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  actionBtn: {
    width: 34, height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: COLORS.errorContainer,
  },
  actionBtnDisabled: {
    opacity: 0.3,
  },

  // ── Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyResetBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
  },
  emptyResetText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ══════════════════════════════
  // MODAL FORMULAIRE
  // ══════════════════════════════
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  formSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding: SPACING['2xl'],
    maxHeight: '90%',
    ...SHADOWS.xl,
  },
  formSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  formSheetTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  formSheetClose: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
  },

  // Champs du formulaire
  formField: { marginBottom: SPACING.xl },
  formLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  formInput: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.md,
    color: COLORS.onSurface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  formInputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorContainer,
  },
  formError: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },

  // Grille rôles
  rolesGrid: {
    gap: SPACING.sm,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rolePillDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  rolePillText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Switch statut
  formSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  formSwitchSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },

  // Note admin
  adminNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  adminNoteText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    lineHeight: 16,
  },

  // Boutons form
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING['2xl'],
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
  },
  cancelFormBtnText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
  },
  saveFormBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  saveFormBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default UserManagementScreen;