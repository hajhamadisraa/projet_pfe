// src/views/screens/ForgotPasswordScreen.jsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS, FONTS, FONT_SIZES, FONT_WEIGHTS,
  RADIUS, SHADOWS,
  SPACING,
} from '../../models/utils/constants';

// ─────────────────────────────────────────
// 3 ÉTAPES : email → code → nouveau mdp
// ─────────────────────────────────────────
const STEPS = {
  EMAIL:    'email',
  CODE:     'code',
  PASSWORD: 'password',
  SUCCESS:  'success',
};

// ─────────────────────────────────────────
// 🧩 STEP INDICATOR
// ─────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [STEPS.EMAIL, STEPS.CODE, STEPS.PASSWORD];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepDot,
            index <= currentIndex && styles.stepDotActive,
            index < currentIndex  && styles.stepDotDone,
          ]}>
            {index < currentIndex ? (
              <MaterialIcons name="check" size={12} color={COLORS.white} />
            ) : (
              <Text style={[
                styles.stepDotText,
                index <= currentIndex && styles.stepDotTextActive,
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < currentIndex && styles.stepLineActive,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────
// 📱 FORGOT PASSWORD SCREEN
// ─────────────────────────────────────────
const ForgotPasswordScreen = ({ navigation }) => {
  const [step,            setStep]           = useState(STEPS.EMAIL);
  const [email,           setEmail]          = useState('');
  const [code,            setCode]           = useState(['', '', '', '', '', '']);
  const [newPassword,     setNewPassword]    = useState('');
  const [confirmPassword, setConfirmPassword]= useState('');
  const [showNewPwd,      setShowNewPwd]     = useState(false);
  const [showConfirmPwd,  setShowConfirmPwd] = useState(false);
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState('');
  const [resendTimer,     setResendTimer]    = useState(0);

  // Refs pour les inputs du code
  const codeRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null),
  ];

  // Animation slide
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = () => {
    slideAnim.setValue(40);
    Animated.timing(slideAnim, {
      toValue:         0,
      duration:        300,
      useNativeDriver: true,
    }).start();
  };

  // ── Timer renvoi code
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Étape 1 : soumettre email
  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Veuillez entrer votre adresse email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format d\'email invalide.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // Simule API
    setLoading(false);
    animateStep();
    setStep(STEPS.CODE);
    startResendTimer();
  };

  // ── Saisie du code OTP
  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, '').slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) codeRefs[index + 1]?.current?.focus();
    if (!value && index > 0) codeRefs[index - 1]?.current?.focus();
  };

  // ── Étape 2 : vérifier code
  const handleCodeSubmit = async () => {
    setError('');
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Entrez les 6 chiffres du code.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    // En mode mock, le code "123456" est valide
    if (fullCode !== '123456') {
      setError('Code incorrect. Essayez 123456 (mode demo).');
      return;
    }
    animateStep();
    setStep(STEPS.PASSWORD);
  };

  // ── Renvoyer le code
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setCode(['', '', '', '', '', '']);
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    startResendTimer();
    codeRefs[0]?.current?.focus();
  };

  // ── Étape 3 : nouveau mot de passe
  const handlePasswordSubmit = async () => {
    setError('');
    if (!newPassword) { setError('Entrez un nouveau mot de passe.'); return; }
    if (newPassword.length < 6) { setError('Minimum 6 caractères.'); return; }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    animateStep();
    setStep(STEPS.SUCCESS);
  };

  // ─────────────────────────────────────────
  // 🎨 RENDER PAR ÉTAPE
  // ─────────────────────────────────────────

  // ── SUCCÈS
  if (step === STEPS.SUCCESS) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.successIconCircle}
          >
            <MaterialIcons name="check" size={48} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.successTitle}>Mot de passe réinitialisé !</Text>
          <Text style={styles.successSubtitle}>
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.successBtnText}>Se connecter</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── CONTENU PAR ÉTAPE
  const stepContent = {
    [STEPS.EMAIL]: {
      icon:     'mail-outline',
      title:    'Mot de passe oublié ?',
      subtitle: 'Entrez votre adresse email. Nous vous enverrons un code de vérification.',
    },
    [STEPS.CODE]: {
      icon:     'mark-email-read',
      title:    'Vérifiez vos emails',
      subtitle: `Un code à 6 chiffres a été envoyé à\n${email}`,
    },
    [STEPS.PASSWORD]: {
      icon:     'lock-reset',
      title:    'Nouveau mot de passe',
      subtitle: 'Choisissez un nouveau mot de passe sécurisé pour votre compte.',
    },
  };

  const { icon, title, subtitle } = stepContent[step];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header avec bouton retour */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (step === STEPS.EMAIL) navigation.goBack();
                else if (step === STEPS.CODE)     setStep(STEPS.EMAIL);
                else if (step === STEPS.PASSWORD) setStep(STEPS.CODE);
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Indicateur étapes */}
          <StepIndicator currentStep={step} />

          {/* ── Icône étape */}
          <Animated.View
            style={[styles.stepIconWrapper, { transform: [{ translateY: slideAnim }] }]}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.stepIconCircle}
            >
              <MaterialIcons name={icon} size={32} color={COLORS.white} />
            </LinearGradient>
          </Animated.View>

          {/* ── Titre + sous-titre */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepSubtitle}>{subtitle}</Text>
          </Animated.View>

          {/* ── Carte contenu */}
          <View style={styles.card}>

            {/* ÉTAPE 1 : Email */}
            {step === STEPS.EMAIL && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Adresse email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    placeholder="agronome@poulia.com"
                    placeholderTextColor={COLORS.outlineVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={handleEmailSubmit}
                  />
                </View>
              </View>
            )}

            {/* ÉTAPE 2 : Code OTP */}
            {step === STEPS.CODE && (
              <View>
                <Text style={styles.fieldLabel}>Code de vérification</Text>
                <View style={styles.otpRow}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={codeRefs[index]}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(v) => handleCodeChange(v, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </View>

                {/* Renvoyer le code */}
                <TouchableOpacity
                  style={styles.resendRow}
                  onPress={handleResend}
                  activeOpacity={resendTimer > 0 ? 1 : 0.7}
                  disabled={resendTimer > 0}
                >
                  <MaterialIcons
                    name="refresh"
                    size={16}
                    color={resendTimer > 0 ? COLORS.outlineVariant : COLORS.secondary}
                  />
                  <Text style={[
                    styles.resendText,
                    resendTimer > 0 && { color: COLORS.outlineVariant },
                  ]}>
                    {resendTimer > 0
                      ? `Renvoyer dans ${resendTimer}s`
                      : 'Renvoyer le code'}
                  </Text>
                </TouchableOpacity>

                {/* Note demo */}
                <View style={styles.demoNote}>
                  <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.demoNoteText}>
                    Mode démo : utilisez le code <Text style={styles.demoCode}>123456</Text>
                  </Text>
                </View>
              </View>
            )}

            {/* ÉTAPE 3 : Nouveau mot de passe */}
            {step === STEPS.PASSWORD && (
              <View style={styles.fieldGroup}>
                <View style={styles.pwdField}>
                  <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: SPACING['3xl'] }]}
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); setError(''); }}
                      placeholder="Minimum 6 caractères"
                      placeholderTextColor={COLORS.outlineVariant}
                      secureTextEntry={!showNewPwd}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPwd(!showNewPwd)}
                      style={styles.eyeBtn}
                    >
                      <MaterialIcons
                        name={showNewPwd ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={COLORS.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.pwdField}>
                  <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: SPACING['3xl'] }]}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                      placeholder="Répétez le mot de passe"
                      placeholderTextColor={COLORS.outlineVariant}
                      secureTextEntry={!showConfirmPwd}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={styles.eyeBtn}
                    >
                      <MaterialIcons
                        name={showConfirmPwd ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={COLORS.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Indicateur force mdp */}
                {newPassword.length > 0 && (
                  <View style={styles.pwdStrength}>
                    <View style={styles.pwdStrengthBars}>
                      {[1, 2, 3].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.pwdStrengthBar,
                            {
                              backgroundColor:
                                newPassword.length >= level * 3
                                  ? level === 1 ? COLORS.error
                                    : level === 2 ? COLORS.secondary
                                    : COLORS.statusHealthy
                                  : COLORS.surfaceContainerHigh,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.pwdStrengthLabel}>
                      {newPassword.length < 4 ? 'Faible'
                        : newPassword.length < 8 ? 'Moyen'
                        : 'Fort'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Erreur */}
            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Bouton principal */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              onPress={
                step === STEPS.EMAIL    ? handleEmailSubmit :
                step === STEPS.CODE     ? handleCodeSubmit :
                handlePasswordSubmit
              }
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {loading ? (
                  <Text style={styles.submitBtnText}>Chargement...</Text>
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      {step === STEPS.EMAIL    ? 'Envoyer le code' :
                       step === STEPS.CODE     ? 'Vérifier le code' :
                       'Réinitialiser'}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Lien retour connexion */}
          <TouchableOpacity
            style={styles.backToLoginRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={16} color={COLORS.secondary} />
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────
// 🎨 STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },

  scrollContent: {
    flexGrow:          1,
    paddingHorizontal: SPACING['2xl'],
    paddingBottom:     SPACING['4xl'],
  },

  // ── Header
  header: {
    paddingTop:    SPACING.xl,
    marginBottom:  SPACING.lg,
  },
  backBtn: {
    width:           40, height: 40,
    borderRadius:    20,
    backgroundColor: COLORS.surfaceContainer,
    alignItems:      'center',
    justifyContent:  'center',
    ...SHADOWS.sm,
  },

  // ── Step Indicator
  stepIndicator: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING['2xl'],
    gap:            0,
  },
  stepDot: {
    width:           32, height: 32,
    borderRadius:    16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     COLORS.outlineVariant,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor:     COLORS.primary,
  },
  stepDotDone: {
    backgroundColor: COLORS.statusHealthy,
    borderColor:     COLORS.statusHealthy,
  },
  stepDotText: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color:      COLORS.onSurfaceVariant,
  },
  stepDotTextActive: { color: COLORS.white },
  stepLine: {
    flex:            1,
    height:          2,
    backgroundColor: COLORS.outlineVariant,
    maxWidth:        48,
  },
  stepLineActive: { backgroundColor: COLORS.statusHealthy },

  // ── Icône étape
  stepIconWrapper: {
    alignItems:    'center',
    marginBottom:  SPACING.xl,
  },
  stepIconCircle: {
    width:          72, height: 72,
    borderRadius:   36,
    alignItems:     'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },

  // ── Titre
  stepTitle: {
    fontFamily:    FONTS.manrope,
    fontSize:      FONT_SIZES['2xl'],
    fontWeight:    FONT_WEIGHTS.extraBold,
    color:         COLORS.primary,
    textAlign:     'center',
    letterSpacing: -0.5,
    marginBottom:  SPACING.sm,
  },
  stepSubtitle: {
    fontFamily:    FONTS.inter,
    fontSize:      FONT_SIZES.sm,
    color:         COLORS.onSurfaceVariant,
    textAlign:     'center',
    lineHeight:    20,
    marginBottom:  SPACING['2xl'],
  },

  // ── Carte
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    RADIUS['2xl'],
    padding:         SPACING['2xl'],
    gap:             SPACING.lg,
    ...SHADOWS.md,
    borderWidth:     1,
    borderColor:     COLORS.outlineVariant + '20',
  },

  // ── Champs
  fieldGroup: { gap: SPACING.lg },
  pwdField:   { gap: SPACING.sm },
  fieldLabel: {
    fontFamily:    FONTS.inter,
    fontSize:      FONT_SIZES.xs,
    fontWeight:    FONT_WEIGHTS.bold,
    color:         COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  SPACING.xs,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius:    RADIUS.lg,
    paddingHorizontal: SPACING.lg,
  },
  inputIcon: { marginRight: SPACING.md },
  input: {
    flex:        1,
    fontFamily:  FONTS.inter,
    fontSize:    FONT_SIZES.md,
    color:       COLORS.onSurface,
    paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
  },
  eyeBtn: { padding: SPACING.sm },

  // ── OTP
  otpRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            SPACING.sm,
    marginBottom:   SPACING.lg,
  },
  otpInput: {
    flex:            1,
    height:          56,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius:    RADIUS.lg,
    textAlign:       'center',
    fontFamily:      FONTS.manrope,
    fontSize:        FONT_SIZES['2xl'],
    fontWeight:      FONT_WEIGHTS.extraBold,
    color:           COLORS.primary,
    borderWidth:     2,
    borderColor:     'transparent',
  },
  otpInputFilled: {
    borderColor:     COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },

  // Renvoyer code
  resendRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    marginBottom:   SPACING.md,
  },
  resendText: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color:      COLORS.secondary,
  },

  // Note demo
  demoNote: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.primary + '25',
  },
  demoNoteText: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.xs,
    color:      COLORS.primary,
    flex:       1,
  },
  demoCode: {
    fontWeight: FONT_WEIGHTS.extraBold,
    letterSpacing: 2,
  },

  // Force mot de passe
  pwdStrength: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.md,
    marginTop:      SPACING.sm,
  },
  pwdStrengthBars: {
    flexDirection: 'row',
    gap:           4,
    flex:          1,
  },
  pwdStrengthBar: {
    flex:         1,
    height:       4,
    borderRadius: RADIUS.full,
  },
  pwdStrengthLabel: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color:      COLORS.onSurfaceVariant,
    minWidth:   40,
  },

  // ── Erreur
  errorBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.errorContainer,
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
  },
  errorText: {
    flex:       1,
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    color:      COLORS.error,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Bouton submit
  submitBtn: {
    borderRadius: RADIUS.full,
    overflow:     'hidden',
    marginTop:    SPACING.sm,
    ...SHADOWS.lg,
  },
  submitBtnLoading: { opacity: 0.7 },
  submitBtnGradient: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  submitBtnText: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES.md,
    fontWeight:  FONT_WEIGHTS.bold,
    color:       COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Retour connexion
  backToLoginRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    marginTop:      SPACING['2xl'],
  },
  backToLoginText: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color:      COLORS.secondary,
  },

  // ── Succès
  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    gap:            SPACING.xl,
  },
  successIconCircle: {
    width:          100, height: 100,
    borderRadius:   50,
    alignItems:     'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
    marginBottom:   SPACING.lg,
  },
  successTitle: {
    fontFamily:    FONTS.manrope,
    fontSize:      FONT_SIZES['2xl'],
    fontWeight:    FONT_WEIGHTS.extraBold,
    color:         COLORS.primary,
    textAlign:     'center',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontFamily: FONTS.inter,
    fontSize:   FONT_SIZES.sm,
    color:      COLORS.onSurfaceVariant,
    textAlign:  'center',
    lineHeight: 22,
  },
  successBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical:   SPACING.lg,
    borderRadius:    RADIUS.full,
    marginTop:       SPACING.lg,
    ...SHADOWS.lg,
  },
  successBtnText: {
    fontFamily:  FONTS.manrope,
    fontSize:    FONT_SIZES.md,
    fontWeight:  FONT_WEIGHTS.bold,
    color:       COLORS.white,
    letterSpacing: 0.3,
  },
});

export default ForgotPasswordScreen;