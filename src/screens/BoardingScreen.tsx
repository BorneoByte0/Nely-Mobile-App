import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface BoardingScreenProps {
  onCreateFamily: () => void;
  onJoinFamily: () => void;
}

export const BoardingScreen: React.FC<BoardingScreenProps> = ({
  onCreateFamily,
  onJoinFamily,
}) => {
  const { language } = useLanguage();
  const { showAlert, alertConfig, visible, hideAlert } = useModernAlert();
  const { userProfile, createUserProfile, user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<'create' | 'join' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ensure user profile exists
  React.useEffect(() => {
    const ensureUserProfile = async () => {
      if (user && !userProfile) {
        await createUserProfile({
          name: user.email?.split('@')[0] || 'User',
          role: 'not elderly',
          language: language,
        });
      }
    };

    ensureUserProfile();
  }, [user, userProfile, createUserProfile, language]);

  // Triple dot loading animation
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  const texts = {
    en: {
      title: 'Family Setup',
      subtitle: 'Choose how you want to start using Nely',
      createOption: 'Create New Family Group',
      createDescription: 'Set up a new family group to start tracking health together',
      joinOption: 'Join Existing Family',
      joinDescription: 'Request to join an existing family group',
      familyCodePlaceholder: 'Enter 6-digit family code',
      continueButton: 'Continue',
      selectOption: 'Please select an option to continue',
      invalidCode: 'Please enter a valid 6-digit family code',
      codeNotFound: 'Family code not found. Please check and try again.',
      error: 'Error',
      success: 'Success',
      joiningFamily: 'Joining family group...',
      familyJoined: 'Successfully joined family group!',
      welcome: 'Welcome to the family!',
    },
    ms: {
      title: 'Persediaan Keluarga',
      subtitle: 'Pilih cara anda ingin mula menggunakan Nely',
      createOption: 'Buat Kumpulan Keluarga Baru',
      createDescription: 'Sediakan kumpulan keluarga baru untuk mula menjejak kesihatan bersama',
      joinOption: 'Sertai Keluarga Sedia Ada',
      joinDescription: 'Minta untuk menyertai kumpulan keluarga sedia ada',
      familyCodePlaceholder: 'Masukkan kod keluarga 6-digit',
      continueButton: 'Teruskan',
      selectOption: 'Sila pilih pilihan untuk teruskan',
      invalidCode: 'Sila masukkan kod keluarga 6-digit yang sah',
      codeNotFound: 'Kod keluarga tidak dijumpai. Sila semak dan cuba lagi.',
      error: 'Ralat',
      success: 'Berjaya',
      joiningFamily: 'Menyertai kumpulan keluarga...',
      familyJoined: 'Berjaya menyertai kumpulan keluarga!',
      welcome: 'Selamat datang ke keluarga!',
    },
  };

  const t = texts[language];

  // Loading animation effect
  React.useEffect(() => {
    if (isLoading) {
      const animateSequence = () => {
        const createAnimation = (dot: Animated.Value, delay: number) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);

        Animated.loop(
          Animated.parallel([
            createAnimation(dot1, 0),
            createAnimation(dot2, 200),
            createAnimation(dot3, 400),
          ])
        ).start();
      };
      animateSequence();
    } else {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      dot1.setValue(0.4);
      dot2.setValue(0.4);
      dot3.setValue(0.4);
    }
  }, [isLoading, dot1, dot2, dot3]);

  const handleOptionSelect = (option: 'create' | 'join') => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (!selectedOption) {
      showAlert({
        type: 'error',
        title: t.error,
        message: t.selectOption,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }

    if (selectedOption === 'create') {
      onCreateFamily();
      return;
    }

    // Navigate to join request screen
    onJoinFamily();
  };

  const canContinue = selectedOption !== null;

  return (
    <SafeAreaWrapper gradientVariant="onboarding">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Create New Family Option */}
          <InteractiveFeedback
            onPress={() => handleOptionSelect('create')}
            disabled={isLoading}
          >
            <View style={[
              styles.optionCard,
              selectedOption === 'create' && styles.optionCardSelected,
            ]}>
              <View style={styles.optionHeader}>
                <View style={[
                  styles.optionIcon,
                  selectedOption === 'create' && styles.optionIconSelected,
                ]}>
                  <Ionicons
                    name="add-circle"
                    size={32}
                    color={selectedOption === 'create' ? colors.white : colors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    selectedOption === 'create' && styles.optionTitleSelected,
                  ]}>
                    {t.createOption}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    selectedOption === 'create' && styles.optionDescriptionSelected,
                  ]}>
                    {t.createDescription}
                  </Text>
                </View>
              </View>

              {selectedOption === 'create' && (
                <View style={styles.selectionIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                </View>
              )}
            </View>
          </InteractiveFeedback>

          {/* Join Existing Family Option */}
          <InteractiveFeedback
            onPress={() => handleOptionSelect('join')}
            disabled={isLoading}
          >
            <View style={[
              styles.optionCard,
              selectedOption === 'join' && styles.optionCardSelected,
            ]}>
              <View style={styles.optionHeader}>
                <View style={[
                  styles.optionIcon,
                  selectedOption === 'join' && styles.optionIconSelected,
                ]}>
                  <Ionicons
                    name="enter"
                    size={32}
                    color={selectedOption === 'join' ? colors.white : colors.secondary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    selectedOption === 'join' && styles.optionTitleSelected,
                  ]}>
                    {t.joinOption}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    selectedOption === 'join' && styles.optionDescriptionSelected,
                  ]}>
                    {t.joinDescription}
                  </Text>
                </View>
              </View>

              {selectedOption === 'join' && (
                <View style={styles.selectionIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                </View>
              )}
            </View>
          </InteractiveFeedback>

        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <InteractiveFeedback
            onPress={handleContinue}
            disabled={!canContinue || isLoading}
            style={[
              styles.continueButton,
              (!canContinue || isLoading) && styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={
                !canContinue || isLoading
                  ? [colors.gray400, colors.gray300]
                  : [colors.primary, colors.secondary, colors.success]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
                  <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
                  <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
                </View>
              ) : (
                <Text style={styles.continueButtonText}>{t.continueButton}</Text>
              )}
            </LinearGradient>
          </InteractiveFeedback>
        </View>
      </ScrollView>

      {visible && alertConfig && (
        <ModernAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    backgroundColor: colors.primaryAlpha,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSelected: {
    backgroundColor: colors.white + '33', // 20% opacity white
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  optionTitleSelected: {
    color: colors.white,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: colors.white + 'CC', // 80% opacity white
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  codeInputContainer: {
    marginTop: 8,
  },
  codeInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.primary,
    letterSpacing: 2,
  },
  buttonContainer: {
    paddingTop: 24,
  },
  continueButton: {
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
});