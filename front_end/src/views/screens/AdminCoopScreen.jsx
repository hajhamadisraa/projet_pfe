// src/views/screens/AdminCoopScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image, Modal, Platform,
  ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAppStore from '../../controllers/context/AppStore';
import useCoops from '../../controllers/hooks/useCoops';
import api from '../../models/services/apiService';
import { LAYOUT } from '../../models/utils/constants';

const USE_MOCK = false;

const TEAM_INIT = [
  { id: 't1', name: 'Marc Dupont',    role: 'Chef de Zone', avatar: 'https://randomuser.me/api/portraits/men/32.jpg',   assignedCoops: ['1'] },
  { id: 't2', name: 'Sophie Laurent', role: 'Vétérinaire',  avatar: 'https://randomuser.me/api/portraits/women/44.jpg', assignedCoops: ['1', '2'] },
  { id: 't3', name: 'Jean-Luc Morel', role: 'Technicien',   avatar: 'https://randomuser.me/api/portraits/men/55.jpg',   assignedCoops: ['2'] },
];

const COOPS_MOCK = [
  {
    id: '1', nom: 'Poulailler 2', secteur: 'Secteur Nord',
    status: 'alerte', temp: '28.4°C', humidite: '62%', population: '1 247',
    updated: 'il y a 2 min', espConnected: true,
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400',
    equipements: [
      { key: 'ventilateur', label: 'Ventilateur', icon: 'air',       qte: 4  },
      { key: 'lampe',       label: 'Lampe',        icon: 'lightbulb', qte: 12 },
      { key: 'camera',      label: 'Caméra IA',    icon: 'videocam',  qte: 2  },
    ],
  },
  {
    id: '2', nom: 'Poulailler Principal', secteur: 'Secteur Est',
    status: 'actif', temp: '24.1°C', humidite: '58%', population: '3 400',
    updated: 'il y a 5 min', espConnected: true,
    image: null,
    equipements: [
      { key: 'ventilateur', label: 'Ventilateur', icon: 'air',        qte: 6 },
      { key: 'chauffage',   label: 'Chauffage',   icon: 'thermostat', qte: 2 },
      { key: 'pad_cooling', label: 'Pad Cooling', icon: 'ac-unit',    qte: 3 },
    ],
  },
  {
    id: '3', nom: 'Unité Quarantaine', secteur: 'Maintenance',
    status: 'inactif', updated: 'En pause depuis 2j', espConnected: false,
    image: null, equipements: [],
  },
];

const STANDARD_EQUIPEMENTS = [
  { key: 'ventilateur', label: 'Ventilateur', icon: 'air'        },
  { key: 'lampe',       label: 'Lampe',        icon: 'lightbulb'  },
  { key: 'chauffage',   label: 'Chauffage',    icon: 'thermostat' },
  { key: 'pad_cooling', label: 'Pad Cooling',  icon: 'ac-unit'    },
  { key: 'store',       label: 'Store',         icon: 'blinds'     },
  { key: 'camera',      label: 'Caméra IA',    icon: 'videocam'   },
];

const adaptCoop = (c) => ({
  id:           c._id,
  nom:          c.name,
  secteur:      c.sector,
  status:       c.status === 'healthy' ? 'actif' : c.status === 'warning' ? 'alerte' : 'inactif',
  temp:         c.sensors?.temperature?.value ? `${c.sensors.temperature.value}°C` : '--',
  humidite:     c.sensors?.humidity?.value    ? `${c.sensors.humidity.value}%`     : '--',
  population:   c.population?.toLocaleString('fr-FR') || '0',
  updated:      c.lastSeenAt ? `Vu ${new Date(c.lastSeenAt).toLocaleTimeString('fr-FR')}` : 'Jamais connecté',
  espConnected:  c.isOnline      || false,
  espMac:        c.esp32Mac      || null,
  image:         c.image         || null,
  equipements:   c.equipements   || [],
  assignedUsers: c.assignedUsers || [],
});

// ─────────────────────────────────────────
// 🪝 HOOK useEsp32
// ─────────────────────────────────────────
const useEsp32 = () => {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/esp32/available');
      setAvailableDevices(res.data || []);
    } catch (err) {
      console.error('[useEsp32] fetchAvailable:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const assignEsp32 = async (mac, coopId) => {
    try {
      const res = await api.post('/esp32/assign', { mac, coopId });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur assignation' };
    }
  };

  const unassignEsp32 = async (mac) => {
    try {
      await api.post(`/esp32/unassign/${mac}`);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur désassignation' };
    }
  };

  return { availableDevices, loading, fetchAvailable, assignEsp32, unassignEsp32 };
};

