import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { VitalSignModal } from '../components/VitalSignModal';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { hapticFeedback, healthStatusHaptics } from '../utils/haptics';
import { useElderlyProfiles, useVitalSigns, useCareNotes, useMedications } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

export function FamilyScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { alertConfig, visible, showAlert, hideAlert, showSuccess, showError, showWarning, showInfo } = useModernAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVital, setSelectedVital] = useState<{
    type: 'bloodPressure' | 'spO2' | 'pulse' | 'bloodGlucose';
    value: string;
    unit: string;
    status: 'normal' | 'concerning' | 'critical';
  } | null>(null);

  // Database hooks
  const { elderlyProfiles, loading: elderlyLoading, error: elderlyError, refetch: refetchElderlyProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0]; // For demo, use first elderly profile
  const { vitalSigns, loading: vitalsLoading, error: vitalsError, refetch: refetchVitalSigns } = useVitalSigns(currentElderly?.id || '');
  const { careNotes, loading: notesLoading, error: notesError, refetch: refetchCareNotes } = useCareNotes(currentElderly?.id || '');
  const { medications: allMedications, loading: medicationsLoading, error: medicationsError, refetch: refetchMedications } = useMedications(currentElderly?.id || '');

  // Filter to only show active medications in family overview
  const medications = allMedications.filter(med => med.isActive);


  const isDataLoading = elderlyLoading || vitalsLoading || notesLoading || medicationsLoading;

  if (isDataLoading) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading family data...' : 'Memuatkan data keluarga...'}
        />
      </SafeAreaWrapper>
    );
  }

  // Handle error states
  if (elderlyError || vitalsError) {
    const hasNetworkError = elderlyError?.includes('network') || vitalsError?.includes('network');
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <ErrorState
          type={hasNetworkError ? 'network' : 'data'}
          message={elderlyError || vitalsError || undefined}
          onRetry={() => {
            // In a real app, you would refetch the data
            window.location.reload();
          }}
        />
      </SafeAreaWrapper>
    );
  }

  if (!currentElderly) {
    return (
      <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
        <View style={styles.card}>
          <Text>No elderly profiles found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const onRefresh = async () => {
    console.log('🔄 Starting family screen refresh...');
    setRefreshing(true);
    try {
      // Refetch all data
      await Promise.all([
        refetchElderlyProfiles(),
        refetchVitalSigns(),
        refetchCareNotes(),
        refetchMedications(),
      ]);

      console.log('✅ Family screen refresh completed successfully');
      setRefreshing(false);
    } catch (error) {
      console.log('❌ Family screen refresh error:', error);
      setRefreshing(false);
      showError(
        language === 'en' ? 'Refresh Failed' : 'Gagal Muat Semula',
        language === 'en'
          ? 'Unable to refresh family data. Please check your connection and try again.'
          : 'Tidak dapat memuat semula data keluarga. Sila periksa sambungan anda dan cuba lagi.'
      );
    }
  };

  const handleVitalPress = (
    type: 'bloodPressure' | 'spO2' | 'pulse' | 'bloodGlucose',
    value: string,
    unit: string,
    status: 'normal' | 'concerning' | 'critical'
  ) => {
    setSelectedVital({ type, value, unit, status });
    setModalVisible(true);
  };

  const getHapticTypeForStatus = (status: 'normal' | 'concerning' | 'critical') => {
    switch (status) {
      case 'normal':
        return 'light' as const;
      case 'concerning':
        return 'medium' as const;
      case 'critical':
        return 'heavy' as const;
      default:
        return 'light' as const;
    }
  };
  
  return (
    <SafeAreaWrapper gradientVariant="family" includeTabBarPadding={true}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Modern Gradient Profile Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.leftSection}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    {currentElderly.avatar ? (
                      <Image
                        source={{ uri: currentElderly.avatar }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={36} color={colors.white} />
                    )}
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: getCareStatusColor(currentElderly.careLevel) }]} />
                </View>
                
                {/* Medical Conditions below avatar */}
                {currentElderly.conditions && currentElderly.conditions.length > 0 && (
                  <View style={styles.conditionsContainer}>
                    {currentElderly.conditions.map((condition, index) => (
                      <View key={condition} style={styles.conditionBadge}>
                        <Text style={styles.conditionText}>{condition}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.headerName}>{currentElderly.name}</Text>
                <View style={styles.profileDetailsRow}>
                  <Text style={styles.profileDetail}>
                    {currentElderly.age} {language === 'en' ? 'years old' : 'tahun'}
                  </Text>
                  <Text style={styles.profileSeparator}>•</Text>
                  <Text style={styles.profileDetail}>
                    {currentElderly.weight || vitalSigns?.weight?.value || '--'} kg
                  </Text>
                  <Text style={styles.profileSeparator}>•</Text>
                  <Text style={styles.profileDetail}>
                    {currentElderly.height || '--'} cm
                  </Text>
                </View>
                <View style={styles.profileDetailsRow}>
                  <Text style={styles.profileDetail}>
                    {language === 'en' ? 'Blood Type:' : 'Jenis Darah:'} {currentElderly.bloodType || '--'}
                  </Text>
                  <Text style={styles.profileSeparator}>•</Text>
                  <Text style={styles.relationship}>
                    {language === 'en' ? currentElderly.relationship : 'Nenek'}
                  </Text>
                </View>
                
                {/* Emergency Contact */}
                <View style={styles.emergencyInfo}>
                  <Text style={styles.emergencyLabel}>
                    {language === 'en' ? 'Emergency:' : 'Kecemasan:'}
                  </Text>
                  <Text style={styles.emergencyContact}>
                    {currentElderly.emergencyContactPhone || currentElderly.emergencyContact || '--'}
                  </Text>
                </View>

                {/* Doctor Information */}
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorText}>
                    {currentElderly.doctorName || '--'} {currentElderly.clinicName ? `• ${currentElderly.clinicName}` : ''}
                  </Text>
                </View>
                
                {/* Care Level Badge */}
                <View style={[styles.careLevelBadge, { backgroundColor: getCareStatusColor(currentElderly.careLevel) }]}>
                  <Text style={styles.careLevelText}>
                    {getCareLevel(currentElderly.careLevel, language)}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Edit Button (Admin Only) */}
            <InteractiveFeedback
              onPress={() => {
                hapticFeedback.medium();
                try {
                  navigation.navigate('EditElderlyProfile');
                } catch (error) {
                  showError(
                    language === 'en' ? 'Navigation Error' : 'Ralat Navigasi',
                    language === 'en' 
                      ? 'Unable to open profile editor. Please try again.'
                      : 'Tidak dapat membuka editor profil. Sila cuba lagi.'
                  );
                }
              }}
              feedbackType="scale"
              hapticType="medium"
            >
              <View style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={colors.white} />
              </View>
            </InteractiveFeedback>
          </View>
        </LinearGradient>

        {/* Glassmorphism Vital Signs Card */}
        <View style={[styles.card, styles.vitalsCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Vital Signs' : 'Tanda Vital'}
            </Text>
            <Text style={styles.lastUpdated}>
              {vitalSigns?.lastRecorded
                ? (language === 'en'
                  ? `Last updated: ${formatLastUpdated(vitalSigns.lastRecorded)}`
                  : `Kemaskini terakhir: ${formatLastUpdated(vitalSigns.lastRecorded)}`)
                : (language === 'en' ? 'No vitals recorded' : 'Tiada vital dicatat')
              }
            </Text>
          </View>
          
          <View style={styles.vitalsGrid}>
            <InteractiveFeedback
              onPress={() => handleVitalPress(
                'bloodPressure',
                `${vitalSigns?.bloodPressure?.systolic || '--'}/${vitalSigns?.bloodPressure?.diastolic || '--'}`,
                'mmHg',
                vitalSigns?.bloodPressure?.status || 'normal'
              )}
              feedbackType="scale"
              hapticType={getHapticTypeForStatus(vitalSigns?.bloodPressure?.status || 'normal')}
            >
              <View style={[styles.vitalCard, { backgroundColor: getStatusBackgroundColor(vitalSigns?.bloodPressure?.status || 'normal') }]}>
                <View style={styles.vitalInfo}>
                  <Text style={styles.vitalLabel}>
                    {language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}
                  </Text>
                  <Text style={styles.vitalUnit}>mmHg</Text>
                </View>
                <View style={styles.vitalValueContainer}>
                  <Text style={styles.vitalValue}>
                    {vitalSigns?.bloodPressure?.systolic || '--'}/{vitalSigns?.bloodPressure?.diastolic || '--'}
                  </Text>
                </View>
                <View style={[styles.vitalStatusDot, { backgroundColor: getStatusColor(vitalSigns?.bloodPressure?.status || 'normal') }]} />
                <View style={styles.tapIndicator}>
                  <Ionicons name="chevron-up" size={16} color={colors.primary} />
                </View>
              </View>
            </InteractiveFeedback>
            
            <InteractiveFeedback
              onPress={() => handleVitalPress(
                'spO2',
                (vitalSigns?.spO2?.value || 0).toString(),
                '%',
                vitalSigns?.spO2?.status || 'normal'
              )}
              feedbackType="scale"
              hapticType={getHapticTypeForStatus(vitalSigns?.spO2?.status || 'normal')}
            >
              <View style={[styles.vitalCard, { backgroundColor: getStatusBackgroundColor(vitalSigns?.spO2?.status || 'normal') }]}>
                <View style={styles.vitalInfo}>
                  <Text style={styles.vitalLabel}>SpO2</Text>
                  <Text style={styles.vitalUnit}>%</Text>
                </View>
                <View style={styles.vitalValueContainer}>
                  <Text style={styles.vitalValue}>{vitalSigns?.spO2?.value || '--'}</Text>
                </View>
                <View style={[styles.vitalStatusDot, { backgroundColor: getStatusColor(vitalSigns?.spO2?.status || 'normal') }]} />
                <View style={styles.tapIndicator}>
                  <Ionicons name="chevron-up" size={16} color={colors.primary} />
                </View>
              </View>
            </InteractiveFeedback>
            
            <InteractiveFeedback
              onPress={() => handleVitalPress(
                'pulse',
                (vitalSigns?.pulse?.value || 0).toString(),
                'bpm',
                vitalSigns?.pulse?.status || 'normal'
              )}
              feedbackType="scale"
              hapticType={getHapticTypeForStatus(vitalSigns?.pulse?.status || 'normal')}
            >
              <View style={[styles.vitalCard, { backgroundColor: getStatusBackgroundColor(vitalSigns?.pulse?.status || 'normal') }]}>
                <View style={styles.vitalInfo}>
                  <Text style={styles.vitalLabel}>
                    {language === 'en' ? 'Pulse' : 'Nadi'}
                  </Text>
                  <Text style={styles.vitalUnit}>bpm</Text>
                </View>
                <View style={styles.vitalValueContainer}>
                  <Text style={styles.vitalValue}>{vitalSigns?.pulse?.value || '--'}</Text>
                </View>
                <View style={[styles.vitalStatusDot, { backgroundColor: getStatusColor(vitalSigns?.pulse?.status || 'normal') }]} />
                <View style={styles.tapIndicator}>
                  <Ionicons name="chevron-up" size={16} color={colors.primary} />
                </View>
              </View>
            </InteractiveFeedback>
            
            <InteractiveFeedback
              onPress={() => handleVitalPress(
                'bloodGlucose',
                (vitalSigns?.bloodGlucose?.value || 0).toString(),
                'mmol/L',
                vitalSigns?.bloodGlucose?.status || 'normal'
              )}
              feedbackType="scale"
              hapticType={getHapticTypeForStatus(vitalSigns?.bloodGlucose?.status || 'normal')}
            >
              <View style={[styles.vitalCard, { backgroundColor: getStatusBackgroundColor(vitalSigns?.bloodGlucose?.status || 'normal') }]}>
                <View style={styles.vitalInfo}>
                  <Text style={styles.vitalLabel}>
                    {language === 'en' ? 'Blood Sugar' : 'Gula Darah'}
                  </Text>
                  <Text style={styles.vitalUnit}>mmol/L</Text>
                </View>
                <View style={styles.vitalValueContainer}>
                  <Text style={styles.vitalValue}>{vitalSigns?.bloodGlucose?.value || '--'}</Text>
                </View>
                <View style={[styles.vitalStatusDot, { backgroundColor: getStatusColor(vitalSigns?.bloodGlucose?.status || 'normal') }]} />
                <View style={styles.tapIndicator}>
                  <Ionicons name="chevron-up" size={16} color={colors.primary} />
                </View>
              </View>
            </InteractiveFeedback>
          </View>
        </View>

        {/* Medication Management Card */}
        <View style={[styles.card, styles.medicationCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Medications' : 'Ubat-ubatan'}
            </Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => {
                hapticFeedback.medium();
                try {
                  navigation.navigate('ManageMedications');
                } catch (error) {
                  showError(
                    language === 'en' ? 'Navigation Error' : 'Ralat Navigasi',
                    language === 'en' 
                      ? 'Unable to open medication management. Please try again.'
                      : 'Tidak dapat membuka pengurusan ubat. Sila cuba lagi.'
                  );
                }
              }}
            >
              <Text style={styles.manageButtonText}>
                {language === 'en' ? 'Manage' : 'Urus'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {medications
            .slice(0, 3)
            .map((medication, index) => (
            <View key={medication.id} style={[
              styles.medicationItem,
              index === medications.slice(0, 3).length - 1 && styles.lastMedicationItem
            ]}>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{medication.name}</Text>
                <Text style={styles.medicationDetails}>
                  {medication.dosage} • {medication.frequency}
                </Text>
                <Text style={styles.medicationInstructions}>
                  {medication.instructions}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.takeButton}
                onPress={() => {
                  hapticFeedback.light();
                  try {
                    navigation.navigate('TakeMedication', { 
                      medicationId: medication.id, 
                      medicationName: medication.name 
                    });
                  } catch (error) {
                    showError(
                      language === 'en' ? 'Navigation Error' : 'Ralat Navigasi',
                      language === 'en' 
                        ? 'Unable to open medication tracker. Please try again.'
                        : 'Tidak dapat membuka penjejak ubat. Sila cuba lagi.'
                    );
                  }
                }}
              >
                <Text style={styles.takeButtonText}>
                  {language === 'en' ? 'Take' : 'Ambil'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {medications.filter(medication => medication.isActive).length === 0 && (
            <View style={styles.noMedicationsContainer}>
              <Ionicons name="medical-outline" size={24} color={colors.textMuted} />
              <Text style={styles.noMedicationsText}>
                {language === 'en' ? 'No active medications' : 'Tiada ubat aktif'}
              </Text>
            </View>
          )}
          
          {/* Recent Activity Button */}
          <View style={styles.medicationFooter}>
            <TouchableOpacity 
              style={styles.recentActivityButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate('RecentMedicationActivity');
              }}
            >
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.recentActivityText}>
                {language === 'en' ? 'Recent Activity' : 'Aktiviti Terkini'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments Card */}
        <View style={[styles.card, styles.appointmentsCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Appointments' : 'Temujanji'}
            </Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => {
                hapticFeedback.medium();
                navigation.navigate('ManageAppointments');
              }}
            >
              <Text style={styles.manageButtonText}>
                {language === 'en' ? 'Manage' : 'Urus'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.noMedicationsContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
            <Text style={styles.noMedicationsText}>
              {language === 'en' ? 'No upcoming appointments' : 'Tiada temujanji akan datang'}
            </Text>
          </View>
          
          {/* View Upcoming and Completed Buttons */}
          <View style={styles.appointmentFooter}>
            <TouchableOpacity 
              style={styles.viewUpcomingButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate('ViewUpcomingAppointments');
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.viewUpcomingText}>
                {language === 'en' ? 'View Upcoming' : 'Lihat Akan Datang'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.completedButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate('CompletedAppointments');
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.completedText}>
                {language === 'en' ? 'Completed' : 'Selesai'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes and Care Card */}
        <View style={[styles.card, styles.notesCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Family Care Notes' : 'Nota Penjagaan Keluarga'}
            </Text>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => {
                hapticFeedback.medium();
                navigation.navigate('AddNote');
              }}
            >
              <Text style={styles.addNoteText}>+</Text>
            </TouchableOpacity>
          </View>
          
          {careNotes && careNotes.length > 0 ? (
            <View style={styles.notesContainer}>
              {careNotes.slice(0, 3).map((note, index) => (
                <View key={note.id} style={[styles.modernNoteCard, index === 0 && styles.firstNoteCard]}>
                  <View style={styles.modernNoteLayout}>
                    {/* Category Icon on Left */}
                    <View style={[styles.modernCategoryIcon, { backgroundColor: getCategoryColor(note.category) }]}>
                      <Ionicons
                        name={getCategoryIcon(note.category) as any}
                        size={14}
                        color={colors.white}
                      />
                    </View>

                    {/* Main Content */}
                    <View style={styles.modernNoteContent}>
                      <View style={styles.modernNoteHeader}>
                        <Text style={styles.modernNoteAuthor}>{note.authorName}</Text>
                        <View style={styles.modernNoteMetadata}>
                          <Text style={styles.modernNoteTime}>
                            {formatNoteTime(note.dateCreated)}
                          </Text>
                          {note.isImportant && (
                            <View style={styles.modernImportantFlag}>
                              <Ionicons name="flag" size={10} color={colors.white} />
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.modernNoteText} numberOfLines={2}>
                        {note.content}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noMedicationsContainer}>
              <Ionicons name="document-text-outline" size={24} color={colors.textMuted} />
              <Text style={styles.noMedicationsText}>
                {language === 'en' ? 'No care notes yet' : 'Belum ada nota penjagaan'}
              </Text>
            </View>
          )}
          
          {/* View All Notes Button */}
          <View style={styles.notesFooter}>
            <TouchableOpacity 
              style={styles.viewAllNotesButton}
              onPress={() => {
                hapticFeedback.light();
                navigation.navigate('ViewAllNotes');
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={styles.viewAllNotesText}>
                {language === 'en' ? 'View All Notes' : 'Lihat Semua Nota'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members Card */}
        <View style={[styles.card, styles.familyCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Family Members' : 'Ahli Keluarga'}
            </Text>
            <Text style={styles.memberCount}>
              1 {language === 'en' ? 'member' : 'ahli'}
            </Text>
          </View>
          
          <View style={styles.noMedicationsContainer}>
            <Ionicons name="people-outline" size={24} color={colors.textMuted} />
            <Text style={styles.noMedicationsText}>
              {language === 'en' ? 'Family member management coming soon' : 'Pengurusan ahli keluarga akan datang'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Vital Sign Detail Modal */}
      {selectedVital && (
        <VitalSignModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedVital(null);
          }}
          vitalType={selectedVital.type}
          currentValue={selectedVital.value}
          unit={selectedVital.unit}
          status={selectedVital.status}
          lastRecorded={vitalSigns?.lastRecorded || ''}
          elderlyId={currentElderly?.id}
          recordedBy={vitalSigns?.recordedBy || ''}
          navigation={navigation}
        />
      )}

      {/* Modern Alert */}
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
}

// Helper functions
function getCareStatusColor(careLevel: string) {
  switch (careLevel) {
    case 'independent': return colors.success;
    case 'dependent': return colors.warning;
    case 'bedridden': return colors.error;
    default: return colors.info;
  }
}

function getCareLevel(careLevel: string, language: string) {
  const levels = {
    independent: language === 'en' ? 'Independent' : 'Berdikari',
    dependent: language === 'en' ? 'Dependent' : 'Bergantung',
    bedridden: language === 'en' ? 'Bedridden' : 'Terlantar',
  };
  return levels[careLevel as keyof typeof levels] || careLevel;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'critical': return colors.error;
    case 'concerning': return colors.warning;
    case 'normal': return colors.success;
    default: return colors.info;
  }
}

function getStatusBackgroundColor(status: string) {
  switch (status) {
    case 'critical': return colors.errorAlpha;
    case 'concerning': return colors.warningAlpha;
    case 'normal': return colors.successAlpha;
    default: return colors.infoAlpha;
  }
}

function formatLastUpdated(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

function getDay(dateString: string) {
  return new Date(dateString).getDate().toString();
}

function getMonth(dateString: string, language: string) {
  const months = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ms: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis']
  };
  return months[language as 'en' | 'ms'][new Date(dateString).getMonth()];
}

function formatTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function getRelationshipMS(relationship: string) {
  const relationships = {
    'Son': 'Anak lelaki',
    'Daughter': 'Anak perempuan',
    'Daughter-in-law': 'Menantu perempuan',
    'Son-in-law': 'Menantu lelaki',
  };
  return relationships[relationship as keyof typeof relationships] || relationship;
}

function getCategoryColor(category: string) {
  const colorMap: { [key: string]: string } = {
    general: colors.primary,
    health: colors.success,
    medication: colors.info,
    appointment: colors.secondary,
    daily_care: colors.warning,
    behavior: colors.textSecondary,
    emergency: colors.error,
  };
  return colorMap[category] || colors.primary;
}

function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: string } = {
    general: 'document-text',
    health: 'medical',
    medication: 'medical-outline',
    appointment: 'calendar',
    daily_care: 'heart',
    behavior: 'person',
    emergency: 'warning',
  };
  return iconMap[category] || 'document-text';
}

function formatNoteTime(dateString: string): string {
  if (!dateString) return 'Unknown';

  try {
    const now = new Date();
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date string in FamilyScreen:', dateString);
      return 'Invalid date';
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    console.log('FamilyScreen date formatting:', { dateString, date, diffMinutes, diffHours, diffDays });

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${diffDays}d ago`;
  } catch (error) {
    console.log('Error formatting time in FamilyScreen:', error, dateString);
    return 'Error';
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileDetail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  profileSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 8,
  },
  relationship: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  emergencyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginRight: 6,
  },
  emergencyContact: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  doctorInfo: {
    marginTop: 2,
    marginBottom: 10,
  },
  doctorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  conditionsContainer: {
    flexDirection: 'column',
    gap: 3,
    width: '100%',
  },
  conditionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  careLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  careLevelText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textMuted,
  },
  vitalsCard: {},
  vitalsGrid: {
    gap: 10,
  },
  vitalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalInfo: {
    flex: 1,
  },
  vitalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  vitalUnit: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '400',
  },
  vitalValueContainer: {
    alignItems: 'flex-end',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vitalStatusDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tapIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    opacity: 0.5,
  },
  medicationCard: {},
  manageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  medicationInstructions: {
    fontSize: 11,
    color: colors.textMuted,
  },
  takeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  noMedicationsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noMedicationsText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  notesContainer: {
    gap: 12,
  },
  modernNoteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  firstNoteCard: {
    borderWidth: 1.5,
    borderColor: colors.primaryAlpha,
  },
  modernNoteLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modernCategoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  modernNoteContent: {
    flex: 1,
  },
  modernNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modernNoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  modernNoteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modernNoteTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  modernImportantFlag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  lastMedicationItem: {
    borderBottomWidth: 0,
  },
  medicationFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: 8,
  },
  recentActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentActivityText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  appointmentsCard: {},
  appointmentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  appointmentDate: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  appointmentDay: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  appointmentMonth: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  appointmentClinic: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: 8,
  },
  viewUpcomingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewUpcomingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  lastAppointmentItem: {
    borderBottomWidth: 0,
  },
  notesCard: {},
  addNoteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  notesFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: 8,
  },
  viewAllNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllNotesText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  familyCard: {},
  memberCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  familyMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  caregiverBadge: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primaryAlpha,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});