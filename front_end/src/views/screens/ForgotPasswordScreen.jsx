import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, FONTS, RADIUS } from '../models/utils/constants';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return "L'email est requis";
    if (!emailRegex.test(value)) return 'Email invalide';
    return '';
  };

  const handleSend = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      shake();
      return;
    }

    setEmailError('');
    setIsLoading(true);

    // Simulation envoi email (mode mock)
    await new Promise((res) => setTimeout(res, 1800));

    setIsLoading(false);
    setIsSuccess(true);

    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={[COLORS.emerald950, COLORS.primary, COLORS.primaryLight]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.emerald400} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          {/* Icon header */}
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock-reset" size={40} color={COLORS.secondary} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Saisis ton adresse email. On t'envoie un lien pour réinitialiser ton mot de passe.
          </Text>

          {!isSuccess ? (
            <>
              {/* Email input */}
              <Animated.View
                style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}
              >
                <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={emailError ? COLORS.error : COLORS.emerald400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (emailError) setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>
                    <MaterialIcons name="error-outline" size={12} /> {emailError}
                  </Text>
                ) : null}
              </Animated.View>

              {/* Send button */}
              <TouchableOpacity
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={isLoading}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[COLORS.secondary, '#FF8C5A']}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Envoyer le lien</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* Success state */
            <Animated.View style={[styles.successBox, { opacity: successOpacity }]}>
              <View style={styles.successIconWrap}>
                <MaterialIcons name="mark-email-read" size={48} color={COLORS.statusHealthy} />
              </View>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successMsg}>
                Un lien de réinitialisation a été envoyé à{' '}
                <Text style={styles.successEmail}>{email}</Text>
                {'. '}Vérifie ta boîte mail (et ton dossier spam).
              </Text>

              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.85}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={[COLORS.secondary, '#FF8C5A']}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="login" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Retour à la connexion</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Info note */}
          {!isSuccess && (
            <View style={styles.noteWrap}>
              <MaterialIcons name="info-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.noteText}>
                En mode démo, aucun email réel n'est envoyé.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'flex-start',
    gap: 6,
  },
  backText: {
    color: COLORS.emerald400,
    fontFamily: FONTS.inter,
    fontSize: 15,
    fontWeight: '500',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(254,106,52,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(254,106,52,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.manrope,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  inputWrap: { marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(179,38,30,0.1)',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: 15,
    color: COLORS.white,
  },
  errorText: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 4,
  },
  btnWrap: { marginTop: 4 },
  btn: {
    height: 56,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FONTS.manrope,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  noteText: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  successBox: {
    alignItems: 'center',
  },
  successIconWrap: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(5,150,105,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: FONTS.manrope,
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
  },
  successMsg: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 4,
  },
  successEmail: {
    color: COLORS.emerald400,
    fontWeight: '600',
  },
});