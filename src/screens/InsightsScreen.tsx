import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useElderlyProfiles, useVitalSigns, useMedications, useAppointments, useNotes, useMedicationTaken } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
}

export function InsightsScreen({ navigation }: Props = {}) {
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError, refetch: refetchElderlyProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { vitalSigns, loading: vitalsLoading, error: vitalsError, refetch: refetchVitalSigns } = useVitalSigns(currentElderly?.id || '');
  const { medications: allMedications, loading: medicationsLoading } = useMedications(currentElderly?.id || '');
  const { appointments, loading: appointmentsLoading } = useAppointments(currentElderly?.id || '');
  const { careNotes, loading: notesLoading } = useNotes(currentElderly?.id || '');
  const { medicationTaken, loading: medicationTakenLoading } = useMedicationTaken(currentElderly?.id || '');

  // Filter to only show active medications for insights
  const medications = allMedications.filter(med => med.isActive);

  const isLoading = profilesLoading || vitalsLoading || medicationsLoading || appointmentsLoading || notesLoading || medicationTakenLoading;

  // Use database data
  const latestVitalSigns = vitalSigns;
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');

  const onRefresh = async () => {
    console.log('🔄 Starting insights screen refresh...');
    setRefreshing(true);
    try {
      // Refetch the main data sources we have refetch functions for
      await Promise.all([
        refetchElderlyProfiles(),
        refetchVitalSigns(),
      ]);

      console.log('✅ Insights screen refresh completed successfully');
      setRefreshing(false);
    } catch (error) {
      console.log('❌ Insights screen refresh error:', error);
      setRefreshing(false);
    }
  };

  const calculateMedicationStats = () => {
    if (medicationTaken.length === 0 || medications.length === 0) {
      return { taken: '0/0', percentage: 0 };
    }

    const now = new Date();
    let daysToCheck = 7; // Default to week
    if (selectedPeriod === 'month') daysToCheck = 30;
    if (selectedPeriod === 'year') daysToCheck = 365;

    const cutoffDate = new Date(now.getTime() - (daysToCheck * 24 * 60 * 60 * 1000));
    const recentTaken = medicationTaken.filter(mt => new Date(mt.takenAt || mt.taken_at || '') >= cutoffDate);

    // Calculate expected doses based on medication schedule
    const expectedDoses = medications.reduce((total, med) => {
      const timesPerDay = 1; // Default since not in Medication schema
      return total + (timesPerDay * daysToCheck);
    }, 0);

    const takenCount = recentTaken.length;
    const percentage = expectedDoses > 0 ? Math.round((takenCount / expectedDoses) * 100) : 0;

    return {
      taken: `${takenCount}/${expectedDoses}`,
      percentage
    };
  };

  const medicationStats = calculateMedicationStats();

  // Calculate real data for different time periods
  const calculateDataForPeriod = (period: string) => {
    let daysToCheck = 7; // Default to week
    if (period === 'month') daysToCheck = 30;
    if (period === 'year') daysToCheck = 365;

    return {
      daysTracked: daysToCheck,
      medicationsTaken: medicationStats.taken,
      medicationPercentage: medicationStats.percentage,
      appointmentsCompleted: completedAppointments.length,
      nextAppointment: upcomingAppointments.length > 0 ? `${upcomingAppointments[0].date} - ${upcomingAppointments[0].doctorName}` : 'No upcoming appointments',
      familyNotes: careNotes.length,
      familyUpdates: 0, // Will be calculated when activity logging is implemented
      lastActivity: 'No recent activity',
      avgBloodPressure: latestVitalSigns?.bloodPressure ? `${latestVitalSigns.bloodPressure.systolic}/${latestVitalSigns.bloodPressure.diastolic}` : 'No data',
      bpChange: '0',
      bpTrend: 'stable',
      avgPulse: latestVitalSigns?.pulse ? latestVitalSigns.pulse.value.toString() : 'No data',
      pulseChange: '0',
      pulseTrend: 'stable',
      spO2: latestVitalSigns?.spO2 ? `${latestVitalSigns.spO2.value}%` : 'No data',
      spO2Change: '0',
      spO2Trend: 'stable'
    };
  };

  const currentData = calculateDataForPeriod(selectedPeriod);

  // Helper functions
  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return colors.success;
      case 'concerning': return colors.warning;
      case 'critical': return colors.error;
      default: return colors.info;
    }
  };

  const getStatusText = (status: string, language: string) => {
    const statusTexts = {
      en: { normal: 'Normal', concerning: 'Concerning', critical: 'Critical' },
      ms: { normal: 'Normal', concerning: 'Membimbangkan', critical: 'Kritikal' }
    };
    return statusTexts[language as 'en' | 'ms'][status as keyof typeof statusTexts.en] || status;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'arrow-up';
      case 'down': return 'arrow-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return colors.warning;
      case 'down': return colors.success;
      default: return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading health insights...' : 'Memuatkan analisis kesihatan...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError || vitalsError) {
    return (
      <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError || vitalsError || 'An error occurred'}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Modern Gradient Header - Compact Version */}
        <LinearGradient
          colors={[colors.info, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {language === 'en' ? 'Health Insights' : 'Analisis Kesihatan'}
            </Text>
          </View>
        </LinearGradient>
        {/* Modern Period Selector */}
        <View style={styles.periodSelectorContainer}>
          <View style={styles.periodSelector}>
            {['week', 'month', 'year'].map((period) => (
              <InteractiveFeedback
                key={period}
                onPress={() => setSelectedPeriod(period)}
                feedbackType="scale"
                hapticType="light"
              >
                <LinearGradient
                  colors={selectedPeriod === period 
                    ? [colors.primary, colors.secondary] 
                    : ['transparent', 'transparent']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.selectedPeriodButton
                  ]}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.selectedPeriodButtonText
                  ]}>
                    {getPeriodText(period, language)}
                  </Text>
                </LinearGradient>
              </InteractiveFeedback>
            ))}
          </View>
        </View>

        {/* Health Score Card */}
        <View style={[styles.card, styles.healthScoreCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="pulse" size={20} color={colors.success} />
              <Text style={styles.cardTitle}>
                {language === 'en' ? 'Health Score' : 'Skor Kesihatan'}
              </Text>
            </View>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>87</Text>
              <Text style={styles.scoreOutOf}>/100</Text>
            </View>
          </View>
          
          <View style={styles.healthMetrics}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: getVitalStatusColor(latestVitalSigns?.bloodPressure?.status || 'normal') }]}>
                <Ionicons name="heart" size={16} color={colors.white} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}</Text>
                <Text style={styles.metricValue}>
                  {latestVitalSigns?.bloodPressure?.systolic || '120'}/
                  {latestVitalSigns?.bloodPressure?.diastolic || '80'}
                </Text>
              </View>
              <Text style={[styles.metricStatus, { color: getVitalStatusColor(latestVitalSigns?.bloodPressure?.status || 'normal') }]}>
                {getStatusText(latestVitalSigns?.bloodPressure?.status || 'normal', language)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: getVitalStatusColor(latestVitalSigns?.spO2?.status || 'normal') }]}>
                <Ionicons name="water" size={16} color={colors.white} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>SpO2</Text>
                <Text style={styles.metricValue}>{latestVitalSigns?.spO2?.value || '98'}%</Text>
              </View>
              <Text style={[styles.metricStatus, { color: getVitalStatusColor(latestVitalSigns?.spO2?.status || 'normal') }]}>
                {getStatusText(latestVitalSigns?.spO2?.status || 'normal', language)}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: getVitalStatusColor(latestVitalSigns?.pulse?.status || 'normal') }]}>
                <Ionicons name="pulse-outline" size={16} color={colors.white} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{language === 'en' ? 'Pulse' : 'Nadi'}</Text>
                <Text style={styles.metricValue}>{latestVitalSigns?.pulse?.value || '72'} bpm</Text>
              </View>
              <Text style={[styles.metricStatus, { color: getVitalStatusColor(latestVitalSigns?.pulse?.status || 'normal') }]}>
                {getStatusText(latestVitalSigns?.pulse?.status || 'normal', language)}
              </Text>
            </View>
          </View>
        </View>

        {/* Medication & Appointments Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { marginRight: 8 }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="medical" size={20} color={colors.success} />
              <Text style={styles.summaryTitle}>
                {language === 'en' ? 'Medications' : 'Ubat-ubatan'}
              </Text>
            </View>
            <Text style={styles.summaryValue}>{medicationStats.taken}</Text>
            <Text style={styles.summaryLabel}>
              {language === 'en' 
                ? `taken this ${selectedPeriod}`
                : `diambil ${selectedPeriod === 'week' ? 'minggu ini' : selectedPeriod === 'month' ? 'bulan ini' : 'tahun ini'}`
              }
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${medicationStats.percentage}%`, backgroundColor: colors.success }]} />
            </View>
          </View>
          
          <View style={[styles.summaryCard, { marginLeft: 8 }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="calendar" size={20} color={colors.info} />
              <Text style={styles.summaryTitle}>
                {language === 'en' ? 'Appointments' : 'Temujanji'}
              </Text>
            </View>
            <Text style={styles.summaryValue}>{completedAppointments.length}</Text>
            <Text style={styles.summaryLabel}>
              {language === 'en' 
                ? `completed this ${selectedPeriod}`
                : `selesai ${selectedPeriod === 'week' ? 'minggu ini' : selectedPeriod === 'month' ? 'bulan ini' : 'tahun ini'}`
              }
            </Text>
            <View style={styles.appointmentList}>
              <Text style={styles.nextAppointment}>
                {upcomingAppointments.length > 0
                  ? (language === 'en'
                      ? `Next: ${upcomingAppointments[0].doctorName}`
                      : `Seterusnya: ${upcomingAppointments[0].doctorName}`
                    )
                  : (language === 'en' ? 'No upcoming appointments' : 'Tiada temujanji akan datang')
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Care Activity & Alerts */}
        <View style={styles.activityRow}>
          <View style={[styles.activityCard, { marginRight: 8 }]}>
            <View style={styles.activityHeader}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.activityTitle}>
                {language === 'en' ? 'Family Care' : 'Jagaan Keluarga'}
              </Text>
            </View>
            <View style={styles.careStats}>
              <View style={styles.careStat}>
                <Text style={styles.careNumber}>{careNotes.length}</Text>
                <Text style={styles.careLabel}>{language === 'en' ? 'Notes' : 'Nota'}</Text>
              </View>
              <View style={styles.careStat}>
                <Text style={styles.careNumber}>{vitalSigns ? 1 : 0}</Text>
                <Text style={styles.careLabel}>{language === 'en' ? 'Updates' : 'Kemaskini'}</Text>
              </View>
            </View>
            <Text style={styles.lastActivity}>
              {language === 'en' ? `Last: ${currentData.lastActivity}` : `Terakhir: ${currentData.lastActivity}`}
            </Text>
          </View>
          
          <View style={[styles.activityCard, { marginLeft: 8 }]}>
            <View style={styles.activityHeader}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.activityTitle}>
                {language === 'en' ? 'Health Alerts' : 'Amaran Kesihatan'}
              </Text>
            </View>
            <View style={styles.alertsList}>
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.alertText}>
                  {language === 'en' ? 'BP slightly elevated' : 'TD sedikit tinggi'}
                </Text>
              </View>
              <View style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: colors.info }]} />
                <Text style={styles.alertText}>
                  {language === 'en' ? 'Medication reminder' : 'Peringatan ubat'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Trends Chart */}
        <View style={[styles.card, styles.trendsCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="trending-up" size={20} color={colors.info} />
              <Text style={styles.cardTitle}>
                {language === 'en' 
                  ? `${selectedPeriod === 'week' ? 'Weekly' : selectedPeriod === 'month' ? 'Monthly' : 'Yearly'} Trends`
                  : `Trend ${selectedPeriod === 'week' ? 'Mingguan' : selectedPeriod === 'month' ? 'Bulanan' : 'Tahunan'}`
                }
              </Text>
            </View>
            <InteractiveFeedback 
              onPress={() => navigation.navigate('ViewAllTrends', { selectedPeriod })} 
              feedbackType="scale" 
              hapticType="light"
            >
              <Text style={styles.detailsButton}>
                {language === 'en' ? 'View All' : 'Lihat Semua'}
              </Text>
            </InteractiveFeedback>
          </View>
          
          <View style={styles.trendMetrics}>
            <View style={styles.trendItem}>
              <View style={styles.trendIconContainer}>
                <Ionicons name="heart" size={16} color={colors.error} />
              </View>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>{language === 'en' ? 'Avg. Blood Pressure' : 'Purata TD'}</Text>
                <Text style={styles.trendValue}>{currentData.avgBloodPressure} mmHg</Text>
              </View>
              <View style={[styles.trendChange, { backgroundColor: `${getTrendColor(currentData.bpTrend)}33` }]}>
                <Ionicons name={getTrendIcon(currentData.bpTrend)} size={12} color={getTrendColor(currentData.bpTrend)} />
                <Text style={[styles.changeText, { color: getTrendColor(currentData.bpTrend) }]}>{currentData.bpChange}</Text>
              </View>
            </View>
            
            <View style={styles.trendItem}>
              <View style={styles.trendIconContainer}>
                <Ionicons name="pulse" size={16} color={colors.info} />
              </View>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>{language === 'en' ? 'Avg. Pulse' : 'Purata Nadi'}</Text>
                <Text style={styles.trendValue}>{currentData.avgPulse} bpm</Text>
              </View>
              <View style={[styles.trendChange, { backgroundColor: `${getTrendColor(currentData.pulseTrend)}33` }]}>
                <Ionicons name={getTrendIcon(currentData.pulseTrend)} size={12} color={getTrendColor(currentData.pulseTrend)} />
                <Text style={[styles.changeText, { color: getTrendColor(currentData.pulseTrend) }]}>{currentData.pulseChange}</Text>
              </View>
            </View>
            
            <View style={styles.trendItem}>
              <View style={styles.trendIconContainer}>
                <Ionicons name="water" size={16} color={colors.success} />
              </View>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>SpO2</Text>
                <Text style={styles.trendValue}>{currentData.spO2}</Text>
              </View>
              <View style={[styles.trendChange, { backgroundColor: `${getTrendColor(currentData.spO2Trend)}33` }]}>
                <Ionicons name={getTrendIcon(currentData.spO2Trend)} size={12} color={getTrendColor(currentData.spO2Trend)} />
                <Text style={[styles.changeText, { color: getTrendColor(currentData.spO2Trend) }]}>{currentData.spO2Change}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Recommendations */}
        <View style={[styles.card, styles.recommendationsCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.cardTitle}>
                {language === 'en' ? 'Health Recommendations' : 'Saranan Kesihatan'}
              </Text>
            </View>
          </View>
          
          <View style={styles.recommendationsList}>
            <View style={styles.recommendationItem}>
              <View style={[styles.recommendationIcon, { backgroundColor: colors.successAlpha }]}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {language === 'en' ? 'Monitor blood pressure daily' : 'Pantau tekanan darah setiap hari'}
                </Text>
                <Text style={styles.recommendationSubtitle}>
                  {language === 'en' ? 'Best time: Morning after wake up' : 'Masa terbaik: Pagi selepas bangun'}
                </Text>
              </View>
            </View>
            
            <View style={styles.recommendationItem}>
              <View style={[styles.recommendationIcon, { backgroundColor: colors.infoAlpha }]}>
                <Ionicons name="time" size={16} color={colors.info} />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {language === 'en' ? 'Take medications on time' : 'Ambil ubat tepat pada masa'}
                </Text>
                <Text style={styles.recommendationSubtitle}>
                  {language === 'en' ? 'Set daily reminders' : 'Tetapkan peringatan harian'}
                </Text>
              </View>
            </View>
            
            <View style={styles.recommendationItem}>
              <View style={[styles.recommendationIcon, { backgroundColor: colors.warningAlpha }]}>
                <Ionicons name="walk" size={16} color={colors.warning} />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {language === 'en' ? 'Light daily exercise' : 'Senaman ringan harian'}
                </Text>
                <Text style={styles.recommendationSubtitle}>
                  {language === 'en' ? '15-30 minutes walking' : '15-30 minit berjalan kaki'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

// Helper function
function getPeriodText(period: string, language: string) {
  const periods = {
    en: { week: 'Week', month: 'Month', year: 'Year' },
    ms: { week: 'Minggu', month: 'Bulan', year: 'Tahun' }
  };
  return periods[language as 'en' | 'ms'][period as keyof typeof periods.en];
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.5,
  },
  periodSelectorContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 6,
    gap: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 12,
    minWidth: 80,
  },
  selectedPeriodButton: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  periodButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  selectedPeriodButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  detailsButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  
  // Health Score Card
  healthScoreCard: {},
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
  },
  scoreOutOf: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  healthMetrics: {
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Summary Cards Row
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 6,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  appointmentList: {
    marginTop: 4,
  },
  nextAppointment: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Activity Cards Row
  activityRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 6,
  },
  activityCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  careStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  careStat: {
    alignItems: 'center',
  },
  careNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  careLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  lastActivity: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  alertText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Trends Card
  trendsCard: {},
  trendMetrics: {
    gap: 16,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Recommendations Card
  recommendationsCard: {},
  recommendationsList: {
    gap: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recommendationSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  bottomPadding: {
    height: 20,
  },
});