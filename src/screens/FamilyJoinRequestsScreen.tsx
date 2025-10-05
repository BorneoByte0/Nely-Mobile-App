import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { hapticFeedback } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import {
  usePendingJoinRequests,
  useReviewFamilyJoinRequest,
  FamilyJoinRequest
} from '../hooks/useDatabase';
import { colors } from '../constants/colors';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';
import { CooldownManager } from '../utils/debounce';

interface FamilyJoinRequestsScreenProps {
  navigation?: any;
}

export const FamilyJoinRequestsScreen: React.FC<FamilyJoinRequestsScreenProps> = ({
  navigation,
}) => {
  const { language } = useLanguage();
  const { userProfile } = useAuth();
  const { isAdmin } = usePermissions();
  const { showAlert, alertConfig, visible, hideAlert } = useModernAlert();

  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = usePendingJoinRequests(userProfile?.family_id || '');

  const {
    reviewRequest,
    loading: reviewLoading,
    error: reviewError
  } = useReviewFamilyJoinRequest();

  const [refreshing, setRefreshing] = useState(false);
  const cooldownManager = useRef(new CooldownManager(2000)).current;


  const texts = {
    en: {
      title: 'Join Requests',
      subtitle: 'Review pending family join requests',
      noRequests: 'No Pending Requests',
      noRequestsDesc: 'There are currently no pending join requests for your family.',
      requestFrom: 'Request from',
      requestMessage: 'Message',
      noMessage: 'No message provided',
      timeAgo: {
        now: 'Just now',
        minutesAgo: (m: number) => `${m} minute${m > 1 ? 's' : ''} ago`,
        hoursAgo: (h: number) => `${h} hour${h > 1 ? 's' : ''} ago`,
        daysAgo: (d: number) => `${d} day${d > 1 ? 's' : ''} ago`,
      },
      actions: {
        approve: 'Approve',
        reject: 'Reject',
        viewProfile: 'View Profile'
      },
      confirmApprove: {
        title: 'Approve Join Request',
        message: (name: string) => `Are you sure you want to approve ${name}'s request to join your family? They will be granted Family Viewer access initially.`,
        confirm: 'Approve',
        cancel: 'Cancel'
      },
      confirmReject: {
        title: 'Reject Join Request',
        message: (name: string) => `Are you sure you want to reject ${name}'s request to join your family? You can provide an optional reason.`,
        confirm: 'Reject',
        cancel: 'Cancel',
        reasonPlaceholder: 'Optional reason for rejection...'
      },
      success: {
        approved: (name: string) => `${name} has been approved and added to your family.`,
        rejected: (name: string) => `${name}'s request has been rejected.`
      },
      errors: {
        loadError: 'Failed to load join requests',
        reviewError: 'Failed to process request',
        notAdmin: 'You do not have permission to review join requests',
        retry: 'Try Again'
      }
    },
    ms: {
      title: 'Permintaan Sertai',
      subtitle: 'Kaji permintaan sertai keluarga yang belum selesai',
      noRequests: 'Tiada Permintaan Tertunda',
      noRequestsDesc: 'Pada masa ini tiada permintaan sertai yang belum selesai untuk keluarga anda.',
      requestFrom: 'Permintaan dari',
      requestMessage: 'Mesej',
      noMessage: 'Tiada mesej diberikan',
      timeAgo: {
        now: 'Baru sahaja',
        minutesAgo: (m: number) => `${m} minit yang lalu`,
        hoursAgo: (h: number) => `${h} jam yang lalu`,
        daysAgo: (d: number) => `${d} hari yang lalu`,
      },
      actions: {
        approve: 'Luluskan',
        reject: 'Tolak',
        viewProfile: 'Lihat Profil'
      },
      confirmApprove: {
        title: 'Luluskan Permintaan Sertai',
        message: (name: string) => `Adakah anda pasti mahu meluluskan permintaan ${name} untuk menyertai keluarga anda? Mereka akan diberikan akses Penonton Keluarga pada mulanya.`,
        confirm: 'Luluskan',
        cancel: 'Batal'
      },
      confirmReject: {
        title: 'Tolak Permintaan Sertai',
        message: (name: string) => `Adakah anda pasti mahu menolak permintaan ${name} untuk menyertai keluarga anda? Anda boleh memberikan sebab pilihan.`,
        confirm: 'Tolak',
        cancel: 'Batal',
        reasonPlaceholder: 'Sebab pilihan untuk penolakan...'
      },
      success: {
        approved: (name: string) => `${name} telah diluluskan dan ditambah ke keluarga anda.`,
        rejected: (name: string) => `Permintaan ${name} telah ditolak.`
      },
      errors: {
        loadError: 'Gagal memuatkan permintaan sertai',
        reviewError: 'Gagal memproses permintaan',
        notAdmin: 'Anda tidak mempunyai kebenaran untuk mengkaji permintaan sertai',
        retry: 'Cuba Lagi'
      }
    },
  };

  const t = texts[language];

  const onRefresh = useCallback(async () => {
    if (!cooldownManager.canCall()) {
      return;
    }

    setRefreshing(true);
    try {
      await refetchRequests();
    } finally {
      setRefreshing(false);
    }
  }, [refetchRequests, cooldownManager]);

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const requestTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - requestTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t.timeAgo.now;
    if (diffInMinutes < 60) return t.timeAgo.minutesAgo(diffInMinutes);

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t.timeAgo.hoursAgo(diffInHours);

    const diffInDays = Math.floor(diffInHours / 24);
    return t.timeAgo.daysAgo(diffInDays);
  };

  const handleApproveRequest = (request: FamilyJoinRequest) => {
    showAlert({
      type: 'info',
      title: t.confirmApprove.title,
      message: t.confirmApprove.message(request.requesterName),
      buttons: [
        {
          text: t.confirmApprove.cancel,
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: t.confirmApprove.confirm,
          style: 'primary',
          onPress: async () => {
            hideAlert();
            await processRequest(request.id, 'approve', request.requesterName);
          }
        }
      ]
    });
  };

  const handleRejectRequest = (request: FamilyJoinRequest) => {
    showAlert({
      type: 'warning',
      title: t.confirmReject.title,
      message: t.confirmReject.message(request.requesterName),
      buttons: [
        {
          text: t.confirmReject.cancel,
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: t.confirmReject.confirm,
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            await processRequest(request.id, 'reject', request.requesterName);
          }
        }
      ]
    });
  };

  const processRequest = async (requestId: string, action: 'approve' | 'reject', requesterName: string) => {
    try {
      const success = await reviewRequest(requestId, action);

      if (success) {
        // Refresh the requests list
        await refetchRequests();

        // Show success message
        const successMessage = action === 'approve'
          ? t.success.approved(requesterName)
          : t.success.rejected(requesterName);

        showAlert({
          type: 'success',
          title: 'Success',
          message: successMessage,
          buttons: [{ text: 'OK', style: 'primary', onPress: hideAlert }]
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: reviewError || t.errors.reviewError,
        buttons: [{ text: t.errors.retry, style: 'default', onPress: hideAlert }]
      });
    }
  };

  // Check admin permissions
  if (!isAdmin) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type="auth"
          message={t.errors.notAdmin}
          onRetry={() => navigation?.goBack()}
        />
      </SafeAreaWrapper>
    );
  }

  // Loading state
  if (requestsLoading && !refreshing) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading join requests...' : 'Memuatkan permintaan sertai...'}
        />
      </SafeAreaWrapper>
    );
  }

  // Error state
  if (requestsError) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={requestsError}
          onRetry={refetchRequests}
        />
      </SafeAreaWrapper>
    );
  }

  const renderRequestCard = (request: FamilyJoinRequest) => (
    <View key={request.id} style={styles.requestCard}>
      {/* Request Header */}
      <View style={styles.requestHeader}>
        <View style={styles.requesterInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {request.requesterName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.requesterDetails}>
            <Text style={styles.requesterName}>{request.requesterName}</Text>
            <Text style={styles.requesterEmail}>{request.requesterEmail}</Text>
            <Text style={styles.requestTime}>{formatTimeAgo(request.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Request Message */}
      {request.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>{t.requestMessage}:</Text>
          <Text style={styles.messageText}>{request.message}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <InteractiveFeedback
          onPress={() => handleApproveRequest(request)}
          disabled={reviewLoading}
          style={styles.approveButton}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.approveButtonText}>{t.actions.approve}</Text>
          </View>
        </InteractiveFeedback>

        <InteractiveFeedback
          onPress={() => handleRejectRequest(request)}
          disabled={reviewLoading}
          style={styles.rejectButton}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="close-circle" size={20} color={colors.white} />
            <Text style={styles.rejectButtonText}>{t.actions.reject}</Text>
          </View>
        </InteractiveFeedback>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <InteractiveFeedback
              onPress={() => navigation?.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>
          {/* Summary Statistics */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.singleStatCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="mail-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{requests.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'en' ? 'Pending Requests' : 'Permintaan Tertunda'}
              </Text>
            </View>
          </View>

          {requests.length === 0 ? (
            // Empty State
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t.noRequests}</Text>
              <Text style={styles.emptySubtitle}>{t.noRequestsDesc}</Text>
            </View>
          ) : (
            // Requests List
            <View style={styles.requestsContainer}>
              {requests.map(renderRequestCard)}
            </View>
          )}
          <View style={styles.bottomPadding} />
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
  header: {
    borderRadius: 16,
    margin: 20,
    marginBottom: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  singleStatCard: {
    paddingVertical: 16,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  requestsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  requesterEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  messageContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
