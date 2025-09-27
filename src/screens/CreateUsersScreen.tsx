import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useUpdateUserProfile } from '../hooks/useDatabase';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
  onSetupComplete?: () => void;
}

export function CreateUsersScreen({ navigation, onSetupComplete }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showError, hideAlert } = useModernAlert();
  const { updateUserProfile } = useUpdateUserProfile();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.email?.split('@')[0] || '',
    phone: '',
    isElderly: false,
    age: '',
  });

  const texts = {
    en: {
      title: 'Set Up Your Profile',
      subtitle: 'Tell us about yourself to personalize your experience',
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      userType: 'Are You A?',
      elderlyOption: 'I am an elderly person',
      notElderlyOption: 'I am a family member',
      age: 'Age',
      continueButton: 'Continue to Family Setup',
      nameRequired: 'Please enter your full name',
      ageRequired: 'Please enter your age',
      invalidAge: 'Please enter a valid age between 1 and 120',
      setupComplete: 'Profile Setup Complete!',
      profileCreated: 'Your profile has been created successfully.',
    },
    ms: {
      title: 'Sediakan Profil Anda',
      subtitle: 'Beritahu kami tentang diri anda untuk memperibadikan pengalaman anda',
      fullName: 'Nama Penuh',
      phoneNumber: 'Nombor Telefon',
      userType: 'Adakah Anda?',
      elderlyOption: 'Saya seorang warga emas',
      notElderlyOption: 'Saya ahli keluarga',
      age: 'Umur',
      continueButton: 'Teruskan ke Sediaan Keluarga',
      nameRequired: 'Sila masukkan nama penuh anda',
      ageRequired: 'Sila masukkan umur anda',
      invalidAge: 'Sila masukkan umur yang sah antara 1 dan 120',
      setupComplete: 'Sediaan Profil Selesai!',
      profileCreated: 'Profil anda telah berjaya dibuat.',
    }
  };

  const currentTexts = texts[language];

  const handleContinue = async () => {
    // Validation
    if (!formData.name.trim()) {
      showError('Error', currentTexts.nameRequired);
      return;
    }

    if (!formData.age.trim()) {
      showError('Error', currentTexts.ageRequired);
      return;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 1 || age > 120) {
      showError('Error', currentTexts.invalidAge);
      return;
    }

    setIsLoading(true);
    hapticFeedback.medium();

    try {
      // Prepare user data for database update
      const updatedUserData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.isElderly ? 'elderly' as const : 'not elderly' as const,
      };

      // Update user profile in database
      const success = await updateUserProfile(updatedUserData);

      if (success) {
        setIsLoading(false);
        hapticFeedback.success();

        showSuccess({
          title: currentTexts.setupComplete,
          message: currentTexts.profileCreated,
          onComplete: () => {
            onSetupComplete?.();
          },
          duration: 1200,
        });
      } else {
        throw new Error('Failed to update profile');
      }

    } catch (error) {
      setIsLoading(false);
      hapticFeedback.error();
      showError('Error', 'Failed to create profile. Please try again.');
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Modern Gradient Header */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>
                  {currentTexts.title}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {currentTexts.subtitle}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {/* Name Section */}
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {currentTexts.fullName} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder={language === 'en' ? 'Enter your full name' : 'Masukkan nama penuh anda'}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {currentTexts.phoneNumber}
                </Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>+60</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={formData.phone.replace('+60 ', '')}
                    onChangeText={(value) => {
                      // Format the number and add +60 prefix
                      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2 $3');
                      updateFormData('phone', `+60 ${formatted}`);
                    }}
                    placeholder="12-345 6789"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
            </View>

            {/* User Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {currentTexts.userType} *
              </Text>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    !formData.isElderly && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    hapticFeedback.light();
                    updateFormData('isElderly', false);
                  }}
                >
                  <View style={[
                    styles.radioButton,
                    !formData.isElderly && styles.radioButtonSelected
                  ]}>
                    {!formData.isElderly && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    !formData.isElderly && styles.optionTextSelected
                  ]}>
                    {currentTexts.notElderlyOption}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.isElderly && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    hapticFeedback.light();
                    updateFormData('isElderly', true);
                  }}
                >
                  <View style={[
                    styles.radioButton,
                    formData.isElderly && styles.radioButtonSelected
                  ]}>
                    {formData.isElderly && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    formData.isElderly && styles.optionTextSelected
                  ]}>
                    {currentTexts.elderlyOption}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Age Section */}
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {currentTexts.age} *
                </Text>
                <TextInput
                  style={[styles.textInput, styles.ageInput]}
                  value={formData.age}
                  onChangeText={(value) => updateFormData('age', value)}
                  placeholder={language === 'en' ? 'Enter your age' : 'Masukkan umur anda'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <InteractiveFeedback
            onPress={isLoading ? undefined : handleContinue}
            feedbackType="scale"
            hapticType="medium"
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.success, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            >
              {isLoading ? (
                <View style={styles.loadingDots}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={20} color={colors.white} />
                  <Text style={styles.continueButtonText}>
                    {currentTexts.continueButton}
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
  // Header
  header: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form Container
  formContainer: {
    paddingHorizontal: 20,
  },

  // Sections
  section: {
    backgroundColor: colors.white,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  ageInput: {
    maxWidth: 120,
  },

  // Phone Input Styles
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  countryCodeContainer: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.gray200,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },

  // Option Buttons (Radio Buttons)
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 12,
    gap: 12,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  continueButtonDisabled: {
    opacity: 0.9,
  },

  // Loading Styles
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },

  bottomPadding: {
    height: 20,
  },
});