// ─────────────────────────────────────────
// 🧩 STATUS BADGE
// ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    alerte:  { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444', label: 'Alerte'  },
    actif:   { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', label: 'Actif'   },
    inactif: { bg: '#F3F4F6', color: '#6B7280', dot: null,      label: 'Inactif' },
  };
  const c = cfg[status] || cfg.inactif;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      {c.dot && <View style={[s.badgeDot, { backgroundColor: c.dot }]} />}
      <Text style={[s.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 ESP BADGE
// ─────────────────────────────────────────
const EspBadge = ({ connected }) => (
  <View style={[s.espBadge, { backgroundColor: connected ? '#ECFDF5' : '#F3F4F6' }]}>
    <MaterialIcons name={connected ? 'wifi' : 'wifi-off'} size={11} color={connected ? '#065F46' : '#9CA3AF'} />
    <Text style={[s.espText, { color: connected ? '#065F46' : '#9CA3AF' }]}>
      {connected ? 'ESP Connecté' : 'Non connecté'}
    </Text>
  </View>
);

// ─────────────────────────────────────────
// 🧩 POPUP ALERTES — scrollable, dismiss, mark all read
// ─────────────────────────────────────────
const AlertsPopup = ({ visible, alerts, onClose, onDismiss, onMarkAllRead }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    {/* ✅ Overlay sans TouchableOpacity pour ne pas bloquer le scroll */}
    <View style={s.popupOverlay}>
      {/* Zone de fermeture derrière le popup */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

      {/* Le popup lui-même */}
      <View style={s.popup}>
        <View style={s.popupHeader}>
          <Text style={s.popupTitle}>Alertes actives</Text>
          <View style={s.popupHeaderRight}>
            {alerts.length > 0 && (
              <TouchableOpacity
                style={s.markAllReadBtn}
                onPress={() => { onMarkAllRead(); onClose(); }}
                activeOpacity={0.8}
              >
                <Text style={s.markAllReadText}>Tout lire</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={s.popupClose}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {alerts.length === 0 ? (
          <View style={s.popupEmpty}>
            <MaterialIcons name="check-circle" size={36} color="#10B981" />
            <Text style={s.popupEmptyText}>Aucune alerte active</Text>
          </View>
        ) : (
          // ✅ ScrollView directement, pas dans un TouchableOpacity
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {alerts.map((a) => {
              const isHigh = a.severity === 'critical';
              return (
                <View key={a.id} style={[s.popupAlertItem, !a.isRead && s.popupAlertItemUnread]}>
                  <View style={[s.popupAlertDot, { backgroundColor: isHigh ? '#EF4444' : '#F59E0B' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.popupAlertTitle}>{a.title}</Text>
                    <Text style={s.popupAlertSub}>{a.location} · {a.timestamp}</Text>
                  </View>
                  <TouchableOpacity style={s.popupDismissBtn} onPress={() => onDismiss(a.id)} activeOpacity={0.8}>
                    <MaterialIcons name="close" size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>
);

// ─────────────────────────────────────────
// 🧩 ESP32 PICKER
// ─────────────────────────────────────────
const Esp32Picker = ({ coopId, currentMac = null, onAssigned, onUnassign }) => {
  const { availableDevices, loading, fetchAvailable, assignEsp32, unassignEsp32 } = useEsp32();
  const [assigning, setAssigning] = useState(false);
  const [selected,  setSelected]  = useState(currentMac);
  const [error,     setError]     = useState('');

  useEffect(() => { fetchAvailable(); }, []);

  const handleAssign = async (mac) => {
    if (!coopId) { setError('Sauvegardez d\'abord le poulailler'); return; }
    setAssigning(true); setError('');
    const result = await assignEsp32(mac, coopId);
    if (result.success) { setSelected(mac); onAssigned?.(mac); } else { setError(result.message); }
    setAssigning(false);
  };

  const handleUnassign = () => {
    Alert.alert('Déconnecter l\'ESP32', 'L\'ESP32 sera réinitialisé et disponible pour un autre poulailler.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => {
        if (!selected) return;
        const result = await unassignEsp32(selected);
        if (result.success) { setSelected(null); onUnassign?.(); fetchAvailable(); } else { setError(result.message); }
      }},
    ]);
  };

  if (selected && !loading) {
    return (
      <View style={ep.assignedContainer}>
        <View style={ep.assignedRow}>
          <View style={ep.assignedIcon}><MaterialIcons name="router" size={20} color="#065F46" /></View>
          <View style={{ flex: 1 }}>
            <Text style={ep.assignedTitle}>ESP32-{selected.slice(-6)}</Text>
            <Text style={ep.assignedMac}>{selected}</Text>
            <View style={ep.onlineDot}><View style={ep.greenDot} /><Text style={ep.onlineText}>Opérationnel dans ~30 secondes</Text></View>
          </View>
          <TouchableOpacity onPress={handleUnassign} style={ep.disconnectBtn}>
            <MaterialIcons name="link-off" size={14} color="#EF4444" />
            <Text style={ep.disconnectText}>Libérer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={ep.loadingBox}>
        <ActivityIndicator size="small" color="#1B4332" />
        <Text style={ep.loadingText}>Recherche des ESP32...</Text>
      </View>
    );
  }

  return (
    <View style={ep.container}>
      <View style={ep.listHeader}>
        <Text style={ep.listHeaderText}>{availableDevices.length} appareil{availableDevices.length > 1 ? 's' : ''} disponible{availableDevices.length > 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={fetchAvailable} style={ep.refreshBtn}>
          <MaterialIcons name="refresh" size={15} color="#1B4332" />
          <Text style={ep.refreshText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
      {error ? <View style={ep.errorBox}><MaterialIcons name="error-outline" size={14} color="#EF4444" /><Text style={ep.errorText}>{error}</Text></View> : null}
      {availableDevices.length === 0 ? (
        <View style={ep.emptyBox}>
          <MaterialIcons name="wifi-off" size={36} color="#D1D5DB" />
          <Text style={ep.emptyTitle}>Aucun ESP32 disponible</Text>
          <Text style={ep.emptySub}>Branchez un ESP32 → connectez-le au WiFi{'\n'}<Text style={{ fontWeight: '700' }}>"Poulailler-Setup"</Text> → revenez ici</Text>
          <TouchableOpacity style={ep.refreshBtnFull} onPress={fetchAvailable}>
            <MaterialIcons name="refresh" size={14} color="#1B4332" />
            <Text style={ep.refreshBtnFullText}>Rafraîchir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        availableDevices.map((device) => {
          const isOnline = device.isOnline;
          const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Jamais';
          return (
            <TouchableOpacity key={device.mac} style={ep.deviceCard} onPress={() => handleAssign(device.mac)} disabled={assigning} activeOpacity={0.75}>
              <View style={[ep.deviceIconBox, isOnline && ep.deviceIconBoxOnline]}>
                <MaterialIcons name="router" size={20} color={isOnline ? '#1B4332' : '#9CA3AF'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ep.deviceName}>{device.label || `ESP32-${device.mac.slice(-6)}`}</Text>
                <Text style={ep.deviceMac}>{device.mac}</Text>
                <Text style={ep.deviceSeen}>{isOnline ? '🟢 En ligne' : '⚫ Hors ligne'} · Vu à {lastSeen}</Text>
              </View>
              {assigning ? <ActivityIndicator size="small" color="#1B4332" /> : (
                <View style={ep.assignBtn}><Text style={ep.assignBtnText}>Assigner</Text><MaterialIcons name="arrow-forward" size={13} color="#FFFFFF" /></View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 COOP CARD — sans navigation onPress
// ─────────────────────────────────────────
const CoopCard = ({ coop, assignedTeam, onEdit, onDelete }) => {
  const accent    = coop.status === 'alerte' ? '#F87171' : coop.status === 'actif' ? '#34D399' : '#D1D5DB';
  const tempColor = coop.status === 'alerte' ? '#DC2626' : '#1B4332';

  return (
    <View style={[s.coopCard, coop.status === 'inactif' && { opacity: 0.75 }]}>
      <View style={[s.coopAccent, { backgroundColor: accent }]} />
      {coop.image ? <Image source={{ uri: coop.image }} style={s.coopImage} /> : null}

      <View style={s.coopHeader}>
        {/* ✅ Plus de onPress pour naviguer */}
        <View style={{ flex: 1 }}>
          <Text style={s.coopSecteur}>{coop.secteur}</Text>
          <Text style={s.coopNom}>{coop.nom}</Text>
        </View>
        <View style={s.coopHeaderRight}>
          <StatusBadge status={coop.status} />
        </View>
      </View>

      <View style={s.espRow}>
        <EspBadge connected={coop.espConnected} />
      </View>

      {coop.status !== 'inactif' ? (
        // ✅ Plus de TouchableOpacity de navigation
        <View>
          <View style={s.tempRow}>
            <View style={s.tempIconBox}>
              <MaterialIcons name="thermostat" size={20} color="#1B4332" />
            </View>
            <View>
              <Text style={s.tempLabel}>Température</Text>
              <Text style={[s.tempValue, { color: tempColor }]}>{coop.temp}</Text>
            </View>
          </View>
          <View style={s.coopStatsRow}>
            <View style={s.coopStat}>
              <View style={s.coopStatLabel}>
                <MaterialIcons name="water-drop" size={14} color="#9CA3AF" />
                <Text style={s.coopStatLabelText}>Humidité</Text>
              </View>
              <Text style={s.coopStatValue}>{coop.humidite}</Text>
            </View>
            <View style={s.coopStat}>
              <View style={s.coopStatLabel}>
                <MaterialIcons name="egg" size={14} color="#9CA3AF" />
                <Text style={s.coopStatLabelText}>Population</Text>
              </View>
              <Text style={s.coopStatValue}>{coop.population}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.inactifBox}>
          <MaterialIcons name="sensors-off" size={40} color="#D1D5DB" />
          <Text style={s.inactifText}>Capteurs hors ligne</Text>
        </View>
      )}

      {coop.equipements?.length > 0 && (
        <View style={s.equipChipsRow}>
          {coop.equipements.slice(0, 4).map((eq) => (
            <View key={eq.key} style={s.equipChip}>
              <MaterialIcons name={eq.icon} size={12} color="#1B4332" />
              <Text style={s.equipChipText}>{eq.qte}×</Text>
            </View>
          ))}
          {coop.equipements.length > 4 && (
            <View style={s.equipChip}><Text style={s.equipChipText}>+{coop.equipements.length - 4}</Text></View>
          )}
        </View>
      )}

      {assignedTeam.length > 0 && (
        <View style={s.teamRow}>
          <MaterialIcons name="group" size={13} color="#9CA3AF" />
          <View style={s.teamAvatars}>
            {assignedTeam.slice(0, 3).map((m, i) => (
              <Image key={m.id} source={{ uri: m.avatar }} style={[s.teamAvatar, { marginLeft: i === 0 ? 0 : -6 }]} />
            ))}
            {assignedTeam.length > 3 && (
              <View style={[s.teamAvatar, s.teamAvatarMore, { marginLeft: -6 }]}>
                <Text style={s.teamAvatarMoreText}>+{assignedTeam.length - 3}</Text>
              </View>
            )}
          </View>
          <Text style={s.teamLabel}>{assignedTeam.map((m) => m.name.split(' ')[0]).join(', ')}</Text>
        </View>
      )}

      <View style={s.coopFooter}>
        <Text style={s.coopUpdated}>{coop.updated}</Text>
        <View style={s.footerActions}>
          <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.8}>
            <MaterialIcons name="edit" size={15} color="#1B4332" />
            <Text style={s.editBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
            <MaterialIcons name="delete-outline" size={15} color="#EF4444" />
            <Text style={s.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────
// 🧩 COMPTEUR ÉQUIPEMENT
// ─────────────────────────────────────────
const EquipCounter = ({ equip, onIncrement, onDecrement, onRemove }) => (
  <View style={s.equipRow}>
    <View style={s.equipRowLeft}>
      <View style={s.equipIconBox}><MaterialIcons name={equip.icon} size={18} color="#1B4332" /></View>
      <Text style={s.equipName}>{equip.label}</Text>
    </View>
    <View style={s.equipCounter}>
      <TouchableOpacity style={s.counterBtn} onPress={onDecrement} activeOpacity={0.7}><MaterialIcons name="remove" size={16} color="#1B4332" /></TouchableOpacity>
      <Text style={s.counterValue}>{equip.qte}</Text>
      <TouchableOpacity style={s.counterBtn} onPress={onIncrement} activeOpacity={0.7}><MaterialIcons name="add" size={16} color="#1B4332" /></TouchableOpacity>
    </View>
    <TouchableOpacity onPress={onRemove} style={s.equipRemoveBtn} activeOpacity={0.7}><MaterialIcons name="delete-outline" size={16} color="#EF4444" /></TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────
// 🧩 MODAL AJOUT / ÉDITION
// ─────────────────────────────────────────
const CoopFormModal = ({ visible, coop, onClose, onSave, team }) => {
  const isEdit = !!coop;
  const [name,        setName]        = useState('');
  const [secteur,     setSecteur]     = useState('');
  const [imageUri,    setImageUri]    = useState(null);
  const [equipements, setEquipements] = useState([]);
  const [customName,  setCustomName]  = useState('');
  const [error,       setError]       = useState('');
  const [step,        setStep]        = useState('form');
  const [savedCoopId, setSavedCoopId] = useState(null);
  const [assignedMac, setAssignedMac] = useState(null);

  React.useEffect(() => {
    if (visible) {
      setName(coop?.nom || ''); setSecteur(coop?.secteur || ''); setImageUri(coop?.image || null);
      setEquipements(coop?.equipements ? [...coop.equipements] : []); setCustomName(''); setError('');
      setStep('form'); setSavedCoopId(coop?.id || null); setAssignedMac(coop?.espMac || null);
    }
  }, [visible, coop]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire."); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const addStandardEquip = (eq) => { if (equipements.find((e) => e.key === eq.key)) return; setEquipements((prev) => [...prev, { ...eq, qte: 1 }]); };
  const addCustomEquip   = () => { if (!customName.trim()) return; setEquipements((prev) => [...prev, { key: `custom_${Date.now()}`, label: customName.trim(), icon: 'build', qte: 1 }]); setCustomName(''); };
  const incrementQte     = (key) => setEquipements((prev) => prev.map((e) => e.key === key ? { ...e, qte: e.qte + 1 } : e));
  const decrementQte     = (key) => setEquipements((prev) => prev.map((e) => e.key === key && e.qte > 1 ? { ...e, qte: e.qte - 1 } : e));
  const removeEquip      = (key) => setEquipements((prev) => prev.filter((e) => e.key !== key));

  const handleSave = async () => {
    if (!name.trim()) { setError('Le nom du bâtiment est requis.'); return; }
    const result = await onSave({ nom: name.trim(), secteur: secteur.trim() || 'Nouveau Secteur', status: coop?.status || 'actif', image: imageUri || null, equipements, population: coop?.population || '0' });
    if (!isEdit && result?.coopId) { setSavedCoopId(result.coopId); setStep('esp32'); }
    if (isEdit) onClose();
  };

  // ── Étape ESP32 ────────────────────────
  if (step === 'esp32') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.modalContainer}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose} />
          <View style={s.formSheet}>
            <View style={s.formHeader}>
              <View>
                <Text style={s.formTitle}>Connecter un ESP32</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Optionnel — vous pouvez le faire plus tard</Text>
              </View>
              <TouchableOpacity style={s.formCloseBtn} onPress={onClose}><MaterialIcons name="close" size={20} color="#9CA3AF" /></TouchableOpacity>
            </View>
            <View style={ep.stepIndicator}>
              <View style={ep.stepDone}><MaterialIcons name="check" size={12} color="#FFFFFF" /></View>
              <View style={ep.stepLine} />
              <View style={ep.stepActive}><Text style={ep.stepActiveText}>2</Text></View>
              <Text style={ep.stepLabel}>Poulailler créé ✅  →  Assigner un ESP32</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Esp32Picker coopId={savedCoopId} currentMac={assignedMac} onAssigned={(mac) => setAssignedMac(mac)} onUnassign={() => setAssignedMac(null)} />
              <View style={{ height: 16 }} />
            </ScrollView>
            <TouchableOpacity style={s.createBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={s.createBtnText}>{assignedMac ? 'Terminé ✓' : 'Passer cette étape'}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Formulaire principal ───────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.formSheet}>
          <View style={s.formHeader}>
            <Text style={s.formTitle}>{isEdit ? 'Modifier le Poulailler' : 'Nouveau Poulailler'}</Text>
            <TouchableOpacity style={s.formCloseBtn} onPress={onClose}><MaterialIcons name="close" size={20} color="#9CA3AF" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.formSection}>
              <Text style={s.formLabel}>Nom du bâtiment *</Text>
              <TextInput style={[s.formInput, error ? { borderColor: '#EF4444' } : {}]} value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="ex: Hangar de Croissance Nord-Est" placeholderTextColor="#D1D5DB" />
              {error ? <Text style={s.formError}>{error}</Text> : null}
            </View>
            <View style={s.formSection}>
              <Text style={s.formLabel}>Secteur</Text>
              <TextInput style={s.formInput} value={secteur} onChangeText={setSecteur} placeholder="ex: Secteur Nord" placeholderTextColor="#D1D5DB" />
            </View>
            <View style={s.formSection}>
              <Text style={s.formLabel}>Photo du poulailler</Text>
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={s.changeImageBtn} onPress={pickImage} activeOpacity={0.8}>
                    <MaterialIcons name="photo-library" size={16} color="#1B4332" />
                    <Text style={s.changeImageText}>Changer la photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.imagePickerRow}>
                  <TouchableOpacity style={s.imagePickerBtn} onPress={takePhoto} activeOpacity={0.8}>
                    <MaterialIcons name="camera-alt" size={22} color="#1B4332" />
                    <Text style={s.imagePickerText}>Prendre une photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.imagePickerBtn} onPress={pickImage} activeOpacity={0.8}>
                    <MaterialIcons name="photo-library" size={22} color="#1B4332" />
                    <Text style={s.imagePickerText}>Depuis la galerie</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={s.formSection}>
              <Text style={s.formLabel}>Équipements</Text>
              <Text style={s.formSubLabel}>Standards (appuyez pour ajouter)</Text>
              <View style={s.standardEquipGrid}>
                {STANDARD_EQUIPEMENTS.map((eq) => {
                  const isAdded = !!equipements.find((e) => e.key === eq.key);
                  return (
                    <TouchableOpacity key={eq.key} style={[s.standardEquipBtn, isAdded && s.standardEquipBtnAdded]} onPress={() => addStandardEquip(eq)} activeOpacity={0.8}>
                      <MaterialIcons name={eq.icon} size={18} color={isAdded ? '#FFFFFF' : '#1B4332'} />
                      <Text style={[s.standardEquipLabel, isAdded && { color: '#FFFFFF' }]}>{eq.label}</Text>
                      {isAdded && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {equipements.length > 0 && (
                <View style={s.equipAddedList}>
                  <Text style={s.formSubLabel}>Quantités</Text>
                  {equipements.map((eq) => (
                    <EquipCounter key={eq.key} equip={eq} onIncrement={() => incrementQte(eq.key)} onDecrement={() => decrementQte(eq.key)} onRemove={() => removeEquip(eq.key)} />
                  ))}
                </View>
              )}
              <Text style={[s.formSubLabel, { marginTop: 12 }]}>Équipement personnalisé</Text>
              <View style={s.customEquipRow}>
                <TextInput style={[s.formInput, { flex: 1 }]} value={customName} onChangeText={setCustomName} placeholder="Nom de l'équipement..." placeholderTextColor="#D1D5DB" returnKeyType="done" onSubmitEditing={addCustomEquip} />
                <TouchableOpacity style={s.customEquipAddBtn} onPress={addCustomEquip} activeOpacity={0.8}><MaterialIcons name="add" size={20} color="#FFFFFF" /></TouchableOpacity>
              </View>
            </View>
            <View style={s.formSection}>
              <Text style={s.formLabel}>Éleveurs affectés</Text>
              <View style={s.autoTeamBox}>
                <MaterialIcons name="info-outline" size={14} color="#1B4332" />
                <Text style={s.autoTeamNote}>Affectés automatiquement depuis la gestion des utilisateurs.</Text>
              </View>
              <View style={s.teamPreviewList}>
                {team.map((m) => (
                  <View key={m.id || m._id} style={s.teamPreviewItem}>
                    <Image source={{ uri: m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1B4332&color=fff` }} style={s.teamPreviewAvatar} />
                    <View>
                      <Text style={s.teamPreviewName}>{m.name}</Text>
                      <Text style={s.teamPreviewRole}>{m.role || 'Éleveur'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            {isEdit && (
              <View style={s.formSection}>
                <Text style={s.formLabel}>Appareil ESP32</Text>
                <Esp32Picker coopId={savedCoopId} currentMac={assignedMac} onAssigned={(mac) => setAssignedMac(mac)} onUnassign={() => setAssignedMac(null)} />
              </View>
            )}
            {!isEdit && (
              <View style={ep.creationNote}>
                <MaterialIcons name="info-outline" size={14} color="#1B4332" />
                <Text style={ep.creationNoteText}>Après la création, vous pourrez assigner un ESP32 à ce poulailler.</Text>
              </View>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
          <TouchableOpacity style={s.createBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.createBtnText}>{isEdit ? 'Enregistrer' : 'Créer le Poulailler →'}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────
// 📱 ADMIN COOP SCREEN
// ─────────────────────────────────────────
const AdminCoopScreen = ({ navigation }) => {
  const user        = useAppStore((state) => state.user);
  const alerts      = useAppStore((state) => state.alerts);
  const unreadCount = useAppStore((state) => state.unreadAlertsCount);
  const {
    logout,
    fetchAlerts,
    dismissAlert,
    markAllAlertsRead,
  } = useAppStore();

  const [mockCoops, setMockCoops] = useState(COOPS_MOCK);

  const {
    coops: apiCoops, loading, fetchCoops, createCoop, updateCoop, deleteCoop,
  } = USE_MOCK ? { coops: [], loading: false, fetchCoops: null, createCoop: null, updateCoop: null, deleteCoop: null } : useCoops();

  const coops = USE_MOCK ? mockCoops : apiCoops.map(adaptCoop);
  const [team]           = useState(TEAM_INIT);
  const [showModal,      setShowModal]      = useState(false);
  const [editingCoop,    setEditingCoop]    = useState(null);
  const [search,         setSearch]         = useState('');
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  // ✅ Refresh alertes + coops au focus
  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
      if (!USE_MOCK && fetchCoops) fetchCoops();
    }, [])
  );

  const filteredCoops = useMemo(() => {
    if (!search.trim()) return coops;
    const q = search.toLowerCase();
    return coops.filter((c) => c.nom.toLowerCase().includes(q) || c.secteur.toLowerCase().includes(q));
  }, [coops, search]);

  const alertCount = coops.filter((c) => c.status === 'alerte').length;

  const getAssignedTeam = (coopId) => {
    if (USE_MOCK) return team.filter((m) => m.assignedCoops?.includes(coopId));
    const coop = coops.find((c) => c.id === coopId);
    return (coop?.assignedUsers || []).map((u) => ({
      id:     u._id,
      name:   u.name,
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=1B4332&color=fff`,
      role:   u.role || 'Éleveur',
    }));
  };

  const handleSave = USE_MOCK
    ? (data) => {
        const coopData = { id: editingCoop?.id || String(Date.now()), nom: data.nom, secteur: data.secteur, status: editingCoop?.status || 'actif', temp: editingCoop?.temp || '24.0°C', humidite: editingCoop?.humidite || '60%', population: editingCoop?.population || '0', updated: "À l'instant", espConnected: editingCoop?.espConnected ?? false, image: data.image || null, equipements: data.equipements };
        setMockCoops((prev) => { const exists = prev.find((c) => c.id === coopData.id); if (exists) return prev.map((c) => c.id === coopData.id ? coopData : c); return [coopData, ...prev]; });
        setEditingCoop(null); setShowModal(false); return null;
      }
    : async (data) => {
        const payload = { name: data.nom, sector: data.secteur, population: parseInt(data.population?.replace(/\s/g, '')) || 0, image: data.image, equipements: data.equipements, status: data.status === 'actif' ? 'healthy' : data.status === 'alerte' ? 'warning' : 'critical' };
        const isEdit  = !!editingCoop;
        const result  = isEdit ? await updateCoop(editingCoop.id, payload) : await createCoop(payload);
        if (!result.success) { Alert.alert('Erreur', result.message); return null; }
        fetchAlerts();
        if (isEdit) { setEditingCoop(null); setShowModal(false); return null; }
        return { coopId: result.data?._id || result.data?.data?._id };
      };

  const handleDelete = USE_MOCK
    ? (coop) => Alert.alert('Supprimer le poulailler', `Êtes-vous sûr de vouloir supprimer "${coop.nom}" ?`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => setMockCoops((prev) => prev.filter((c) => c.id !== coop.id)) }])
    : (coop) => Alert.alert('Supprimer le poulailler', `Êtes-vous sûr de vouloir supprimer "${coop.nom}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          const result = await deleteCoop(coop.id);
          if (!result.success) { Alert.alert('Erreur', result.message); return; }
          fetchAlerts();
        }},
      ]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  if (!USE_MOCK && loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={{ marginTop: 12, color: '#6B7A6E', fontSize: 14 }}>Chargement des poulaillers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.headerTitle} activeOpacity={0.8}>
          <Text style={s.headerTitleText}>Mes Poulaillers</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => setShowAlertPopup(true)} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={22} color="#1B4332" />
            {unreadCount > 0 && <View style={s.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={s.headerAvatar} />
            ) : (
              <View style={[s.headerAvatar, s.avatarFallback]}>
                <Text style={s.avatarInitials}>{user?.name?.charAt(0) || 'A'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Bâtiments Actifs</Text>
            <Text style={s.sectionSub}>{coops.length} Poulaillers • {alertCount} Alerte{alertCount > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={s.newBtn} onPress={() => { setEditingCoop(null); setShowModal(true); }} activeOpacity={0.85}>
            <MaterialIcons name="add" size={16} color="#FFFFFF" />
            <Text style={s.newBtnText}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchWrapper}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput style={s.searchInput} placeholder="Rechercher un poulailler..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={18} color="#9CA3AF" /></TouchableOpacity>}
        </View>

        {filteredCoops.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
            <Text style={s.emptyTitle}>Aucun résultat</Text>
            <TouchableOpacity style={s.emptyResetBtn} onPress={() => setSearch('')}><Text style={s.emptyResetText}>Effacer</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={s.coopList}>
            {filteredCoops.map((coop) => (
              <CoopCard
                key={coop.id}
                coop={coop}
                assignedTeam={getAssignedTeam(coop.id)}
                onEdit={() => { setEditingCoop(coop); setShowModal(true); }}
                onDelete={() => handleDelete(coop)}
              />
            ))}
          </View>
        )}
        <View style={{ height: LAYOUT.bottomNavHeight + 24 }} />
      </ScrollView>

      <CoopFormModal
        visible={showModal}
        coop={editingCoop}
        onClose={() => { setShowModal(false); setEditingCoop(null); }}
        onSave={handleSave}
        team={USE_MOCK ? team : editingCoop ? getAssignedTeam(editingCoop.id) : []}
      />

      {/* ✅ Popup avec dismiss et markAllRead */}
      <AlertsPopup
        visible={showAlertPopup}
        alerts={alerts || []}
        onClose={() => setShowAlertPopup(false)}
        onDismiss={dismissAlert}
        onMarkAllRead={markAllAlertsRead}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(245,247,245,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(27,67,50,0.06)' },
  headerTitle:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitleText: { fontWeight: '800', fontSize: 17, color: '#1B4332', letterSpacing: -0.3 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn:   { position: 'relative', padding: 4 },
  notifDot:        { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35', borderWidth: 1.5, borderColor: '#F5F7F5' },
  headerAvatar:    { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#1B4332' },
  avatarFallback:  { backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  scroll:          { flex: 1 },
  scrollContent:   { padding: 16, paddingTop: 20, gap: 20 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle:    { fontWeight: '800', fontSize: 22, color: '#1B4332', lineHeight: 26 },
  sectionSub:      { color: '#6B7A6E', fontSize: 13, fontWeight: '500', marginTop: 3 },
  newBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF6B35', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  newBtnText:      { fontWeight: '700', fontSize: 13, color: '#FFFFFF' },
  searchWrapper:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(27,67,50,0.08)' },
  searchInput:     { flex: 1, fontSize: 14, color: '#1B4332', paddingVertical: 14 },
  emptyState:      { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle:      { fontWeight: '800', fontSize: 18, color: '#1B4332' },
  emptyResetBtn:   { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1B4332', borderRadius: 100 },
  emptyResetText:  { fontWeight: '700', fontSize: 13, color: '#FFFFFF' },
  coopList:        { gap: 14 },
  coopCard:        { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  coopAccent:      { height: 4 },
  coopImage:       { width: '100%', height: 120, resizeMode: 'cover' },
  coopHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  coopHeaderRight: { alignItems: 'flex-end', gap: 6 },
  coopSecteur:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: '#9CA3AF', marginBottom: 2 },
  coopNom:         { fontWeight: '800', fontSize: 18, color: '#1B4332', lineHeight: 22 },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  badgeDot:        { width: 6, height: 6, borderRadius: 3 },
  badgeText:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  espRow:          { paddingHorizontal: 20, marginTop: 6 },
  espBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  espText:         { fontSize: 10, fontWeight: '700' },
  tempRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 12, marginHorizontal: 20, marginTop: 12 },
  tempIconBox:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(27,67,50,0.1)', alignItems: 'center', justifyContent: 'center' },
  tempLabel:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 2 },
  tempValue:       { fontWeight: '800', fontSize: 16 },
  coopStatsRow:    { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 12 },
  coopStat:        { flex: 1 },
  coopStatLabel:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  coopStatLabelText:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#9CA3AF' },
  coopStatValue:   { fontWeight: '800', fontSize: 15, color: '#1B4332' },
  inactifBox:      { alignItems: 'center', justifyContent: 'center', height: 80, paddingHorizontal: 20 },
  inactifText:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#D1D5DB', marginTop: 6 },
  equipChipsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, marginTop: 12 },
  equipChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(27,67,50,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  equipChipText:   { fontSize: 10, fontWeight: '700', color: '#1B4332' },
  teamRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginTop: 12 },
  teamAvatars:     { flexDirection: 'row' },
  teamAvatar:      { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#FFFFFF' },
  teamAvatarMore:  { backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  teamAvatarMoreText: { fontSize: 8, fontWeight: '700', color: '#FFFFFF' },
  teamLabel:       { fontSize: 11, fontWeight: '600', color: '#6B7A6E', flex: 1 },
  coopFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 14, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  coopUpdated:     { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', flex: 1 },
  footerActions:   { flexDirection: 'row', gap: 8 },
  editBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(27,67,50,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  editBtnText:     { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  deleteBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  deleteBtnText:   { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  // ── Popup alertes ✅ corrigé
  popupOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 70, paddingRight: 16 },
  popup:               { backgroundColor: '#FFFFFF', borderRadius: 20, width: 300, maxHeight: 420, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12, overflow: 'hidden' },
  popupHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  popupHeaderRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popupTitle:          { fontWeight: '800', fontSize: 15, color: '#1B4332', flex: 1 },
  markAllReadBtn:      { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F0FDF4', borderRadius: 8 },
  markAllReadText:     { fontSize: 11, fontWeight: '700', color: '#065F46' },
  popupClose:          { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  popupEmpty:          { alignItems: 'center', paddingVertical: 32, gap: 10 },
  popupEmptyText:      { fontSize: 13, color: '#6B7A6E', fontWeight: '600' },
  popupAlertItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  popupAlertItemUnread:{ backgroundColor: '#F0FDF4' },
  popupAlertDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  popupAlertTitle:     { fontSize: 13, fontWeight: '700', color: '#1B4332', lineHeight: 18, flex: 1 },
  popupAlertSub:       { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  popupDismissBtn:     { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  // ── Modal form
  modalContainer:    { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:     { flex: 1, backgroundColor: 'rgba(27,67,50,0.35)' },
  formSheet:         { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  formHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  formTitle:         { fontWeight: '800', fontSize: 20, color: '#1B4332' },
  formCloseBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  formSection:       { marginBottom: 24 },
  formLabel:         { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: '#9CA3AF', marginBottom: 10 },
  formSubLabel:      { fontSize: 11, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  formInput:         { backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 14, color: '#1B4332', borderWidth: 1.5, borderColor: 'transparent' },
  formError:         { color: '#EF4444', fontSize: 12, marginTop: 4 },
  imagePickerRow:    { flexDirection: 'row', gap: 10 },
  imagePickerBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: 'rgba(27,67,50,0.2)' },
  imagePickerText:   { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  imagePreview:      { width: '100%', height: 140, borderRadius: 14 },
  changeImageBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 10, backgroundColor: '#F0FDF4', borderRadius: 12 },
  changeImageText:   { fontSize: 13, fontWeight: '700', color: '#1B4332' },
  standardEquipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  standardEquipBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: 'rgba(27,67,50,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  standardEquipBtnAdded: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  standardEquipLabel:{ fontSize: 12, fontWeight: '600', color: '#1B4332' },
  equipAddedList:    { marginTop: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, gap: 10 },
  equipRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  equipRowLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  equipIconBox:      { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(27,67,50,0.1)', alignItems: 'center', justifyContent: 'center' },
  equipName:         { fontSize: 13, fontWeight: '600', color: '#1B4332', flex: 1 },
  equipCounter:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 4, paddingVertical: 2 },
  counterBtn:        { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  counterValue:      { fontSize: 15, fontWeight: '800', color: '#1B4332', minWidth: 24, textAlign: 'center' },
  equipRemoveBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  customEquipRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customEquipAddBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  autoTeamBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(27,67,50,0.08)', borderRadius: 12, padding: 12, marginBottom: 12 },
  autoTeamNote:      { flex: 1, fontSize: 12, color: '#1B4332', lineHeight: 17 },
  teamPreviewList:   { gap: 8 },
  teamPreviewItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10 },
  teamPreviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  teamPreviewName:   { fontSize: 13, fontWeight: '700', color: '#1B4332' },
  teamPreviewRole:   { fontSize: 11, color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase' },
  createBtn:         { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  createBtnText:     { fontWeight: '800', fontSize: 16, color: '#FFFFFF' },
});

const ep = StyleSheet.create({
  stepIndicator:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  stepDone:        { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  stepLine:        { width: 16, height: 2, backgroundColor: '#1B4332' },
  stepActive:      { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  stepActiveText:  { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  stepLabel:       { fontSize: 12, color: '#1B4332', fontWeight: '600', flex: 1 },
  container:       { gap: 10 },
  listHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listHeaderText:  { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  refreshBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(27,67,50,0.08)', borderRadius: 8 },
  refreshText:     { fontSize: 11, fontWeight: '700', color: '#1B4332' },
  loadingBox:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 14 },
  loadingText:     { fontSize: 13, color: '#6B7A6E' },
  emptyBox:        { alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB', borderRadius: 16, gap: 8 },
  emptyTitle:      { fontWeight: '700', fontSize: 14, color: '#6B7280' },
  emptySub:        { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  refreshBtnFull:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(27,67,50,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, marginTop: 4 },
  refreshBtnFullText: { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  deviceCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  deviceIconBox:   { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  deviceIconBoxOnline: { backgroundColor: 'rgba(27,67,50,0.1)' },
  deviceName:      { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  deviceMac:       { fontSize: 10, color: '#9CA3AF', marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  deviceSeen:      { fontSize: 11, color: '#6B7280', marginTop: 2 },
  assignBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1B4332', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  assignBtnText:   { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  assignedContainer:{ backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: 'rgba(27,67,50,0.2)' },
  assignedRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignedIcon:    { width: 42, height: 42, borderRadius: 12, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  assignedTitle:   { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  assignedMac:     { fontSize: 10, color: '#6B7A6E', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  onlineDot:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  greenDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  onlineText:      { fontSize: 11, color: '#065F46', fontWeight: '600' },
  disconnectBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 8 },
  disconnectText:  { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  errorBox:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10 },
  errorText:       { fontSize: 12, color: '#EF4444', flex: 1 },
  creationNote:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(27,67,50,0.06)', borderRadius: 12, padding: 12, marginBottom: 8 },
  creationNoteText:{ flex: 1, fontSize: 12, color: '#1B4332', lineHeight: 17 },
});

export default AdminCoopScreen;