import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAppointments, useUpdateAppointment } from '../hooks/useDatabase';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

// Extended mock appointments data
const allAppointmentsData = [
  {
    id: 'apt-001',
    doctorName: 'Dr. Ahmad Rahman',
    clinic: 'Kuala Lumpur General Hospital',
    appointmentType: 'Regular Checkup',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: '10:30 AM',
    notes: 'Bring previous blood test results',
    status: 'upcoming',
  },
  {
    id: 'apt-002',
    doctorName: 'Dr. Siti Nurhaliza',
    clinic: 'Bandar Health Clinic',
    appointmentType: 'Follow-up',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '2:00 PM',
    notes: '',
    status: 'upcoming',
  },
  {
    id: 'apt-003',
    doctorName: 'Dr. Lim Wei Ming',
    clinic: 'Petaling Jaya Medical Centre',
    appointmentType: 'Specialist Consultation',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '9:15 AM',
    notes: 'Cardiology consultation',
    status: 'upcoming',
  },
  {
    id: 'apt-004',
    doctorName: 'Dr. Ahmad Rahman',
    clinic: 'Kuala Lumpur General Hospital',
    appointmentType: 'Blood Test',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '8:00 AM',
    notes: 'Fasting required',
    status: 'completed',
  },
  {
    id: 'apt-005',
    doctorName: 'Dr. Fatimah Zahra',
    clinic: 'Shah Alam Clinic',
    appointmentType: 'Vaccination',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    time: '11:00 AM',
    notes: 'Annual flu shot',
    status: 'completed',
  },
];

