import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
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
import { useCreateAppointmentOutcome, useElderlyProfiles } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      appointmentId?: string;
      doctorName?: string;
      appointmentType?: string;
    };
  };
}

export function AppointmentOutcomeScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { userProfile } = useAuth();
  const { appointmentId, doctorName, appointmentType } = route?.params || {};
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showError, hideAlert } = useModernAlert();

  // Database hooks
  const { elderlyProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0]; // For demo, use first elderly profile
  const { createOutcome, loading: createLoading, error: createError } = useCreateAppointmentOutcome();

  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  const [testResults, setTestResults] = useState('');
  const [newMedications, setNewMedications] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextAppointment, setNextAppointment] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [isLoading, setIsLoading] = useState(false);


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

  const handleSaveOutcome = async () => {
    if (!diagnosis.trim() || !doctorNotes.trim()) {
      showError(
        language === 'en' ? 'Required Fields' : 'Medan Diperlukan',
        language === 'en'
          ? 'Please fill in the diagnosis and doctor\'s notes fields.'
          : 'Sila isi medan diagnosis dan nota doktor.'
      );
      return;
    }

    if (!appointmentId || !currentElderly?.id) {
      showError(
        language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        language === 'en'
          ? 'Appointment or patient information is missing.'
          : 'Maklumat temujanji atau pesakit hilang.'
      );
      return;
    }

    setIsLoading(true);
    startDotsAnimation();

    try {
      const outcomeData = {
        appointmentId: appointmentId,
        elderlyId: currentElderly.id,
        diagnosis: diagnosis.trim(),
        doctorNotes: doctorNotes.trim(),
        testResults: testResults.trim() || undefined,
        newMedications: newMedications.trim() || undefined,
        prescriptions: prescriptions.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        nextAppointmentRecommended: nextAppointment.trim().length > 0,
        outcomeRecordedBy: userProfile?.name || 'Healthcare Provider',
      };

      const result = await createOutcome(outcomeData);

      if (result) {
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Appointment Completed!' : 'Temujanji Selesai!',
          message: language === 'en'
            ? 'Appointment outcome has been recorded successfully.'
            : 'Hasil temujanji telah direkodkan dengan jayanya.',
          onComplete: () => {
            // Navigate to Family screen and reset stack to prevent back navigation to edit screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Family' }],
            });
          },
          duration: 800,
        });
      } else {
        throw new Error(createError || 'Failed to save outcome');
      }
    } catch (error) {
      hapticFeedback.error();
      showError(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'Failed to save appointment outcome. Please try again.'
          : 'Gagal menyimpan hasil temujanji. Sila cuba lagi.'
      );
    } finally {
      setIsLoading(false);
      stopDotsAnimation();
    }
  };

  return (
    <>
    <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
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
                {language === 'en' ? 'Appointment Outcome' : 'Hasil Temujanji'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Record medical outcomes and next steps' : 'Rekod hasil perubatan dan langkah seterusnya'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Required Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Required Information' : 'Maklumat Diperlukan'}
          </Text>
          
          {/* Diagnosis */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Diagnosis' : 'Diagnosis'} *
            </Text>
            <TextInput
              style={[styles.textInput, styles.singleLineInput]}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder={language === 'en' ? 'Enter diagnosis...' : 'Masukkan diagnosis...'}
              placeholderTextColor={colors.textMuted}
              multiline={false}
            />
          </View>

          {/* Doctor's Notes */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? "Doctor's Notes" : 'Nota Doktor'} *
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={doctorNotes}
              onChangeText={setDoctorNotes}
              placeholder={language === 'en' ? 'Enter detailed notes about the appointment...' : 'Masukkan nota terperinci tentang temujanji...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Optional Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Additional Information (Optional)' : 'Maklumat Tambahan (Pilihan)'}
          </Text>
          
          {/* Test Results */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Test Results' : 'Keputusan Ujian'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={testResults}
              onChangeText={setTestResults}
              placeholder={language === 'en' ? 'Enter test results if any...' : 'Masukkan keputusan ujian jika ada...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* New Medications */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'New Medications' : 'Ubat Baharu'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={newMedications}
              onChangeText={setNewMedications}
              placeholder={language === 'en' ? 'List any new medications prescribed...' : 'Senaraikan ubat baharu yang diberikan...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Recommendations */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Doctor Recommendations' : 'Cadangan Doktor'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder={language === 'en' ? 'Enter doctor\'s recommendations...' : 'Masukkan cadangan doktor...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Next Appointment */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Next Appointment' : 'Temujanji Seterusnya'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.singleLineInput]}
              value={nextAppointment}
              onChangeText={setNextAppointment}
              placeholder={language === 'en' ? 'e.g., Follow-up in 3 months' : 'cth: Susulan dalam 3 bulan'}
              placeholderTextColor={colors.textMuted}
              multiline={false}
            />
          </View>

          {/* Prescriptions */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Prescriptions' : 'Preskripsi'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={prescriptions}
              onChangeText={setPrescriptions}
              placeholder={language === 'en' ? 'List prescriptions and instructions...' : 'Senaraikan preskripsi dan arahan...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={handleSaveOutcome}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading || createLoading}
        >
          <LinearGradient
            colors={[colors.success, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, (isLoading || createLoading) && styles.saveButtonDisabled]}
          >
            {(isLoading || createLoading) ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Complete Appointment' : 'Selesaikan Temujanji'}
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
    borderRadius: 16,
    margin: 20,
    marginBottom: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textPrimary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  singleLineInput: {
    height: 50,
    paddingVertical: 16,
  },
  multiLineInput: {
    minHeight: 100,
    paddingVertical: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
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
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
