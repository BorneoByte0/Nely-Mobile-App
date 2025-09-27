import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useUserProfile } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';
import { useEffect } from 'react';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      userId?: string;
    };
  };
}

export function EditUserProfileScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { updateUserProfile } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Database hooks
  const { userProfile, loading: profileLoading, error: profileError } = useUserProfile();
  
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
  
  // Form state - initialize with empty values, will be populated from database
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    relationship: 'son',
    emergencyContact: '',
    address: '',
    dateOfBirth: '1985-03-15',
    occupation: '',
  });

  // Load user profile data from database
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role || '',
        relationship: 'son', // Default since not in User schema
        emergencyContact: '', // Default since not in User schema
        address: '', // Default since not in User schema
        dateOfBirth: '1985-03-15', // Default since not in User schema
        occupation: '', // Default since not in User schema
      });
    } else {
      // Fallback to default values for demo
      setFormData({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+60 12-345 6789',
        role: 'not elderly',
        relationship: 'son',
        emergencyContact: '+60 12-987 6543',
        address: '123 Jalan Merdeka, Kuala Lumpur 50050',
        dateOfBirth: '1985-03-15',
        occupation: 'Software Engineer',
      });
    }
  }, [userProfile]);

  const relationships = [
    { value: 'son', labelEn: 'Son', labelMs: 'Anak lelaki' },
    { value: 'daughter', labelEn: 'Daughter', labelMs: 'Anak perempuan' },
    { value: 'son-in-law', labelEn: 'Son-in-law', labelMs: 'Menantu lelaki' },
    { value: 'daughter-in-law', labelEn: 'Daughter-in-law', labelMs: 'Menantu perempuan' },
    { value: 'grandchild', labelEn: 'Grandchild', labelMs: 'Cucu' },
    { value: 'other', labelEn: 'Other', labelMs: 'Lain-lain' }
  ];

  const roleOptions = [
    { value: 'Primary Caregiver', labelEn: 'Primary Caregiver', labelMs: 'Penjaga Utama' },
    { value: 'Secondary Caregiver', labelEn: 'Secondary Caregiver', labelMs: 'Penjaga Kedua' },
    { value: 'Medical Coordinator', labelEn: 'Medical Coordinator', labelMs: 'Koordinator Perubatan' },
    { value: 'Emergency Contact', labelEn: 'Emergency Contact', labelMs: 'Hubungan Kecemasan' },
    { value: 'Family Member', labelEn: 'Family Member', labelMs: 'Ahli Keluarga' },
    { value: 'Healthcare Professional', labelEn: 'Healthcare Professional', labelMs: 'Profesional Kesihatan' }
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      updateFormData('dateOfBirth', dateString);
    }
  };

  const handleRoleSelect = (roleValue: string) => {
    updateFormData('role', roleValue);
    setShowRoleDropdown(false);
    hapticFeedback.light();
  };

  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'en' ? 'en-US' : 'ms-MY',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const getCurrentRole = () => {
    const role = roleOptions.find(r => r.value === formData.role);
    return role ? (language === 'en' ? role.labelEn : role.labelMs) : formData.role;
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      Alert.alert(
        language === 'en' ? 'Required Fields' : 'Medan Diperlukan',
        language === 'en'
          ? 'Please fill in all required fields.'
          : 'Sila isi semua medan yang diperlukan.',
        [{ text: language === 'en' ? 'OK' : 'Baik', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);
    startDotsAnimation();

    try {
      const profileData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        preferred_language: language,
      };

      console.log('Updating profile with:', profileData);
      const { error } = await updateUserProfile(profileData);

      if (!error) {
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Profile Updated!' : 'Profil Dikemas kini!',
          message: language === 'en'
            ? 'Your profile has been successfully updated.'
            : 'Profil anda telah berjaya dikemas kini.',
          onComplete: () => navigation?.goBack(),
          duration: 800,
        });
      } else {
        console.log('Profile update error:', error);
        throw error;
      }
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'Failed to update profile. Please try again.'
          : 'Gagal mengemas kini profil. Sila cuba lagi.',
        [{ text: language === 'en' ? 'OK' : 'Baik', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
      stopDotsAnimation();
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (profileLoading) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading profile...' : 'Memuatkan profil...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profileError) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profileError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.secondary, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <InteractiveFeedback
              onPress={() => navigation?.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Edit Profile' : 'Edit Profil'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Update your personal information' : 'Kemas kini maklumat peribadi anda'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content - always visible, overlay will cover when loading */}
          <>
            {/* Basic Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Basic Information' : 'Maklumat Asas'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Full Name' : 'Nama Penuh'} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder={language === 'en' ? 'Enter your full name' : 'Masukkan nama penuh anda'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Email Address' : 'Alamat E-mel'} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder={language === 'en' ? 'Enter your email address' : 'Masukkan alamat e-mel anda'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Phone Number' : 'Nombor Telefon'} *
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
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Date of Birth' : 'Tarikh Lahir'}
                  </Text>
                  <InteractiveFeedback
                    onPress={() => {
                      setShowDatePicker(true);
                      hapticFeedback.light();
                    }}
                    feedbackType="scale"
                    hapticType="light"
                  >
                    <View style={styles.datePickerButton}>
                      <Text style={styles.dateText}>
                        {formatDateForDisplay(formData.dateOfBirth)}
                      </Text>
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                    </View>
                  </InteractiveFeedback>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(formData.dateOfBirth)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1940, 0, 1)}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Family Role Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Family Role' : 'Peranan Keluarga'}
              </Text>
              
              <View style={styles.optionsContainer}>
                {relationships.map((relationship) => (
                  <InteractiveFeedback
                    key={relationship.value}
                    onPress={() => {
                      hapticFeedback.light();
                      updateFormData('relationship', relationship.value);
                    }}
                    feedbackType="scale"
                    hapticType="light"
                  >
                    <View style={[
                      styles.optionButton,
                      formData.relationship === relationship.value && styles.optionButtonSelected
                    ]}>
                      <View style={[
                        styles.radioButton,
                        formData.relationship === relationship.value && styles.radioButtonSelected
                      ]}>
                        {formData.relationship === relationship.value && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.optionText,
                        formData.relationship === relationship.value && styles.optionTextSelected
                      ]}>
                        {language === 'en' ? relationship.labelEn : relationship.labelMs}
                      </Text>
                    </View>
                  </InteractiveFeedback>
                ))}
              </View>
            </View>

            {/* Professional Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Professional Information' : 'Maklumat Profesional'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Occupation' : 'Pekerjaan'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.occupation}
                  onChangeText={(value) => updateFormData('occupation', value)}
                  placeholder={language === 'en' ? 'Enter your occupation' : 'Masukkan pekerjaan anda'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Role in Care' : 'Peranan dalam Penjagaan'}
                </Text>
                <InteractiveFeedback
                  onPress={() => {
                    setShowRoleDropdown(!showRoleDropdown);
                    hapticFeedback.light();
                  }}
                  feedbackType="scale"
                  hapticType="light"
                >
                  <View style={styles.dropdownButton}>
                    <Text style={styles.dropdownText}>
                      {getCurrentRole()}
                    </Text>
                    <Ionicons 
                      name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                </InteractiveFeedback>
                
                {showRoleDropdown && (
                  <View style={styles.dropdownOptions}>
                    {roleOptions.map((role) => (
                      <InteractiveFeedback
                        key={role.value}
                        onPress={() => handleRoleSelect(role.value)}
                        feedbackType="scale"
                        hapticType="light"
                      >
                        <View style={[
                          styles.dropdownOption,
                          formData.role === role.value && styles.dropdownOptionSelected
                        ]}>
                          <Text style={[
                            styles.dropdownOptionText,
                            formData.role === role.value && styles.dropdownOptionTextSelected
                          ]}>
                            {language === 'en' ? role.labelEn : role.labelMs}
                          </Text>
                          {formData.role === role.value && (
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                          )}
                        </View>
                      </InteractiveFeedback>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Contact Information' : 'Maklumat Hubungan'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Home Address' : 'Alamat Rumah'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.address}
                  onChangeText={(value) => updateFormData('address', value)}
                  placeholder={language === 'en' ? 'Enter your home address' : 'Masukkan alamat rumah anda'}
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Emergency Contact' : 'Hubungan Kecemasan'}
                </Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCodeText}>+60</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={formData.emergencyContact.replace('+60 ', '')}
                    onChangeText={(value) => {
                      // Format the number and add +60 prefix
                      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2 $3');
                      updateFormData('emergencyContact', `+60 ${formatted}`);
                    }}
                    placeholder="12-987 6543"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
            </View>
          </>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer */}
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
              end={{ x: 1, y: 1 }}
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
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // Header
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

  // Sections
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
    zIndex: 1,
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
    position: 'relative',
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  textArea: {
    height: 100,
    paddingTop: 12,
  },

  // Option Buttons (Radio Buttons)
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },

  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  dropdownOptions: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primaryAlpha,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 20,
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