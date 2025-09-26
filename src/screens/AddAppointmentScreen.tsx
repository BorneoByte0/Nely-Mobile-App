import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ModernAlert } from '../components/ModernAlert';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAddAppointment } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

const appointmentTypes = [
  'Regular Checkup',
  'Follow-up',
  'Specialist Consultation',
  'Blood Test',
  'Vaccination',
  'Emergency Visit',
  'Dental Checkup',
  'Eye Examination',
  'Physical Therapy',
  'Other'
];

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:15 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

const commonDoctors = [
  'Dr. Ahmad Rahman',
  'Dr. Siti Nurhaliza',
  'Dr. Lim Wei Ming',
  'Dr. Fatimah Zahra',
  'Dr. Raj Kumar',
  'Dr. Sarah Abdullah'
];

const commonClinics = [
  'Kuala Lumpur General Hospital',
  'Bandar Health Clinic',
  'Petaling Jaya Medical Centre',
  'Shah Alam Clinic',
  'Subang Jaya Medical Centre',
  'University Malaya Medical Centre'
];

export function AddAppointmentScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();

  // Database hooks
  const { elderlyProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { addAppointment, loading: addingLoading, error: addingError } = useAddAppointment();
  const { alertConfig, visible: alertVisible, showError, showWarning, hideAlert } = useModernAlert();
  
  const [doctorName, setDoctorName] = useState('');
  const [clinic, setClinic] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateString, setDateString] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
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
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setDateString(selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCreateAppointment = async () => {
    if (!doctorName.trim() || !clinic.trim() || !appointmentType.trim() || !dateString.trim() || !time.trim()) {
      showError(
        language === 'en' ? 'Required Fields' : 'Medan Diperlukan',
        language === 'en' 
          ? 'Please fill in all required fields.'
          : 'Sila isi semua medan yang diperlukan.'
      );
      return;
    }

    // Validate date format and future date
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDate.getTime())) {
      showError(
        language === 'en' ? 'Invalid Date' : 'Tarikh Tidak Sah',
        language === 'en' 
          ? 'Please enter a valid date in YYYY-MM-DD format.'
          : 'Sila masukkan tarikh yang sah dalam format TTTT-BB-HH.'
      );
      return;
    }

    if (selectedDate < today) {
      showWarning(
        language === 'en' ? 'Past Date' : 'Tarikh Lalu',
        language === 'en' 
          ? 'Please select a future date for the appointment.'
          : 'Sila pilih tarikh akan datang untuk temujanji.'
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

    try {
      // Prepare appointment data
      const appointmentData = {
        elderlyId: currentElderly.id,
        doctorName: doctorName.trim(),
        clinic: clinic.trim(),
        appointmentType: appointmentType,
        date: date.toISOString().split('T')[0], // Convert Date to string
        time: time,
        status: 'upcoming' as const,
        notes: notes.trim(),
        followUpRequired: false,
      };

      const success = await addAppointment(appointmentData);

      if (success) {
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Appointment Created!' : 'Temujanji Dicipta!',
          message: language === 'en'
            ? 'New appointment has been created successfully.'
            : 'Temujanji baharu telah dicipta dengan jayanya.',
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error(addingError || 'Failed to create appointment');
      }
    } catch (error) {
      hapticFeedback.error();
      showError(
        language === 'en' ? 'Creation Failed' : 'Gagal Cipta',
        language === 'en'
          ? 'Failed to create appointment. Please check your connection and try again.'
          : 'Gagal mencipta temujanji. Sila semak sambungan anda dan cuba lagi.'
      );
    } finally {
      setIsLoading(false);
      stopDotsAnimation();
    }
  };

  const closeAllDropdowns = () => {
    setShowTypeDropdown(false);
    setShowTimeDropdown(false);
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
                {language === 'en' ? 'New Appointment' : 'Temujanji Baharu'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Schedule medical appointment and consultations' : 'Jadual temujanji dan konsultasi perubatan'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Doctor Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Doctor Name' : 'Nama Doktor'} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder={language === 'en' ? 'Enter doctor name' : 'Masukkan nama doktor'}
              placeholderTextColor={colors.textMuted}
              onFocus={closeAllDropdowns}
            />
          </View>

          {/* Clinic */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Clinic/Hospital' : 'Klinik/Hospital'} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={clinic}
              onChangeText={setClinic}
              placeholder={language === 'en' ? 'Enter clinic/hospital name' : 'Masukkan nama klinik/hospital'}
              placeholderTextColor={colors.textMuted}
              onFocus={closeAllDropdowns}
            />
          </View>

          {/* Appointment Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Appointment Type' : 'Jenis Temujanji'} *
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                hapticFeedback.light();
                setShowTimeDropdown(false);
                setShowTypeDropdown(!showTypeDropdown);
              }}
            >
              <Text style={[styles.dropdownText, !appointmentType && styles.placeholderText]}>
                {appointmentType || (language === 'en' ? 'Select appointment type' : 'Pilih jenis temujanji')}
              </Text>
              <Ionicons 
                name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showTypeDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {appointmentTypes.map((type, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        type === appointmentType && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        setAppointmentType(type);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        type === appointmentType && styles.dropdownItemTextSelected
                      ]}>
                        {type}
                      </Text>
                      {type === appointmentType && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Date' : 'Tarikh'} *
            </Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                hapticFeedback.light();
                setShowDatePicker(true);
                closeAllDropdowns();
              }}
            >
              <View style={styles.datePickerContent}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.datePickerText}>
                  {dateString ? formatDateForDisplay(date) : (language === 'en' ? 'Select date' : 'Pilih tarikh')}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {dateString && (
              <Text style={styles.datePreview}>
                {formatDateForDisplay(date)}
              </Text>
            )}
          </View>

          {/* Time */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Time' : 'Masa'} *
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                hapticFeedback.light();
                setShowTypeDropdown(false);
                setShowTimeDropdown(!showTimeDropdown);
              }}
            >
              <Text style={[styles.dropdownText, !time && styles.placeholderText]}>
                {time || (language === 'en' ? 'Select time' : 'Pilih masa')}
              </Text>
              <Ionicons 
                name={showTimeDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showTimeDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {timeSlots.map((timeSlot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        timeSlot === time && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        hapticFeedback.light();
                        setTime(timeSlot);
                        setShowTimeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        timeSlot === time && styles.dropdownItemTextSelected
                      ]}>
                        {timeSlot}
                      </Text>
                      {timeSlot === time && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'en' ? 'Notes (Optional)' : 'Nota (Pilihan)'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.multiLineInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={language === 'en' ? 'Any additional notes or special instructions...' : 'Nota tambahan atau arahan khas...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={closeAllDropdowns}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={handleCreateAppointment}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>
                  {language === 'en' ? 'Create Appointment' : 'Cipta Temujanji'}
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
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
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
    paddingVertical: 16,
    fontSize: 14,
    color: colors.textPrimary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  multiLineInput: {
    minHeight: 80,
    paddingVertical: 12,
  },
  dropdownButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 144,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 144,
  },
  dropdownSearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
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
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  datePreview: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  datePickerButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  createButton: {
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
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
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