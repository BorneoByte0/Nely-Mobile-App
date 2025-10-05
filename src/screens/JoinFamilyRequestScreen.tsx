import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useCreateFamilyJoinRequest, useUserJoinRequestStatus, useValidateFamilyCode } from '../hooks/useDatabase';
import { colors } from '../constants/colors';

interface JoinFamilyRequestScreenProps {
  navigation?: any;
  onBack?: () => void;
  onRequestCreated?: () => void;
}

export const JoinFamilyRequestScreen: React.FC<JoinFamilyRequestScreenProps> = ({
  navigation,
  onBack,
  onRequestCreated,
}) => {
  const { language } = useLanguage();
  const { showAlert, alertConfig, visible, hideAlert } = useModernAlert();
  const { createJoinRequest, loading: requestLoading, error: requestError } = useCreateFamilyJoinRequest();
  const { validateFamilyCode, loading: validationLoading } = useValidateFamilyCode();

  const [familyCode, setFamilyCode] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    familyName?: string;
    familyId?: string;
    error?: string;
  } | null>(null);

  // Check for existing request status
  const { status: existingRequestStatus } = useUserJoinRequestStatus(familyCode);

  // Loading animation
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  const texts = {
    en: {
      title: 'Join Family Group',
      subtitle: 'Request to join an existing family group',
      familyCodeLabel: 'Family Code',
      familyCodePlaceholder: 'Enter 6-digit family code',
      messageLabel: 'Request Message (Optional)',
      messagePlaceholder: 'Hi! I would like to join your family group to help monitor health together.',
      sendRequest: 'Send Join Request',
      cancel: 'Cancel',
      validation: {
        invalidCode: 'Please enter a valid 6-digit family code',
        familyNotFound: 'Family group not found. Please check the code and try again.',
        alreadyMember: 'You are already a member of this family group.',
        requestExists: 'You already have a pending request for this family.',
        requestRejected: 'Your previous request was rejected. You can send a new request.',
        validating: 'Validating family code...',
        validFamily: 'Valid family group found'
      },
      status: {
        pending: 'Request Pending',
        pendingDesc: 'Your join request is waiting for approval from a family admin.',
        approved: 'Request Approved',
        approvedDesc: 'Your request has been approved! You can now access the family group.',
        rejected: 'Request Rejected',
        rejectedDesc: 'Your previous request was not approved. You can submit a new request.'
      },
      success: {
        title: 'Request Sent!',
        message: 'Your join request has been sent to the family administrators. You will be notified when they review your request.',
        button: 'OK'
      },
      error: {
        title: 'Request Failed',
        message: 'Failed to send join request. Please check your connection and try again.',
        button: 'Try Again'
      }
    },
    ms: {
      title: 'Sertai Kumpulan Keluarga',
      subtitle: 'Minta untuk menyertai kumpulan keluarga sedia ada',
      familyCodeLabel: 'Kod Keluarga',
      familyCodePlaceholder: 'Masukkan kod keluarga 6-digit',
      messageLabel: 'Mesej Permintaan (Pilihan)',
      messagePlaceholder: 'Hi! Saya ingin menyertai kumpulan keluarga anda untuk membantu memantau kesihatan bersama.',
      sendRequest: 'Hantar Permintaan Sertai',
      cancel: 'Batal',
      validation: {
        invalidCode: 'Sila masukkan kod keluarga 6-digit yang sah',
        familyNotFound: 'Kumpulan keluarga tidak dijumpai. Sila semak kod dan cuba lagi.',
        alreadyMember: 'Anda sudah menjadi ahli kumpulan keluarga ini.',
        requestExists: 'Anda sudah mempunyai permintaan yang belum selesai untuk keluarga ini.',
        requestRejected: 'Permintaan terdahulu anda telah ditolak. Anda boleh hantar permintaan baru.',
        validating: 'Mengesahkan kod keluarga...',
        validFamily: 'Kumpulan keluarga yang sah dijumpai'
      },
      status: {
        pending: 'Permintaan Dalam Proses',
        pendingDesc: 'Permintaan sertai anda sedang menunggu kelulusan daripada admin keluarga.',
        approved: 'Permintaan Diluluskan',
        approvedDesc: 'Permintaan anda telah diluluskan! Anda kini boleh mengakses kumpulan keluarga.',
        rejected: 'Permintaan Ditolak',
        rejectedDesc: 'Permintaan terdahulu anda tidak diluluskan. Anda boleh hantar permintaan baru.'
      },
      success: {
        title: 'Permintaan Dihantar!',
        message: 'Permintaan sertai anda telah dihantar kepada pentadbir keluarga. Anda akan dimaklumkan apabila mereka mengkaji permintaan anda.',
        button: 'OK'
      },
      error: {
        title: 'Permintaan Gagal',
        message: 'Gagal menghantar permintaan sertai. Sila semak sambungan anda dan cuba lagi.',
        button: 'Cuba Lagi'
      }
    },
  };

  const t = texts[language];

  // Loading animation effect
  useEffect(() => {
    if (requestLoading || validationLoading) {
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
  }, [requestLoading, validationLoading, dot1, dot2, dot3]);

  // Validate family code as user types
  useEffect(() => {
    if (familyCode.length === 6) {
      const validateCode = async () => {
        const result = await validateFamilyCode(familyCode);
        setValidationResult(result);
      };

      // Debounce validation to avoid too many API calls
      const timeoutId = setTimeout(validateCode, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
    }
  }, [familyCode]); // Remove validateFamilyCode from dependencies

  const handleSendRequest = async () => {
    if (familyCode.length !== 6) {
      showAlert({
        type: 'error',
        title: t.error.title,
        message: t.validation.invalidCode,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }

    if (!validationResult?.isValid) {
      showAlert({
        type: 'error',
        title: t.error.title,
        message: validationResult?.error || t.validation.familyNotFound,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }

    try {
      const result = await createJoinRequest(familyCode, requestMessage.trim() || undefined);

      if (result && result.success) {
        showAlert({
          type: 'success',
          title: t.success.title,
          message: t.success.message,
          buttons: [{
            text: t.success.button,
            style: 'primary',
            onPress: () => {
              hideAlert();
              onRequestCreated?.();
            }
          }],
        });
      } else {
        showAlert({
          type: 'error',
          title: t.error.title,
          message: result?.error || requestError || 'Failed to create join request',
          buttons: [{ text: t.error.button, style: 'default', onPress: hideAlert }],
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: t.error.title,
        message: requestError || t.error.message,
        buttons: [{ text: t.error.button, style: 'default', onPress: hideAlert }],
      });
    }
  };

  const handleBack = () => {
    onBack?.();
    navigation?.goBack();
  };

  const canSendRequest = familyCode.length === 6 &&
                        validationResult?.isValid &&
                        !requestLoading &&
                        !validationLoading &&
                        existingRequestStatus !== 'pending';

  const getRequestStatusDisplay = () => {
    if (!existingRequestStatus || existingRequestStatus === 'none') return null;

    const statusConfig = {
      pending: {
        icon: 'time-outline',
        color: colors.warning,
        title: t.status.pending,
        description: t.status.pendingDesc
      },
      approved: {
        icon: 'checkmark-circle',
        color: colors.success,
        title: t.status.approved,
        description: t.status.approvedDesc
      },
      rejected: {
        icon: 'close-circle',
        color: colors.error,
        title: t.status.rejected,
        description: t.status.rejectedDesc
      }
    };

    const config = statusConfig[existingRequestStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <View style={[styles.statusCard, { borderColor: config.color }]}>
        <View style={styles.statusHeader}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
          <Text style={[styles.statusTitle, { color: config.color }]}>
            {config.title}
          </Text>
        </View>
        <Text style={styles.statusDescription}>{config.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaWrapper gradientVariant="onboarding">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <InteractiveFeedback onPress={handleBack}>
            <View style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </View>
          </InteractiveFeedback>

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Family Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.familyCodeLabel}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.codeInput,
                  validationResult?.isValid && styles.codeInputValid,
                  validationResult?.error && styles.codeInputError
                ]}
                value={familyCode}
                onChangeText={setFamilyCode}
                placeholder={t.familyCodePlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                selectionColor={colors.primary}
                editable={!requestLoading}
              />

              {/* Validation Indicator */}
              <View style={styles.validationContainer}>
                {validationLoading && (
                  <View style={styles.validationLoading}>
                    <Animated.View style={[styles.validationDot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.validationDot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.validationDot, { opacity: dot3 }]} />
                  </View>
                )}

                {validationResult?.isValid && (
                  <View style={styles.validationSuccess}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.validationText}>
                      {validationResult.familyName}
                    </Text>
                  </View>
                )}

                {validationResult?.error && (
                  <View style={styles.validationError}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                    <Text style={styles.validationErrorText}>
                      {validationResult.error}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Request Status Display */}
          {getRequestStatusDisplay()}

          {/* Request Message Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.messageLabel}</Text>
            <TextInput
              style={styles.messageInput}
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder={t.messagePlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={colors.primary}
              editable={!requestLoading}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <InteractiveFeedback
            onPress={handleSendRequest}
            disabled={!canSendRequest}
            style={[
              styles.sendButton,
              !canSendRequest && styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={
                !canSendRequest
                  ? [colors.gray400, colors.gray300]
                  : [colors.primary, colors.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {requestLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
                  <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
                  <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
                </View>
              ) : (
                <Text style={styles.sendButtonText}>{t.sendRequest}</Text>
              )}
            </LinearGradient>
          </InteractiveFeedback>

          <InteractiveFeedback onPress={handleBack}>
            <View style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </View>
          </InteractiveFeedback>
        </View>
      </ScrollView>

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
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  inputContainer: {
    gap: 12,
  },
  codeInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.gray200,
    letterSpacing: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeInputValid: {
    borderColor: colors.success,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  validationContainer: {
    minHeight: 24,
  },
  validationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  validationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  validationText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  validationErrorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  messageInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.gray200,
    minHeight: 100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContainer: {
    paddingTop: 24,
    gap: 12,
  },
  sendButton: {
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
  sendButtonText: {
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
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});