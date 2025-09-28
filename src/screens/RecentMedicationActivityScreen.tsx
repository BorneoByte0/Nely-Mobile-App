import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useMedicationTaken } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

interface MedicationActivity {
  id: string;
  medicationName: string;
  dosage: string;
  timeTaken: string;
  dateTaken: string;
  notes?: string;
  takenBy: string;
  status: 'taken' | 'missed' | 'late';
}

export function RecentMedicationActivityScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week'>('all');

  // Simple flag to track initial load
  const isInitialMount = useRef(true);

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { medicationTaken, loading: medicationTakenLoading, error: medicationTakenError, refetch: refetchMedicationTaken } = useMedicationTaken(currentElderly?.id || '');

  const isLoading = profilesLoading || medicationTakenLoading;

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
          refetchMedicationTaken?.();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [currentElderly?.id])
  );

  // Mock recent medication activity data
  const recentActivity: MedicationActivity[] = [
    {
      id: 'act-001',
      medicationName: 'Amlodipine',
      dosage: '5mg',
      timeTaken: '08:30',
      dateTaken: new Date().toISOString(),
      notes: 'Taken with breakfast as prescribed',
      takenBy: 'Ahmad Hassan',
      status: 'taken',
    },
    {
      id: 'act-002',
      medicationName: 'Metformin',
      dosage: '500mg',
      timeTaken: '20:15',
      dateTaken: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      takenBy: 'Siti Fatimah',
      status: 'taken',
    },
    {
      id: 'act-003',
      medicationName: 'Simvastatin',
      dosage: '20mg',
      timeTaken: '',
      dateTaken: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      takenBy: '',
      status: 'missed',
    },
    {
      id: 'act-004',
      medicationName: 'Amlodipine',
      dosage: '5mg',
      timeTaken: '09:45',
      dateTaken: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Taken 1 hour late due to appointment',
      takenBy: 'Ahmad Hassan',
      status: 'late',
    },
    {
      id: 'act-005',
      medicationName: 'Metformin',
      dosage: '500mg',
      timeTaken: '19:30',
      dateTaken: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      takenBy: 'Nurul Ain',
      status: 'taken',
    },
  ];

  const filterOptions = [
    { key: 'all', labelEn: 'All', labelMs: 'Semua' },
    { key: 'today', labelEn: 'Today', labelMs: 'Hari Ini' },
    { key: 'week', labelEn: 'This Week', labelMs: 'Minggu Ini' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return colors.success;
      case 'late': return colors.warning;
      case 'missed': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return 'checkmark-circle';
      case 'late': return 'time';
      case 'missed': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken': return language === 'en' ? 'Taken' : 'Diambil';
      case 'late': return language === 'en' ? 'Late' : 'Lewat';
      case 'missed': return language === 'en' ? 'Missed' : 'Terlepas';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'en' ? 'Today' : 'Hari Ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return language === 'en' ? 'Yesterday' : 'Semalam';
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Use database data if available, otherwise fall back to mock data
  const displayActivity = medicationTaken.length > 0 ? medicationTaken.map(item => ({
    id: item.id || '',
    medicationName: item.medications?.name || '',
    dosage: item.dosage_taken || item.medications?.dosage || '',
    timeTaken: item.taken_at ? new Date(item.taken_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    dateTaken: item.taken_at || '',
    notes: item.notes || '',
    takenBy: item.taken_by || '',
    status: 'taken' as const, // Database entries are assumed to be taken
  })) : recentActivity;

  const filteredActivity = displayActivity.filter(activity => {
    const activityDate = new Date(activity.dateTaken);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (selectedFilter === 'today') {
      return activityDate.toDateString() === today.toDateString();
    } else if (selectedFilter === 'week') {
      return activityDate >= weekAgo;
    }
    return true;
  });

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading medication activity...' : 'Memuatkan aktiviti ubat...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError || medicationTakenError) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError || medicationTakenError || 'An error occurred'}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}
      >
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.info, colors.primary]}
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
                {language === 'en' ? 'Recent Activity' : 'Aktiviti Terkini'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'View medication history and adherence' : 'Lihat sejarah ubat dan pematuhan'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            {filterOptions.map((option) => (
              <InteractiveFeedback
                key={option.key}
                onPress={() => {
                  setSelectedFilter(option.key as any);
                  hapticFeedback.selection();
                }}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive
                ]}>
                  <Text style={[
                    styles.filterTabText,
                    selectedFilter === option.key && styles.filterTabTextActive
                  ]}>
                    {language === 'en' ? option.labelEn : option.labelMs}
                  </Text>
                </View>
              </InteractiveFeedback>
            ))}
          </View>
        </View>

        {/* Activity List */}
        <View style={styles.activityContainer}>
          {filteredActivity.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityMainInfo}>
                  <Text style={styles.medicationName}>{activity.medicationName}</Text>
                  <Text style={styles.medicationDosage}>{activity.dosage}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
                  <Ionicons name={getStatusIcon(activity.status)} size={16} color={colors.white} />
                  <Text style={styles.statusText}>{getStatusText(activity.status)}</Text>
                </View>
              </View>
              
              <View style={styles.activityDetails}>
                <View style={styles.timeInfo}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.dateText}>{formatDate(activity.dateTaken)}</Text>
                  {activity.timeTaken && (
                    <>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.timeText}>{activity.timeTaken}</Text>
                    </>
                  )}
                </View>
                
                {activity.takenBy && (
                  <View style={styles.takenByInfo}>
                    <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.takenByText}>
                      {language === 'en' ? 'Recorded by:' : 'Direkod oleh:'} {activity.takenBy}
                    </Text>
                  </View>
                )}
                
                {activity.notes && (
                  <View style={styles.notesInfo}>
                    <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.notesText}>{activity.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {filteredActivity.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No activity found' : 'Tiada aktiviti dijumpai'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'en' 
                ? 'Try adjusting your filter or check back later'
                : 'Cuba laraskan penapis anda atau semak semula kemudian'
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
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  container: {
    paddingHorizontal: 20,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
  activityContainer: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: colors.textSecondary,
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
  activityDetails: {
    gap: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  takenByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takenByText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  notesInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
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
  },
  bottomPadding: {
    height: 24,
  },
});