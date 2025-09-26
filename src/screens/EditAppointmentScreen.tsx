import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Animated } from 'react-native';
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
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { useElderlyProfiles, useAppointments, useUpdateAppointment, useDeleteAppointment } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      appointmentId?: string;
    };
  };
}

// Mock appointment data - in real app this would come from database
const mockAppointmentData: { [key: string]: any } = {
  'apt-001': {
    id: 'apt-001',
    doctorName: 'Dr. Ahmad Rahman',
    clinic: 'Kuala Lumpur General Hospital',
    appointmentType: 'Regular Checkup',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:30 AM',
    notes: 'Bring previous blood test results',
    status: 'upcoming',
  },
  'apt-002': {
    id: 'apt-002',
    doctorName: 'Dr. Siti Nurhaliza',
    clinic: 'Bandar Health Clinic',
    appointmentType: 'Follow-up',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '2:00 PM',
    notes: '',
    status: 'upcoming',
  },
  'apt-003': {
    id: 'apt-003',
    doctorName: 'Dr. Lim Wei Ming',
    clinic: 'Petaling Jaya Medical Centre',
    appointmentType: 'Specialist Consultation',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '9:15 AM',
    notes: 'Cardiology consultation',
    status: 'upcoming',
  },
};

const appointmentTypes = [
  'Regular Checkup',
  'Follow-up',
  'Specialist Consultation',
  'Blood Test',
  'Vaccination',
  'Emergency Visit',
  'Other'
];

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:15 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

