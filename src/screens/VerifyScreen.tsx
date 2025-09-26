import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface VerifyScreenProps {
  onVerifySuccess: () => void;
  email?: string;
}

export const VerifyScreen: React.FC<VerifyScreenProps> = ({
  onVerifySuccess,
  email = 'user@example.com' // Default email for display
}) => {
  const { language } = useLanguage();
  const { showAlert, alertConfig, visible, hideAlert } = useModernAlert();

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);

  // Triple dot loading animation
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Loading animation
  useEffect(() => {
    if (isLoading || isResending) {
      const animateSequence = () => {
        const createAnimation = (dot: Animated.Value, delay: number) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);

        Animated.loop(
          Animated.parallel([
            createAnimation(dot1, 0),
            createAnimation(dot2, 200),
            createAnimation(dot3, 400),
          ])
        ).start();
      };
      animateSequence();
    } else {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      dot1.setValue(0.4);
      dot2.setValue(0.4);
      dot3.setValue(0.4);
    }
  }, [isLoading, isResending, dot1, dot2, dot3]);

  const texts = {
    en: {
      title: 'Email Verification',
      subtitle: 'Enter the 6-digit code we sent to your email',
      emailSent: 'Code sent to',
      verifyButton: 'Verify Email',
      resendCode: 'Resend Code',
      resendIn: 'Resend in',
      seconds: 's',
      verificationSuccess: 'Verification Successful',
      welcome: 'Email verified successfully!',
      error: 'Error',
      invalidCode: 'Please enter a valid 6-digit code',
      verificationFailed: 'Invalid verification code. Please try again.',
      resendSuccess: 'New verification code sent!',
      checkEmail: 'Please check your email for the new code.',
      resendFailed: 'Failed to resend code. Please try again.',
    },
    ms: {
      title: 'Pengesahan Email',
      subtitle: 'Masukkan kod 6-digit yang kami hantar ke email anda',
      emailSent: 'Kod dihantar ke',
      verifyButton: 'Sahkan Email',
      resendCode: 'Hantar Semula Kod',
      resendIn: 'Hantar semula dalam',
      seconds: 's',
      verificationSuccess: 'Pengesahan Berjaya',
      welcome: 'Email disahkan dengan berjaya!',
      error: 'Ralat',
      invalidCode: 'Sila masukkan kod 6-digit yang sah',
      verificationFailed: 'Kod pengesahan tidak sah. Sila cuba lagi.',
      resendSuccess: 'Kod pengesahan baru dihantar!',
      checkEmail: 'Sila semak email anda untuk kod yang baru.',
      resendFailed: 'Gagal menghantar semula kod. Sila cuba lagi.',
    },
  };

  const t = texts[language];

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to move to previous input
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');

    if (code.length !== 6) {
      showAlert({
        type: 'error',
        title: t.error,
        message: t.invalidCode,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }

    setIsLoading(true);

    // Simulate verification API call
    setTimeout(() => {
      setIsLoading(false);

      // For demo purposes, accept any 6-digit code
      if (code.length === 6) {
        showAlert({
          type: 'success',
          title: t.verificationSuccess,
          message: t.welcome,
          buttons: [{
            text: 'OK',
            style: 'primary',
            onPress: () => { hideAlert(); onVerifySuccess(); }
          }],
        });
      } else {
        showAlert({
          type: 'error',
          title: t.error,
          message: t.verificationFailed,
          buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
        });
      }
    }, 2000);
  };

  const handleResendCode = async () => {
    setIsResending(true);

    // Simulate resend API call
    setTimeout(() => {
      setIsResending(false);
      setCanResend(false);
      setCountdown(60);

      showAlert({
        type: 'success',
        title: t.resendSuccess,
        message: t.checkEmail,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
    }, 1500);
  };

  const isCodeComplete = verificationCode.every(digit => digit !== '');

  return (
    <SafeAreaWrapper gradientVariant="auth">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
          <Text style={styles.emailText}>
            <Text style={styles.emailLabel}>{t.emailSent} </Text>
            <Text style={styles.emailValue}>{email}</Text>
          </Text>
        </View>

        {/* Verification Code Input */}
        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              selectionColor={colors.primary}
            />
          ))}
        </View>

        {/* Verify Button */}
        <InteractiveFeedback
          onPress={handleVerify}
          disabled={!isCodeComplete || isLoading}
          style={[
            styles.verifyButton,
            (!isCodeComplete || isLoading) && styles.disabledButton,
          ]}
        >
          <LinearGradient
            colors={
              !isCodeComplete || isLoading
                ? [colors.gray400, colors.gray300]
                : [colors.primary, colors.secondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>{t.verifyButton}</Text>
            )}
          </LinearGradient>
        </InteractiveFeedback>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <InteractiveFeedback onPress={handleResendCode} disabled={isResending}>
              <View style={styles.resendButton}>
                {isResending ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
                  </View>
                ) : (
                  <Text style={styles.resendText}>{t.resendCode}</Text>
                )}
              </View>
            </InteractiveFeedback>
          ) : (
            <Text style={styles.countdownText}>
              {t.resendIn} {countdown}{t.seconds}
            </Text>
          )}
        </View>
      </View>

      {visible && alertConfig && (
        <ModernAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emailText: {
    textAlign: 'center',
  },
  emailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emailValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 12,
    backgroundColor: colors.white,
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha,
  },
  verifyButton: {
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});