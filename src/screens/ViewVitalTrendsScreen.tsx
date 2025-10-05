import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useVitalSignsHistory } from '../hooks/useDatabase';
import { CooldownManager } from '../utils/debounce';

const { width } = Dimensions.get('window');
const chartWidth = width - 80;

interface TrendData {
  date: string;
  systolic: number;
  diastolic: number;
  spO2: number;
  pulse: number;
  temperature: number;
  weight: number;
  bloodGlucose?: number;
  bloodPressureStatus?: string;
  spO2Status?: string;
  pulseStatus?: string;
  temperatureStatus?: string;
  bloodGlucoseStatus?: string;
  recordedBy?: string;
  notes?: string;
}

interface Props {
  navigation?: any;
  route?: {
    params?: {
      vitalType?: 'bloodPressure' | 'spO2' | 'pulse' | 'temperature' | 'weight' | 'bloodGlucose';
    };
  };
}

export function ViewVitalTrendsScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months'>('week');
  const [selectedVital, setSelectedVital] = useState<string>(route?.params?.vitalType || 'bloodPressure');


  // Get current elderly profile and vital signs history
  const { elderlyProfiles, loading: profilesLoading, refetch: refetchProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { vitalSignsHistory, loading: historyLoading, error: historyError, refetch: refetchHistory } = useVitalSignsHistory(currentElderly?.id || '', selectedPeriod);

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Cooldown manager for pull-to-refresh
  const cooldownManager = useRef(new CooldownManager(2000)).current;

  // Handle pull to refresh
  const handleRefresh = async () => {
    if (!cooldownManager.canCall()) {
      return;
    }
    setRefreshing(true);
    try {
      // Trigger haptic feedback
      hapticFeedback.light();

      // Refetch both profiles and vital signs history
      await Promise.all([
        refetchProfiles?.(),
        refetchHistory?.()
      ]);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  // Handle period change with refetch
  const handlePeriodChange = (period: 'week' | 'month' | '3months') => {
    setSelectedPeriod(period);
    hapticFeedback.selection();
    // History will automatically refetch due to useEffect dependency on selectedPeriod
  };

  const vitalTypes = [
    { key: 'bloodPressure', label: language === 'en' ? 'Blood Pressure' : 'Tekanan Darah', icon: 'heart', color: colors.error },
    { key: 'spO2', label: 'SpO2', icon: 'pulse', color: colors.info },
    { key: 'pulse', label: language === 'en' ? 'Pulse Rate' : 'Kadar Nadi', icon: 'radio-button-on', color: colors.primary },
    { key: 'temperature', label: language === 'en' ? 'Temperature' : 'Suhu', icon: 'thermometer', color: colors.warning },
    { key: 'weight', label: language === 'en' ? 'Weight' : 'Berat', icon: 'fitness', color: colors.secondary },
    { key: 'bloodGlucose', label: language === 'en' ? 'Blood Glucose' : 'Gula Darah', icon: 'water', color: colors.success },
  ];

  const periods = [
    { key: 'week', label: language === 'en' ? 'Week' : 'Minggu' },
    { key: 'month', label: language === 'en' ? 'Month' : 'Bulan' },
    { key: '3months', label: language === 'en' ? '3 Months' : '3 Bulan' },
  ];

  const getVitalValue = (data: TrendData, vitalType: string) => {
    switch (vitalType) {
      case 'bloodPressure':
        if (data.systolic === 0 || data.diastolic === 0) return 'N/A';
        return `${data.systolic}/${data.diastolic}`;
      case 'spO2':
        if (data.spO2 === 0) return 'N/A';
        return `${data.spO2}%`;
      case 'pulse':
        if (data.pulse === 0) return 'N/A';
        return `${data.pulse} bpm`;
      case 'temperature':
        if (data.temperature === 0) return 'N/A';
        return `${data.temperature}°C`;
      case 'weight':
        if (data.weight === 0) return 'N/A';
        return `${data.weight} kg`;
      case 'bloodGlucose':
        return data.bloodGlucose ? `${data.bloodGlucose} mmol/L` : 'N/A';
      default:
        return 'N/A';
    }
  };

  const getStatusColor = (data: TrendData, vitalType: string) => {
    let status = 'normal';
    switch (vitalType) {
      case 'bloodPressure':
        status = data.bloodPressureStatus || 'normal';
        break;
      case 'spO2':
        status = data.spO2Status || 'normal';
        break;
      case 'pulse':
        status = data.pulseStatus || 'normal';
        break;
      case 'temperature':
        status = data.temperatureStatus || 'normal';
        break;
      case 'bloodGlucose':
        status = data.bloodGlucoseStatus || 'normal';
        break;
      default:
        status = 'normal';
    }

    switch (status) {
      case 'critical': return colors.error;
      case 'concerning': return colors.warning;
      case 'normal': return colors.success;
      default: return colors.success;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    // For chart labels, use shorter format
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  const getAverageValue = (vitalType: string) => {
    if (!vitalSignsHistory.length) return '--';

    const values = vitalSignsHistory.map(data => {
      switch (vitalType) {
        case 'bloodPressure':
          return (data.systolic + data.diastolic) / 2;
        case 'spO2':
          return data.spO2;
        case 'pulse':
          return data.pulse;
        case 'temperature':
          return data.temperature;
        case 'weight':
          return data.weight;
        case 'bloodGlucose':
          return data.bloodGlucose || 0;
        default:
          return 0;
      }
    }).filter(val => val > 0);

    if (values.length === 0) return '--';

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return average.toFixed(1);
  };

  const getAlertCount = () => {
    if (!vitalSignsHistory.length) return 0;

    return vitalSignsHistory.filter(data => {
      const statuses = [
        data.bloodPressureStatus,
        data.spO2Status,
        data.pulseStatus,
        data.temperatureStatus,
        data.bloodGlucoseStatus
      ];
      return statuses.some(status => status === 'critical' || status === 'concerning');
    }).length;
  };

  const renderLineChart = () => {
    const selectedVitalData = vitalTypes.find(v => v.key === selectedVital);
    if (!selectedVitalData) return null;

    // Filter data based on selected vital to only show valid readings
    const filteredData = vitalSignsHistory.filter(data => {
      switch (selectedVital) {
        case 'bloodPressure':
          return data.systolic > 0 && data.diastolic > 0;
        case 'spO2':
          return data.spO2 > 0;
        case 'pulse':
          return data.pulse > 0;
        case 'temperature':
          return data.temperature > 0;
        case 'weight':
          return data.weight > 0;
        case 'bloodGlucose':
          return data.bloodGlucose && data.bloodGlucose > 0;
        default:
          return false;
      }
    });

    if (filteredData.length < 2) {
      return (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{selectedVitalData.label}</Text>
            <Text style={styles.chartSubtitle}>
              {language === 'en'
                ? `Last ${selectedPeriod === 'week' ? '7 days' : selectedPeriod === 'month' ? '30 days' : '3 months'}`
                : `${selectedPeriod === 'week' ? '7 hari' : selectedPeriod === 'month' ? '30 hari' : '3 bulan'} terakhir`}
            </Text>
          </View>

          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
            <Text style={styles.noDataText}>
              {language === 'en'
                ? filteredData.length === 0
                  ? `No ${selectedVitalData.label.toLowerCase()} data available for selected period`
                  : `Need at least 2 data points to display trends`
                : filteredData.length === 0
                  ? `Tiada data ${selectedVitalData.label.toLowerCase()} tersedia untuk tempoh yang dipilih`
                  : `Perlu sekurang-kurangnya 2 data untuk memaparkan trend`}
            </Text>
          </View>
        </View>
      );
    }

    // Prepare data for LineChart
    const getDataValues = () => {
      switch (selectedVital) {
        case 'bloodPressure':
          return {
            datasets: [
              {
                data: filteredData.map(d => d.systolic),
                color: (opacity = 1) => `rgba(220, 38, 127, ${opacity})`, // Systolic (red)
                strokeWidth: 2
              },
              {
                data: filteredData.map(d => d.diastolic),
                color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, // Diastolic (blue)
                strokeWidth: 2
              }
            ],
            legend: ['Systolic', 'Diastolic']
          };
        case 'spO2':
          return {
            datasets: [{
              data: filteredData.map(d => d.spO2),
              color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
              strokeWidth: 3
            }]
          };
        case 'pulse':
          return {
            datasets: [{
              data: filteredData.map(d => d.pulse),
              color: (opacity = 1) => `rgba(153, 102, 255, ${opacity})`,
              strokeWidth: 3
            }]
          };
        case 'temperature':
          return {
            datasets: [{
              data: filteredData.map(d => d.temperature),
              color: (opacity = 1) => `rgba(255, 159, 64, ${opacity})`,
              strokeWidth: 3
            }]
          };
        case 'weight':
          return {
            datasets: [{
              data: filteredData.map(d => d.weight),
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 3
            }]
          };
        case 'bloodGlucose':
          return {
            datasets: [{
              data: filteredData.map(d => d.bloodGlucose || 0),
              color: (opacity = 1) => `rgba(54, 235, 162, ${opacity})`,
              strokeWidth: 3
            }]
          };
        default:
          return { datasets: [{ data: [0] }] };
      }
    };

    const chartData = {
      labels: filteredData.map(data => formatChartDate(data.date)),
      ...getDataValues()
    };

    const chartConfig = {
      backgroundColor: colors.white,
      backgroundGradientFrom: colors.white,
      backgroundGradientTo: colors.white,
      decimalPlaces: selectedVital === 'temperature' ? 1 : 0,
      color: (opacity = 1) => selectedVitalData.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
      labelColor: (opacity = 1) => colors.textSecondary + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: selectedVitalData.color
      },
      propsForBackgroundLines: {
        stroke: colors.gray200,
        strokeWidth: 1
      }
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{selectedVitalData.label}</Text>
          <Text style={styles.chartSubtitle}>
            {language === 'en'
              ? `Last ${selectedPeriod === 'week' ? '7 days' : selectedPeriod === 'month' ? '30 days' : '3 months'}`
              : `${selectedPeriod === 'week' ? '7 hari' : selectedPeriod === 'month' ? '30 hari' : '3 bulan'} terakhir`}
          </Text>
        </View>

        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.lineChart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
        />
      </View>
    );
  };

  // Show loading state
  if (profilesLoading || historyLoading) {
    return (
      <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'en' ? 'Loading vital signs trends...' : 'Memuatkan trend tanda vital...'}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (historyError) {
    return (
      <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>
            {language === 'en' ? 'Error loading vital signs data' : 'Ralat memuatkan data tanda vital'}
          </Text>
          <Text style={styles.errorMessage}>{historyError}</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show no elderly profile state
  if (!currentElderly) {
    return (
      <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>
            {language === 'en' ? 'No elderly profile found' : 'Tiada profil warga emas dijumpai'}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
      {/* Modern Header */}
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <InteractiveFeedback
            onPress={() => {
              hapticFeedback.light();
              navigation.goBack();
            }}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={styles.modernBackButton}>
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </View>
          </InteractiveFeedback>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.modernHeaderTitle}>
              {language === 'en' ? 'Vital Signs Trends' : 'Trend Tanda Vital'}
            </Text>
            <Text style={styles.modernHeaderSubtitle}>
              {language === 'en' ? 'View health data trends and analytics' : 'Lihat trend dan analitis data kesihatan'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title={language === 'en' ? 'Pull to refresh' : 'Tarik untuk segar semula'}
            titleColor={colors.textSecondary}
          />
        }
      >

        {/* Period Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>
            {language === 'en' ? 'Time Period' : 'Tempoh Masa'}
          </Text>
          <View style={styles.selectorRow}>
            {periods.map((period) => (
              <InteractiveFeedback
                key={period.key}
                onPress={() => handlePeriodChange(period.key as any)}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={[
                  styles.selectorButton,
                  selectedPeriod === period.key && styles.selectorButtonActive
                ]}>
                  <Text style={[
                    styles.selectorButtonText,
                    selectedPeriod === period.key && styles.selectorButtonTextActive
                  ]}>
                    {period.label}
                  </Text>
                </View>
              </InteractiveFeedback>
            ))}
          </View>
        </View>


        {/* Chart */}
        {renderLineChart()}

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
            <Text style={styles.statsTitle}>
              {language === 'en' ? 'Statistics' : 'Statistik'}
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getAverageValue(selectedVital)}</Text>
              <Text style={styles.statLabel}>
                {language === 'en' ? 'Average' : 'Purata'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(() => {
                  const filteredCount = vitalSignsHistory.filter(data => {
                    switch (selectedVital) {
                      case 'bloodPressure':
                        return data.systolic > 0 && data.diastolic > 0;
                      case 'spO2':
                        return data.spO2 > 0;
                      case 'pulse':
                        return data.pulse > 0;
                      case 'temperature':
                        return data.temperature > 0;
                      case 'weight':
                        return data.weight > 0;
                      case 'bloodGlucose':
                        return data.bloodGlucose && data.bloodGlucose > 0;
                      default:
                        return false;
                    }
                  }).length;
                  return filteredCount;
                })()}
              </Text>
              <Text style={styles.statLabel}>
                {language === 'en' ? 'Readings' : 'Bacaan'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getAlertCount()}</Text>
              <Text style={styles.statLabel}>
                {language === 'en' ? 'Alerts' : 'Amaran'}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Readings */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Ionicons name="time" size={20} color={colors.secondary} />
            <Text style={styles.recentTitle}>
              {language === 'en' ? 'Recent Readings' : 'Bacaan Terkini'}
            </Text>
          </View>
          
          {(() => {
            // Filter recent readings for selected vital
            const filteredRecent = vitalSignsHistory.filter(data => {
              switch (selectedVital) {
                case 'bloodPressure':
                  return data.systolic > 0 && data.diastolic > 0;
                case 'spO2':
                  return data.spO2 > 0;
                case 'pulse':
                  return data.pulse > 0;
                case 'temperature':
                  return data.temperature > 0;
                case 'weight':
                  return data.weight > 0;
                case 'bloodGlucose':
                  return data.bloodGlucose && data.bloodGlucose > 0;
                default:
                  return false;
              }
            }).slice(-3).reverse();

            return filteredRecent.length > 0 ? (
              filteredRecent.map((data, index) => (
                <View key={data.date} style={styles.recentItem}>
                  <View style={styles.recentDate}>
                    <Text style={styles.recentDateText}>{formatDate(data.date)}</Text>
                    <Text style={styles.recentTime}>
                      {new Date(data.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.recentValue}>
                    <Text style={[styles.recentValueText, { color: getStatusColor(data, selectedVital) }]}>
                      {getVitalValue(data, selectedVital)}
                    </Text>
                  </View>
                  <View style={[styles.recentStatus, { backgroundColor: getStatusColor(data, selectedVital) }]} />
                </View>
              ))
            ) : (
              <View style={styles.noRecentContainer}>
                <Text style={styles.noRecentText}>
                  {language === 'en'
                    ? `No recent ${vitalTypes.find(v => v.key === selectedVital)?.label.toLowerCase()} readings available`
                    : `Tiada bacaan ${vitalTypes.find(v => v.key === selectedVital)?.label.toLowerCase()} terkini tersedia`}
                </Text>
              </View>
            );
          })()}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  modernHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modernHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: colors.primary,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectorButtonTextActive: {
    color: colors.white,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recentContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  recentDate: {
    flex: 1,
  },
  recentDateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recentTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  recentValue: {
    flex: 1,
    alignItems: 'center',
  },
  recentValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomPadding: {
    height: 24,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  noRecentContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noRecentText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
