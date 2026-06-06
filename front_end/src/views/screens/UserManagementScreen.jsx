// src/views/screens/UserManagementScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import useCoops from '../../controllers/hooks/useCoops';
import useUsers from '../../controllers/hooks/useUsers';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  LAYOUT, RADIUS, SHADOWS, SPACING,
} from '../../models/utils/constants';
import { MOCK_COOPS, MOCK_USERS } from '../../models/utils/mockData';

const USE_MOCK = false;

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'ADMIN',       label: 'Admin',       color: COLORS.primary, bg: COLORS.primary + '20' },
  { key: 'OPERATOR',    label: 'Eleveur',     color: '#1D4ED8', bg: '#EFF6FF' },
];

const getRoleConfig = (roleKey) => ROLES.find((r) => r.key === roleKey) || ROLES[2];

// ─────────────────────────────────────────
// PERMISSIONS — toute la logique ici
// ─────────────────────────────────────────
//
//  SUPER_ADMIN → peut tout faire sur tout le monde
//  ADMIN       → peut gérer les Eleveurs seulement
//  OPERATOR    → n'a pas accès à cette page
//
const getPermissions = (currentUser, targetUser) => {
  const myRole   = currentUser?.roleBadgeType;
  const isSelf   = String(targetUser?.id) === String(currentUser?.id);
  const targetRole = targetUser?.roleBadgeType;

  if (myRole === 'SUPER_ADMIN') {
    // Super Admin peut tout, sauf se supprimer lui-même
    return {
      canEdit:   true,
      canToggle: !isSelf,
      canDelete: !isSelf,
      isSelf,
    };
  }

  if (myRole === 'ADMIN') {
    // Admin peut gérer uniquement les Eleveurs (OPERATOR)
    const targetIsOperator = targetRole === 'OPERATOR';
    return {
      canEdit:   targetIsOperator,
      canToggle: targetIsOperator && !isSelf,
      canDelete: targetIsOperator && !isSelf,
      isSelf,
    };
  }

  // OPERATOR ou rôle inconnu : aucun droit (ne devrait pas voir la page)
  return { canEdit: false, canToggle: false, canDelete: false, isSelf };
};

// Rôles que l'admin connecté peut CRÉER/ASSIGNER
const getAssignableRoles = (myRole) => {
  if (myRole === 'SUPER_ADMIN') return ROLES;                        // tous les rôles
  if (myRole === 'ADMIN')       return ROLES.filter(r => r.key === 'OPERATOR'); // Eleveur seulement
  return [];
};

const adaptCoopForSelector = (c) => {
  if (!c) return null;
  const id = c._id || c.id;
  if (!id) return null;
  return {
    id: String(id),
    name: c.name || c.nom || '',
    sector: c.sector || c.secteur || '',
    status: c.status === 'healthy' ? 'healthy' : c.status === 'warning' ? 'warning' : 'critical',
    population: Number(c.population) || 0,
  };
};

