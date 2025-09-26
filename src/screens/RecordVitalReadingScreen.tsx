import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ModernAlert } from '../components/ModernAlert';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useRecordVitalSigns, useUserProfile } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';

interface VitalSignsForm {
  systolic: string;
  diastolic: string;
  spO2: string;
  pulse: string;
  temperature: string;
  weight: string;
  bloodGlucose: string;
  notes: string;
}

interface Props {
  navigation: any;
}

export function RecordVitalReadingScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { alertConfig, visible: alertVisible, showAlert, hideAlert, showError } = useModernAlert();
  const [isLoading, setIsLoading] = useState(false);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const { userProfile } = useUserProfile();
  const { recordVitalSigns, loading: recordingLoading, error: recordingError } = useRecordVitalSigns();

  // Get current elderly profile (first one for demo)
  const currentElderly = elderlyProfiles[0];
  
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
  const [formData, setFormData] = useState<VitalSignsForm>({
    systolic: '',
    diastolic: '',
    spO2: '',
    pulse: '',
    temperature: '',
    weight: '',
    bloodGlucose: '',
    notes: '',
  });

  const handleSave = async () => {
    console.log('=== VITAL SIGNS SAVE STARTED ===');
    console.log('Form data:', formData);
    console.log('Current elderly:', currentElderly);
    console.log('User profile:', userProfile);
    console.log('User:', user);

    // Basic validation
    if (!formData.systolic || !formData.diastolic) {
      console.log('❌ Validation failed: Missing blood pressure');
      showError(
        language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        language === 'en'
          ? 'Please enter at least blood pressure readings.'
          : 'Sila masukkan sekurang-kurangnya bacaan tekanan darah.'
      );
      return;
    }

    if (!currentElderly) {
      console.log('❌ Validation failed: No elderly profile');
      showError(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'No elderly profile found. Please try again.'
          : 'Tiada profil warga emas dijumpai. Sila cuba lagi.'
      );
      return;
    }

    console.log('✅ Validation passed');
    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      // Prepare vital signs data
      const vitalData = {
        bloodPressure: {
          systolic: parseInt(formData.systolic),
          diastolic: parseInt(formData.diastolic),
        },
        ...(formData.spO2 && { spO2: { value: parseFloat(formData.spO2) } }),
        ...(formData.pulse && { pulse: { value: parseInt(formData.pulse) } }),
        ...(formData.temperature && { temperature: { value: parseFloat(formData.temperature) } }),
        ...(formData.weight && { weight: { value: parseFloat(formData.weight) } }),
        ...(formData.bloodGlucose && {
          bloodGlucose: {
            value: parseFloat(formData.bloodGlucose),
            testType: 'random'
          }
        }),
        notes: formData.notes || undefined,
      };

      const recordedBy = userProfile?.name || user?.email || 'Unknown';
      console.log('📝 Prepared vital data:', vitalData);
      console.log('👤 Recorded by:', recordedBy);
      console.log('🆔 Elderly ID:', currentElderly.id);

      console.log('🚀 Calling recordVitalSigns...');
      const success = await recordVitalSigns(currentElderly.id, vitalData, recordedBy);
      console.log('📊 recordVitalSigns result:', success);

      if (success) {
        console.log('🎉 Success! Showing success animation...');
        setIsLoading(false);
        stopDotsAnimation();
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Success!' : 'Berjaya!',
          message: language === 'en'
            ? 'Vital signs recorded successfully!'
            : 'Tanda vital berjaya direkodkan!',
          onComplete: () => {
            console.log('🔙 Navigating back...');
            navigation.goBack();
          },
          duration: 800,
        });
      } else {
        throw new Error(recordingError || 'Failed to record vital signs');
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showError(
        language === 'en' ? 'Recording Failed' : 'Gagal Merekod',
        language === 'en'
          ? 'Unable to record vital signs. Please check your connection and try again.'
          : 'Tidak dapat merekod tanda vital. Sila semak sambungan anda dan cuba lagi.'
      );
    }
  };

  const getStatusColor = (value: string, type: 'bp' | 'spO2' | 'pulse' | 'temp' | 'glucose') => {
    if (!value) return colors.gray300;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return colors.gray300;

    switch (type) {
      case 'bp':
        const systolic = parseFloat(formData.systolic);
        const diastolic = parseFloat(formData.diastolic);
        if (systolic > 160 || diastolic > 100) return colors.error;
        if (systolic > 140 || diastolic > 90) return colors.warning;
        return colors.success;
      case 'spO2':
        if (numValue < 90) return colors.error;
        if (numValue < 95) return colors.warning;
        return colors.success;
      case 'pulse':
        if (numValue < 50 || numValue > 120) return colors.error;
        if (numValue < 60 || numValue > 100) return colors.warning;
        return colors.success;
      case 'temp':
        if (numValue > 38.5) return colors.error;
        if (numValue > 37.5) return colors.warning;
        return colors.success;
      case 'glucose':
        if (numValue > 15) return colors.error;
        if (numValue > 10) return colors.warning;
        return colors.success;
      default:
        return colors.gray300;
    }
  };

  return (
    <>
    <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
      {/* Modern Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
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
              {language === 'en' ? 'Record Vital Signs' : 'Rekod Tanda Vital'}
            </Text>
            <Text style={styles.modernHeaderSubtitle}>
              {language === 'en' ? 'Enter current health measurements' : 'Masukkan pengukuran kesihatan semasa'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Blood Pressure Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}
            </Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Systolic' : 'Sistolik'} (mmHg)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: getStatusColor(formData.systolic, 'bp') }]}
                value={formData.systolic}
                onChangeText={(text) => setFormData(prev => ({ ...prev, systolic: text }))}
                placeholder="120"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Diastolic' : 'Diastolik'} (mmHg)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: getStatusColor(formData.diastolic, 'bp') }]}
                value={formData.diastolic}
                onChangeText={(text) => setFormData(prev => ({ ...prev, diastolic: text }))}
                placeholder="80"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Other Vital Signs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Other Measurements' : 'Pengukuran Lain'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>SpO2 (%)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: getStatusColor(formData.spO2, 'spO2') }]}
              value={formData.spO2}
              onChangeText={(text) => setFormData(prev => ({ ...prev, spO2: text }))}
              placeholder="98"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Pulse Rate' : 'Kadar Nadi'} (bpm)
            </Text>
            <TextInput
              style={[styles.textInput, { borderColor: getStatusColor(formData.pulse, 'pulse') }]}
              value={formData.pulse}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pulse: text }))}
              placeholder="72"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Temperature' : 'Suhu'} (°C)
            </Text>
            <TextInput
              style={[styles.textInput, { borderColor: getStatusColor(formData.temperature, 'temp') }]}
              value={formData.temperature}
              onChangeText={(text) => setFormData(prev => ({ ...prev, temperature: text }))}
              placeholder="36.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Weight' : 'Berat'} (kg)
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
              placeholder="65"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Blood Glucose' : 'Gula Darah'} (mmol/L)
            </Text>
            <TextInput
              style={[styles.textInput, { borderColor: getStatusColor(formData.bloodGlucose, 'glucose') }]}
              value={formData.bloodGlucose}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bloodGlucose: text }))}
              placeholder="5.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Additional Notes' : 'Nota Tambahan'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Notes (Optional)' : 'Nota (Pilihan)'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder={language === 'en' 
                ? 'Any observations about health condition...' 
                : 'Sebarang pemerhatian tentang keadaan kesihatan...'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
                <Ionicons name="checkmark" size={24} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Save Vital Signs' : 'Simpan Tanda Vital'}
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
    marginBottom: 16,
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
    height: 100,
    paddingTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  saveButtonDisabled: {
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