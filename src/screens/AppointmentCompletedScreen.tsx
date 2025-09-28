import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAppointments, useAppointmentOutcomes } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      appointmentId?: string;
      doctorName?: string;
      appointmentType?: string;
      clinic?: string;
      date?: string;
      time?: string;
      notes?: string;
    };
  };
}

export function AppointmentCompletedScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { appointmentId, doctorName, appointmentType, clinic, date, time, notes } = route?.params || {};

  // Database hooks
  const { elderlyProfiles, loading: elderlyLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0]; // For demo, use first elderly profile
  const { appointments, loading: appointmentsLoading } = useAppointments(currentElderly?.id || '');
  const { outcomes, loading: outcomesLoading, error: outcomesError } = useAppointmentOutcomes(currentElderly?.id || '');

  // Find the specific appointment and its outcome
  const appointmentData = appointments.find(apt => apt.id === appointmentId);
  const appointmentOutcome = outcomes.find(outcome => outcome.appointmentId === appointmentId);

  const isLoading = elderlyLoading || appointmentsLoading || outcomesLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading appointment details...' : 'Memuatkan butiran temujanji...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (outcomesError) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={outcomesError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  // Use appointmentData from database or fallback to route params
  const appointment = appointmentData || {
    id: appointmentId,
    doctorName: doctorName || 'Unknown Doctor',
    clinic: clinic || 'Unknown Clinic',
    appointmentType: appointmentType || 'Unknown Type',
    date: date || new Date().toISOString(),
    time: time || 'Unknown Time',
    notes: notes || ''
  };

  if (!appointment.id) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text style={styles.errorText}>
            {language === 'en' ? 'Appointment details not found' : 'Butiran temujanji tidak dijumpai'}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return colors.success;
      case 'high': return colors.warning;
      case 'critical': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
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
                {language === 'en' ? 'Appointment Summary' : 'Ringkasan Temujanji'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Medical records and appointment outcomes' : 'Rekod perubatan dan hasil temujanji'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>
        {/* Appointment Header */}
        <LinearGradient
          colors={[colors.success, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.appointmentCard}
        >
          <View style={styles.appointmentHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.white} />
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>{appointment.appointmentType}</Text>
              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.clinicName}>{appointment.clinic}</Text>
              <Text style={styles.appointmentDate}>
                {formatDate(appointment.date)} • {appointment.time}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Doctor's Notes */}
        {appointmentOutcome ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? "Doctor's Notes" : 'Nota Doktor'}
              </Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.diagnosisTitle}>
                {language === 'en' ? 'Diagnosis:' : 'Diagnosis:'} {appointmentOutcome.diagnosis}
              </Text>
              <Text style={styles.doctorNotes}>{appointmentOutcome.doctorNotes}</Text>
              {appointmentOutcome.testResults && (
                <View style={styles.outcomeSection}>
                  <Text style={styles.outcomeSectionTitle}>
                    {language === 'en' ? 'Test Results:' : 'Keputusan Ujian:'}
                  </Text>
                  <Text style={styles.outcomeText}>{appointmentOutcome.testResults}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? "Appointment Notes" : 'Nota Temujanji'}
              </Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.doctorNotes}>
                {appointment.notes || (language === 'en' ? 'No detailed outcome recorded for this appointment.' : 'Tiada hasil terperinci direkodkan untuk temujanji ini.')}
              </Text>
            </View>
          </View>
        )}

        {/* New Medications */}
        {appointmentOutcome?.newMedications && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={20} color={colors.info} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'New Medications' : 'Ubat Baharu'}
              </Text>
            </View>
            <View style={styles.medicationCard}>
              <Text style={styles.outcomeText}>{appointmentOutcome.newMedications}</Text>
            </View>
          </View>
        )}

        {/* Prescriptions */}
        {appointmentOutcome?.prescriptions && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Prescriptions' : 'Preskripsi'}
              </Text>
            </View>
            <View style={styles.prescriptionCard}>
              <Text style={styles.outcomeText}>{appointmentOutcome.prescriptions}</Text>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {appointmentOutcome?.recommendations && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Recommendations' : 'Cadangan'}
              </Text>
            </View>
            <View style={styles.recommendationsCard}>
              <Text style={styles.outcomeText}>{appointmentOutcome.recommendations}</Text>
            </View>
          </View>
        )}

        {/* Follow-up */}
        {appointmentOutcome?.nextAppointmentRecommended && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Follow-up Required' : 'Susulan Diperlukan'}
              </Text>
            </View>
            <View style={styles.nextAppointmentCard}>
              <Text style={styles.nextAppointmentType}>
                {language === 'en' ? 'Follow-up appointment recommended' : 'Temujanji susulan disyorkan'}
              </Text>
              {appointmentOutcome.nextAppointmentTimeframe && (
                <Text style={styles.nextAppointmentTime}>
                  {appointmentOutcome.nextAppointmentTimeframe}
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
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
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 3,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  appointmentDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  diagnosisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  doctorNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  testResultCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  testStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  testStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  testValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  testRange: {
    fontSize: 12,
    color: colors.textMuted,
  },
  vaccineCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vaccineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  vaccineDetails: {
    gap: 6,
  },
  vaccineDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  medicationSubsection: {
    marginBottom: 16,
  },
  medicationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  medicationCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  medicationChange: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '500',
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  medicationDuration: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recommendationsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  nextAppointmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextAppointmentType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  nextAppointmentTime: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  nextAppointmentNotes: {
    fontSize: 12,
    color: colors.textMuted,
  },
  prescriptionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionMedication: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  prescriptionQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  prescriptionInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  prescriptionRefills: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
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
  outcomeSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  outcomeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  outcomeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});