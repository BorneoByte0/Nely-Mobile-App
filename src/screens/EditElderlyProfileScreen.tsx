import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useUpdateElderlyProfile } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
  route?: {
    params?: {
      elderlyId?: string;
    };
  };
}

export function EditElderlyProfileScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showError, hideAlert } = useModernAlert();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError } = useElderlyProfiles();
  const { updateElderlyProfile, loading: updateLoading } = useUpdateElderlyProfile();

  const { elderlyId } = route?.params || {};
  const elderlyProfile = elderlyProfiles.find(p => p.id === elderlyId) || elderlyProfiles[0];

  if (profilesLoading) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading profile...' : 'Memuatkan profil...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError || !elderlyProfile) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError || (language === 'en' ? 'Profile not found' : 'Profil tidak dijumpai')}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }
  // Removed dropdown state - using radio options instead

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
  
  // Form state with current elderly profile data
  const [formData, setFormData] = useState({
    name: elderlyProfile.name,
    age: elderlyProfile.age.toString(),
    relationship: elderlyProfile.relationship,
    careLevel: elderlyProfile.careLevel,
    conditions: elderlyProfile.conditions?.join(', ') || '', // Convert array to string
    weight: '65', // Default weight - would need additional fields in database
    height: '155', // Default height - would need additional fields in database
    bloodType: 'O+', // Default blood type - would need additional field in database
    emergencyContact: elderlyProfile.emergencyContact || '',
    doctorName: '', // Would need additional fields in database
    clinicName: '', // Would need additional fields in database
  });

  const careLevels = [
    { value: 'independent', labelEn: 'Independent', labelMs: 'Berdikari' },
    { value: 'dependent', labelEn: 'Dependent', labelMs: 'Bergantung' },
    { value: 'bedridden', labelEn: 'Bedridden', labelMs: 'Terlantar' }
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSave = async () => {
    // Basic validation
    if (!formData.name || !formData.age) {
      showError(
        language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        language === 'en'
          ? 'Please fill in name and age.'
          : 'Sila isi nama dan umur.'
      );
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.medium();

    try {
      // Prepare update data with only the fields we can update in the database
      const updateData = {
        name: formData.name,
        age: parseInt(formData.age),
        relationship: formData.relationship,
        careLevel: formData.careLevel as 'independent' | 'dependent' | 'bedridden',
        conditions: formData.conditions ? formData.conditions.split(',').map(c => c.trim()).filter(c => c) : [],
        emergencyContact: formData.emergencyContact,
      };

      const success = await updateElderlyProfile(elderlyProfile.id, updateData);

      if (success) {
        setIsLoading(false);
        stopDotsAnimation();
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Profile Updated!' : 'Profil Dikemas kini!',
          message: language === 'en'
            ? 'Elderly profile has been successfully updated.'
            : 'Profil warga emas telah berjaya dikemas kini.',
          onComplete: () => navigation?.goBack(),
          duration: 800,
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.error();

      showError(
        language === 'en' ? 'Update Failed' : 'Gagal Kemaskini',
        language === 'en'
          ? 'Unable to update profile. Please check your connection and try again.'
          : 'Tidak dapat mengemaskini profil. Sila semak sambungan anda dan cuba lagi.'
      );
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
                {language === 'en' ? 'Update elderly care information' : 'Kemas kini maklumat penjagaan warga emas'}
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
                  placeholder={language === 'en' ? 'Enter full name' : 'Masukkan nama penuh'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Age' : 'Umur'} *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.age}
                    onChangeText={(value) => updateFormData('age', value)}
                    placeholder="74"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Relationship' : 'Hubungan'} *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.relationship}
                    onChangeText={(value) => updateFormData('relationship', value)}
                    placeholder={language === 'en' ? 'Grandmother' : 'Nenek'}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Care Level Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Care Level' : 'Tahap Penjagaan'}
              </Text>
              
              <View style={styles.optionsContainer}>
                {careLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.optionButton,
                      formData.careLevel === level.value && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      hapticFeedback.light();
                      updateFormData('careLevel', level.value);
                    }}
                  >
                    <View style={[
                      styles.radioButton,
                      formData.careLevel === level.value && styles.radioButtonSelected
                    ]}>
                      {formData.careLevel === level.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      formData.careLevel === level.value && styles.optionTextSelected
                    ]}>
                      {language === 'en' ? level.labelEn : level.labelMs}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Physical Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Physical Information' : 'Maklumat Fizikal'}
              </Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Weight (kg)' : 'Berat (kg)'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.weight}
                    onChangeText={(value) => updateFormData('weight', value)}
                    placeholder="65"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Height (cm)' : 'Tinggi (cm)'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.height}
                    onChangeText={(value) => updateFormData('height', value)}
                    placeholder="155"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Blood Type' : 'Jenis Darah'}
                </Text>
                <View style={styles.bloodTypeGrid}>
                  {bloodTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.bloodTypeOption,
                        formData.bloodType === type && styles.bloodTypeOptionSelected
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        updateFormData('bloodType', type);
                      }}
                    >
                      <View style={[
                        styles.radioButton,
                        formData.bloodType === type && styles.radioButtonSelected
                      ]}>
                        {formData.bloodType === type && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.bloodTypeText,
                        formData.bloodType === type && styles.bloodTypeTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Medical Conditions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Medical Conditions' : 'Keadaan Perubatan'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Conditions' : 'Keadaan'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.conditions}
                  onChangeText={(value) => updateFormData('conditions', value)}
                  placeholder={language === 'en' ? 'Enter medical conditions (e.g., Diabetes, High blood pressure)' : 'Masukkan keadaan perubatan (cth: Diabetes, Tekanan darah tinggi)'}
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Contact & Emergency' : 'Hubungan & Kecemasan'}
              </Text>
              
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
                    placeholder="12-345 6789"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Primary Doctor' : 'Doktor Utama'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.doctorName}
                    onChangeText={(value) => updateFormData('doctorName', value)}
                    placeholder="Dr. Siti Nurhaliza"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'Clinic/Hospital' : 'Klinik/Hospital'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.clinicName}
                    onChangeText={(value) => updateFormData('clinicName', value)}
                    placeholder="Bandar Health Clinic"
                    placeholderTextColor={colors.textMuted}
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

  // Blood Type Grid
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 12,
    gap: 8,
    minWidth: '22%',
  },
  bloodTypeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha,
  },
  bloodTypeText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  bloodTypeTextSelected: {
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
    height: 20,
  },
});