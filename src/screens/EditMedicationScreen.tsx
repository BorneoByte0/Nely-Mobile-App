import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useElderlyProfiles, useMedications, useUpdateMedication, useDeleteMedication } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      medicationId?: string;
      medicationName?: string;
    };
  };
}

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedBy: string;
}

export function EditMedicationScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { medicationId, medicationName } = route?.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { showAlert, alertConfig, hideAlert } = useModernAlert();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { medications, loading: medicationsLoading, error: medicationsError } = useMedications(currentElderly?.id || '');
  const { updateMedication } = useUpdateMedication();
  const { deleteMedication } = useDeleteMedication();

  const currentMedication = medications.find(med => med.id === medicationId);
  const isDataLoading = profilesLoading || medicationsLoading;

  // Triple dots animation
  const dot1Anim = useState(new Animated.Value(0.4))[0];
  const dot2Anim = useState(new Animated.Value(0.4))[0];
  const dot3Anim = useState(new Animated.Value(0.4))[0];

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
  const [formData, setFormData] = useState<MedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    prescribedBy: '',
  });

  useEffect(() => {
    const medication = currentMedication;

    if (medication) {
      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        frequency: medication.frequency || '',
        duration: '30 days', // Default duration since not in schema
        instructions: medication.instructions || '',
        prescribedBy: medication.prescribedBy || '',
      });
    }
  }, [currentMedication, medicationId]);

  const handleSave = async () => {
    // Basic validation
    if (!formData.name || !formData.dosage || !formData.frequency) {
      showAlert({
        type: 'error',
        title: language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        message: language === 'en'
          ? 'Please fill in medication name, dosage, and frequency.'
          : 'Sila isi nama ubat, dos, dan kekerapan.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => hideAlert(),
          },
        ],
      });
      return;
    }

    if (!medicationId) {
      showAlert({
        type: 'error',
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'Medication not found.'
          : 'Ubat tidak dijumpai.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => {
              hideAlert();
              navigation.goBack();
            },
          },
        ],
      });
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      const medicationData = {
        id: medicationId,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        duration: formData.duration.trim(),
        instructions: formData.instructions.trim(),
        prescribedBy: formData.prescribedBy.trim(),
      };

      const success = await updateMedication(medicationId, medicationData);

      if (success) {
        setIsLoading(false);
        stopDotsAnimation();
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Medication Updated!' : 'Ubat Dikemaskini!',
          message: language === 'en'
            ? 'Medication updated successfully!'
            : 'Ubat berjaya dikemaskini!',
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showAlert({
        type: 'error',
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'Failed to update medication. Please try again.'
          : 'Gagal mengemaskini ubat. Sila cuba lagi.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => hideAlert(),
          },
        ],
      });
    }
  };

  const handleDelete = () => {
    if (!medicationId) {
      navigation.goBack();
      return;
    }

    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Delete Medication' : 'Hapus Ubat',
      message: language === 'en'
        ? `Are you sure you want to delete ${formData.name || medicationName}?`
        : `Adakah anda pasti untuk menghapus ${formData.name || medicationName}?`,
      buttons: [
        {
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'destructive',
          onPress: () => hideAlert(),
        },
        {
          text: language === 'en' ? 'Delete' : 'Hapus',
          style: 'primary',
          onPress: async () => {
            hideAlert();

            try {
              const success = await deleteMedication(medicationId);

              if (success) {
                hapticFeedback.success();
                showSuccess({
                  title: language === 'en' ? 'Medication Deleted' : 'Ubat Dihapus',
                  message: language === 'en'
                    ? 'Medication has been deleted successfully.'
                    : 'Ubat telah dihapus dengan jayanya.',
                  onComplete: () => navigation.goBack(),
                  duration: 800,
                });
              } else {
                throw new Error('Delete failed');
              }
            } catch (error) {
              hapticFeedback.error();
              showAlert({
                type: 'error',
                title: language === 'en' ? 'Error' : 'Ralat',
                message: language === 'en'
                  ? 'Failed to delete medication. Please try again.'
                  : 'Gagal menghapus ubat. Sila cuba lagi.',
                buttons: [
                  {
                    text: language === 'en' ? 'OK' : 'OK',
                    style: 'primary',
                    onPress: () => hideAlert(),
                  },
                ],
              });
            }
          },
        },
      ],
    });
  };

  const frequencyOptions = [
    'Once daily',
    'Twice daily', 
    'Three times daily',
    'Four times daily',
    'As needed',
    'Every 8 hours',
    'Every 12 hours',
    'Weekly'
  ];

  if (isDataLoading) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading medication details...' : 'Memuatkan butiran ubat...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError || medicationsError) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError || medicationsError || 'An error occurred'}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <>
    <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
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
                {language === 'en' ? 'Edit Medication' : 'Edit Ubat'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Update medication details and dosage' : 'Kemas kini butiran ubat dan dos'}
              </Text>
            </View>

            <InteractiveFeedback
              onPress={handleDelete}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={colors.white} />
              </View>
            </InteractiveFeedback>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Current Medication Info */}
        <View style={styles.currentMedicationCard}>
          <View style={styles.currentMedicationHeader}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.currentMedicationTitle}>
              {language === 'en' ? 'Current Medication' : 'Ubat Semasa'}
            </Text>
          </View>
          <Text style={styles.currentMedicationName}>{medicationName}</Text>
          <Text style={styles.currentMedicationNote}>
            {language === 'en' 
              ? 'Edit the fields below to update this medication'
              : 'Edit ruangan di bawah untuk mengemaskini ubat ini'
            }
          </Text>
        </View>

        {/* Medication Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Medication Information' : 'Maklumat Ubat'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Medication Name' : 'Nama Ubat'} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={language === 'en' ? 'Enter medication name' : 'Masukkan nama ubat'}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Dosage' : 'Dos'} *
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.dosage}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))}
                placeholder="5mg"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Frequency' : 'Kekerapan'} *
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.frequency}
                onChangeText={(text) => setFormData(prev => ({ ...prev, frequency: text }))}
                placeholder={language === 'en' ? 'Once daily' : 'Sekali sehari'}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Duration' : 'Tempoh'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.duration}
              onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
              placeholder={language === 'en' ? '30 days, 1 month, etc.' : '30 hari, 1 bulan, dll.'}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Frequency Quick Select */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectLabel}>
              {language === 'en' ? 'Common Frequencies:' : 'Kekerapan Biasa:'}
            </Text>
            <View style={styles.quickSelectOptions}>
              {frequencyOptions.slice(0, 4).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.quickSelectButton,
                    formData.frequency === option && styles.quickSelectButtonSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, frequency: option }));
                    hapticFeedback.selection();
                  }}
                >
                  <Text style={[
                    styles.quickSelectText,
                    formData.frequency === option && styles.quickSelectTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Instructions' : 'Arahan'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Instructions' : 'Arahan Penggunaan'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
              placeholder={language === 'en' 
                ? 'Take with food, in the morning, etc.'
                : 'Ambil bersama makanan, pada waktu pagi, dll.'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Prescriber Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Prescriber Information' : 'Maklumat Penulis Preskripsi'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Prescribed by' : 'Ditulis oleh'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.prescribedBy}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prescribedBy: text }))}
              placeholder={language === 'en' 
                ? 'Dr. Name - Hospital/Clinic' 
                : 'Dr. Nama - Hospital/Klinik'}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Fixed Footer with Save Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={isLoading ? undefined : handleSave}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
                </Text>
              </>
            )}
          </LinearGradient>
        </InteractiveFeedback>
      </View>

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
      {alertConfig && (
        <ModernAlert
          visible={alertConfig !== null}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons || []}
          onClose={hideAlert}
        />
      )}
    </>
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  currentMedicationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentMedicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentMedicationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginLeft: 6,
  },
  currentMedicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentMedicationNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  quickSelectContainer: {
    marginTop: 8,
  },
  quickSelectLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  quickSelectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: colors.primaryAlpha,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickSelectButtonSelected: {
    backgroundColor: colors.primary,
  },
  quickSelectText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  quickSelectTextSelected: {
    color: colors.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  saveButtonDisabled: {
    opacity: 0.9,
  },
  bottomPadding: {
    height: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
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
});