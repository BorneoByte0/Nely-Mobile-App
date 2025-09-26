import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

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

  // Mock trend data for the last 7 days
  const mockTrendData: TrendData[] = [
    { date: '2024-09-02', systolic: 142, diastolic: 88, spO2: 97, pulse: 75, temperature: 36.4, weight: 65.2, bloodGlucose: 7.8 },
    { date: '2024-09-03', systolic: 145, diastolic: 90, spO2: 98, pulse: 72, temperature: 36.5, weight: 65.1, bloodGlucose: 8.2 },
    { date: '2024-09-04', systolic: 148, diastolic: 92, spO2: 97, pulse: 74, temperature: 36.6, weight: 65.0, bloodGlucose: 7.5 },
    { date: '2024-09-05', systolic: 144, diastolic: 89, spO2: 98, pulse: 73, temperature: 36.4, weight: 64.9, bloodGlucose: 8.0 },
    { date: '2024-09-06', systolic: 146, diastolic: 91, spO2: 98, pulse: 71, temperature: 36.5, weight: 64.8, bloodGlucose: 7.9 },
    { date: '2024-09-07', systolic: 143, diastolic: 87, spO2: 97, pulse: 76, temperature: 36.3, weight: 64.9, bloodGlucose: 7.6 },
    { date: '2024-09-08', systolic: 145, diastolic: 90, spO2: 98, pulse: 72, temperature: 36.5, weight: 65.0, bloodGlucose: 8.2 },
  ];

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
        return `${data.systolic}/${data.diastolic}`;
      case 'spO2':
        return `${data.spO2}%`;
      case 'pulse':
        return `${data.pulse} bpm`;
      case 'temperature':
        return `${data.temperature}°C`;
      case 'weight':
        return `${data.weight} kg`;
      case 'bloodGlucose':
        return data.bloodGlucose ? `${data.bloodGlucose} mmol/L` : 'N/A';
      default:
        return 'N/A';
    }
  };

  const getStatusColor = (data: TrendData, vitalType: string) => {
    switch (vitalType) {
      case 'bloodPressure':
        if (data.systolic > 160 || data.diastolic > 100) return colors.error;
        if (data.systolic > 140 || data.diastolic > 90) return colors.warning;
        return colors.success;
      case 'spO2':
        if (data.spO2 < 90) return colors.error;
        if (data.spO2 < 95) return colors.warning;
        return colors.success;
      case 'pulse':
        if (data.pulse < 50 || data.pulse > 120) return colors.error;
        if (data.pulse < 60 || data.pulse > 100) return colors.warning;
        return colors.success;
      case 'temperature':
        if (data.temperature > 38.5) return colors.error;
        if (data.temperature > 37.5) return colors.warning;
        return colors.success;
      default:
        return colors.success;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAverageValue = (vitalType: string) => {
    const values = mockTrendData.map(data => {
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
    });
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return average.toFixed(1);
  };

  const renderSimpleChart = () => {
    const selectedVitalData = vitalTypes.find(v => v.key === selectedVital);
    if (!selectedVitalData) return null;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{selectedVitalData.label}</Text>
          <Text style={styles.chartSubtitle}>
            {language === 'en' ? 'Last 7 days' : '7 hari terakhir'}
          </Text>
        </View>
        
        <View style={styles.chartArea}>
          {mockTrendData.map((data, index) => {
            const isLast = index === mockTrendData.length - 1;
            return (
              <View key={data.date} style={styles.chartPoint}>
                <View style={styles.chartLine}>
                  <View 
                    style={[
                      styles.chartDot, 
                      { 
                        backgroundColor: getStatusColor(data, selectedVital),
                        transform: [{ scale: isLast ? 1.3 : 1 }]
                      }
                    ]} 
                  />
                  {index < mockTrendData.length - 1 && (
                    <View style={styles.chartConnector} />
                  )}
                </View>
                <Text style={styles.chartDate}>{formatDate(data.date)}</Text>
                <Text style={[styles.chartValue, { color: getStatusColor(data, selectedVital) }]}>
                  {getVitalValue(data, selectedVital)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Period Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>
            {language === 'en' ? 'Time Period' : 'Tempoh Masa'}
          </Text>
          <View style={styles.selectorRow}>
            {periods.map((period) => (
              <InteractiveFeedback
                key={period.key}
                onPress={() => {
                  setSelectedPeriod(period.key as any);
                  hapticFeedback.selection();
                }}
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
        {renderSimpleChart()}

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
              <Text style={styles.statValue}>{mockTrendData.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'en' ? 'Readings' : 'Bacaan'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.floor(Math.random() * 3) + 1}
              </Text>
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
          
          {mockTrendData.slice(-3).reverse().map((data, index) => (
            <View key={data.date} style={styles.recentItem}>
              <View style={styles.recentDate}>
                <Text style={styles.recentDateText}>{formatDate(data.date)}</Text>
              </View>
              <View style={styles.recentValue}>
                <Text style={[styles.recentValueText, { color: getStatusColor(data, selectedVital) }]}>
                  {getVitalValue(data, selectedVital)}
                </Text>
              </View>
              <View style={[styles.recentStatus, { backgroundColor: getStatusColor(data, selectedVital) }]} />
            </View>
          ))}
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
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartPoint: {
    alignItems: 'center',
    flex: 1,
  },
  chartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    width: '100%',
    justifyContent: 'center',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  chartConnector: {
    height: 2,
    backgroundColor: colors.gray300,
    flex: 1,
    marginLeft: 4,
  },
  chartDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
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
});