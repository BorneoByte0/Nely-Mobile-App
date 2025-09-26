import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      appointmentId?: string;
    };
  };
}

// Mock appointment completion data
const appointmentCompletionData: { [key: string]: any } = {
  'apt-004': {
    id: 'apt-004',
    doctorName: 'Dr. Ahmad Rahman',
    clinic: 'Kuala Lumpur General Hospital',
    appointmentType: 'Blood Test',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '8:00 AM',
    notes: 'Fasting required',
    status: 'completed',
    completionData: {
      dateCompleted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      doctorNotes: 'Blood test results show improved cholesterol levels. Patient responded well to current medication regimen. Continue with Simvastatin 20mg daily.',
      diagnosis: 'Hyperlipidemia - Well controlled',
      testResults: [
        { test: 'Total Cholesterol', value: '4.8 mmol/L', range: '< 5.2 mmol/L', status: 'normal' },
        { test: 'LDL Cholesterol', value: '2.9 mmol/L', range: '< 3.4 mmol/L', status: 'normal' },
        { test: 'HDL Cholesterol', value: '1.4 mmol/L', range: '> 1.0 mmol/L', status: 'normal' },
        { test: 'Triglycerides', value: '1.2 mmol/L', range: '< 1.7 mmol/L', status: 'normal' },
      ],
      newMedications: [],
      modifiedMedications: [
        {
          name: 'Simvastatin',
          change: 'Continue current dosage',
          dosage: '20mg',
          frequency: 'Once daily at bedtime',
          duration: '3 months',
        }
      ],
      recommendations: [
        'Continue with current diet and exercise plan',
        'Monitor blood pressure regularly at home',
        'Schedule follow-up blood test in 3 months',
        'Maintain weight within healthy range',
      ],
      nextAppointment: {
        type: 'Follow-up consultation',
        timeframe: '3 months',
        notes: 'Review blood test results and medication effectiveness',
      },
      prescriptions: [
        {
          medication: 'Simvastatin 20mg',
          quantity: '90 tablets',
          instructions: 'Take one tablet daily at bedtime',
          refills: '2 refills remaining',
        }
      ]
    }
  },
  'apt-005': {
    id: 'apt-005',
    doctorName: 'Dr. Fatimah Zahra',
    clinic: 'Shah Alam Clinic',
    appointmentType: 'Vaccination',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    time: '11:00 AM',
    notes: 'Annual flu shot',
    status: 'completed',
    completionData: {
      dateCompleted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      doctorNotes: 'Annual influenza vaccination administered successfully. No adverse reactions observed. Patient advised on potential mild side effects.',
      diagnosis: 'Routine vaccination - Completed',
      testResults: [],
      newMedications: [],
      modifiedMedications: [],
      recommendations: [
        'Monitor for any delayed reactions for 24-48 hours',
        'Apply cold compress if injection site becomes sore',
        'Contact clinic if fever exceeds 38°C',
        'Schedule next flu vaccination in 12 months',
      ],
      nextAppointment: {
        type: 'Annual flu vaccination',
        timeframe: '12 months',
        notes: 'Routine annual influenza protection',
      },
      prescriptions: [],
      vaccineDetails: {
        vaccine: 'Influenza Vaccine (Quadrivalent)',
        lot: 'FL2024-0891',
        manufacturer: 'Sanofi Pasteur',
        site: 'Left deltoid muscle',
        nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }
  }
};

export function AppointmentCompletedScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const { appointmentId } = route?.params || {};

  const appointmentData = appointmentId ? appointmentCompletionData[appointmentId] : undefined;

  if (!appointmentData) {
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

  const completion = appointmentData.completionData;

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
              <Text style={styles.appointmentTitle}>{appointmentData.appointmentType}</Text>
              <Text style={styles.doctorName}>{appointmentData.doctorName}</Text>
              <Text style={styles.clinicName}>{appointmentData.clinic}</Text>
              <Text style={styles.appointmentDate}>
                {formatDate(appointmentData.date)} • {appointmentData.time}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Doctor's Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              {language === 'en' ? "Doctor's Notes" : 'Nota Doktor'}
            </Text>
          </View>
          <View style={styles.notesCard}>
            <Text style={styles.diagnosisTitle}>
              {language === 'en' ? 'Diagnosis:' : 'Diagnosis:'} {completion.diagnosis}
            </Text>
            <Text style={styles.doctorNotes}>{completion.doctorNotes}</Text>
          </View>
        </View>

        {/* Test Results */}
        {completion.testResults && completion.testResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flask" size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Test Results' : 'Keputusan Ujian'}
              </Text>
            </View>
            {completion.testResults.map((result: any, index: number) => (
              <View key={index} style={styles.testResultCard}>
                <View style={styles.testResultHeader}>
                  <Text style={styles.testName}>{result.test}</Text>
                  <View style={[styles.testStatusBadge, { backgroundColor: getTestStatusColor(result.status) }]}>
                    <Text style={styles.testStatusText}>
                      {result.status === 'normal' 
                        ? (language === 'en' ? 'Normal' : 'Normal')
                        : result.status === 'high'
                        ? (language === 'en' ? 'High' : 'Tinggi')
                        : (language === 'en' ? 'Critical' : 'Kritikal')
                      }
                    </Text>
                  </View>
                </View>
                <Text style={styles.testValue}>{result.value}</Text>
                <Text style={styles.testRange}>
                  {language === 'en' ? 'Normal range:' : 'Julat normal:'} {result.range}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Vaccine Details */}
        {completion.vaccineDetails && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Vaccination Details' : 'Butiran Vaksinasi'}
              </Text>
            </View>
            <View style={styles.vaccineCard}>
              <Text style={styles.vaccineTitle}>{completion.vaccineDetails.vaccine}</Text>
              <View style={styles.vaccineDetails}>
                <Text style={styles.vaccineDetail}>
                  {language === 'en' ? 'Lot Number:' : 'Nombor Lot:'} {completion.vaccineDetails.lot}
                </Text>
                <Text style={styles.vaccineDetail}>
                  {language === 'en' ? 'Manufacturer:' : 'Pengilang:'} {completion.vaccineDetails.manufacturer}
                </Text>
                <Text style={styles.vaccineDetail}>
                  {language === 'en' ? 'Injection Site:' : 'Tempat Suntikan:'} {completion.vaccineDetails.site}
                </Text>
                <Text style={styles.vaccineDetail}>
                  {language === 'en' ? 'Next Due:' : 'Seterusnya:'} {formatDate(completion.vaccineDetails.nextDue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Medications */}
        {(completion.newMedications.length > 0 || completion.modifiedMedications.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={20} color={colors.info} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Medications' : 'Ubat-ubatan'}
              </Text>
            </View>
            
            {completion.newMedications.length > 0 && (
              <View style={styles.medicationSubsection}>
                <Text style={styles.medicationSubtitle}>
                  {language === 'en' ? 'New Medications:' : 'Ubat Baharu:'}
                </Text>
                {completion.newMedications.map((med: any, index: number) => (
                  <View key={index} style={styles.medicationCard}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDetails}>{med.dosage} • {med.frequency}</Text>
                    <Text style={styles.medicationDuration}>{med.duration}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {completion.modifiedMedications.length > 0 && (
              <View style={styles.medicationSubsection}>
                <Text style={styles.medicationSubtitle}>
                  {language === 'en' ? 'Modified Medications:' : 'Ubat Diubah:'}
                </Text>
                {completion.modifiedMedications.map((med: any, index: number) => (
                  <View key={index} style={styles.medicationCard}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationChange}>{med.change}</Text>
                    <Text style={styles.medicationDetails}>{med.dosage} • {med.frequency}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recommendations */}
        {completion.recommendations && completion.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Recommendations' : 'Cadangan'}
              </Text>
            </View>
            <View style={styles.recommendationsCard}>
              {completion.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Next Appointment */}
        {completion.nextAppointment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Next Appointment' : 'Temujanji Seterusnya'}
              </Text>
            </View>
            <View style={styles.nextAppointmentCard}>
              <Text style={styles.nextAppointmentType}>{completion.nextAppointment.type}</Text>
              <Text style={styles.nextAppointmentTime}>
                {language === 'en' ? 'In' : 'Dalam'} {completion.nextAppointment.timeframe}
              </Text>
              <Text style={styles.nextAppointmentNotes}>{completion.nextAppointment.notes}</Text>
            </View>
          </View>
        )}

        {/* Prescriptions */}
        {completion.prescriptions && completion.prescriptions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Prescriptions' : 'Preskripsi'}
              </Text>
            </View>
            {completion.prescriptions.map((prescription: any, index: number) => (
              <View key={index} style={styles.prescriptionCard}>
                <Text style={styles.prescriptionMedication}>{prescription.medication}</Text>
                <Text style={styles.prescriptionQuantity}>
                  {language === 'en' ? 'Quantity:' : 'Kuantiti:'} {prescription.quantity}
                </Text>
                <Text style={styles.prescriptionInstructions}>{prescription.instructions}</Text>
                <Text style={styles.prescriptionRefills}>{prescription.refills}</Text>
              </View>
            ))}
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
});