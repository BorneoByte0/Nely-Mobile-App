import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useRecordMedicationTaken, useUserProfile } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      medicationId?: string;
      medicationName?: string;
    };
  };
}

export function TakeMedicationScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { medicationId, medicationName } = route?.params || {};
  const [isLoading, setIsLoading] = useState(false);

  // Database hooks
  const { elderlyProfiles } = useElderlyProfiles();
  const { userProfile } = useUserProfile();
  const { recordMedicationTaken, loading: recordingLoading } = useRecordMedicationTaken();
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
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const [notes, setNotes] = useState('');
  const [dosageTaken, setDosageTaken] = useState('');

  const handleTakeMedication = async () => {
    if (!medicationId || !currentElderly) {
      showSuccess({
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'Medication or elderly profile not found.'
          : 'Ubat atau profil warga emas tidak dijumpai.',
        onComplete: () => navigation.goBack(),
        duration: 800,
      });
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      const takenBy = userProfile?.name || user?.email || 'Unknown';
      const success = await recordMedicationTaken(
        currentElderly.id,
        medicationId,
        takenBy,
        notes || undefined
      );

      if (success) {
        setIsLoading(false);
        stopDotsAnimation();
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Medication Taken!' : 'Ubat Telah Diambil!',
          message: language === 'en'
            ? `${medicationName} has been recorded as taken.`
            : `${medicationName} telah direkodkan sebagai telah diambil.`,
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error('Failed to record medication taken');
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showSuccess({
        title: language === 'en' ? 'Recording Failed' : 'Gagal Merekod',
        message: language === 'en'
          ? 'Unable to record medication. Please try again.'
          : 'Tidak dapat merekod ubat. Sila cuba lagi.',
        onComplete: () => navigation.goBack(),
        duration: 800,
      });
    }
  };

  // Basic validation for required parameters
  if (!medicationId || !medicationName) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text style={styles.errorText}>
            {language === 'en' ? 'Medication information not provided' : 'Maklumat ubat tidak disediakan'}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

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
                {language === 'en' ? 'Take Medication' : 'Ambil Ubat'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Record medication intake and track adherence' : 'Rekod pengambilan ubat dan jejak pematuhan'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>
        {/* Medication Info Card */}
        <LinearGradient
          colors={[colors.success, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.medicationCard}
        >
          <View style={styles.medicationHeader}>
            <Ionicons name="medical" size={24} color={colors.white} />
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medicationName}</Text>
              <Text style={styles.medicationDetails}>
                {language === 'en' ? 'Prescribed medication' : 'Ubat yang dipreskripkan'}
              </Text>
            </View>
          </View>
          <Text style={styles.medicationInstructions}>
            {language === 'en' ? 'Follow prescribed instructions' : 'Ikuti arahan yang ditetapkan'}
          </Text>
        </LinearGradient>

        {/* Dosage Confirmation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Confirm Dosage' : 'Sahkan Dos'}
            </Text>
          </View>
          
          <View style={styles.dosageContainer}>
            <Text style={styles.prescribedDosage}>
              {language === 'en' ? 'Taking medication as prescribed' : 'Mengambil ubat seperti yang ditetapkan'}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'Dosage taken (optional)' : 'Dos yang diambil (pilihan)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={dosageTaken}
                onChangeText={setDosageTaken}
                placeholder={language === 'en' ? 'Enter dosage taken' : 'Masukkan dos yang diambil'}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Time Taken */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Time Taken' : 'Masa Diambil'}
            </Text>
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.currentDate}>
              {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Notes (Optional)' : 'Nota (Pilihan)'}
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={language === 'en' 
                ? 'Any side effects, how you feel, etc.'
                : 'Sebarang kesan sampingan, perasaan, dll.'}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Fixed Footer with Confirm Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={isLoading ? undefined : handleTakeMedication}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.success, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
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
                <Text style={styles.confirmButtonText}>
                  {language === 'en' ? 'Confirm Taken' : 'Sahkan Telah Diambil'}
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
  medicationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 3,
  },
  medicationDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  medicationInstructions: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
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
  dosageContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescribedDosage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  timeContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  currentDate: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmButton: {
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
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.9,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
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