import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/colors';

interface CreateFamilyGroupScreenProps {
  onFamilyCreated: (familyCode: string) => void;
  onBack: () => void;
}

interface RelationshipOption {
  key: string;
  labelEn: string;
  labelMs: string;
}

export const CreateFamilyGroupScreen: React.FC<CreateFamilyGroupScreenProps> = ({
  onFamilyCreated,
  onBack,
}) => {
  const { language } = useLanguage();
  const { showAlert, alertConfig, visible, hideAlert } = useModernAlert();
  const { user, updateUserProfile } = useAuth();

  // Helper function to fetch user profile (copied from AuthContext)
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const [familyName, setFamilyName] = useState('');
  const [elderlyName, setElderlyName] = useState('');
  const [elderlyAge, setElderlyAge] = useState('');
  const [relationship, setRelationship] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);

  // Dropdown animation
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;

  // Triple dot loading animation
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  const relationshipOptions: RelationshipOption[] = [
    { key: 'grandmother', labelEn: 'Grandmother', labelMs: 'Nenek' },
    { key: 'grandfather', labelEn: 'Grandfather', labelMs: 'Atuk' },
    { key: 'mother', labelEn: 'Mother', labelMs: 'Ibu' },
    { key: 'father', labelEn: 'Father', labelMs: 'Ayah' },
    { key: 'other', labelEn: 'Other Family Member', labelMs: 'Ahli Keluarga Lain' },
  ];

  const careLevelOptions: RelationshipOption[] = [
    { key: 'independent', labelEn: 'Independent', labelMs: 'Berdikari' },
    { key: 'dependent', labelEn: 'Dependent', labelMs: 'Bergantung' },
    { key: 'bedridden', labelEn: 'Bedridden', labelMs: 'Terlantar' },
  ];

  const texts = {
    en: {
      title: 'Create Family Group',
      subtitle: 'Set up your family to start tracking health together',
      familyNameLabel: 'Family Group Name',
      familyNamePlaceholder: 'e.g., The Johnson Family',
      elderlyPersonSection: 'Primary Elderly Person',
      elderlyNameLabel: 'Full Name',
      elderlyNamePlaceholder: 'Enter full name',
      elderlyAgeLabel: 'Age',
      elderlyAgePlaceholder: 'Age in years',
      relationshipLabel: 'Your relationship to them',
      relationshipPlaceholder: 'Select relationship',
      careLevelLabel: 'Care Level',
      careLevelPlaceholder: 'Select care level',
      createButton: 'Create Family Group',
      success: 'Success',
      familyCreated: 'Family group created successfully!',
      familyCode: 'Your family code is',
      shareCode: 'Share this code with family members to join.',
      error: 'Error',
      fillAllFields: 'Please fill in all required fields',
      invalidAge: 'Please enter a valid age (18-120)',
      creating: 'Creating family group...',
    },
    ms: {
      title: 'Buat Kumpulan Keluarga',
      subtitle: 'Sediakan keluarga anda untuk mula menjejak kesihatan bersama',
      familyNameLabel: 'Nama Kumpulan Keluarga',
      familyNamePlaceholder: 'cth: Keluarga Ahmad',
      elderlyPersonSection: 'Warga Emas Utama',
      elderlyNameLabel: 'Nama Penuh',
      elderlyNamePlaceholder: 'Masukkan nama penuh',
      elderlyAgeLabel: 'Umur',
      elderlyAgePlaceholder: 'Umur dalam tahun',
      relationshipLabel: 'Hubungan anda dengan mereka',
      relationshipPlaceholder: 'Pilih hubungan',
      careLevelLabel: 'Tahap Penjagaan',
      careLevelPlaceholder: 'Pilih tahap penjagaan',
      createButton: 'Buat Kumpulan Keluarga',
      success: 'Berjaya',
      familyCreated: 'Kumpulan keluarga berjaya dibuat!',
      familyCode: 'Kod keluarga anda ialah',
      shareCode: 'Kongsi kod ini dengan ahli keluarga untuk menyertai.',
      error: 'Ralat',
      fillAllFields: 'Sila lengkapkan semua maklumat yang diperlukan',
      invalidAge: 'Sila masukkan umur yang sah (18-120)',
      creating: 'Membuat kumpulan keluarga...',
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

  // Handle dropdown animation
  const toggleDropdown = () => {
    // Stop any ongoing animations
    dropdownHeight.stopAnimation();
    dropdownOpacity.stopAnimation();
    chevronRotation.stopAnimation();

    if (showRelationshipDropdown) {
      // Close dropdown
      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowRelationshipDropdown(false);
      });
    } else {
      // Open dropdown
      setShowRelationshipDropdown(true);
      Animated.parallel([
        Animated.timing(dropdownHeight, {
          toValue: relationshipOptions.length * 56, // 56px per option
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleRelationshipSelect = (option: RelationshipOption) => {
    setRelationship(option.key);

    // Stop any ongoing animations
    dropdownHeight.stopAnimation();
    dropdownOpacity.stopAnimation();
    chevronRotation.stopAnimation();

    // Close dropdown with animation
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(chevronRotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRelationshipDropdown(false);
    });
  };

  const getRelationshipLabel = () => {
    const option = relationshipOptions.find(opt => opt.key === relationship);
    if (!option) return '';
    return language === 'en' ? option.labelEn : option.labelMs;
  };

  const validateForm = () => {
    if (!familyName.trim() || !elderlyName.trim() || !elderlyAge.trim() || !relationship || !careLevel) {
      showAlert({
        type: 'error',
        title: t.error,
        message: t.fillAllFields,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return false;
    }

    const age = parseInt(elderlyAge);
    if (isNaN(age) || age < 18 || age > 120) {
      showAlert({
        type: 'error',
        title: t.error,
        message: t.invalidAge,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return false;
    }

    return true;
  };

  const handleCreateFamily = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      showAlert({
        type: 'error',
        title: t.error,
        message: 'User not authenticated',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate a random 6-digit family code
      const familyCode = Math.floor(100000 + Math.random() * 900000).toString();

      console.log('Creating family with code:', familyCode);
      console.log('AuthContext user ID:', user?.id);
      console.log('AuthContext user email:', user?.email);

      // 1. Create family group in database
      // Get the current session to ensure we have the right user ID for RLS
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No active session found');
      }

      console.log('Using user ID for family creation:', session.user.id);

      // Test if we can access the users table (should work with RLS)
      const { data: testUsers, error: testError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id);

      console.log('User table access test:', { testUsers, testError });

      // Test: Try to create family group with explicit user ID that matches auth.uid()
      console.log('About to insert family group with user ID:', session.user.id);

      // Use secure RPC function to create family group
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_family_group_secure', {
        p_family_code: familyCode,
        p_family_name: familyName.trim(),
        p_elderly_name: elderlyName.trim(),
        p_elderly_age: parseInt(elderlyAge),
        p_elderly_relationship: relationship,
        p_elderly_care_level: careLevel
      });

      console.log('Secure RPC result:', { rpcResult, rpcError });

      if (rpcError) {
        console.error('RPC function error:', rpcError);
        throw new Error(`RPC failed: ${rpcError.message}`);
      }

      if (!rpcResult.success) {
        console.error('RPC function returned error:', rpcResult.error);
        throw new Error(`Family creation failed: ${rpcResult.error}`);
      }

      console.log('Family creation completed successfully:', rpcResult);

      // The RPC function has already created the family group, elderly profile, and updated the user
      // Just refresh the user profile to reflect the changes in our local state
      const { data: { session: updatedSession } } = await supabase.auth.getSession();
      if (updatedSession?.user) {
        const updatedProfile = await fetchUserProfile(updatedSession.user.id);
        if (updatedProfile) {
          console.log('Updated user profile with family_id:', updatedProfile.family_id);
        }
      }

      setIsLoading(false);

      showAlert({
        type: 'success',
        title: t.success,
        message: `${t.familyCreated}\n\n${t.familyCode}: ${familyCode}\n\n${t.shareCode}`,
        buttons: [{
          text: 'OK',
          style: 'primary',
          onPress: () => { hideAlert(); onFamilyCreated(familyCode); }
        }],
      });

    } catch (error) {
      console.error('Family creation failed:', error);
      setIsLoading(false);

      showAlert({
        type: 'error',
        title: t.error,
        message: error instanceof Error ? error.message : 'Failed to create family group. Please try again.',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
    }
  };

  const canCreate = familyName.trim() && elderlyName.trim() && elderlyAge.trim() && relationship;

  return (
    <SafeAreaWrapper gradientVariant="onboarding">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Modern Header Section with Back Button */}
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modernHeader}
          >
            <View style={styles.headerContent}>
              <InteractiveFeedback
                onPress={onBack}
                disabled={isLoading}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={styles.backButton}>
                  <Ionicons name="chevron-back" size={24} color={colors.white} />
                </View>
              </InteractiveFeedback>

              <View style={styles.headerCenterContent}>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.form}>
            {/* Family Group Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.familyNameLabel}</Text>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder={t.familyNamePlaceholder}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                editable={!isLoading}
              />
            </View>

            {/* Elderly Person Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.elderlyPersonSection}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.elderlyNameLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={elderlyName}
                  onChangeText={setElderlyName}
                  placeholder={t.elderlyNamePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primary}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.elderlyAgeLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={elderlyAge}
                  onChangeText={setElderlyAge}
                  placeholder={t.elderlyAgePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={3}
                  selectionColor={colors.primary}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.relationshipLabel}</Text>
                <InteractiveFeedback
                  onPress={toggleDropdown}
                  disabled={isLoading}
                >
                  <View style={[styles.input, styles.dropdownInput]}>
                    <Text style={[
                      styles.dropdownText,
                      !relationship && styles.dropdownPlaceholder,
                    ]}>
                      {getRelationshipLabel() || t.relationshipPlaceholder}
                    </Text>
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: chevronRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          })
                        }]
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Animated.View>
                  </View>
                </InteractiveFeedback>

                {/* Dropdown Options */}
                <Animated.View style={[
                  styles.dropdown,
                  {
                    height: dropdownHeight,
                    overflow: 'hidden',
                  }
                ]}>
                  <Animated.View style={{ opacity: dropdownOpacity }}>
                    {relationshipOptions.map((option) => (
                      <InteractiveFeedback
                        key={option.key}
                        onPress={() => handleRelationshipSelect(option)}
                        disabled={isLoading}
                        feedbackType="scale"
                        hapticType="light"
                      >
                        <View style={[
                          styles.dropdownOption,
                          relationship === option.key && styles.dropdownOptionSelected,
                        ]}>
                          <Text style={[
                            styles.dropdownOptionText,
                            relationship === option.key && styles.dropdownOptionTextSelected,
                          ]}>
                            {language === 'en' ? option.labelEn : option.labelMs}
                          </Text>
                          {relationship === option.key && (
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                          )}
                        </View>
                      </InteractiveFeedback>
                    ))}
                  </Animated.View>
                </Animated.View>
              </View>

              {/* Care Level Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.careLevelLabel}</Text>
                <View style={styles.optionsContainer}>
                  {careLevelOptions.map((option) => (
                    <InteractiveFeedback
                      key={option.key}
                      onPress={() => setCareLevel(option.key)}
                      disabled={isLoading}
                    >
                      <View style={[
                        styles.optionButton,
                        careLevel === option.key && styles.optionButtonSelected
                      ]}>
                        <View style={[
                          styles.radioButton,
                          careLevel === option.key && styles.radioButtonSelected
                        ]}>
                          {careLevel === option.key && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Text style={[
                          styles.optionText,
                          careLevel === option.key && styles.optionTextSelected
                        ]}>
                          {language === 'en' ? option.labelEn : option.labelMs}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <InteractiveFeedback
              onPress={handleCreateFamily}
              disabled={!canCreate || isLoading}
              style={[
                styles.createButton,
                (!canCreate || isLoading) && styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={
                  !canCreate || isLoading
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
                  <Text style={styles.createButtonText}>{t.createButton}</Text>
                )}
              </LinearGradient>
            </InteractiveFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    paddingVertical: 40,
  },
  // Modern Header Styles
  modernHeader: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownOption: {
    height: 56, // Fixed height for animation consistency
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  createButton: {
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
  createButtonText: {
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

  // Care Level Radio Button Styles
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
});