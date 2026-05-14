// src/views/screens/SetPasswordScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import api from '../../models/services/apiService';

const SetPasswordScreen = ({ route, navigation }) => {
  const token  = route?.params?.token || null;
  const logout = useAppStore((s) => s.logout);

  // ✅ console.log dans useEffect uniquement (évite la boucle infinie)
  useEffect(() => {
    console.log('[SetPassword] token reçu:', token);
  }, [token]);

  const [verifying,   setVerifying]   = useState(true);
  const [tokenValid,  setTokenValid]  = useState(false);
  const [userName,    setUserName]    = useState('');
  const [userEmail,   setUserEmail]   = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  // ── 1. Vérifier que le token est valide ─
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }
      try {
        const res = await api.get('/auth/verify-invite', { token });
        setUserName(res.name   || '');
        setUserEmail(res.email || '');
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  // ── Validation ─────────────────────────
  const validate = () => {
    const e = {};
    if (password.length < 6) e.password = 'Minimum 6 caractères';
    if (password !== confirm) e.confirm  = 'Les mots de passe ne correspondent pas';
    return e;
  };

  // ── 2. Soumettre le mot de passe ───────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      await api.post('/auth/set-password', { token, password });

      // ✅ Après activation réussie
Alert.alert(
  '✅ Compte activé !',
  'Votre mot de passe a été créé. Vous pouvez maintenant vous connecter.',
  [{
    text: 'Se connecter',
    onPress: () => navigation.popToTop(), // ✅ retourne à Auth qui est en dessous
  }]
);
    } catch (err) {
      Alert.alert('Erreur', err?.message || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  // ── Chargement ─────────────────────────
  if (verifying) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={s.verifyingText}>Vérification du lien...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Token invalide / expiré ────────────
  if (!tokenValid) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <View style={s.errorIconBox}>
            <MaterialIcons name="link-off" size={48} color="#EF4444" />
          </View>
          <Text style={s.errorTitle}>Lien invalide ou expiré</Text>
          <Text style={s.errorSub}>
            Ce lien d'activation a expiré (48h) ou a déjà été utilisé.{'\n'}
            Contactez votre administrateur.
          </Text>
          <TouchableOpacity
            style={s.backBtn}
           // ✅ Bouton retour token invalide
              onPress={() => navigation.popToTop()}
          >
            <Text style={s.backBtnText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Formulaire ─────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.iconBox}>
            <MaterialIcons name="lock-reset" size={40} color="#FFFFFF" />
          </View>

          <Text style={s.title}>Bienvenue sur PoulIA</Text>
          <Text style={s.subtitle}>
            Bonjour <Text style={s.name}>{userName}</Text> 👋{'\n'}
            Choisissez votre mot de passe pour activer votre compte.
          </Text>
          {userEmail ? (
            <View style={s.emailBadge}>
              <MaterialIcons name="email" size={14} color="#1B4332" />
              <Text style={s.emailText}>{userEmail}</Text>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Mot de passe</Text>
            <View style={[s.inputRow, errors.password && s.inputError]}>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
                placeholder="Minimum 6 caractères"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.eyeBtn}>
                <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={s.field}>
            <Text style={s.label}>Confirmer le mot de passe</Text>
            <View style={[s.inputRow, errors.confirm && s.inputError]}>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setErrors((e) => ({ ...e, confirm: '' })); }}
                placeholder="Répétez votre mot de passe"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={s.eyeBtn}>
                <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}
          </View>

          <PasswordStrength password={password} />

          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={s.submitBtnText}>Activer mon compte</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🧩 INDICATEUR FORCE MOT DE PASSE
// ─────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: '6 caractères minimum', ok: password.length >= 6 },
    { label: 'Une majuscule',         ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre',            ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color = score === 3 ? '#10B981' : score === 2 ? '#F59E0B' : '#EF4444';
  const label = score === 3 ? 'Fort' : score === 2 ? 'Moyen' : 'Faible';

  return (
    <View style={s.strengthBox}>
      <View style={s.strengthBarRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.strengthBar, { backgroundColor: i < score ? color : '#E5E7EB' }]} />
        ))}
        <Text style={[s.strengthLabel, { color }]}>{label}</Text>
      </View>
      {checks.map((c) => (
        <View key={c.label} style={s.strengthCheck}>
          <MaterialIcons name={c.ok ? 'check' : 'close'} size={13} color={c.ok ? '#10B981' : '#9CA3AF'} />
          <Text style={[s.strengthCheckText, { color: c.ok ? '#10B981' : '#9CA3AF' }]}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F7F5' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },

  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#1B4332',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24,
    shadowColor: '#1B4332', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },

  title:    { fontSize: 26, fontWeight: '800', color: '#1B4332', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#6B7A6E', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  name:     { fontWeight: '700', color: '#1B4332' },

  emailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: 'rgba(27,67,50,0.1)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    marginBottom: 28,
  },
  emailText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },

  field:      { marginBottom: 18 },
  label:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#6B7A6E', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputError: { borderColor: '#EF4444' },
  input:      { flex: 1, fontSize: 15, color: '#1B4332', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 16 : 12 },
  eyeBtn:     { paddingHorizontal: 14 },
  errorText:  { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },

  strengthBox:      { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 24, gap: 8 },
  strengthBarRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  strengthBar:      { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', width: 48, textAlign: 'right' },
  strengthCheck:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthCheckText:{ fontSize: 12, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FF6B35', borderRadius: 100, paddingVertical: 16,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  verifyingText: { marginTop: 16, fontSize: 15, color: '#6B7A6E', fontWeight: '500' },
  errorIconBox:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  errorTitle:    { fontSize: 22, fontWeight: '800', color: '#1B4332', textAlign: 'center' },
  errorSub:      { fontSize: 14, color: '#6B7A6E', textAlign: 'center', lineHeight: 22 },
  backBtn:       { marginTop: 8, backgroundColor: '#1B4332', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100 },
  backBtnText:   { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default SetPasswordScreen;