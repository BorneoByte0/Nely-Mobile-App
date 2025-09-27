import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ModernAlert } from '../components/ModernAlert';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAddMedication } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationPeriod: string;
  instructions: string;
  prescribedBy: string;
}

export function AddMedicationScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Database hooks
  const { elderlyProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { addMedication, loading: addingLoading, error: addingError } = useAddMedication();

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
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showError, hideAlert } = useModernAlert();
  const [formData, setFormData] = useState<MedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    durationPeriod: 'days',
    instructions: '',
    prescribedBy: '',
  });

  // Duration period options
  const durationPeriods = [
    { value: 'days', labelEn: 'Days', labelMs: 'Hari' },
    { value: 'weeks', labelEn: 'Weeks', labelMs: 'Minggu' },
    { value: 'months', labelEn: 'Months', labelMs: 'Bulan' },
    { value: 'years', labelEn: 'Years', labelMs: 'Tahun' },
  ];

  // Common duration values
  const commonDurations = [
    { value: '7', period: 'days', labelEn: '1 Week', labelMs: '1 Minggu' },
    { value: '14', period: 'days', labelEn: '2 Weeks', labelMs: '2 Minggu' },
    { value: '1', period: 'months', labelEn: '1 Month', labelMs: '1 Bulan' },
    { value: '3', period: 'months', labelEn: '3 Months', labelMs: '3 Bulan' },
    { value: '6', period: 'months', labelEn: '6 Months', labelMs: '6 Bulan' },
    { value: '1', period: 'years', labelEn: '1 Year', labelMs: '1 Tahun' },
  ];

  const handleSave = async () => {
    // Basic validation
    if (!formData.name || !formData.dosage || !formData.frequency) {
      showError(
        language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        language === 'en'
          ? 'Please fill in medication name, dosage, and frequency.'
          : 'Sila isi nama ubat, dos, dan kekerapan.'
      );
      return;
    }

    if (!currentElderly) {
      showError(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'No elderly profile found. Please try again.'
          : 'Tiada profil warga emas dijumpai. Sila cuba lagi.'
      );
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      // Calculate end date if duration is provided
      let endDate: string | undefined;
      if (formData.duration) {
        const durationValue = parseInt(formData.duration);
        if (!isNaN(durationValue)) {
          const end = new Date();

          switch (formData.durationPeriod) {
            case 'days':
              end.setDate(end.getDate() + durationValue);
              break;
            case 'weeks':
              end.setDate(end.getDate() + (durationValue * 7));
              break;
            case 'months':
              end.setMonth(end.getMonth() + durationValue);
              break;
            case 'years':
              end.setFullYear(end.getFullYear() + durationValue);
              break;
          }
          endDate = end.toISOString();
        }
      }

      // Prepare medication data
      const medicationData = {
        elderlyId: currentElderly.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions || '',
        prescribedBy: formData.prescribedBy || '',
        startDate: new Date().toISOString(),
        endDate,
        isActive: true,
      };

      const success = await addMedication(medicationData);

      if (success) {
        setIsLoading(false);
        stopDotsAnimation();
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Medication Added!' : 'Ubat Ditambahkan!',
          message: language === 'en'
            ? 'Medication added successfully!'
            : 'Ubat berjaya ditambahkan!',
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error(addingError || 'Failed to add medication');
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showError(
        language === 'en' ? 'Add Failed' : 'Gagal Tambah',
        language === 'en'
          ? 'Unable to add medication. Please check your connection and try again.'
          : 'Tidak dapat menambah ubat. Sila semak sambungan anda dan cuba lagi.'
      );
    }
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

  return (
    <>
    <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
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
                {language === 'en' ? 'Add Medication' : 'Tambah Ubat'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Add new medication for care management' : 'Tambah ubat baharu untuk pengurusan penjagaan'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

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

          {/* Duration Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Duration' : 'Tempoh'}
            </Text>

            {/* Duration Input Row */}
            <View style={styles.durationInputRow}>
              <View style={styles.durationNumberContainer}>
                <TextInput
                  style={[styles.textInput, styles.durationNumberInput]}
                  value={formData.duration}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text.replace(/[^0-9]/g, '') }))}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={styles.durationPeriodContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.durationPeriodScroll}
                >
                  {durationPeriods.map((period) => (
                    <TouchableOpacity
                      key={period.value}
                      style={[
                        styles.durationPeriodButton,
                        formData.durationPeriod === period.value && styles.durationPeriodButtonActive
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, durationPeriod: period.value }));
                        hapticFeedback.selection();
                      }}
                    >
                      <Text style={[
                        styles.durationPeriodText,
                        formData.durationPeriod === period.value && styles.durationPeriodTextActive
                      ]}>
                        {language === 'en' ? period.labelEn : period.labelMs}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Common Duration Quick Select */}
            <View style={styles.quickSelectContainer}>
              <Text style={styles.quickSelectLabel}>
                {language === 'en' ? 'Common Durations:' : 'Tempoh Biasa:'}
              </Text>
              <View style={styles.quickSelectOptions}>
                {commonDurations.map((duration, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickSelectButton,
                      formData.duration === duration.value && formData.durationPeriod === duration.period && styles.quickSelectButtonActive
                    ]}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        duration: duration.value,
                        durationPeriod: duration.period
                      }));
                      hapticFeedback.selection();
                    }}
                  >
                    <Text style={[
                      styles.quickSelectText,
                      formData.duration === duration.value && formData.durationPeriod === duration.period && styles.quickSelectTextActive
                    ]}>
                      {language === 'en' ? duration.labelEn : duration.labelMs}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
                  style={styles.quickSelectButton}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, frequency: option }));
                    hapticFeedback.selection();
                  }}
                >
                  <Text style={styles.quickSelectText}>{option}</Text>
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
            colors={[colors.success, colors.primary]}
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
                  {language === 'en' ? 'Add Medication' : 'Tambah Ubat'}
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
  },
  quickSelectText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  quickSelectButtonActive: {
    backgroundColor: colors.primary,
  },
  quickSelectTextActive: {
    color: colors.white,
  },
  // Duration specific styles
  durationInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  durationNumberContainer: {
    flex: 0.3,
  },
  durationNumberInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  durationPeriodContainer: {
    flex: 0.7,
  },
  durationPeriodScroll: {
    gap: 8,
  },
  durationPeriodButton: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  durationPeriodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationPeriodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  durationPeriodTextActive: {
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