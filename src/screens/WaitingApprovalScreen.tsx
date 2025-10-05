import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCurrentUserJoinRequestStatus } from '../hooks/useDatabase';
import { colors } from '../constants/colors';
import { CooldownManager } from '../utils/debounce';

interface WaitingApprovalScreenProps {
  onBackToAuth?: () => void;
  onApproved?: () => void;
}

export const WaitingApprovalScreen: React.FC<WaitingApprovalScreenProps> = ({
  onBackToAuth,
  onApproved,
}) => {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get the user's pending request status
  const { status: requestStatus, data: requestData, loading, refetch } = useCurrentUserJoinRequestStatus();

  // Animation for the waiting indicator
  const pulse = useRef(new Animated.Value(1)).current;

  // Cooldown manager for pull-to-refresh
  const cooldownManager = useRef(new CooldownManager(2000)).current;

  const texts = {
    en: {
      title: 'Waiting for Approval',
      subtitle: 'Your join request is being reviewed',
      statusPending: 'Request Pending',
      statusPendingDesc: 'Your request to join the family group is waiting for approval from a family administrator.',
      statusApproved: 'Request Approved!',
      statusApprovedDesc: 'Congratulations! Your request has been approved. You can now access the family group.',
      statusRejected: 'Request Not Approved',
      statusRejectedDesc: 'Your request was not approved this time. You can submit a new request if needed.',
      familyName: 'Family Group',
      requestedAt: 'Requested',
      reviewedAt: 'Reviewed',
      reviewMessage: 'Message from Admin',
      refresh: 'Pull to refresh status',
      signOut: 'Sign Out',
      tryAgain: 'Request to Join Another Family',
      continue: 'Continue to App',
      noRequest: 'No pending requests found',
    },
    ms: {
      title: 'Menunggu Kelulusan',
      subtitle: 'Permintaan sertai anda sedang dikaji',
      statusPending: 'Permintaan Dalam Proses',
      statusPendingDesc: 'Permintaan anda untuk menyertai kumpulan keluarga sedang menunggu kelulusan daripada pentadbir keluarga.',
      statusApproved: 'Permintaan Diluluskan!',
      statusApprovedDesc: 'Tahniah! Permintaan anda telah diluluskan. Anda kini boleh mengakses kumpulan keluarga.',
      statusRejected: 'Permintaan Tidak Diluluskan',
      statusRejectedDesc: 'Permintaan anda tidak diluluskan kali ini. Anda boleh hantar permintaan baru jika diperlukan.',
      familyName: 'Kumpulan Keluarga',
      requestedAt: 'Diminta',
      reviewedAt: 'Dikaji',
      reviewMessage: 'Mesej daripada Admin',
      refresh: 'Tarik untuk segarkan status',
      signOut: 'Log Keluar',
      tryAgain: 'Minta Sertai Keluarga Lain',
      continue: 'Teruskan ke Aplikasi',
      noRequest: 'Tiada permintaan yang belum selesai dijumpai',
    },
  };

  const t = texts[language];

  // Pulse animation
  useEffect(() => {
    if (requestStatus === 'pending') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [requestStatus, pulse]);

  // Check for status changes
  useEffect(() => {
    if (requestStatus === 'approved') {
      // User approved, should navigate to main app
      setTimeout(() => {
        onApproved?.();
      }, 2000); // Give time to read the success message
    }
  }, [requestStatus, onApproved]);

  const handleRefresh = async () => {
    if (!cooldownManager.canCall()) {
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onBackToAuth?.();
  };

  const handleTryAgain = () => {
    onBackToAuth?.();
  };

  const getStatusConfig = () => {
    switch (requestStatus) {
      case 'pending':
        return {
          icon: 'time-outline',
          color: colors.warning,
          title: t.statusPending,
          description: t.statusPendingDesc,
          showPulse: true,
        };
      case 'approved':
        return {
          icon: 'checkmark-circle',
          color: colors.success,
          title: t.statusApproved,
          description: t.statusApprovedDesc,
          showPulse: false,
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: colors.error,
          title: t.statusRejected,
          description: t.statusRejectedDesc,
          showPulse: false,
        };
      default:
        return {
          icon: 'help-circle',
          color: colors.gray400,
          title: t.noRequest,
          description: '',
          showPulse: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaWrapper gradientVariant="onboarding">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            title={t.refresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              statusConfig.showPulse && { transform: [{ scale: pulse }] }
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={48}
              color={statusConfig.color}
            />
          </Animated.View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: statusConfig.color }]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={statusConfig.icon as any}
              size={24}
              color={statusConfig.color}
            />
            <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
              {statusConfig.title}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {statusConfig.description}
          </Text>

          {/* Request Details */}
          {requestData && (
            <View style={styles.requestDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.familyName}:</Text>
                <Text style={styles.detailValue}>{requestData.familyName || 'Unknown'}</Text>
              </View>

              {requestData.requestedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.requestedAt}:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(requestData.requestedAt)}
                  </Text>
                </View>
              )}

              {requestData.reviewedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t.reviewedAt}:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(requestData.reviewedAt)}
                  </Text>
                </View>
              )}

              {requestData.reviewMessage && (
                <View style={styles.messageContainer}>
                  <Text style={styles.detailLabel}>{t.reviewMessage}:</Text>
                  <Text style={styles.reviewMessage}>{requestData.reviewMessage}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {requestStatus === 'approved' && (
            <InteractiveFeedback onPress={onApproved}>
              <LinearGradient
                colors={[colors.success, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>{t.continue}</Text>
              </LinearGradient>
            </InteractiveFeedback>
          )}

          {requestStatus === 'rejected' && (
            <InteractiveFeedback onPress={handleTryAgain}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>{t.tryAgain}</Text>
              </LinearGradient>
            </InteractiveFeedback>
          )}

          <InteractiveFeedback onPress={handleSignOut}>
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t.signOut}</Text>
            </View>
          </InteractiveFeedback>
        </View>
      </ScrollView>
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
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: colors.white,
    borderRadius: 50,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  requestDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  messageContainer: {
    marginTop: 8,
  },
  reviewMessage: {
    fontSize: 14,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: 4,
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 'auto',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});