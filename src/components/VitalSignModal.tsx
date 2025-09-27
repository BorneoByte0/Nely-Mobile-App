import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useVitalSignsHistory } from '../hooks/useDatabase';

const { width, height } = Dimensions.get('window');

interface VitalSignModalProps {
  visible: boolean;
  onClose: () => void;
  vitalType: 'bloodPressure' | 'spO2' | 'pulse' | 'bloodGlucose' | 'temperature' | 'weight';
  currentValue: string;
  unit: string;
  status: 'normal' | 'concerning' | 'critical';
  lastRecorded: string;
  recordedBy: string;
  navigation?: any;
  elderlyId?: string; // Add elderly ID for fetching history
}

export const VitalSignModal: React.FC<VitalSignModalProps> = ({
  visible,
  onClose,
  vitalType,
  currentValue,
  unit,
  status,
  lastRecorded,
  recordedBy,
  navigation,
  elderlyId,
}) => {
  const { language } = useLanguage();
  const [slideAnim] = useState(new Animated.Value(height));

  // Fetch vital signs history for this elderly person
  const { vitalSignsHistory, loading: historyLoading, refetch: refetchHistory } = useVitalSignsHistory(elderlyId || '', 'month');

  // Refetch history when modal becomes visible
  React.useEffect(() => {
    if (visible && elderlyId) {
      console.log('🔄 VitalSignModal: Refetching history on modal open...');
      refetchHistory();
    }
  }, [visible, elderlyId]); // Removed refetchHistory from dependencies

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const getVitalInfo = () => {
    const vitals = {
      bloodPressure: {
        icon: 'water-outline',
        titleEn: 'Blood Pressure',
        titleMs: 'Tekanan Darah',
        normalRange: '90/60 - 140/90 mmHg',
        description: language === 'en' 
          ? 'Blood pressure measures the force of blood against artery walls.'
          : 'Tekanan darah mengukur daya darah terhadap dinding arteri.',
      },
      spO2: {
        icon: 'heart-outline',
        titleEn: 'Blood Oxygen',
        titleMs: 'Oksigen Darah',
        normalRange: '95-100%',
        description: language === 'en'
          ? 'Oxygen saturation measures how much oxygen your blood carries.'
          : 'Ketepuan oksigen mengukur berapa banyak oksigen yang dibawa darah.',
      },
      pulse: {
        icon: 'pulse-outline',
        titleEn: 'Pulse Rate',
        titleMs: 'Kadar Nadi',
        normalRange: '60-100 bpm',
        description: language === 'en'
          ? 'Pulse rate measures heartbeats per minute.'
          : 'Kadar nadi mengukur denyutan jantung per minit.',
      },
      bloodGlucose: {
        icon: 'water-outline',
        titleEn: 'Blood Sugar',
        titleMs: 'Gula Darah',
        normalRange: '4.0-7.8 mmol/L',
        description: language === 'en'
          ? 'Blood glucose levels indicate how your body processes sugar.'
          : 'Tahap glukosa darah menunjukkan bagaimana badan memproses gula.',
      },
      temperature: {
        icon: 'thermometer-outline',
        titleEn: 'Body Temperature',
        titleMs: 'Suhu Badan',
        normalRange: '36.1-37.2°C',
        description: language === 'en'
          ? 'Body temperature reflects overall health and immune response.'
          : 'Suhu badan mencerminkan kesihatan keseluruhan dan tindak balas imun.',
      },
      weight: {
        icon: 'scale-outline',
        titleEn: 'Weight',
        titleMs: 'Berat Badan',
        normalRange: 'BMI 18.5-24.9',
        description: language === 'en'
          ? 'Weight tracking helps monitor overall health trends.'
          : 'Pengesanan berat membantu memantau trend kesihatan keseluruhan.',
      },
    };
    return vitals[vitalType];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return colors.error;
      case 'concerning': return colors.warning;
      case 'normal': return colors.success;
      default: return colors.info;
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      en: { normal: 'Normal', concerning: 'Concerning', critical: 'Critical' },
      ms: { normal: 'Normal', concerning: 'Membimbangkan', critical: 'Kritikal' }
    };
    return statusTexts[language as 'en' | 'ms'][status as keyof typeof statusTexts.en];
  };

  const vital = getVitalInfo();

  // Process vital signs history for the specific vital type
  const vitalHistory = React.useMemo((): Array<{
    date: string;
    value: string;
    status: string;
    recordedBy: string;
  }> => {
    if (!vitalSignsHistory || vitalSignsHistory.length === 0) {
      return [];
    }

    const processedHistory = vitalSignsHistory
      .map(reading => {
        let value = '';
        let vitalStatus = 'normal';

        switch (vitalType) {
          case 'bloodPressure':
            if (reading.systolic && reading.diastolic) {
              value = `${reading.systolic}/${reading.diastolic}`;
              vitalStatus = reading.bloodPressureStatus || 'normal';
            }
            break;
          case 'spO2':
            if (reading.spO2) {
              value = reading.spO2.toString();
              vitalStatus = reading.spO2Status || 'normal';
            }
            break;
          case 'pulse':
            if (reading.pulse) {
              value = reading.pulse.toString();
              vitalStatus = reading.pulseStatus || 'normal';
            }
            break;
          case 'temperature':
            if (reading.temperature) {
              value = reading.temperature.toFixed(1);
              vitalStatus = reading.temperatureStatus || 'normal';
            }
            break;
          case 'bloodGlucose':
            if (reading.bloodGlucose) {
              value = reading.bloodGlucose.toString();
              vitalStatus = reading.bloodGlucoseStatus || 'normal';
            }
            break;
          case 'weight':
            if (reading.weight) {
              value = reading.weight.toString();
              vitalStatus = 'normal'; // Weight doesn't have status calculation
            }
            break;
        }

        if (value) {
          return {
            date: reading.date,
            value: value,
            status: vitalStatus,
            recordedBy: reading.recordedBy || 'Unknown User'
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
      .slice(0, 6); // Show up to 6 recent readings

    return processedHistory;
  }, [vitalSignsHistory, vitalType]);

  // Debug logging
  React.useEffect(() => {
    if (visible) {
      console.log('🔍 VitalSignModal Debug:', {
        elderlyId,
        vitalType,
        historyLoading,
        rawHistoryLength: vitalSignsHistory?.length || 0,
        processedHistoryLength: vitalHistory.length,
        vitalHistory: vitalHistory.slice(0, 2), // Show first 2 for debugging
      });
    }
  }, [visible, elderlyId, vitalType, historyLoading, vitalSignsHistory?.length]); // Removed vitalHistory to prevent infinite loops

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name={vital.icon as any} size={28} color={colors.primary} />
              <Text style={styles.modalTitle}>
                {language === 'en' ? vital.titleEn : vital.titleMs}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Current Reading */}
            <View style={[styles.currentReading, { backgroundColor: getStatusColor(status) + '20' }]}>
              <Text style={styles.currentValue}>{currentValue}</Text>
              <Text style={styles.currentUnit}>{unit}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{getStatusText(status)}</Text>
              </View>
            </View>

            {/* Normal Range */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                {language === 'en' ? 'Normal Range' : 'Julat Normal'}
              </Text>
              <Text style={styles.infoValue}>{vital.normalRange}</Text>
              <Text style={styles.infoDescription}>{vital.description}</Text>
            </View>

            {/* Last Reading Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                {language === 'en' ? 'Recording Details' : 'Butiran Rekod'}
              </Text>
              <View style={styles.recordingDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {language === 'en' ? 'Last Recorded:' : 'Dicatat Terakhir:'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      const lastDate = new Date(lastRecorded);
                      return !isNaN(lastDate.getTime())
                        ? lastDate.toLocaleString()
                        : 'Invalid date';
                    })()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {language === 'en' ? 'Recorded by:' : 'Dicatat oleh:'}
                  </Text>
                  <Text style={styles.detailValue}>{recordedBy}</Text>
                </View>
              </View>
            </View>

            {/* Recent History */}
            <View style={styles.infoCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.infoTitle}>
                  {language === 'en' ? 'Recent History' : 'Sejarah Terkini'}
                </Text>
                {vitalHistory.length > 0 && (
                  <Text style={styles.historyCount}>
                    {vitalHistory.length} {language === 'en' ? 'readings' : 'bacaan'}
                  </Text>
                )}
              </View>

              {historyLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    {language === 'en' ? 'Loading history...' : 'Memuatkan sejarah...'}
                  </Text>
                </View>
              ) : vitalHistory.length > 0 ? (
                <>
                  {vitalHistory.map((reading, index) => {
                    const readingDate = new Date(reading.date);
                    const isValidDate = !isNaN(readingDate.getTime());

                    return (
                      <View key={index} style={styles.historyItem}>
                        <View style={styles.historyLeft}>
                          <Text style={styles.historyDate}>
                            {isValidDate ? readingDate.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short'
                            }) : 'Invalid'}
                          </Text>
                          <Text style={styles.historyTime}>
                            {isValidDate ? readingDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            }) : '--:--'}
                          </Text>
                        </View>
                        <View style={styles.historyCenter}>
                          <Text style={styles.historyValue}>{reading.value} {unit}</Text>
                          <Text style={styles.historyRecorder}>{reading.recordedBy}</Text>
                        </View>
                        <View style={[styles.historyStatus, { backgroundColor: getStatusColor(reading.status) }]} />
                      </View>
                    );
                  })}

                  {vitalHistory.length < 4 && (
                    <View style={styles.moreDataNeeded}>
                      <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
                      <Text style={styles.moreDataText}>
                        {language === 'en'
                          ? `Record ${4 - vitalHistory.length} more readings to see better trends`
                          : `Rekod ${4 - vitalHistory.length} lagi bacaan untuk melihat trend yang lebih baik`}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noHistoryContainer}>
                  <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.noHistoryText}>
                    {language === 'en'
                      ? 'No vital signs history available yet. Record new readings to build history.'
                      : 'Belum ada sejarah tanda vital. Rekod bacaan baru untuk membina sejarah.'}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.recordButton]}
                onPress={() => {
                  if (navigation) {
                    onClose();
                    navigation.navigate('RecordVitalReading');
                  }
                }}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={20} color={colors.white} />
                  <Text style={styles.recordButtonText}>
                    {language === 'en' ? 'Record New Reading' : 'Rekod Bacaan Baru'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.trendButton]}
                onPress={() => {
                  if (navigation) {
                    onClose();
                    navigation.navigate('ViewVitalTrends', { vitalType });
                  }
                }}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="trending-up" size={20} color={colors.textPrimary} />
                  <Text style={styles.trendButtonText}>
                    {language === 'en' ? 'View Trends' : 'Lihat Trend'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  currentReading: {
    alignItems: 'center',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    position: 'relative',
  },
  currentValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentUnit: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: colors.gray50,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recordingDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  moreDataNeeded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  moreDataText: {
    fontSize: 12,
    color: colors.warning,
    flex: 1,
    lineHeight: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  historyLeft: {
    width: 90,
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  historyTime: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  historyCenter: {
    flex: 1,
    marginLeft: 12,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  historyRecorder: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noHistoryContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  noHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  recordButton: {
    backgroundColor: colors.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trendButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  trendButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});