// ─────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────
const KpiCard = ({ icon, label, value, color, bg, trend }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <View style={[styles.kpiIconBox, { backgroundColor: bg }]}>
      <MaterialIcons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────
const RoleBadge = ({ roleKey }) => {
  const config = getRoleConfig(roleKey);
  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.roleBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────
// COOP SELECTOR
// ─────────────────────────────────────────
const CoopSelector = ({ coops, selectedCoopIds, onToggle }) => (
  <View style={styles.coopSelectorList}>
    {coops.map((coop) => {
      if (!coop?.id) return null;
      const isSelected = selectedCoopIds.includes(coop.id);
      const statusColor = coop.status === 'warning' ? COLORS.secondary
                        : coop.status === 'critical' ? COLORS.error
                        : COLORS.statusHealthy;
      return (
        <TouchableOpacity
          key={coop.id}
          style={[styles.coopSelectorItem, isSelected && styles.coopSelectorItemSelected]}
          onPress={() => onToggle(coop.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.coopStatusDot, { backgroundColor: statusColor }]} />
          <View style={styles.coopSelectorInfo}>
            <Text style={[styles.coopSelectorName, isSelected && { color: COLORS.primary }]}>
              {coop.name}
            </Text>
            <Text style={styles.coopSelectorSector}>{coop.sector}</Text>
          </View>
          <Text style={styles.coopSelectorPop}>
            {coop.population?.toLocaleString('fr-FR')} oiseaux
          </Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <MaterialIcons name="check" size={14} color={COLORS.white} />}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─────────────────────────────────────────
// MODAL APPROBATION
// ─────────────────────────────────────────
const ApproveModal = ({ visible, user, coops, onClose, onApprove, onReject }) => {
  const [selectedCoopIds, setSelectedCoopIds] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) setSelectedCoopIds([]);
  }, [visible]);

  const toggleCoop = (id) =>
    setSelectedCoopIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const handleApprove = async () => {
    if (!user?.id) return;
    setLoading(true);
    await onApprove(user.id, selectedCoopIds);
    setLoading(false);
  };

  const handleReject = () => {
    if (!user?.id) return;
    Alert.alert(
      'Refuser la demande',
      `Êtes-vous sûr de vouloir refuser le compte de "${user.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: () => onReject(user.id) },
      ]
    );
  };

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.formSheet}>
          <View style={styles.formSheetHandle} />
          <View style={styles.formSheetHeader}>
            <View>
              <Text style={styles.formSheetTitle}>Demande de compte</Text>
              <Text style={styles.formSheetSubtitle}>Valider et affecter un poulailler</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.formSheetClose}>
              <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.pendingUserCard}>
              <View style={styles.pendingAvatarBox}>
                <Text style={styles.avatarInitials}>
                  {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                </Text>
              </View>
              <View style={styles.pendingUserInfo}>
                <Text style={styles.pendingUserName}>{user.name}</Text>
                <Text style={styles.pendingUserEmail}>{user.email}</Text>
                <View style={styles.pendingBadge}>
                  <MaterialIcons name="schedule" size={11} color={COLORS.secondary} />
                  <Text style={styles.pendingBadgeText}>{user.lastSeen}</Text>
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.coopSelectorHeader}>
                <Text style={styles.formLabel}>Affecter à un poulailler</Text>
                {selectedCoopIds.length > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {selectedCoopIds.length} sélectionné{selectedCoopIds.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.formHint}>Optionnel — vous pouvez affecter plus tard.</Text>
              {coops.length === 0 ? (
                <View style={styles.noCoopsBox}>
                  <MaterialIcons name="home-work" size={32} color={COLORS.outlineVariant} />
                  <Text style={styles.noCoopsText}>Aucun poulailler disponible</Text>
                </View>
              ) : (
                <CoopSelector coops={coops} selectedCoopIds={selectedCoopIds} onToggle={toggleCoop} />
              )}
            </View>

            <View style={styles.approveButtons}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
                <MaterialIcons name="person-remove" size={17} color={COLORS.error} />
                <Text style={styles.rejectBtnText}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveBtn, loading && { opacity: 0.7 }]}
                onPress={handleApprove}
                disabled={loading}
              >
                <MaterialIcons name="how-to-reg" size={17} color={COLORS.white} />
                <Text style={styles.approveBtnText}>{loading ? 'Validation...' : 'Approuver'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────
// MODAL FORMULAIRE UTILISATEUR
// ─────────────────────────────────────────
const UserFormModal = ({ visible, user, coops, onClose, onSave, myRole }) => {
  const isEdit = !!user;
  const assignableRoles = getAssignableRoles(myRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [isActive, setIsActive] = useState(true);
  const [selectedCoopIds, setSelectedCoopIds] = useState([]);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setEmail(user?.email || '');
      setRole(user?.roleBadgeType || 'OPERATOR');
      setIsActive(user?.isActive ?? true);
      setSelectedCoopIds(
        (user?.assignedCoops || [])
          .filter(Boolean)
          .map((c) => c?.id)
          .filter(Boolean)
      );
      setErrors({});
    }
  }, [visible, user]);

  const toggleCoop = (coopId) =>
    setSelectedCoopIds((prev) =>
      prev.includes(coopId) ? prev.filter((id) => id !== coopId) : [...prev, coopId]
    );

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Le nom est requis';
    if (!isEdit) {
      if (!email.trim()) e.email = "L'email est requis";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const assignedCoops = coops
      .filter((c) => c?.id && selectedCoopIds.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name }));
    onSave({ id: user?.id, name: name.trim(), email: email.trim(), roleBadgeType: role, isActive, assignedCoops });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.formSheet}>
          <View style={styles.formSheetHandle} />
          <View style={styles.formSheetHeader}>
            <Text style={styles.formSheetTitle}>{isEdit ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.formSheetClose}>
              <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nom complet *</Text>
              <TextInput
                style={[styles.formInput, errors.name && styles.formInputError]}
                value={name}
                onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
                placeholder="Jean Dupont"
                placeholderTextColor={COLORS.outlineVariant}
              />
              {errors.name && <Text style={styles.formError}>{errors.name}</Text>}
            </View>
            {!isEdit && (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Adresse email *</Text>
                <TextInput
                  style={[styles.formInput, errors.email && styles.formInputError]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
                  placeholder="jean@poulia.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.formError}>{errors.email}</Text>}
              </View>
            )}
            <View style={styles.formField}>
              <View style={styles.coopSelectorHeader}>
                <Text style={styles.formLabel}>Poulaillers assignés</Text>
                {selectedCoopIds.length > 0 && (
                  <View style={styles.selectedCountBadge}>
                    <Text style={styles.selectedCountText}>
                      {selectedCoopIds.length} sélectionné{selectedCoopIds.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
              {coops.length === 0 ? (
                <View style={styles.noCoopsBox}>
                  <MaterialIcons name="home-work" size={32} color={COLORS.outlineVariant} />
                  <Text style={styles.noCoopsText}>Aucun poulailler disponible</Text>
                </View>
              ) : (
                <CoopSelector coops={coops} selectedCoopIds={selectedCoopIds} onToggle={toggleCoop} />
              )}
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Rôle</Text>
              <View style={styles.rolesGrid}>
                {assignableRoles.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.rolePill, role === r.key && { backgroundColor: r.bg, borderColor: r.color }]}
                    onPress={() => setRole(r.key)}
                  >
                    <View style={[styles.rolePillDot, { backgroundColor: r.color }]} />
                    <Text style={[styles.rolePillText, role === r.key && { color: r.color, fontWeight: FONT_WEIGHTS.bold }]}>
                      {r.label}
                    </Text>
                    {role === r.key && <MaterialIcons name="check" size={14} color={r.color} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formField}>
              <View style={styles.formSwitchRow}>
                <View>
                  <Text style={styles.formLabel}>Compte actif</Text>
                  <Text style={styles.formSwitchSubtitle}>L'utilisateur peut se connecter</Text>
                </View>
                <Switch value={isActive} onValueChange={setIsActive} />
              </View>
            </View>
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelFormBtn} onPress={onClose}>
                <Text style={styles.cancelFormBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveFormBtn} onPress={handleSave}>
                <MaterialIcons name={isEdit ? 'save' : 'person-add'} size={18} color={COLORS.white} />
                <Text style={styles.saveFormBtnText}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────
// USER CARD
// ─────────────────────────────────────────
const UserCard = ({ user, currentUser, onEdit, onDelete, onToggle }) => {
  if (!user?.id) return null;

  const { canEdit, canToggle, canDelete, isSelf } = getPermissions(currentUser, user);
  const isProtected = !canEdit && !canToggle && !canDelete; // Admin/SuperAdmin qu'on ne peut pas toucher

  return (
    <View style={[styles.userCard, !user.isActive && styles.userCardInactive]}>
      {/* Bande latérale statut */}
      <View style={[styles.userCardAccent, { backgroundColor: user.isActive ? COLORS.statusHealthy : COLORS.error }]} />

      <View style={styles.userCardLeft}>
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, !user.isActive && styles.avatarFallbackInactive]}>
              <Text style={styles.avatarInitials}>
                {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
              </Text>
            </View>
          )}
          <View style={[styles.presenceDot, { backgroundColor: user.isOnline ? COLORS.statusHealthy : COLORS.outlineVariant }]} />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, !user.isActive && styles.userNameInactive]}>{user.name}</Text>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>Moi</Text>
              </View>
            )}
            {/* Cadenas visible si on n'a aucun droit sur cet utilisateur */}
            {isProtected && !isSelf && (
              <View style={styles.protectedBadge}>
                <MaterialIcons name="lock" size={10} color="#7C3AED" />
                <Text style={styles.protectedBadgeText}>Protégé</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>

          {user.assignedCoops?.filter(Boolean).length > 0 && (
            <View style={styles.assignedCoopsRow}>
              <MaterialIcons name="home-work" size={12} color={COLORS.primary} />
              <Text style={styles.assignedCoopsText} numberOfLines={1}>
                {user.assignedCoops.filter(Boolean).map((c) => c?.name).filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.userMetaRow}>
            <RoleBadge roleKey={user.roleBadgeType} />
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: user.isActive ? COLORS.statusHealthy : COLORS.error }]} />
              <Text style={[styles.statusText, { color: user.isActive ? COLORS.statusHealthy : COLORS.error }]}>
                {user.isActive ? 'Actif' : 'Suspendu'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        {/* Switch : visible seulement si on peut toggler */}
        {canToggle ? (
          <Switch
            value={!!user.isActive}
            onValueChange={() => onToggle(user.id)}
            trackColor={{ false: COLORS.errorContainer, true: COLORS.statusHealthy + '40' }}
            thumbColor={user.isActive ? COLORS.statusHealthy : COLORS.error}
          />
        ) : (
          // Espace vide pour garder l'alignement
          <View style={styles.switchPlaceholder} />
        )}

        {/* Bouton Modifier */}
        <TouchableOpacity
          style={[styles.actionBtn, !canEdit && styles.actionBtnDisabled]}
          onPress={() => canEdit && onEdit(user)}
          disabled={!canEdit}
        >
          <MaterialIcons name="edit" size={18} color={canEdit ? COLORS.primary : COLORS.outlineVariant} />
        </TouchableOpacity>

        {/* Bouton Supprimer */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn, !canDelete && styles.actionBtnDisabled]}
          onPress={() => canDelete && onDelete(user)}
          disabled={!canDelete}
        >
          <MaterialIcons name="delete-outline" size={18} color={canDelete ? COLORS.error : COLORS.outlineVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// PENDING USER CARD
// ─────────────────────────────────────────
const PendingUserCard = ({ user, onApprove, onReject }) => {
  if (!user?.id) return null;
  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingCardLeft}>
        <View style={[styles.avatar, styles.avatarFallback, { width: 44, height: 44, borderRadius: 22 }]}>
          <Text style={styles.avatarInitials}>
            {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.pendingChip}>
            <MaterialIcons name="schedule" size={11} color={COLORS.secondary} />
            <Text style={styles.pendingChipText}>{user.lastSeen}</Text>
          </View>
        </View>
      </View>
      <View style={styles.pendingCardActions}>
        <TouchableOpacity style={styles.pendingRejectBtn} onPress={() => onReject(user)}>
          <MaterialIcons name="close" size={16} color={COLORS.error} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pendingApproveBtn} onPress={() => onApprove(user)}>
          <MaterialIcons name="check" size={16} color={COLORS.white} />
          <Text style={styles.pendingApproveBtnText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// FILTER PILL
// ─────────────────────────────────────────
const FilterPill = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    {count !== undefined && count > 0 && (
      <View style={[styles.filterPillCount, active && styles.filterPillCountActive]}>
        <Text style={[styles.filterPillCountText, active && styles.filterPillCountTextActive]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────
const UserManagementScreen = () => {
  const currentUser = useAppStore((s) => s.user);
  const myRole = currentUser?.roleBadgeType;

  // ── GUARD : OPERATOR n'a pas accès à cette page ──
  if (myRole === 'OPERATOR') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Gestion Utilisateurs</Text>
        </View>
        <View style={styles.accessDenied}>
          <MaterialIcons name="lock" size={56} color={COLORS.outlineVariant} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>
            Vous n'avez pas les droits nécessaires pour gérer les utilisateurs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { coops: rawCoops, fetchCoops } = USE_MOCK ? { coops: [], fetchCoops: null } : useCoops();
  const { users: apiUsers, fetchUsers, createUser, updateUser, toggleUser, deleteUser, approveUser, rejectUser } =
    USE_MOCK
      ? { users: [], fetchUsers: null, createUser: null, updateUser: null, toggleUser: null, deleteUser: null, approveUser: null, rejectUser: null }
      : useUsers();

  const coops = useMemo(() => {
    const source = USE_MOCK ? MOCK_COOPS : (rawCoops || []);
    return source.map(adaptCoopForSelector).filter(Boolean);
  }, [rawCoops]);

  const allUsers = useMemo(() => {
    const source = USE_MOCK
      ? MOCK_USERS.map((u) => ({
          ...u,
          email: u.email || `${u.name.toLowerCase().replace(' ', '.')}@poulia.com`,
          assignedCoops: u.assignedCoops || [],
        }))
      : (apiUsers || []);
    return source.filter((u) => u?.id);
  }, [apiUsers]);

  const pendingUsers = allUsers.filter((u) => u?.status === 'PENDING');
  const activeUsers  = allUsers.filter((u) => u?.status !== 'PENDING');

  const activeCount     = activeUsers.filter((u) => u.isActive).length;
  const suspendedCount  = activeUsers.filter((u) => !u.isActive).length;
  const adminCount      = activeUsers.filter((u) => u.roleBadgeType === 'ADMIN' || u.roleBadgeType === 'SUPER_ADMIN').length;

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [approveVisible, setApproveVisible] = useState(false);
  const [approvingUser, setApprovingUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (USE_MOCK) return;
      Promise.all([fetchCoops?.(), fetchUsers?.()]).catch(console.error);
    }, [fetchCoops, fetchUsers])
  );

  const filteredUsers = useMemo(() => {
    let result = activeUsers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (filterRole !== 'ALL') result = result.filter((u) => u.roleBadgeType === filterRole);
    if (filterStatus === 'ACTIVE')    result = result.filter((u) => u.isActive);
    if (filterStatus === 'SUSPENDED') result = result.filter((u) => !u.isActive);
    return result;
  }, [activeUsers, search, filterRole, filterStatus]);

  // Handlers
  const handleAdd  = () => { setEditingUser(null); setModalVisible(true); };
  const handleEdit = (user) => { setEditingUser(user); setModalVisible(true); };

  const handleSave = USE_MOCK
    ? (userData) => { console.log('Mock save', userData); setModalVisible(false); }
    : async (userData) => {
        const isEdit = !!editingUser;
        const result = isEdit ? await updateUser(editingUser?.id, userData) : await createUser(userData);
        if (result?.success) { setModalVisible(false); fetchUsers?.(); }
        else Alert.alert('Erreur', result?.message || 'Échec de l\'opération');
      };

  const handleOpenApprove = (user) => { setApprovingUser(user); setApproveVisible(true); };

  const handleApprove = USE_MOCK
    ? () => setApproveVisible(false)
    : async (userId, selectedCoopIds) => {
        const result = await approveUser(userId, { cooperatives: selectedCoopIds });
        if (result?.success) { setApproveVisible(false); fetchUsers?.(); }
        else Alert.alert('Erreur', result?.message);
      };

  const handleRejectFromModal = USE_MOCK
    ? () => setApproveVisible(false)
    : async (userId) => {
        const result = await rejectUser(userId);
        if (result?.success) setApproveVisible(false);
      };

  const handleRejectCard = (user) => {
    if (!user?.id) return;
    Alert.alert('Refuser', `Refuser le compte de "${user.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => (USE_MOCK ? null : rejectUser(user.id)) },
    ]);
  };

  const handleDelete = (user) => {
    if (!user?.id || String(user.id) === String(currentUser?.id)) {
      Alert.alert('Impossible', "Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    Alert.alert('Supprimer', `Supprimer "${user.name}" ?`, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => (USE_MOCK ? null : deleteUser(user.id)) },
    ]);
  };

  const handleToggle = USE_MOCK ? (id) => console.log('Toggle mock', id) : toggleUser;

  const hasActiveFilters = search.trim() || filterRole !== 'ALL' || filterStatus !== 'ALL';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Gestion Utilisateurs</Text>
          <Text style={styles.topBarSubtitle}>{allUsers.length} compte{allUsers.length !== 1 ? 's' : ''} au total</Text>
        </View>
        
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── KPI ROW ── */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="pending-actions"
            label="En attente"
            value={pendingUsers.length}
            color={pendingUsers.length > 0 ? COLORS.secondary : COLORS.onSurfaceVariant}
            bg={pendingUsers.length > 0 ? COLORS.secondary + '18' : COLORS.surfaceContainer}
          />
          <KpiCard
            icon="check-circle"
            label="Actifs"
            value={activeCount}
            color={COLORS.statusHealthy}
            bg={COLORS.statusHealthy + '18'}
          />
          <KpiCard
            icon="block"
            label="Suspendus"
            value={suspendedCount}
            color={suspendedCount > 0 ? COLORS.error : COLORS.onSurfaceVariant}
            bg={suspendedCount > 0 ? COLORS.errorContainer : COLORS.surfaceContainer}
          />
          <KpiCard
            icon="admin-panel-settings"
            label="Admins"
            value={adminCount}
            color={COLORS.primary}
            bg={COLORS.primary + '18'}
          />
        </View>

        {/* ── PENDING SECTION ── */}
        {pendingUsers.length > 0 && (
          <View style={styles.pendingSection}>
            <View style={styles.pendingSectionHeader}>
              <View style={styles.pendingSectionTitleRow}>
                <View style={styles.pendingPulse}>
                  <MaterialIcons name="schedule" size={16} color={COLORS.secondary} />
                </View>
                <Text style={styles.pendingSectionTitle}>Demandes en attente</Text>
              </View>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>{pendingUsers.length}</Text>
              </View>
            </View>
            <View style={styles.pendingList}>
              {pendingUsers.map((user) => (
                <PendingUserCard key={user.id} user={user} onApprove={handleOpenApprove} onReject={handleRejectCard} />
              ))}
            </View>
          </View>
        )}

        {/* ── SEARCH ── */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur…"
            placeholderTextColor={COLORS.outlineVariant}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="cancel" size={18} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTERS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {/* Statut */}
          <FilterPill label="Tous" active={filterStatus === 'ALL'} onPress={() => setFilterStatus('ALL')} />
          <FilterPill
            label="Actifs"
            active={filterStatus === 'ACTIVE'}
            onPress={() => setFilterStatus('ACTIVE')}
            count={activeCount}
          />
          <FilterPill
            label="Suspendus"
            active={filterStatus === 'SUSPENDED'}
            onPress={() => setFilterStatus('SUSPENDED')}
            count={suspendedCount}
          />

          <View style={styles.filterSep} />

          {/* Rôle */}
          <FilterPill label="Tous rôles" active={filterRole === 'ALL'} onPress={() => setFilterRole('ALL')} />
          {ROLES.map((r) => (
            <FilterPill
              key={r.key}
              label={r.label}
              active={filterRole === r.key}
              onPress={() => setFilterRole(r.key)}
              count={activeUsers.filter((u) => u.roleBadgeType === r.key).length}
            />
          ))}
        </ScrollView>

        {/* ── LISTE HEADER ── */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderLabel}>
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' trouvé' + (filteredUsers.length !== 1 ? 's' : '') : ''}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
              style={styles.clearFiltersBtn}
            >
              <MaterialIcons name="filter-alt-off" size={14} color={COLORS.primary} />
              <Text style={styles.clearFiltersBtnText}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── USER LIST ── */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="manage-search" size={52} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySubtitle}>Modifiez vos filtres ou votre recherche</Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => { setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL'); }}
            >
              <Text style={styles.emptyResetText}>Réinitialiser les filtres</Text>
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

        <View style={{ height: SPACING['4xl'] }} />
      </ScrollView>

      <UserFormModal
        visible={modalVisible}
        user={editingUser}
        coops={coops}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        myRole={myRole}
      />
      <ApproveModal
        visible={approveVisible}
        user={approvingUser}
        coops={coops}
        onClose={() => setApproveVisible(false)}
        onApprove={handleApprove}
        onReject={handleRejectFromModal}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },

  // ── TOP BAR ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    minHeight: LAYOUT.topBarHeight,
  },
  topBarTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  topBarSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white + 'AA',
    marginTop: 1,
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
  addBtnText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], gap: SPACING.lg },

  // ── KPI ──
  kpiRow: { flexDirection: 'row', gap: SPACING.sm },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
    alignItems: 'center',
    gap: 4,
  },
  kpiIconBox: {
    width: 32, height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiValue: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.extraBold,
    lineHeight: 28,
  },
  kpiLabel: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  // ── PENDING SECTION ──
  pendingSection: {
    backgroundColor: 'rgba(254, 106, 52, 0.06)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(254, 106, 52, 0.20)',
  },
  pendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  pendingSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pendingPulse: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingSectionTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
  },
  pendingCountBadge: {
    backgroundColor: COLORS.secondary,
    minWidth: 24, height: 24,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCountText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  pendingList: { gap: SPACING.md },

  pendingCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  pendingCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  pendingCardActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 106, 52, 0.10)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  pendingChipText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  pendingRejectBtn: {
    width: 36, height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 36,
  },
  pendingApproveBtnText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // ── SEARCH ──
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant + '40',
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurface,
    paddingVertical: SPACING.lg,
  },

  // ── FILTERS ──
  filtersRow: { gap: SPACING.sm, alignItems: 'center', paddingRight: SPACING['2xl'] },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant + '50',
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
  },
  filterPillTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHTS.bold },
  filterPillCount: {
    backgroundColor: COLORS.outlineVariant + '40',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    minWidth: 18,
    alignItems: 'center',
  },
  filterPillCountActive: { backgroundColor: COLORS.white + '30' },
  filterPillCountText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
  },
  filterPillCountTextActive: { color: COLORS.white },
  filterSep: {
    width: 1, height: 20,
    backgroundColor: COLORS.outlineVariant + '60',
    marginHorizontal: SPACING.xs,
  },

  // ── LIST HEADER ──
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  listHeaderLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.full,
  },
  clearFiltersBtnText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  // ── USER CARD ──
  userList: { gap: SPACING.md },
  userCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingLeft: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  userCardInactive: { opacity: 0.75 },
  userCardAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    borderRadius: RADIUS.sm,
  },
  userCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  avatarWrapper: { width: 48, height: 48, position: 'relative' },
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
  avatarFallbackInactive: { backgroundColor: COLORS.outlineVariant },
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
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  userName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  userNameInactive: { color: COLORS.onSurfaceVariant },
  selfBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  selfBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  userEmail: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },
  assignedCoopsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  assignedCoopsText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    flex: 1,
  },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 3 },
  roleBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  roleBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },

  userActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  switchPlaceholder: { width: 51, height: 31 }, // même taille qu'un Switch standard
  actionBtn: {
    width: 34, height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn:         { backgroundColor: COLORS.errorContainer },
  actionBtnDisabled: { opacity: 0.3 },

  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  protectedBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── ACCESS DENIED ──
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING['4xl'],
  },
  accessDeniedTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  accessDeniedText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── EMPTY STATE ──
  emptyState: { alignItems: 'center', paddingVertical: SPACING['4xl'], gap: SPACING.sm },
  emptyTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
  },
  emptyResetBtn: {
    marginTop: SPACING.md,
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

  // ── MODAL ──
  modalContainer:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  formSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding: SPACING['2xl'],
    paddingTop: SPACING.md,
    maxHeight: '92%',
    ...SHADOWS.xl,
  },
  formSheetHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  formSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING['2xl'],
  },
  formSheetTitle: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  formSheetSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  formSheetClose: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
  },

  pendingUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.emerald50,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.emerald100,
  },
  pendingAvatarBox: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingUserInfo:  { flex: 1 },
  pendingUserName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  pendingUserEmail: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pendingBadgeText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  formField:    { marginBottom: SPACING.xl },
  formLabel: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  formHint: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
    marginTop: -SPACING.xs,
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
  formInputError: { borderColor: COLORS.error, backgroundColor: COLORS.errorContainer },
  formError: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },

  coopSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  selectedCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  selectedCountText: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  coopSelectorList: { gap: SPACING.sm },
  coopSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  coopSelectorItemSelected: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '50',
  },
  coopStatusDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  coopSelectorInfo: { flex: 1 },
  coopSelectorName: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.onSurface,
  },
  coopSelectorSector: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  coopSelectorPop: {
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onSurfaceVariant,
    textAlign: 'right',
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  noCoopsBox: { alignItems: 'center', paddingVertical: SPACING['2xl'], gap: SPACING.sm },
  noCoopsText: { fontFamily: FONTS.inter, fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant },

  rolesGrid: { gap: SPACING.sm },
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
  rolePillDot: { width: 10, height: 10, borderRadius: 5 },
  rolePillText: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onSurfaceVariant,
    fontWeight: FONT_WEIGHTS.medium,
  },

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

  approveButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.error + '60',
    backgroundColor: COLORS.errorContainer,
  },
  rejectBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.error,
  },
  approveBtn: {
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
  approveBtnText: {
    fontFamily: FONTS.manrope,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default UserManagementScreen;