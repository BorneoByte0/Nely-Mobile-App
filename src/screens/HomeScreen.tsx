import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';
import { InteractiveFeedback, FeedbackToast } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useVitalSigns, useUserProfile, useMedications, useCareNotes, useMedicationTaken } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';

// Activity Details Modal Component
function ActivityDetailsModal({
  visible,
  onClose,
  vitalSigns,
  careNotes,
  medicationTaken
}: {
  visible: boolean;
  onClose: () => void;
  vitalSigns: any;
  careNotes: any[];
  medicationTaken: any[];
}) {
  const { language } = useLanguage();
  const [slideAnim] = useState(new Animated.Value(300));

  // Combine all activities for detailed view
  const allActivities = combineAllActivities(vitalSigns, careNotes || [], medicationTaken || [], language);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vitals': return 'pulse';
      case 'medication': return 'medical';
      case 'note': return 'document-text';
      default: return 'information-circle';
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'concerning': return colors.warning;
      case 'critical': return colors.error;
      case 'normal': return colors.success;
      case 'info': return colors.info;
      default: return colors.primary;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'concerning': return colors.warningAlpha;
      case 'critical': return colors.errorAlpha;
      case 'normal': return colors.successAlpha;
      case 'info': return colors.infoAlpha;
      default: return colors.primaryAlpha;
    }
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleBackdropPress}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {language === 'en' ? 'Recent Activity' : 'Aktiviti Terkini'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
          >
            {allActivities.length > 0 ? (
              allActivities.map((activity) => (
              <View key={activity.id} style={styles.modalActivityItem}>
                <View style={styles.activityItemHeader}>
                  <View style={styles.activityIconContainer}>
                    <Ionicons 
                      name={getActivityIcon(activity.type) as any} 
                      size={20} 
                      color={getActivityColor(activity.status)} 
                    />
                  </View>
                  <View style={styles.activityTimeInfo}>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(activity.status) }]}>
                    <View style={[styles.statusBadgeDot, { backgroundColor: getActivityColor(activity.status) }]} />
                  </View>
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDetails}>{activity.details}</Text>
                </View>
              </View>
              ))
            ) : (
              <View style={styles.emptyActivityState}>
                <Ionicons name="time-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyActivityTitle}>
                  {language === 'en' ? 'No Activity Yet' : 'Belum Ada Aktiviti'}
                </Text>
                <Text style={styles.emptyActivitySubtitle}>
                  {language === 'en'
                    ? 'Start recording health data to see activity history'
                    : 'Mula merekod data kesihatan untuk melihat sejarah aktiviti'
                  }
                </Text>
              </View>
            )}

            {allActivities.length > 0 && (
              <View style={styles.endOfList}>
                <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
                <Text style={styles.endOfListText}>
                  {language === 'en' ? 'End of activity history' : 'Tamat sejarah aktiviti'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Medication Details Modal Component
function MedicationDetailsModal({
  visible,
  onClose,
  medications,
  medicationTaken
}: {
  visible: boolean;
  onClose: () => void;
  medications: any[];
  medicationTaken: any[];
}) {
  const { language } = useLanguage();
  const [slideAnim] = useState(new Animated.Value(300));

  // Transform database medications to display format
  const allMedications = medications?.map(med => {
    // Determine if medication was taken today
    const today = new Date().toDateString();
    const wasTakenToday = medicationTaken?.some(taken =>
      taken.medications?.name === med.name &&
      new Date(taken.taken_at).toDateString() === today
    );

    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      instructions: med.instructions,
      prescribedBy: med.prescribedBy || (language === 'en' ? 'Unknown Doctor' : 'Doktor Tidak Diketahui'),
      timeSchedule: parseFrequencyToSchedule(med.frequency),
      status: wasTakenToday ? 'taken' : 'pending',
      takenAt: wasTakenToday ? medicationTaken?.find(taken =>
        taken.medications?.name === med.name &&
        new Date(taken.taken_at).toDateString() === today
      )?.taken_at : null,
      nextDose: getNextDoseTime(med.frequency),
      type: getMedicationType(med.name)
    };
  }) || [];

  const getMedicationIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'heart';
      case 'diabetes': return 'water';
      case 'cholesterol': return 'shield-checkmark';
      default: return 'medical';
    }
  };

  const getMedicationColor = (status: string) => {
    switch (status) {
      case 'taken': return colors.success;
      case 'partially_taken': return colors.warning;
      case 'pending': return colors.info;
      case 'missed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getMedicationBadgeColor = (status: string) => {
    switch (status) {
      case 'taken': return colors.successAlpha;
      case 'partially_taken': return colors.warningAlpha;
      case 'pending': return colors.infoAlpha;
      case 'missed': return colors.errorAlpha;
      default: return colors.gray200;
    }
  };

  const getMedicationStatusText = (status: string) => {
    switch (status) {
      case 'taken': return language === 'en' ? 'Completed' : 'Selesai';
      case 'partially_taken': return language === 'en' ? 'Partial' : 'Sebahagian';
      case 'pending': return language === 'en' ? 'Pending' : 'Menunggu';
      case 'missed': return language === 'en' ? 'Missed' : 'Terlepas';
      default: return language === 'en' ? 'Unknown' : 'Tidak Diketahui';
    }
  };

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleBackdropPress}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {language === 'en' ? "Today's Medications" : 'Ubat-ubatan Hari Ini'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
          >
            {allMedications.map((medication) => (
              <View key={medication.id} style={styles.modalMedicationItem}>
                <View style={styles.medicationItemHeader}>
                  <View style={styles.medicationItemIconContainer}>
                    <Ionicons 
                      name={getMedicationIcon(medication.type) as any} 
                      size={20} 
                      color={getMedicationColor(medication.status)} 
                    />
                  </View>
                  <View style={styles.medicationItemInfo}>
                    <Text style={styles.medicationItemName}>{medication.name}</Text>
                    <Text style={styles.medicationItemDosage}>{medication.dosage} • {medication.frequency}</Text>
                  </View>
                  <View style={[styles.medicationStatusBadge, { backgroundColor: getMedicationBadgeColor(medication.status) }]}>
                    <Text style={[styles.medicationStatusText, { color: getMedicationColor(medication.status) }]}>
                      {getMedicationStatusText(medication.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.medicationItemDetails}>
                  <Text style={styles.medicationItemInstructions}>{medication.instructions}</Text>
                  <Text style={styles.medicationItemPrescriber}>
                    {language === 'en' ? 'Prescribed by: ' : 'Ditetapkan oleh: '}{medication.prescribedBy}
                  </Text>
                  
                  {medication.status === 'taken' && medication.takenAt && (
                    <Text style={styles.medicationTakenTime}>
                      {language === 'en' ? 'Taken at: ' : 'Diambil pada: '}{formatTimeFromDate(medication.takenAt)}
                    </Text>
                  )}
                  
                  {medication.nextDose && (
                    <Text style={styles.medicationNextDose}>
                      {language === 'en' ? 'Next dose: ' : 'Dos seterusnya: '}{medication.nextDose}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            <View style={styles.endOfList}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
              <Text style={styles.endOfListText}>
                {language === 'en' ? 'All medications for today' : 'Semua ubat untuk hari ini'}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface Props {
  navigation?: any;
}

// Helper function to combine ALL activities for the modal
function combineAllActivities(vitalSigns: any, careNotes: any[], medicationTaken: any[], language: string) {
  const activities: any[] = [];

  // Add vital signs activity
  if (vitalSigns && vitalSigns.lastRecorded) {
    const timestamp = vitalSigns.lastRecorded;
    activities.push({
      id: `vital-${vitalSigns.id}`,
      time: formatTimeFromDate(timestamp),
      date: formatDateFromDate(timestamp),
      timestamp: timestamp, // Keep original timestamp for sorting
      type: 'vitals',
      title: language === 'en' ? `Vitals recorded by ${vitalSigns.recordedBy || 'Caregiver'}` : `Vital dicatat oleh ${vitalSigns.recordedBy || 'Penjaga'}`,
      details: `Blood pressure: ${vitalSigns.bloodPressure?.systolic || '--'}/${vitalSigns.bloodPressure?.diastolic || '--'} mmHg, Heart rate: ${vitalSigns.pulse?.value || '--'} bpm, SpO₂: ${vitalSigns.spO2?.value || '--'}%`,
      status: 'normal'
    });
  }

  // Add all care notes activities
  if (careNotes && careNotes.length > 0) {
    careNotes.forEach(note => {
      const timestamp = note.dateCreated || note.created_at || note.date_created;
      activities.push({
        id: `note-${note.id}`,
        time: formatTimeFromDate(timestamp),
        date: formatDateFromDate(timestamp),
        timestamp: timestamp, // Keep original timestamp for sorting
        type: 'note',
        title: language === 'en' ? `Care note added by ${note.authorName || note.author_name || 'Caregiver'}` : `Nota penjagaan ditambah oleh ${note.authorName || note.author_name || 'Penjaga'}`,
        details: note.content || 'No details available',
        status: note.isImportant || note.is_important ? 'concerning' : 'info'
      });
    });
  }

  // Add all medication taken activities
  if (medicationTaken && medicationTaken.length > 0) {
    medicationTaken.forEach(med => {
      const timestamp = med.taken_at;
      activities.push({
        id: `medication-${med.id}`,
        time: formatTimeFromDate(timestamp),
        date: formatDateFromDate(timestamp),
        timestamp: timestamp, // Keep original timestamp for sorting
        type: 'medication',
        title: language === 'en' ? 'Medication taken' : 'Ubat telah diambil',
        details: `${med.medications?.name || 'Unknown medication'} ${med.medications?.dosage || ''}`,
        status: 'normal'
      });
    });
  }

  // Sort by timestamp (most recent first) - use actual timestamp instead of formatted date
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Helper function to combine and sort recent activities (top 2)
function combineRecentActivities(vitalSigns: any, careNotes: any[], medicationTaken: any[], language: string) {
  const activities: any[] = [];

  // Add vital signs activity
  if (vitalSigns && vitalSigns.lastRecorded) {
    activities.push({
      id: `vital-${vitalSigns.id}`,
      time: formatTimeFromDate(vitalSigns.lastRecorded),
      date: vitalSigns.lastRecorded,
      type: 'vitals',
      title: language === 'en' ? `Vitals recorded by ${vitalSigns.recordedBy || 'Caregiver'}` : `Vital dicatat oleh ${vitalSigns.recordedBy || 'Penjaga'}`,
      details: `Blood pressure: ${vitalSigns.bloodPressure?.systolic || '--'}/${vitalSigns.bloodPressure?.diastolic || '--'} mmHg`,
      status: 'normal'
    });
  }

  // Add care notes activities
  if (careNotes && careNotes.length > 0) {
    careNotes.slice(0, 2).forEach(note => {
      activities.push({
        id: `note-${note.id}`,
        time: formatTimeFromDate(note.dateCreated || note.created_at || note.date_created),
        date: note.dateCreated || note.created_at || note.date_created,
        type: 'note',
        title: language === 'en' ? `Care note added by ${note.authorName || note.author_name || 'Caregiver'}` : `Nota penjagaan ditambah oleh ${note.authorName || note.author_name || 'Penjaga'}`,
        details: note.content?.substring(0, 50) + (note.content?.length > 50 ? '...' : ''),
        status: note.isImportant || note.is_important ? 'important' : 'info'
      });
    });
  }

  // Add medication taken activities
  if (medicationTaken && medicationTaken.length > 0) {
    medicationTaken.slice(0, 2).forEach(med => {
      activities.push({
        id: `medication-${med.id}`,
        time: formatTimeFromDate(med.taken_at),
        date: med.taken_at,
        type: 'medication',
        title: language === 'en' ? 'Medication taken' : 'Ubat telah diambil',
        details: `${med.medications?.name || 'Unknown'} ${med.medications?.dosage || ''}`,
        status: 'normal'
      });
    });
  }

  // Sort by date (most recent first) and take top 2
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);
}

// Helper function to format time from date string
function formatTimeFromDate(dateString: string): string {
  if (!dateString) return '--:--';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return '--:--';
  }
}

// Helper function to format date from date string
function formatDateFromDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

// Helper function to parse frequency into schedule times
function parseFrequencyToSchedule(frequency: string): string[] {
  if (!frequency) return [];

  const freq = frequency.toLowerCase();
  if (freq.includes('once') || freq.includes('daily')) {
    return ['08:00'];
  } else if (freq.includes('twice')) {
    return ['08:00', '20:00'];
  } else if (freq.includes('three') || freq.includes('thrice')) {
    return ['08:00', '14:00', '20:00'];
  } else if (freq.includes('four')) {
    return ['08:00', '12:00', '16:00', '20:00'];
  }
  return ['08:00']; // Default fallback
}

// Helper function to get next dose time
function getNextDoseTime(frequency: string): string {
  const schedule = parseFrequencyToSchedule(frequency);
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  for (const time of schedule) {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduleTime = hours * 100 + minutes;
    if (scheduleTime > currentTime) {
      return time;
    }
  }

  // If all times have passed, return first time tomorrow
  return schedule[0] || '08:00';
}

// Helper function to determine medication type
function getMedicationType(medicationName: string): string {
  if (!medicationName) return 'general';

  const name = medicationName.toLowerCase();
  if (name.includes('amlodipine') || name.includes('lisinopril') || name.includes('enalapril')) {
    return 'blood_pressure';
  } else if (name.includes('metformin') || name.includes('insulin') || name.includes('glipizide')) {
    return 'diabetes';
  } else if (name.includes('simvastatin') || name.includes('atorvastatin') || name.includes('lovastatin')) {
    return 'cholesterol';
  }
  return 'general';
}

function HomeScreenComponent({ navigation }: Props) {
  const { texts, language } = useLanguage();
  const { user } = useAuth();
  const { canPerformAction } = usePermissions();
  const { alertConfig, visible, showAlert, hideAlert, showSuccess, showError, showWarning, showInfo } = useModernAlert();
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({ type: 'success', message: '' });

  // Simple flag to track initial load
  const isInitialMount = useRef(true);

  // Database hooks
  const { elderlyProfiles, loading: elderlyLoading, error: elderlyError, refetch: refetchElderlyProfiles } = useElderlyProfiles();
  const { userProfile, loading: userLoading, error: userError } = useUserProfile();

  // Get first elderly profile for demo (in real app, user would select)
  const currentElderly = elderlyProfiles[0];
  const { vitalSigns, loading: vitalsLoading, error: vitalsError, refetch: refetchVitalSigns } = useVitalSigns(currentElderly?.id || '');
  const { medications: allMedications, loading: medicationsLoading, error: medicationsError, refetch: refetchMedications } = useMedications(currentElderly?.id || '');
  const { careNotes, loading: notesLoading, error: notesError, refetch: refetchCareNotes } = useCareNotes(currentElderly?.id || '');
  const { medicationTaken, loading: medicationTakenLoading, error: medicationTakenError, refetch: refetchMedicationTaken } = useMedicationTaken(currentElderly?.id || '');

  // Filter to only show active medications for HomeScreen - memoized for performance
  const medications = useMemo(() =>
    allMedications.filter(med => med.isActive),
    [allMedications]
  );

  // Show loading if any critical data is still loading - memoized for performance
  const isDataLoading = useMemo(() =>
    elderlyLoading || userLoading || vitalsLoading || medicationsLoading,
    [elderlyLoading, userLoading, vitalsLoading, medicationsLoading]
  );

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount, only refresh on subsequent focuses
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Simple refresh when returning to screen - refresh all key data
      if (currentElderly?.id) {
        const timer = setTimeout(() => {
          // Refresh vitals (for Record Vitals quick action)
          refetchVitalSigns?.();
          // Refresh medication taken data
          refetchMedicationTaken?.();
          // Refresh care notes
          refetchCareNotes?.();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [currentElderly?.id])
  );



  // Handle loading and error states
  if (isDataLoading) {
    return (
      <SafeAreaWrapper gradientVariant="home" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading health data...' : 'Memuatkan data kesihatan...'}
        />
      </SafeAreaWrapper>
    );
  }

  // Handle error states
  if (elderlyError || userError || vitalsError || medicationsError) {
    const hasNetworkError = elderlyError?.includes('network') || userError?.includes('network') || vitalsError?.includes('network') || medicationsError?.includes('network');
    return (
      <SafeAreaWrapper gradientVariant="home" includeTabBarPadding={true}>
        <ErrorState
          type={hasNetworkError ? 'network' : 'data'}
          message={elderlyError || userError || vitalsError || medicationsError || undefined}
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
      <SafeAreaWrapper gradientVariant="home" includeTabBarPadding={true}>
        <View style={styles.container}>
          <Text>No elderly profiles found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Calculate medication progress from database data (today only)
  const today = new Date().toDateString();
  const totalMeds = medications?.length || 0; // All active medications for today

  // Count unique medications taken today (avoid double counting if taken multiple times)
  const uniqueMedicationsTakenToday = new Set(
    medicationTaken?.filter(taken =>
      new Date(taken.taken_at).toDateString() === today
    ).map(taken => taken.medication_id) || []
  );
  const takenMeds = uniqueMedicationsTakenToday.size;

  // Health alerts based on vital signs status
  const activeAlerts: any[] = [];
  if (vitalSigns) {
    if (vitalSigns.bloodPressure?.status === 'concerning') {
      activeAlerts.push({
        id: 'bp-alert',
        type: 'yellow',
        title: language === 'en' ? 'Blood Pressure Alert' : 'Amaran Tekanan Darah',
        message: language === 'en'
          ? 'Blood pressure readings are concerning. Consider consulting healthcare provider.'
          : 'Bacaan tekanan darah membimbangkan. Pertimbangkan untuk berunding dengan penyedia kesihatan.'
      });
    }
    if (vitalSigns.spO2?.status === 'concerning') {
      activeAlerts.push({
        id: 'spo2-alert',
        type: 'red',
        title: language === 'en' ? 'Oxygen Level Alert' : 'Amaran Tahap Oksigen',
        message: language === 'en'
          ? 'Blood oxygen levels are concerning. Seek immediate medical attention.'
          : 'Tahap oksigen darah membimbangkan. Dapatkan perhatian perubatan segera.'
      });
    }
  }

  // Combine recent activities from different sources
  const recentActivities = combineRecentActivities(vitalSigns, careNotes || [], medicationTaken || [], language);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToastConfig({ type, message });
    setToastVisible(true);
  };

  const handleQuickAction = (action: 'vitals' | 'medicine' | 'note') => {
    if (!navigation) {
      showError(
        language === 'en' ? 'Navigation Error' : 'Ralat Navigasi',
        language === 'en'
          ? 'Unable to navigate. Please restart the app.'
          : 'Tidak dapat menavigasi. Sila mulakan semula aplikasi.'
      );
      return;
    }

    // Check permissions before allowing actions
    let requiredPermission: string;
    let actionName: string;

    switch (action) {
      case 'vitals':
        requiredPermission = 'record_vitals';
        actionName = language === 'en' ? 'record vital signs' : 'merekod tanda vital';
        break;
      case 'medicine':
        requiredPermission = 'take_medication';
        actionName = language === 'en' ? 'record medication intake' : 'merekod pengambilan ubat';
        break;
      case 'note':
        requiredPermission = 'add_care_note';
        actionName = language === 'en' ? 'add care notes' : 'menambah nota penjagaan';
        break;
      default:
        throw new Error('Invalid action');
    }

    // Check if user has permission
    if (!canPerformAction(requiredPermission)) {
      showWarning(
        language === 'en' ? 'Access Restricted' : 'Akses Terhad',
        language === 'en'
          ? `You don't have permission to ${actionName}. Only Admin and Carer roles can perform this action.`
          : `Anda tidak mempunyai kebenaran untuk ${actionName}. Hanya peranan Admin dan Penjaga boleh melakukan tindakan ini.`
      );
      return;
    }

    try {
      switch (action) {
        case 'vitals':
          navigation.navigate('RecordVitalReading');
          break;
        case 'medicine':
          navigation.navigate('TakeMedicineQuick');
          break;
        case 'note':
          navigation.navigate('AddNote');
          break;
        default:
          throw new Error('Invalid action');
      }
    } catch (error) {
      showError(
        language === 'en' ? 'Action Failed' : 'Tindakan Gagal',
        language === 'en'
          ? 'Unable to perform this action. Please try again.'
          : 'Tidak dapat melakukan tindakan ini. Sila cuba lagi.'
      );
    }
  };


  const handleViewAllActivity = () => {
    setActivityModalVisible(true);
  };

  const handleCloseActivityModal = () => {
    setActivityModalVisible(false);
  };

  const handleViewAllMedications = () => {
    setMedicationModalVisible(true);
  };

  const handleCloseMedicationModal = () => {
    setMedicationModalVisible(false);
  };




  return (
    <SafeAreaWrapper gradientVariant="home" includeTabBarPadding={true}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* Modern Header Section */}
        <LinearGradient
          colors={[colors.secondary, colors.primary]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.modernHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <View style={[styles.relationshipBadge, styles.centeredBadge]}>
                <Text style={styles.relationship}>
                  {language === 'en' ? currentElderly.relationship.charAt(0).toUpperCase() + currentElderly.relationship.slice(1) : 'Nenek'}
                </Text>
              </View>
              <Text style={styles.elderlyName}>{currentElderly.name}</Text>
              <View style={styles.modernSubtitle}>
                <View style={styles.healthStatusIndicator} />
                <Text style={styles.subtitleText}>
                  {language === 'en' ? 'Health monitoring active' : 'Pemantauan kesihatan aktif'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Health Status Card */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.healthStatusCard}
        >
          <View style={styles.cardTitleRow}>
            <Ionicons name="heart" size={20} color="rgba(255, 255, 255, 0.95)" />
            <Text style={styles.gradientCardTitle}>
              {language === 'en' ? "Today's Health Status" : 'Status Kesihatan Hari Ini'}
            </Text>
          </View>
          
          {/* Vital Signs List */}
          <View style={styles.vitalSignsList}>
            <View style={styles.vitalSignRow}>
              <View style={styles.vitalSignLeft}>
                <View style={styles.gradientVitalIcon}>
                  <Ionicons name="heart" size={16} color="rgba(255, 255, 255, 0.95)" />
                </View>
                <Text style={styles.gradientVitalLabel}>
                  {language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}
                </Text>
              </View>
              <View style={styles.vitalSignRight}>
                <Text style={styles.gradientVitalValue}>
                  {vitalSigns?.bloodPressure?.systolic || '--'}/{vitalSigns?.bloodPressure?.diastolic || '--'} mmHg
                </Text>
                <View style={[styles.gradientStatusDot, { backgroundColor: getStatusColor(vitalSigns?.bloodPressure?.status || 'normal') }]} />
              </View>
            </View>

            <View style={styles.vitalSignRow}>
              <View style={styles.vitalSignLeft}>
                <View style={styles.gradientVitalIcon}>
                  <Ionicons name="water" size={16} color="rgba(255, 255, 255, 0.95)" />
                </View>
                <Text style={styles.gradientVitalLabel}>SpO₂</Text>
              </View>
              <View style={styles.vitalSignRight}>
                <Text style={styles.gradientVitalValue}>
                  {vitalSigns?.spO2?.value || '--'}%
                </Text>
                <View style={[styles.gradientStatusDot, { backgroundColor: getStatusColor(vitalSigns?.spO2?.status || 'normal') }]} />
              </View>
            </View>

            <View style={styles.vitalSignRow}>
              <View style={styles.vitalSignLeft}>
                <View style={styles.gradientVitalIcon}>
                  <Ionicons name="pulse" size={16} color="rgba(255, 255, 255, 0.95)" />
                </View>
                <Text style={styles.gradientVitalLabel}>
                  {language === 'en' ? 'Heart Rate' : 'Kadar Jantung'}
                </Text>
              </View>
              <View style={styles.vitalSignRight}>
                <Text style={styles.gradientVitalValue}>
                  {vitalSigns?.pulse?.value || '--'} bpm
                </Text>
                <View style={[styles.gradientStatusDot, { backgroundColor: getStatusColor(vitalSigns?.pulse?.status || 'normal') }]} />
              </View>
            </View>

            <View style={styles.vitalSignRow}>
              <View style={styles.vitalSignLeft}>
                <View style={styles.gradientVitalIcon}>
                  <Ionicons name="thermometer" size={16} color="rgba(255, 255, 255, 0.95)" />
                </View>
                <Text style={styles.gradientVitalLabel}>
                  {language === 'en' ? 'Temperature' : 'Suhu Badan'}
                </Text>
              </View>
              <View style={styles.vitalSignRight}>
                <Text style={styles.gradientVitalValue}>
                  {vitalSigns?.temperature?.value || '--'}°C
                </Text>
                <View style={[styles.gradientStatusDot, { backgroundColor: getStatusColor(vitalSigns?.temperature?.status || 'normal') }]} />
              </View>
            </View>
          </View>
          
          <View style={styles.gradientLastUpdated}>
            <Ionicons name="time" size={12} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.gradientLastUpdatedText}>
              {vitalSigns?.lastRecorded
                ? (language === 'en'
                  ? `Updated ${formatLastUpdated(vitalSigns.lastRecorded)} by ${vitalSigns.recordedBy || 'Caregiver'}`
                  : `Dikemaskini ${formatLastUpdated(vitalSigns.lastRecorded)} oleh ${vitalSigns.recordedBy || 'Penjaga'}`)
                : (language === 'en' ? 'No vitals recorded yet' : 'Tiada vital dicatat lagi')
              }
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>
            {language === 'en' ? 'Quick Actions' : 'Tindakan Pantas'}
          </Text>
          <View style={styles.actionButtonsRow}>
            <InteractiveFeedback
              onPress={() => handleQuickAction('vitals')}
              feedbackType="scale"
              hapticType="medium"
              disabled={isLoading}
            >
              <View style={[styles.actionButton, { backgroundColor: colors.primaryAlpha }]}>
                <Ionicons name="pulse" size={24} color={colors.primary} />
                <Text style={styles.actionText}>
                  {language === 'en' ? 'Record Vitals' : 'Rekod Vital'}
                </Text>
              </View>
            </InteractiveFeedback>
            
            <InteractiveFeedback
              onPress={() => handleQuickAction('medicine')}
              feedbackType="scale"
              hapticType="heavy"
              disabled={isLoading}
            >
              <View style={[styles.actionButton, { backgroundColor: colors.successAlpha }]}>
                <Ionicons name="medical" size={24} color={colors.success} />
                <Text style={styles.actionText}>
                  {language === 'en' ? 'Take Medicine' : 'Ambil Ubat'}
                </Text>
              </View>
            </InteractiveFeedback>
            
            <InteractiveFeedback
              onPress={() => handleQuickAction('note')}
              feedbackType="scale"
              hapticType="light"
              disabled={isLoading}
            >
              <View style={[styles.actionButton, { backgroundColor: colors.infoAlpha }]}>
                <Ionicons name="create-outline" size={24} color={colors.info} />
                <Text style={styles.actionText}>
                  {language === 'en' ? 'Add Note' : 'Tambah Nota'}
                </Text>
              </View>
            </InteractiveFeedback>
          </View>
        </View>

        {/* Modern Medication & Activity Section */}
        <View style={styles.medicationActivitySection}>
          {/* Medication Progress Card */}
          <View style={styles.medicationProgressCard}>
            <View style={styles.medicationHeaderRow}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationIconWrapper}>
                  <Ionicons name="medical" size={20} color={colors.success} />
                </View>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationTitle}>
                    {language === 'en' ? "Today's Medication" : 'Ubat Hari Ini'}
                  </Text>
                  <Text style={styles.medicationProgress}>
                    {totalMeds === 0
                      ? (language === 'en' ? 'No medications registered' : 'Tiada ubat didaftarkan')
                      : `${takenMeds} of ${totalMeds} taken`
                    }
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleViewAllMedications} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  {language === 'en' ? 'View All' : 'Lihat Semua'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[colors.success, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${totalMeds === 0 ? 0 : (takenMeds / totalMeds) * 100}%` }]}
                />
              </View>
            </View>
            
            <Text style={styles.nextMedicationText}>
              {language === 'en'
                ? `Next: ${getNextMedication(medications || [], medicationTaken || [], language)} at ${getNextMedicationTime(medications || [], medicationTaken || [])}`
                : `Seterusnya: ${getNextMedication(medications || [], medicationTaken || [], language)} pada ${getNextMedicationTime(medications || [], medicationTaken || [])}`
              }
            </Text>
          </View>

          {/* Recent Activity Card */}
          <View style={styles.recentActivityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>
                {language === 'en' ? 'Recent Activity' : 'Aktiviti Terkini'}
              </Text>
              <TouchableOpacity onPress={handleViewAllActivity} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  {language === 'en' ? 'View All' : 'Lihat Semua'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activityList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityTimeWrapper}>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                      <View style={[styles.activityDot, { backgroundColor: getActivityDotColor(activity.type, activity.status) }]} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.title}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {activity.details}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.activityItem}>
                  <View style={styles.activityTimeWrapper}>
                    <Text style={styles.activityTime}>--:--</Text>
                    <View style={[styles.activityDot, { backgroundColor: colors.textMuted }]} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      {language === 'en' ? 'No recent activity' : 'Tiada aktiviti terkini'}
                    </Text>
                    <Text style={styles.activityDetail}>
                      {language === 'en' ? 'Start tracking health data to see activity' : 'Mula jejak data kesihatan untuk melihat aktiviti'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Health Alerts Card */}
        {activeAlerts.length > 0 && (
          <View style={styles.alertsCard}>
            <Text style={styles.cardTitle}>
              {language === 'en' ? 'Health Alerts' : 'Amaran Kesihatan'}
            </Text>
            {activeAlerts.map(alert => (
              <View key={alert.id} style={[styles.alertItem, { backgroundColor: getAlertBoxColor(alert.type) }]}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Loading State */}
      {isLoading && (
        <HealthLoadingState
          type="general"
          overlay={true}
          message={language === 'en' ? 'Saving...' : 'Menyimpan...'}
        />
      )}

      {/* Toast Feedback */}
      <FeedbackToast
        visible={toastVisible}
        type={toastConfig.type}
        message={toastConfig.message}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        visible={activityModalVisible}
        onClose={handleCloseActivityModal}
        vitalSigns={vitalSigns}
        careNotes={careNotes || []}
        medicationTaken={medicationTaken || []}
      />

      {/* Medication Details Modal */}
      <MedicationDetailsModal
        visible={medicationModalVisible}
        onClose={handleCloseMedicationModal}
        medications={medications || []}
        medicationTaken={medicationTaken || []}
      />

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
function getOverallHealthColor(vitalSigns: any) {
  if (!vitalSigns) return colors.info;

  const concerningCount = Object.values(vitalSigns).filter(
    vital => typeof vital === 'object' && vital && 'status' in vital && vital.status === 'concerning'
  ).length;

  if (concerningCount >= 2) return colors.warning;
  if (concerningCount === 1) return colors.info;
  return colors.success;
}

function getOverallHealthStatus(language: string, vitalSigns: any) {
  if (!vitalSigns) {
    return language === 'en' ? 'No Data' : 'Tiada Data';
  }

  const concerningCount = Object.values(vitalSigns).filter(
    vital => typeof vital === 'object' && vital && 'status' in vital && vital.status === 'concerning'
  ).length;

  if (concerningCount >= 2) {
    return language === 'en' ? 'Needs Attention' : 'Perlu Perhatian';
  }
  if (concerningCount === 1) {
    return language === 'en' ? 'Good' : 'Baik';
  }
  return language === 'en' ? 'Excellent' : 'Cemerlang';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'critical': return colors.error;
    case 'concerning': return colors.warning;
    case 'normal': return colors.success;
    default: return colors.info;
  }
}

function getAlertColor(type: string) {
  switch (type) {
    case 'red': return colors.error;
    case 'yellow': return colors.warning;
    case 'green': return colors.success;
    default: return colors.info;
  }
}

function getAlertBoxColor(type: string) {
  switch (type) {
    case 'red': return colors.errorAlpha;
    case 'yellow': return colors.warningAlpha;
    case 'green': return colors.successAlpha;
    default: return colors.infoAlpha;
  }
}

function getActivityDotColor(type: string, status: string) {
  if (status === 'important') return colors.warning;

  switch (type) {
    case 'vitals': return colors.primary;
    case 'medication': return colors.success;
    case 'note': return colors.info;
    default: return colors.textSecondary;
  }
}

function getNextMedication(medications: any[], medicationTaken: any[], language: string) {
  if (!medications || medications.length === 0) {
    return language === 'en' ? 'No medications' : 'Tiada ubat';
  }

  // Find next medication that hasn't been taken today
  const today = new Date().toDateString();
  const pendingMedications = medications.filter(med => {
    const wasTakenToday = medicationTaken?.some(taken =>
      taken.medications?.name === med.name &&
      new Date(taken.taken_at).toDateString() === today
    );
    return !wasTakenToday;
  });

  if (pendingMedications.length === 0) {
    return language === 'en' ? 'All medications taken' : 'Semua ubat telah diambil';
  }

  return pendingMedications[0]?.name || (language === 'en' ? 'No medications' : 'Tiada ubat');
}

function getNextMedicationTime(medications: any[], medicationTaken: any[]) {
  if (!medications || medications.length === 0) return '--:--';

  // Find next medication that hasn't been taken today
  const today = new Date().toDateString();
  const pendingMedications = medications.filter(med => {
    const wasTakenToday = medicationTaken?.some(taken =>
      taken.medications?.name === med.name &&
      new Date(taken.taken_at).toDateString() === today
    );
    return !wasTakenToday;
  });

  if (pendingMedications.length === 0) return '--:--';

  const nextMed = pendingMedications[0];
  return getNextDoseTime(nextMed?.frequency || '');
}

function getTimeBasedGreeting(language: string): string {
  const hour = new Date().getHours();

  if (language === 'ms') {
    if (hour >= 5 && hour < 12) {
      return 'Selamat pagi,';
    } else if (hour >= 12 && hour < 17) {
      return 'Selamat tengahari,';
    } else if (hour >= 17 && hour < 21) {
      return 'Selamat petang,';
    } else {
      return 'Selamat malam,';
    }
  } else {
    if (hour >= 5 && hour < 12) {
      return 'Good morning,';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon,';
    } else if (hour >= 17 && hour < 21) {
      return 'Good evening,';
    } else {
      return 'Good night,';
    }
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

// Memoize the component to prevent unnecessary re-renders
export const HomeScreen = memo(HomeScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modern Header Styles
  modernHeader: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  elderlyName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginRight: 12,
    letterSpacing: -0.3,
  },
  relationshipBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  relationship: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  centeredBadge: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  modernSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  healthStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Today's Health Status Card (Gradient)
  healthStatusCard: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 10,
    marginBottom: 16,
  },
  overallStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vitalSignsList: {
    gap: 20,
  },
  vitalSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalSignLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vitalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vitalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vitalSignRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Gradient Card Specific Styles
  gradientCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradientVitalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gradientVitalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  gradientVitalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginRight: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradientStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  gradientLastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientLastUpdatedText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Activity Item
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  // Quick Actions Card
  quickActionsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginVertical: 12,
    padding: 24,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
  },
  actionButton: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  // Medication & Activity Section
  medicationActivitySection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 20,
  },
  medicationProgressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    flex: 1,
  },
  medicationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.successAlpha,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  medicationProgress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginVertical: 16,
  },
  nextMedicationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recentActivityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllButton: {
    alignSelf: 'flex-start',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  activityList: {
    gap: 16,
  },
  activityTimeWrapper: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 45,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Alerts Card
  alertsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    marginVertical: 12,
    padding: 24,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  alertItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Progress Bar
  progressTrack: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Activity Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
    paddingTop: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollContent: {
    flex: 1,
    paddingTop: 8,
  },
  modalActivityItem: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  activityItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityTimeInfo: {
    flex: 1,
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  endOfList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  endOfListText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  emptyActivityState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyActivitySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Medication Modal Specific Styles
  medicationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalMedicationItem: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  medicationItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationItemInfo: {
    flex: 1,
  },
  medicationItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  medicationItemDosage: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  medicationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  medicationItemDetails: {
    paddingLeft: 52,
    gap: 4,
  },
  medicationItemInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  medicationItemPrescriber: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  medicationTakenTime: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  medicationNextDose: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
});