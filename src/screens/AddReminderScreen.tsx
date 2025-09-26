import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      goBack?: () => void;
    };
  };
}

interface ReminderFormData {
  name: string;
  type: 'medication' | 'vitals' | 'appointment';
  time: Date;
  description: string;
  enabled: boolean;
}

export function AddReminderScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { alertConfig, visible: alertVisible, showAlert, showSuccess, showError, hideAlert } = useModernAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);

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

  const [formData, setFormData] = useState<ReminderFormData>({
    name: '',
    type: 'medication',
    time: new Date(),
    description: '',
    enabled: true
  });

  const reminderTypes = [
    {
      key: 'medication',
      label: language === 'en' ? 'Medication' : 'Ubat',
      icon: 'medical',
      color: colors.primary
    },
    {
      key: 'vitals',
      label: language === 'en' ? 'Vitals Check' : 'Pemeriksaan Vital',
      icon: 'heart',
      color: colors.error
    },
    {
      key: 'appointment',
      label: language === 'en' ? 'Appointment' : 'Temujanji',
      icon: 'calendar',
      color: colors.secondary
    }
  ];

  const handleInputChange = (field: keyof ReminderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      handleInputChange('time', selectedTime);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showError(
        language === 'en' ? 'Reminder Name Required' : 'Nama Peringatan Diperlukan',
        language === 'en'
          ? 'Please enter a name for this reminder.'
          : 'Sila masukkan nama untuk peringatan ini.'
      );
      return false;
    }

    if (formData.name.trim().length < 3) {
      showError(
        language === 'en' ? 'Name Too Short' : 'Nama Terlalu Pendek',
        language === 'en'
          ? 'Reminder name must be at least 3 characters long.'
          : 'Nama peringatan mestilah sekurang-kurangnya 3 aksara.'
      );
      return false;
    }

    return true;
  };

  const saveReminder = async () => {
    if (!validateForm()) return;

    hapticFeedback.medium();
    setIsLoading(true);
    startDotsAnimation();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success animation
      setIsLoading(false);
      stopDotsAnimation();
      setShowSuccessAnimation(true);

      // Navigate back after animation
      setTimeout(() => {
        setShowSuccessAnimation(false);
        if (route?.params?.goBack) {
          route.params.goBack();
        } else {
          navigation?.goBack();
        }
      }, 1200);

    } catch (error) {
      setIsLoading(false);
      stopDotsAnimation();
      showError(
        language === 'en' ? 'Save Failed' : 'Gagal Menyimpan',
        language === 'en'
          ? 'Failed to save reminder. Please try again.'
          : 'Gagal menyimpan peringatan. Sila cuba lagi.'
      );
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const selectedType = reminderTypes.find(type => type.key === formData.type);

  return (
    <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
      {/* Content - always visible, overlay will cover when loading */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
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
                {language === 'en' ? 'Add New Reminder' : 'Tambah Peringatan Baru'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Set up health reminders for better care' : 'Tetapkan peringatan kesihatan untuk penjagaan yang lebih baik'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Reminder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Reminder Name' : 'Nama Peringatan'} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder={language === 'en' ? 'e.g., Evening Blood Pressure Check' : 'cth., Pemeriksaan Tekanan Darah Petang'}
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />
          </View>

          {/* Reminder Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Reminder Type' : 'Jenis Peringatan'}
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setTypeDropdownVisible(!typeDropdownVisible)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownContent}>
                <View style={styles.selectedTypeContainer}>
                  <View style={[styles.typeIconSmall, { backgroundColor: selectedType?.color + '33' }]}>
                    <Ionicons name={selectedType?.icon as any} size={16} color={selectedType?.color} />
                  </View>
                  <Text style={styles.dropdownText}>{selectedType?.label}</Text>
                </View>
                <Ionicons
                  name={typeDropdownVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {typeDropdownVisible && (
              <View style={styles.dropdownMenu}>
                {reminderTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.dropdownItem,
                      formData.type === type.key && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      handleInputChange('type', type.key);
                      setTypeDropdownVisible(false);
                      hapticFeedback.light();
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={[styles.typeIconSmall, { backgroundColor: type.color + '33' }]}>
                        <Ionicons name={type.icon as any} size={16} color={type.color} />
                      </View>
                      <Text style={[
                        styles.dropdownItemText,
                        formData.type === type.key && styles.dropdownItemTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </View>
                    {formData.type === type.key && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Reminder Time' : 'Masa Peringatan'}
            </Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.timeButtonContent}>
                <View style={styles.timeInfoContainer}>
                  <View style={styles.timeIconContainer}>
                    <Ionicons name="time" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.timeButtonText}>{formatTime(formData.time)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={formData.time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Description (Optional)' : 'Penerangan (Pilihan)'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder={language === 'en' ? 'Additional notes about this reminder...' : 'Nota tambahan mengenai peringatan ini...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Enabled Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>
                {language === 'en' ? 'Enable Reminder' : 'Aktifkan Peringatan'}
              </Text>
              <Text style={styles.toggleDescription}>
                {language === 'en' ? 'Turn on notifications for this reminder' : 'Hidupkan pemberitahuan untuk peringatan ini'}
              </Text>
            </View>
            <InteractiveFeedback
              onPress={() => handleInputChange('enabled', !formData.enabled)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.toggleSwitch,
                formData.enabled && styles.toggleSwitchEnabled
              ]}>
                <Ionicons
                  name={formData.enabled ? 'checkmark' : 'close'}
                  size={16}
                  color={formData.enabled ? colors.white : colors.textMuted}
                />
              </View>
            </InteractiveFeedback>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer with Save Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={saveReminder}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {language === 'en' ? 'Save Reminder' : 'Simpan Peringatan'}
              </Text>
            )}
          </LinearGradient>
        </InteractiveFeedback>
      </View>


      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation
          visible={showSuccessAnimation}
          title={language === 'en' ? 'Success!' : 'Berjaya!'}
          message={language === 'en' ? 'Reminder saved successfully!' : 'Peringatan berjaya disimpan!'}
          onComplete={() => setShowSuccessAnimation(false)}
          duration={1200}
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

  // Form
  formContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Dropdown
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryAlpha,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Time Button
  timeButton: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleSwitch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSwitchEnabled: {
    backgroundColor: colors.success,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  bottomPadding: {
    height: 20,
  },

  // Loading animations
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