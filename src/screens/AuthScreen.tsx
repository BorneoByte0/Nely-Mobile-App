import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  onAuthSuccess: (email: string, isLogin?: boolean) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { texts, language } = useLanguage();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { alertConfig, visible, showError, showSuccess, hideAlert } = useModernAlert();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      setIsLoading(false);

      if (error) {
        showError(texts.auth.error, error.message || 'Google Sign-In failed');
      } else {
        // Don't call onAuthSuccess here - let the AuthContext handle the actual authentication
        // The auth state change will be detected automatically by App.tsx
        console.log('Google Sign-In initiated - waiting for authentication...');
      }
    } catch (err) {
      setIsLoading(false);
      showError(texts.auth.error, 'An unexpected error occurred');
    }
  };

  const handleEmailAuth = async () => {
    if (isLogin) {
      // Real login with Supabase
      if (email.trim() && loginPassword.trim()) {
        setIsLoading(true);
        try {
          const { error } = await signIn(email.trim(), loginPassword);
          setIsLoading(false);

          if (error) {
            showError(texts.auth.error, error.message);
          } else {
            showSuccess(
              texts.auth.loginSuccess,
              texts.auth.welcomeBack2,
              () => onAuthSuccess(email, true)
            );
          }
        } catch (err) {
          setIsLoading(false);
          showError(texts.auth.error, 'An unexpected error occurred');
        }
      } else {
        showError(texts.auth.error, texts.auth.fillEmailPassword);
      }
    } else {
      // Real registration with Supabase
      if (email.trim() && registerPassword.trim() && confirmPassword.trim() && name.trim()) {
        if (registerPassword === confirmPassword) {
          if (registerPassword.length < 6) {
            showError(texts.auth.error, 'Password must be at least 6 characters');
            return;
          }

          setIsLoading(true);
          try {
            const userData = {
              name: name.trim(),
              phone: phone.trim(),
              role: 'caregiver',
              language: language
            };

            const { error } = await signUp(email.trim(), registerPassword, userData);
            setIsLoading(false);

            if (error) {
              showError(texts.auth.error, error.message);
            } else {
              showSuccess(
                texts.auth.registerSuccess,
                `${texts.auth.welcome}, ${name}!`,
                () => onAuthSuccess(email, false)
              );
            }
          } catch (err) {
            setIsLoading(false);
            showError(texts.auth.error, 'An unexpected error occurred');
          }
        } else {
          showError(texts.auth.error, texts.auth.passwordMismatch);
        }
      } else {
        showError(texts.auth.error, texts.auth.fillAllFields);
      }
    }
  };


  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary, colors.success]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <LanguageToggle position="topRight" size="small" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/nely-splash.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Nely</Text>
            </View>
            <Text style={styles.tagline}>
              {isLogin ? texts.auth.welcomeBack : texts.auth.getStarted}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.toggleContainer}>
              <InteractiveFeedback
                style={[styles.toggleButton, isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                  {texts.auth.login}
                </Text>
              </InteractiveFeedback>
              <InteractiveFeedback
                style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                  {texts.auth.register}
                </Text>
              </InteractiveFeedback>
            </View>

            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={texts.auth.fullName}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.input}
                  placeholder={texts.auth.phoneNumber}
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder={texts.auth.email}
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={texts.auth.password}
                placeholderTextColor={colors.textMuted}
                value={isLogin ? loginPassword : registerPassword}
                onChangeText={isLogin ? setLoginPassword : setRegisterPassword}
                secureTextEntry={!showPassword}
              />
              <InteractiveFeedback
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textSecondary}
                />
              </InteractiveFeedback>
            </View>

            {!isLogin && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={texts.auth.confirmPassword}
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <InteractiveFeedback
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </InteractiveFeedback>
              </View>
            )}

            {/* Email Auth Button */}
            <InteractiveFeedback onPress={handleEmailAuth} disabled={isLoading}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.authButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <LoadingDots />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name="mail"
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.authButtonText}>
                      {isLogin ? 'Sign in with Email' : texts.auth.registerButton}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </InteractiveFeedback>

            {/* Google Auth Button (Login only) */}
            {isLogin && (
              <InteractiveFeedback onPress={handleGoogleAuth} disabled={isLoading}>
                <View style={styles.googleButton}>
                  {isLoading ? (
                    <LoadingDots />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons
                        name="logo-google"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.googleButtonText}>
                        Sign in with Google
                      </Text>
                    </View>
                  )}
                </View>
              </InteractiveFeedback>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {alertConfig && (
        <ModernAlert
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </LinearGradient>
  );
}

// Loading dots component for auth button
const LoadingDots: React.FC = () => {
  const dot1 = new Animated.Value(0.4);
  const dot2 = new Animated.Value(0.4);
  const dot3 = new Animated.Value(0.4);

  React.useEffect(() => {
    const animate = () => {
      const duration = 400;
      const delay = 200;

      const createAnimation = (animatedValue: Animated.Value, delayTime: number) =>
        Animated.sequence([
          Animated.delay(delayTime),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.4,
            duration,
            useNativeDriver: true,
          }),
        ]);

      Animated.loop(
        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, delay),
          createAnimation(dot3, delay * 2),
        ])
      ).start();
    };

    animate();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeToggleText: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    color: colors.textPrimary,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 18,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    color: colors.textPrimary,
  },
  eyeButton: {
    position: 'absolute',
    right: 18,
    top: 18,
    padding: 2,
  },
  authButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: -35,
  },
});