export function ManageAppointmentsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<'upcoming'>('upcoming');
  const { showWarning, showConfirm, showAlert, alertConfig, hideAlert, showSuccess, showError } = useModernAlert();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useAppointments(currentElderly?.id || '');
  const { updateAppointment, loading: updateLoading } = useUpdateAppointment();

  const isLoading = profilesLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading appointments...' : 'Memuatkan temujanji...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (appointmentsError) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={appointmentsError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  const filterOptions = [
    { key: 'upcoming', labelEn: 'Upcoming', labelMs: 'Akan Datang' },
  ];

  const filteredAppointments = appointments.filter(appointment =>
    selectedFilter === 'upcoming' ? appointment.status === 'upcoming' : appointment.status === selectedFilter
  );

  const deleteAppointment = (appointmentId: string, doctorName: string) => {
    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Cancel Appointment' : 'Batal Temujanji',
      message: language === 'en' 
        ? `Are you sure you want to cancel the appointment with ${doctorName}?`
        : `Adakah anda pasti untuk membatalkan temujanji dengan ${doctorName}?`,
      buttons: [
        {
          text: language === 'en' ? 'No' : 'Tidak',
          style: 'destructive',
          onPress: () => hideAlert(),
        },
        {
          text: language === 'en' ? 'Yes' : 'Ya',
          style: 'primary',
          onPress: async () => {
            hideAlert();
            try {
              const success = await updateAppointment(appointmentId, { status: 'cancelled' });
              if (success) {
                hapticFeedback.success();
                showSuccess(
                  language === 'en' ? 'Appointment Cancelled' : 'Temujanji Dibatalkan',
                  language === 'en' ? 'The appointment has been cancelled successfully.' : 'Temujanji telah berjaya dibatalkan.'
                );
                // The appointments list will refresh automatically via the hook
              } else {
                throw new Error('Failed to cancel appointment');
              }
            } catch (error) {
              hapticFeedback.error();
              showError(
                language === 'en' ? 'Cancellation Failed' : 'Gagal Batalkan',
                language === 'en' ? 'Unable to cancel appointment. Please try again.' : 'Tidak dapat membatalkan temujanji. Sila cuba lagi.'
              );
            }
          },
        },
      ],
    });
  };

  const editAppointment = (appointmentId: string) => {
    hapticFeedback.light();
    navigation.navigate('EditAppointment', { appointmentId });
  };

  const markAsDone = (appointmentId: string, doctorName: string, appointmentType: string) => {
    hapticFeedback.medium();
    navigation.navigate('AppointmentOutcome', { 
      appointmentId, 
      doctorName, 
      appointmentType 
    });
  };

  const addNewAppointment = () => {
    hapticFeedback.medium();
    navigation.navigate('AddAppointment');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'upcoming' ? colors.primary : colors.success;
  };

  const getStatusIcon = (status: string) => {
    return status === 'upcoming' ? 'time-outline' : 'checkmark-circle';
  };

  return (
    <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
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
                {language === 'en' ? 'Manage Appointments' : 'Urus Temujanji'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Schedule and manage medical appointments' : 'Jadual dan urus temujanji perubatan'}
              </Text>
            </View>

            <InteractiveFeedback
              onPress={addNewAppointment}
              feedbackType="scale"
              hapticType="medium"
            >
              <View style={styles.addButton}>
                <Ionicons name="add" size={20} color={colors.white} />
              </View>
            </InteractiveFeedback>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>


        {/* Statistics Card - Upcoming Only */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.singleStatCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>
              {appointments.filter(apt => apt.status === 'upcoming').length}
            </Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Upcoming Appointments' : 'Temujanji Akan Datang'}
            </Text>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsContainer}>
          {filteredAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentMainInfo}>
                  <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                  <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
                  <Text style={styles.clinicName}>{appointment.clinic}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <Ionicons name={getStatusIcon(appointment.status)} size={16} color={colors.white} />
                  <Text style={styles.statusText}>
                    {appointment.status === 'upcoming' 
                      ? (language === 'en' ? 'Upcoming' : 'Akan Datang')
                      : (language === 'en' ? 'Completed' : 'Selesai')
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                
                {appointment.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>{appointment.notes}</Text>
                  </View>
                )}
              </View>
              
              {appointment.status === 'upcoming' && (
                <View style={styles.appointmentActions}>
                  <View style={styles.leftActions}>
                    <InteractiveFeedback
                      onPress={() => editAppointment(appointment.id)}
                      feedbackType="scale"
                      hapticType="light"
                    >
                      <View style={[styles.actionButton, styles.editButton]}>
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                        <Text style={styles.editButtonText}>
                          {language === 'en' ? 'Edit' : 'Edit'}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                    
                    <InteractiveFeedback
                      onPress={() => deleteAppointment(appointment.id, appointment.doctorName)}
                      feedbackType="scale"
                      hapticType="heavy"
                    >
                      <View style={[styles.actionButton, styles.cancelButton]}>
                        <Ionicons name="close-outline" size={16} color={colors.error} />
                        <Text style={styles.cancelButtonText}>
                          {language === 'en' ? 'Cancel' : 'Batal'}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                  </View>
                  
                  <InteractiveFeedback
                    onPress={() => markAsDone(appointment.id, appointment.doctorName, appointment.appointmentType)}
                    feedbackType="scale"
                    hapticType="medium"
                  >
                    <View style={[styles.actionButton, styles.doneButton]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.doneButtonText}>
                        {language === 'en' ? 'Mark Done' : 'Selesai'}
                      </Text>
                    </View>
                  </InteractiveFeedback>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredAppointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No appointments found' : 'Tiada temujanji dijumpai'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'en' 
                ? 'Try adjusting your filter or add new appointments'
                : 'Cuba laraskan penapis anda atau tambah temujanji baharu'
              }
            </Text>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
      
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
    </SafeAreaWrapper>
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
  addButton: {
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
  filterContainer: {
    marginBottom: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  singleStatCard: {
    paddingVertical: 16,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  appointmentsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: colors.primaryAlpha,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.errorAlpha,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.error,
  },
  doneButton: {
    backgroundColor: colors.successAlpha,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 24,
  },
});