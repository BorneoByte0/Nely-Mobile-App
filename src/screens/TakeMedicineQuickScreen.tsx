import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useMedications, useRecordMedicationTaken, useUserProfile } from '../hooks/useDatabase';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useAuth } from '../context/AuthContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
}

export function TakeMedicineQuickScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showAlert, hideAlert, showError } = useModernAlert();

  // Triple dots animation - MOVED TO TOP TO FIX HOOKS ORDER
  const dot1Anim = useState(new Animated.Value(0.4))[0];
  const dot2Anim = useState(new Animated.Value(0.4))[0];
  const dot3Anim = useState(new Animated.Value(0.4))[0];

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { medications: allMedications, loading: medicationsLoading, error: medicationsError } = useMedications(currentElderly?.id || '');
  const { userProfile } = useUserProfile();
  const { recordMedicationTaken, loading: recordingLoading } = useRecordMedicationTaken();

  // Filter to only show active medications
  const medications = allMedications.filter(med => med.isActive);

  const dataLoading = profilesLoading || medicationsLoading;

  // Check for no medications and show alert
  useEffect(() => {
    if (!dataLoading && !medicationsError && (!medications || medications.length === 0)) {
      showAlert({
        type: 'warning',
        title: language === 'en' ? 'No Medications' : 'Tiada Ubat',
        message: language === 'en'
          ? 'No medications registered. Please add medications first.'
          : 'Tiada ubat didaftarkan. Sila tambah ubat dahulu.',
        buttons: [
          {
            text: language === 'en' ? 'Cancel' : 'Batal',
            style: 'cancel',
            onPress: () => {
              hideAlert();
              navigation.goBack();
            }
          },
          {
            text: language === 'en' ? 'Add Medications' : 'Tambah Ubat',
            style: 'default',
            onPress: () => {
              hideAlert();
              navigation.navigate('Family', { screen: 'AddMedication' });
            }
          }
        ]
      });
    }
  }, [dataLoading, medicationsError, medications, language]);

  if (dataLoading) {
    return (
      <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading medications...' : 'Memuatkan ubat-ubatan...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (medicationsError) {
    return (
      <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={medicationsError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  // Show normal interface when no medications (alert will handle user feedback)
  if (!medications || medications.length === 0) {
    return (
      <>
        <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
          {/* Modern Header */}
          <LinearGradient
            colors={[colors.success, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modernHeader}
          >
            <View style={styles.headerContent}>
              <InteractiveFeedback
                onPress={() => {
                  hapticFeedback.light();
                  navigation?.goBack();
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
                  {language === 'en' ? 'Take Medicine' : 'Ambil Ubat'}
                </Text>
                <Text style={styles.modernHeaderSubtitle}>
                  {language === 'en' ? 'Mark medications as taken today' : 'Tandakan ubat yang diambil hari ini'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.container}>
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateTitle}>
                {language === 'en' ? 'No Medications' : 'Tiada Ubat'}
              </Text>
              <Text style={styles.emptyStateText}>
                {language === 'en'
                  ? 'No medications are currently registered.'
                  : 'Tiada ubat yang didaftarkan pada masa ini.'}
              </Text>
            </View>
          </View>
        </SafeAreaWrapper>

        {/* Modern Alert */}
        {alertVisible && alertConfig && (
          <ModernAlert
            visible={alertVisible}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onClose={hideAlert}
          />
        )}
      </>
    );
  }

  const startDotsAnimation = () => {
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 200),
      animateDot(dot3Anim, 400),
    ]).start();
  };

  const stopDotsAnimation = () => {
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();
    dot1Anim.setValue(0.4);
    dot2Anim.setValue(0.4);
    dot3Anim.setValue(0.4);
  };

  // Use active medications from database
  const activeMedications = medications.filter(med => med.isActive);

  // For quick taking, show all active medications
  const todaysMedications = activeMedications.map(medication => ({
    id: medication.id,
    medicationId: medication.id,
    name: medication.name,
    dosage: medication.dosage,
    instructions: medication.instructions,
    frequency: medication.frequency,
    time: 'As needed', // Quick take doesn't depend on specific schedule
  }));

  const handleMedicationToggle = (medicationId: string) => {
    setSelectedMedications(prev => 
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
    hapticFeedback.light();
  };

  const handleConfirmTaken = async () => {
    if (selectedMedications.length === 0) {
      return;
    }

    if (!currentElderly) {
      showSuccess({
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'No elderly profile found.'
          : 'Tiada profil warga emas dijumpai.',
        onComplete: () => navigation?.goBack(),
        duration: 800,
      });
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      const takenBy = userProfile?.name || user?.email || 'Unknown';
      let successCount = 0;

      // Record each selected medication as taken
      for (const medicationId of selectedMedications) {
        const success = await recordMedicationTaken(
          currentElderly.id,
          medicationId,
          takenBy,
          'Quick take'
        );
        if (success) successCount++;
      }

      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.success();

      if (successCount === selectedMedications.length) {
        showSuccess({
          title: language === 'en' ? 'Success!' : 'Berjaya!',
          message: language === 'en'
            ? `${selectedMedications.length} medication${selectedMedications.length > 1 ? 's' : ''} marked as taken successfully!`
            : `${selectedMedications.length} ubat berjaya ditandakan sebagai diambil!`,
          onComplete: () => navigation?.goBack(),
          duration: 800,
        });
      } else {
        showSuccess({
          title: language === 'en' ? 'Partial Success' : 'Sebahagian Berjaya',
          message: language === 'en'
            ? `${successCount}/${selectedMedications.length} medications recorded successfully.`
            : `${successCount}/${selectedMedications.length} ubat berjaya direkod.`,
          onComplete: () => navigation?.goBack(),
          duration: 800,
        });
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showSuccess({
        title: language === 'en' ? 'Recording Failed' : 'Gagal Merekod',
        message: language === 'en'
          ? 'Unable to record medications. Please try again.'
          : 'Tidak dapat merekod ubat. Sila cuba lagi.',
        onComplete: () => navigation?.goBack(),
        duration: 800,
      });
    }
  };

  return (
    <>
    <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
      {/* Modern Header */}
      <LinearGradient
        colors={[colors.success, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernHeader}
      >
        <View style={styles.headerContent}>
          <InteractiveFeedback
            onPress={() => {
              hapticFeedback.light();
              navigation?.goBack();
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
              {language === 'en' ? 'Take Medicine' : 'Ambil Ubat'}
            </Text>
            <Text style={styles.modernHeaderSubtitle}>
              {language === 'en' ? 'Mark medications as taken today' : 'Tandakan ubat yang diambil hari ini'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Today's Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? "Today's Medications" : 'Ubat Hari Ini'}
            </Text>
          </View>

          {todaysMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.emptyStateTitle}>
                {language === 'en' ? 'All medications taken!' : 'Semua ubat telah diambil!'}
              </Text>
              <Text style={styles.emptyStateText}>
                {language === 'en' 
                  ? 'Great job! All scheduled medications for today have been taken.' 
                  : 'Bagus! Semua ubat yang dijadualkan untuk hari ini telah diambil.'}
              </Text>
            </View>
          ) : (
            todaysMedications.map((medication) => (
              <InteractiveFeedback
                key={medication.id}
                onPress={() => handleMedicationToggle(medication.id)}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={[
                  styles.medicationCard,
                  selectedMedications.includes(medication.id) && styles.medicationCardSelected
                ]}>
                  <View style={styles.medicationInfo}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <Text style={styles.medicationTime}>{medication.time}</Text>
                    </View>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    {medication.instructions && (
                      <Text style={styles.medicationInstructions}>
                        {medication.instructions}
                      </Text>
                    )}
                  </View>
                  
                  <View style={[
                    styles.checkboxContainer,
                    selectedMedications.includes(medication.id) && styles.checkboxSelected
                  ]}>
                    {selectedMedications.includes(medication.id) ? (
                      <Ionicons name="checkmark" size={20} color={colors.white} />
                    ) : (
                      <View style={styles.checkboxEmpty} />
                    )}
                  </View>
                </View>
              </InteractiveFeedback>
            ))
          )}
        </View>

        {/* Instructions */}
        {todaysMedications.length > 0 && (
          <View style={styles.instructionsSection}>
            <View style={styles.instructionItem}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.instructionText}>
                {language === 'en'
                  ? 'Select the medications you have taken and confirm below.'
                  : 'Pilih ubat yang telah anda ambil dan sahkan di bawah.'}
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="time" size={20} color={colors.warning} />
              <Text style={styles.instructionText}>
                {language === 'en'
                  ? 'Take medications at the recommended times for best results.'
                  : 'Ambil ubat pada masa yang disyorkan untuk hasil terbaik.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer with Confirm Button */}
      {todaysMedications.length > 0 && (
        <View style={styles.footer}>
          <InteractiveFeedback
            onPress={isLoading ? undefined : handleConfirmTaken}
            feedbackType="scale"
            hapticType="medium"
            disabled={isLoading || selectedMedications.length === 0}
          >
            <LinearGradient
              colors={[colors.success, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.confirmButton, 
                (isLoading || selectedMedications.length === 0) && styles.confirmButtonDisabled
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingDots}>
                  <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                  <Text style={styles.confirmButtonText}>
                    {selectedMedications.length > 0
                      ? language === 'en' 
                        ? `Confirm ${selectedMedications.length} Taken`
                        : `Sahkan ${selectedMedications.length} Diambil`
                      : language === 'en' 
                        ? 'Select Medications'
                        : 'Pilih Ubat'
                    }
                  </Text>
                </>
              )}
            </LinearGradient>
          </InteractiveFeedback>
        </View>
      )}
    </SafeAreaWrapper>

      {/* Success Animation */}
      {successConfig && (
        <SuccessAnimation
          visible={visible}
          title={successConfig.title}
          message={successConfig.message}
          onComplete={hideSuccess}
          duration={successConfig.duration}
        />
      )}

      {/* Modern Alert */}
      {alertVisible && alertConfig && (
        <ModernAlert
          visible={alertVisible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.gray100,
  },
  medicationCardSelected: {
    borderColor: colors.success,
    backgroundColor: colors.successAlpha,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  medicationTime: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning,
    backgroundColor: colors.warningAlpha,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicationDosage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.success,
  },
  checkboxEmpty: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  instructionsSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.9,
  },
  // Loading Styles
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  bottomPadding: {
    height: 24,
  },
});