import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useElderlyProfiles } from '../hooks/useDatabase';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
  route?: {
    params?: {
      selectedPeriod?: string;
    };
  };
}

export function ViewAllTrendsScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(route?.params?.selectedPeriod || 'week');

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Mock trend data for charts
  const getTrendData = (period: string) => {
    const trendData = {
      week: {
        bloodPressure: [
          { day: 'Mon', systolic: 140, diastolic: 88 },
          { day: 'Tue', systolic: 142, diastolic: 90 },
          { day: 'Wed', systolic: 138, diastolic: 86 },
          { day: 'Thu', systolic: 145, diastolic: 92 },
          { day: 'Fri', systolic: 141, diastolic: 89 },
          { day: 'Sat', systolic: 143, diastolic: 91 },
          { day: 'Sun', systolic: 139, diastolic: 87 },
        ],
        pulse: [72, 74, 69, 76, 73, 75, 71],
        spO2: [97, 98, 96, 97, 98, 97, 98],
        weight: [68.2, 68.1, 68.3, 68.0, 68.2, 68.1, 68.2],
      },
      month: {
        bloodPressure: [
          { day: 'Week 1', systolic: 142, diastolic: 89 },
          { day: 'Week 2', systolic: 139, diastolic: 86 },
          { day: 'Week 3', systolic: 136, diastolic: 84 },
          { day: 'Week 4', systolic: 138, diastolic: 85 },
        ],
        pulse: [75, 73, 71, 72],
        spO2: [97, 98, 98, 99],
        weight: [68.3, 68.1, 67.9, 67.8],
      },
      year: {
        bloodPressure: [
          { day: 'Jan', systolic: 145, diastolic: 92 },
          { day: 'Feb', systolic: 142, diastolic: 89 },
          { day: 'Mar', systolic: 140, diastolic: 87 },
          { day: 'Apr', systolic: 138, diastolic: 85 },
          { day: 'May', systolic: 135, diastolic: 83 },
          { day: 'Jun', systolic: 133, diastolic: 81 },
          { day: 'Jul', systolic: 132, diastolic: 80 },
          { day: 'Aug', systolic: 130, diastolic: 78 },
          { day: 'Sep', systolic: 131, diastolic: 79 },
          { day: 'Oct', systolic: 129, diastolic: 77 },
          { day: 'Nov', systolic: 132, diastolic: 80 },
          { day: 'Dec', systolic: 128, diastolic: 76 },
        ],
        pulse: [78, 76, 75, 73, 71, 70, 69, 68, 70, 67, 71, 66],
        spO2: [96, 97, 97, 98, 98, 98, 99, 99, 98, 99, 99, 99],
        weight: [69.5, 69.2, 68.9, 68.6, 68.3, 68.1, 67.9, 67.7, 67.8, 67.6, 67.8, 67.5],
      }
    };
    return trendData[period as keyof typeof trendData] || trendData.week;
  };

  const currentTrendData = getTrendData(selectedPeriod);

  const getPeriodText = (period: string) => {
    const periods = {
      en: { week: 'Week', month: 'Month', year: 'Year' },
      ms: { week: 'Minggu', month: 'Bulan', year: 'Tahun' }
    };
    return periods[language as 'en' | 'ms'][period as keyof typeof periods.en];
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return colors.warning;
      case 'down': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  // Simple bar chart component
  const BarChart = ({ data, color, maxValue }: { data: number[], color: string, maxValue: number }) => {
    const chartWidth = width - 80;
    const barWidth = chartWidth / data.length - 4;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {data.map((value, index) => (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (value / maxValue) * 120,
                    width: barWidth,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

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
        {/* Header */}
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
                {language === 'en' ? 'Health Trends' : 'Trend Kesihatan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentElderly?.name || 'Family Member'} • {language === 'en' ? 'Detailed Analysis' : 'Analisis Terperinci'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Period Selector */}
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
                    {getPeriodText(period)}
                  </Text>
                </LinearGradient>
              </InteractiveFeedback>
            ))}
          </View>
        </View>

        {/* Blood Pressure Trends */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <View style={styles.trendHeaderLeft}>
              <View style={[styles.trendIcon, { backgroundColor: colors.errorAlpha }]}>
                <Ionicons name="heart" size={20} color={colors.error} />
              </View>
              <Text style={styles.trendCardTitle}>
                {language === 'en' ? 'Blood Pressure Trends' : 'Trend Tekanan Darah'}
              </Text>
            </View>
            <View style={styles.trendStats}>
              <Text style={styles.trendValue}>142/89</Text>
              <Text style={styles.trendLabel}>{language === 'en' ? 'Avg' : 'Purata'}</Text>
            </View>
          </View>
          
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>
              {language === 'en' ? 'Systolic Pressure (mmHg)' : 'Tekanan Sistolik (mmHg)'}
            </Text>
            <BarChart 
              data={currentTrendData.bloodPressure.map(bp => bp.systolic)} 
              color={colors.error}
              maxValue={160}
            />
            <View style={styles.chartLabels}>
              {currentTrendData.bloodPressure.map((bp, index) => (
                <Text key={index} style={styles.chartLabel}>{bp.day}</Text>
              ))}
            </View>
          </View>

          <View style={styles.insightBox}>
            <Ionicons name="trending-down" size={16} color={colors.success} />
            <Text style={styles.insightText}>
              {language === 'en' 
                ? 'Blood pressure showing improvement over time' 
                : 'Tekanan darah menunjukkan peningkatan dari masa ke masa'}
            </Text>
          </View>
        </View>

        {/* Pulse Rate Trends */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <View style={styles.trendHeaderLeft}>
              <View style={[styles.trendIcon, { backgroundColor: colors.infoAlpha }]}>
                <Ionicons name="pulse" size={20} color={colors.info} />
              </View>
              <Text style={styles.trendCardTitle}>
                {language === 'en' ? 'Pulse Rate Trends' : 'Trend Kadar Nadi'}
              </Text>
            </View>
            <View style={styles.trendStats}>
              <Text style={styles.trendValue}>73</Text>
              <Text style={styles.trendLabel}>bpm</Text>
            </View>
          </View>
          
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>
              {language === 'en' ? 'Heart Rate (bpm)' : 'Kadar Jantung (bpm)'}
            </Text>
            <BarChart 
              data={currentTrendData.pulse} 
              color={colors.info}
              maxValue={100}
            />
            <View style={styles.chartLabels}>
              {currentTrendData.bloodPressure.map((bp, index) => (
                <Text key={index} style={styles.chartLabel}>{bp.day}</Text>
              ))}
            </View>
          </View>

          <View style={styles.insightBox}>
            <Ionicons name="trending-down" size={16} color={colors.success} />
            <Text style={styles.insightText}>
              {language === 'en' 
                ? 'Resting heart rate is within healthy range' 
                : 'Kadar jantung rehat berada dalam julat sihat'}
            </Text>
          </View>
        </View>

        {/* SpO2 Trends */}
        <View style={styles.trendCard}>
          <View style={styles.trendCardHeader}>
            <View style={styles.trendHeaderLeft}>
              <View style={[styles.trendIcon, { backgroundColor: colors.successAlpha }]}>
                <Ionicons name="water" size={20} color={colors.success} />
              </View>
              <Text style={styles.trendCardTitle}>
                {language === 'en' ? 'Oxygen Saturation' : 'Ketepuan Oksigen'}
              </Text>
            </View>
            <View style={styles.trendStats}>
              <Text style={styles.trendValue}>98%</Text>
              <Text style={styles.trendLabel}>SpO2</Text>
            </View>
          </View>
          
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>
              {language === 'en' ? 'Oxygen Saturation (%)' : 'Ketepuan Oksigen (%)'}
            </Text>
            <BarChart 
              data={currentTrendData.spO2} 
              color={colors.success}
              maxValue={100}
            />
            <View style={styles.chartLabels}>
              {currentTrendData.bloodPressure.map((bp, index) => (
                <Text key={index} style={styles.chartLabel}>{bp.day}</Text>
              ))}
            </View>
          </View>

          <View style={styles.insightBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.insightText}>
              {language === 'en' 
                ? 'Oxygen levels consistently excellent' 
                : 'Tahap oksigen secara konsisten cemerlang'}
            </Text>
          </View>
        </View>

        {/* Health Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={24} color={colors.primary} />
            <Text style={styles.summaryTitle}>
              {language === 'en' ? 'Health Summary' : 'Ringkasan Kesihatan'}
            </Text>
          </View>
          
          <View style={styles.summaryMetrics}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricNumber}>87</Text>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Health Score' : 'Skor Kesihatan'}
              </Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: '87%' }]} />
              </View>
            </View>
            
            <View style={styles.summaryMetric}>
              <Text style={styles.metricNumber}>12</Text>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Days Improved' : 'Hari Membaik'}
              </Text>
            </View>
            
            <View style={styles.summaryMetric}>
              <Text style={styles.metricNumber}>3</Text>
              <Text style={styles.metricLabel}>
                {language === 'en' ? 'Alerts' : 'Amaran'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  
  // Period Selector
  periodSelectorContainer: {
    marginHorizontal: 20,
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
  
  // Trend Cards
  trendCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trendCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trendStats: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // Chart Section
  chartSection: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  chartContainer: {
    height: 140,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    height: 120,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Insight Box
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successAlpha,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    flex: 1,
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
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
    gap: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  
  bottomPadding: {
    height: 20,
  },
});