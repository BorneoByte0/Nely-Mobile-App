import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAppointments } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

export function ViewUpcomingAppointmentsScreen({ navigation }: Props) {
  const { language } = useLanguage();

  // Simple flag to track initial load
  const isInitialMount = useRef(true);

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { appointments, loading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useAppointments(currentElderly?.id || '');

  // Filter to show upcoming appointments only (future dates)
  const upcomingAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
    return appointmentDate > new Date() && appointment.status === 'upcoming';
  }).sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  // Simplified auto-refresh: only refresh on focus, skip initial mount
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount, only refresh on subsequent focuses
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Simple refresh when returning to screen
      if (currentElderly?.id) {
        const timer = setTimeout(() => {
          refetchAppointments?.();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [currentElderly?.id])
  );

  const isLoading = profilesLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading upcoming appointments...' : 'Memuatkan temujanji akan datang...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (appointmentsError) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={appointmentsError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'en' ? 'Today' : 'Hari Ini';
    if (diffDays === 1) return language === 'en' ? 'Tomorrow' : 'Esok';
    if (diffDays <= 7) return language === 'en' ? `In ${diffDays} days` : `Dalam ${diffDays} hari`;
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'upcoming' ? colors.primary : colors.success;
  };

  const getStatusIcon = (status: string) => {
    return status === 'upcoming' ? 'time-outline' : 'checkmark-circle';
  };

  const getDaysUntilAppointment = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


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
              onPress={() => navigation.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Upcoming Appointments' : 'Temujanji Akan Datang'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'View and manage scheduled appointments' : 'Lihat dan urus temujanji yang dijadualkan'}
              </Text>
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
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Upcoming Appointments' : 'Temujanji Akan Datang'}
            </Text>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsContainer}>
          {upcomingAppointments.map((appointment, index) => {
            const daysUntil = getDaysUntilAppointment(appointment.date);
            const isUrgent = daysUntil <= 3;
            
            return (
              <InteractiveFeedback
                key={appointment.id}
                onPress={() => {
                  hapticFeedback.light();
                  navigation.navigate('ManageAppointments');
                }}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={[
                  styles.appointmentCard,
                  isUrgent && styles.urgentAppointmentCard
                ]}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentMainInfo}>
                      <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                      <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
                      <Text style={styles.clinicName}>{appointment.clinic}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                      <Ionicons name={getStatusIcon(appointment.status)} size={16} color={colors.white} />
                      <Text style={styles.statusText}>
                        {daysUntil === 0 
                          ? (language === 'en' ? 'Today' : 'Hari Ini')
                          : daysUntil === 1
                          ? (language === 'en' ? 'Tomorrow' : 'Esok')
                          : `${daysUntil} ${language === 'en' ? 'days' : 'hari'}`
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.detailText}>{appointment.time}</Text>
                    </View>
                    
                    {appointment.notes && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.detailText}>{appointment.notes}</Text>
                      </View>
                    )}
                  </View>
                  
                  {isUrgent && (
                    <View style={styles.urgentIndicator}>
                      <Ionicons name="warning" size={14} color={colors.warning} />
                      <Text style={styles.urgentText}>
                        {language === 'en' ? 'Coming soon' : 'Akan berlaku'}
                      </Text>
                    </View>
                  )}
                </View>
              </InteractiveFeedback>
            );
          })}
        </View>

        {upcomingAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No upcoming appointments' : 'Tiada temujanji akan datang'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'en' 
                ? 'Schedule new appointments from the manage appointments screen'
                : 'Jadualkan temujanji baharu dari skrin urus temujanji'
              }
            </Text>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

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
  appointmentsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  urgentAppointmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  urgentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.warningAlpha,
  },
  urgentText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
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
  bottomPadding: {
    height: 24,
  },
});