export function EditAppointmentScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { appointmentId } = route?.params || {};
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { showError, showWarning, showConfirm, showAlert, alertConfig, hideAlert } = useModernAlert();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useAppointments(currentElderly?.id || '');
  const { updateAppointment } = useUpdateAppointment();
  const { deleteAppointment } = useDeleteAppointment();

  const currentAppointment = appointments.find(apt => apt.id === appointmentId);
  
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

  // Load appointment data from database or fallback to mock
  useEffect(() => {
    let appointment = currentAppointment;

    // Fallback to mock data for demo purposes if no database data
    if (!appointment && appointmentId && mockAppointmentData[appointmentId]) {
      appointment = mockAppointmentData[appointmentId];
    }

    if (appointment) {
      setDoctorName(appointment.doctorName || '');
      setClinic(appointment.clinic || '');
      setAppointmentType(appointment.appointmentType || '');
      const appointmentDate = appointment.date;
      if (appointmentDate) {
        const parsedDate = new Date(appointmentDate);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
          setDateString(parsedDate.toISOString().split('T')[0]);
        }
      }
      setTime(appointment.time || '');
      setNotes(appointment.notes || '');
    }
  }, [currentAppointment, appointmentId]);

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

  const handleSaveAppointment = async () => {
    if (!doctorName.trim() || !clinic.trim() || !appointmentType.trim() || !dateString.trim() || !time.trim()) {
      showAlert({
        type: 'error',
        title: language === 'en' ? 'Required Fields' : 'Medan Diperlukan',
        message: language === 'en'
          ? 'Please fill in all required fields.'
          : 'Sila isi semua medan yang diperlukan.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => hideAlert(),
          },
        ],
      });
      return;
    }

    if (!appointmentId) {
      showAlert({
        type: 'error',
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'Appointment not found.'
          : 'Temujanji tidak dijumpai.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => {
              hideAlert();
              navigation.goBack();
            },
          },
        ],
      });
      return;
    }

    setIsLoading(true);
    startDotsAnimation();

    try {
      const appointmentData = {
        id: appointmentId,
        doctorName: doctorName.trim(),
        clinic: clinic.trim(),
        appointmentType: appointmentType.trim(),
        date: dateString,
        time: time.trim(),
        notes: notes.trim(),
      };

      const success = await updateAppointment(appointmentId, appointmentData);

      if (success) {
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Appointment Updated!' : 'Temujanji Dikemaskini!',
          message: language === 'en'
            ? 'Appointment has been updated successfully.'
            : 'Temujanji telah dikemaskini dengan jayanya.',
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      hapticFeedback.error();
      showAlert({
        type: 'error',
        title: language === 'en' ? 'Error' : 'Ralat',
        message: language === 'en'
          ? 'Failed to update appointment. Please try again.'
          : 'Gagal mengemaskini temujanji. Sila cuba lagi.',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'OK',
            style: 'primary',
            onPress: () => hideAlert(),
          },
        ],
      });
    } finally {
      setIsLoading(false);
      stopDotsAnimation();
    }
  };

  const handleDeleteAppointment = () => {
    if (!appointmentId) {
      navigation.goBack();
      return;
    }

    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Delete Appointment' : 'Padam Temujanji',
      message: language === 'en'
        ? 'Are you sure you want to delete this appointment? This action cannot be undone.'
        : 'Adakah anda pasti untuk memadam temujanji ini? Tindakan ini tidak boleh dibatalkan.',
      buttons: [
        {
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'destructive',
          onPress: () => hideAlert(),
        },
        {
          text: language === 'en' ? 'Delete' : 'Padam',
          style: 'primary',
          onPress: async () => {
            hideAlert();
            setIsLoading(true);
            startDotsAnimation();

            try {
              const success = await deleteAppointment(appointmentId);

              if (success) {
                hapticFeedback.success();

                showSuccess({
                  title: language === 'en' ? 'Appointment Deleted' : 'Temujanji Dipadam',
                  message: language === 'en'
                    ? 'Appointment has been deleted successfully.'
                    : 'Temujanji telah dipadam dengan jayanya.',
                  onComplete: () => navigation.navigate('ManageAppointments'),
                  duration: 800,
                });
              } else {
                throw new Error('Delete failed');
              }
            } catch (error) {
              hapticFeedback.error();
              showAlert({
                type: 'error',
                title: language === 'en' ? 'Error' : 'Ralat',
                message: language === 'en'
                  ? 'Failed to delete appointment. Please try again.'
                  : 'Gagal memadam temujanji. Sila cuba lagi.',
                buttons: [
                  {
                    text: language === 'en' ? 'OK' : 'OK',
                    style: 'primary',
                    onPress: () => hideAlert(),
                  },
                ],
              });
            } finally {
              setIsLoading(false);
              stopDotsAnimation();
            }
          },
        },
      ],
    });
  };

  const isDataLoading = profilesLoading || appointmentsLoading;

  if (isDataLoading) {
    return (
      <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading appointment details...' : 'Memuatkan butiran temujanji...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (appointmentsError) {
    return (
      <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={appointmentsError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <>
    <SafeAreaWrapper gradientVariant="vitals" includeTabBarPadding={true}>
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
              onPress={() => navigation.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Edit Appointment' : 'Edit Temujanji'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Update appointment details and schedule' : 'Kemaskini butiran dan jadual temujanji'}
              </Text>
            </View>

            <InteractiveFeedback
              onPress={handleDeleteAppointment}
              feedbackType="scale"
              hapticType="medium"
            >
              <View style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={colors.white} />
              </View>
            </InteractiveFeedback>
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
              placeholder={language === 'en' ? 'Enter doctor\'s name' : 'Masukkan nama doktor'}
              placeholderTextColor={colors.textMuted}
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
              placeholder={language === 'en' ? 'Enter clinic or hospital name' : 'Masukkan nama klinik atau hospital'}
              placeholderTextColor={colors.textMuted}
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
                setShowTypeDropdown(!showTypeDropdown);
                setShowTimeDropdown(false);
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
                setShowTypeDropdown(false);
                setShowTimeDropdown(false);
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
                setShowTimeDropdown(!showTimeDropdown);
                setShowTypeDropdown(false);
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
              placeholder={language === 'en' ? 'Any additional notes...' : 'Nota tambahan...'}
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
          onPress={handleSaveAppointment}
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
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Update Appointment' : 'Kemaskini Temujanji'}
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
          visible={alertConfig !== null}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons || []}
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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