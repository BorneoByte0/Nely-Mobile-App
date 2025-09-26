import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

// Extended mock completed appointments data
const completedAppointments = [
  {
    id: 'apt-004',
    doctorName: 'Dr. Ahmad Rahman',
    clinic: 'Kuala Lumpur General Hospital',
    appointmentType: 'Blood Test',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '8:00 AM',
    notes: 'Fasting required',
    status: 'completed',
    completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hasOutcome: true,
  },
  {
    id: 'apt-005',
    doctorName: 'Dr. Fatimah Zahra',
    clinic: 'Shah Alam Clinic',
    appointmentType: 'Vaccination',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    time: '11:00 AM',
    notes: 'Annual flu shot',
    status: 'completed',
    completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    hasOutcome: true,
  },
];

export function CompletedAppointmentsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'thisMonth' | 'lastMonth'>('all');

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useAppointments(currentElderly?.id || '');

  // Filter for completed appointments only
  const completedAppointmentsFromDB = appointments.filter(apt => apt.status === 'completed');

  const isLoading = profilesLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading completed appointments...' : 'Memuatkan temujanji selesai...'}
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

  const filterOptions = [
    { key: 'all', labelEn: 'All', labelMs: 'Semua' },
    { key: 'thisMonth', labelEn: 'This Month', labelMs: 'Bulan Ini' },
    { key: 'lastMonth', labelEn: 'Last Month', labelMs: 'Bulan Lalu' },
  ];

  const getFilteredAppointments = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Use database data if available, otherwise fall back to demo data
    const appointmentsToFilter = completedAppointmentsFromDB.length > 0 ? completedAppointmentsFromDB : completedAppointments;

    switch (selectedFilter) {
      case 'thisMonth':
        return appointmentsToFilter.filter(apt => {
          const completedDate = apt.date; // Use appointment date since completedDate doesn't exist in schema
          return new Date(completedDate) >= thisMonthStart;
        });
      case 'lastMonth':
        return appointmentsToFilter.filter(apt => {
          const completedDate = apt.date; // Use appointment date since completedDate doesn't exist in schema
          const date = new Date(completedDate);
          return date >= lastMonthStart && date <= lastMonthEnd;
        });
      default:
        return appointmentsToFilter;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'en' ? 'Today' : 'Hari Ini';
    if (diffDays === 1) return language === 'en' ? 'Yesterday' : 'Semalam';
    if (diffDays <= 7) return language === 'en' ? `${diffDays} days ago` : `${diffDays} hari lalu`;
    if (diffDays <= 30) return language === 'en' ? `${Math.floor(diffDays / 7)} weeks ago` : `${Math.floor(diffDays / 7)} minggu lalu`;
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAppointmentPress = (appointment: any) => {
    hapticFeedback.light();
    if (appointment.hasOutcome) {
      navigation.navigate('AppointmentCompleted', { appointmentId: appointment.id });
    } else {
      // Show basic appointment details for appointments without detailed outcomes
      navigation.navigate('ManageAppointments');
    }
  };

  const filteredAppointments = getFilteredAppointments();
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return bDate.getTime() - aDate.getTime();
  });

  return (
    <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.success, colors.primary]}
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
                {language === 'en' ? 'Completed Appointments' : 'Temujanji Selesai'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Review past appointments and medical records' : 'Semak temujanji lalu dan rekod perubatan'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive
                ]}
                onPress={() => {
                  hapticFeedback.light();
                  setSelectedFilter(option.key as any);
                }}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === option.key && styles.filterTabTextActive
                ]}>
                  {language === 'en' ? option.labelEn : option.labelMs}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Statistics */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.singleStatCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{sortedAppointments.length}</Text>
            <Text style={styles.statLabel}>
              {selectedFilter === 'all' 
                ? (language === 'en' ? 'Total Completed' : 'Jumlah Selesai')
                : selectedFilter === 'thisMonth'
                ? (language === 'en' ? 'This Month' : 'Bulan Ini')
                : (language === 'en' ? 'Last Month' : 'Bulan Lalu')
              }
            </Text>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsContainer}>
          {sortedAppointments.map((appointment) => (
            <InteractiveFeedback
              key={appointment.id}
              onPress={() => handleAppointmentPress(appointment)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentMainInfo}>
                    <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                    <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
                    <Text style={styles.clinicName}>{appointment.clinic}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                      <Text style={styles.statusText}>
                        {language === 'en' ? 'Completed' : 'Selesai'}
                      </Text>
                    </View>
                    {appointment.notes && ( // Use notes as indicator since hasOutcome doesn't exist in schema
                      <View style={styles.outcomeIndicator}>
                        <Ionicons name="document-text" size={12} color={colors.primary} />
                        <Text style={styles.outcomeText}>
                          {language === 'en' ? 'Summary' : 'Ringkasan'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>
                      {new Date(appointment.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {appointment.time}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
                    <Text style={styles.completedText}>
                      {language === 'en' ? 'Completed' : 'Selesai'} {formatDate(appointment.date)}
                    </Text>
                  </View>
                  
                  {appointment.notes && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.detailText}>{appointment.notes}</Text>
                    </View>
                  )}
                </View>
                
                {appointment.notes && ( // Use notes as indicator since hasOutcome doesn't exist in schema
                  <View style={styles.viewDetailsFooter}>
                    <Text style={styles.tapToViewText}>
                      {language === 'en' ? 'Tap to view appointment summary' : 'Ketik untuk lihat ringkasan temujanji'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                )}
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        {sortedAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No completed appointments' : 'Tiada temujanji selesai'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all'
                ? (language === 'en' 
                    ? 'Completed appointments will appear here'
                    : 'Temujanji selesai akan muncul di sini'
                  )
                : (language === 'en'
                    ? 'No appointments completed in this time period'
                    : 'Tiada temujanji selesai dalam tempoh ini'
                  )
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
  filterContainer: {
    marginBottom: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  statusContainer: {
    alignItems: 'flex-end',
    gap: 6,
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
  outcomeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryAlpha,
    borderRadius: 8,
  },
  outcomeText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.primary,
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
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
  completedText: {
    fontSize: 12,
    color: colors.success,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  viewDetailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.primaryAlpha,
  },
  tapToViewText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
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