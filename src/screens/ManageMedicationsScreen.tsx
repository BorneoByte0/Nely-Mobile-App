import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useMedications, useUpdateMedication } from '../hooks/useDatabase';
import { useModernAlert } from '../hooks/useModernAlert';
import { ModernAlert } from '../components/ModernAlert';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

export function ManageMedicationsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { showAlert, alertConfig, hideAlert, showError, showSuccess } = useModernAlert();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { medications, loading: medicationsLoading, error: medicationsError } = useMedications(currentElderly?.id || '');
  const { updateMedication, loading: updateLoading } = useUpdateMedication();

  const isLoading = profilesLoading || medicationsLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading medications...' : 'Memuatkan ubat-ubatan...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (medicationsError) {
    return (
      <SafeAreaWrapper gradientVariant="medicine" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={medicationsError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  const toggleMedicationStatus = async (medicationId: string) => {
    try {
      const medication = medications.find(med => med.id === medicationId);
      if (!medication) return;

      const success = await updateMedication(medicationId, {
        isActive: !medication.isActive
      });

      if (success) {
        hapticFeedback.selection();
        showSuccess(
          language === 'en' ? 'Updated' : 'Dikemaskini',
          language === 'en'
            ? 'Medication status updated successfully!'
            : 'Status ubat berjaya dikemaskini!'
        );
        // Refresh will happen automatically via the medications hook
      } else {
        throw new Error('Failed to update medication status');
      }
    } catch (error) {
      hapticFeedback.error();
      showError(
        language === 'en' ? 'Update Failed' : 'Gagal Kemaskini',
        language === 'en'
          ? 'Unable to update medication status. Please try again.'
          : 'Tidak dapat mengemaskini status ubat. Sila cuba lagi.'
      );
    }
  };

  const deleteMedication = (medicationId: string, medicationName: string) => {
    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Delete Medication' : 'Hapus Ubat',
      message: language === 'en'
        ? `Are you sure you want to delete ${medicationName}?`
        : `Adakah anda pasti untuk menghapus ${medicationName}?`,
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
              const success = await updateMedication(medicationId, {
                isActive: false
              });

              if (success) {
                hapticFeedback.success();
                showSuccess(
                  language === 'en' ? 'Deleted' : 'Dihapus',
                  language === 'en'
                    ? 'Medication deleted successfully!'
                    : 'Ubat berjaya dihapus!'
                );
              } else {
                throw new Error('Failed to delete medication');
              }
            } catch (error) {
              hapticFeedback.error();
              showError(
                language === 'en' ? 'Delete Failed' : 'Gagal Hapus',
                language === 'en'
                  ? 'Unable to delete medication. Please try again.'
                  : 'Tidak dapat menghapus ubat. Sila cuba lagi.'
              );
            }
          },
        },
      ],
    });
  };

  const filterOptions = [
    { key: 'all', labelEn: 'All', labelMs: 'Semua' },
    { key: 'active', labelEn: 'Active', labelMs: 'Aktif' },
    { key: 'inactive', labelEn: 'Inactive', labelMs: 'Tidak Aktif' },
  ];

  const filteredMedications = medications.filter(medication => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return medication.isActive;
    if (selectedFilter === 'inactive') return !medication.isActive;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} ${language === 'en' ? 'days' : 'hari'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${language === 'en' ? 'months' : 'bulan'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${language === 'en' ? 'years' : 'tahun'}`;
    }
  };

  const addNewMedication = () => {
    hapticFeedback.medium();
    navigation.navigate('AddMedication');
  };

  const editMedication = (medicationId: string, medicationName: string) => {
    hapticFeedback.light();
    navigation.navigate('EditMedication', { medicationId, medicationName });
  };

  return (
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
              onPress={() => navigation.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Manage Medications' : 'Urus Ubat-ubatan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Track and manage medication schedules' : 'Jejak dan urus jadual ubat-ubatan'}
              </Text>
            </View>

            <InteractiveFeedback
              onPress={addNewMedication}
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

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            {filterOptions.map((option) => (
              <InteractiveFeedback
                key={option.key}
                onPress={() => {
                  setSelectedFilter(option.key as any);
                  hapticFeedback.selection();
                }}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive
                ]}>
                  <Text style={[
                    styles.filterTabText,
                    selectedFilter === option.key && styles.filterTabTextActive
                  ]}>
                    {language === 'en' ? option.labelEn : option.labelMs}
                  </Text>
                </View>
              </InteractiveFeedback>
            ))}
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>
              {medications.filter(med => med.isActive).length}
            </Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Active' : 'Aktif'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="pause-circle" size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {medications.filter(med => !med.isActive).length}
            </Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Inactive' : 'Tidak Aktif'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="medical" size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{medications.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Total' : 'Jumlah'}
            </Text>
          </View>
        </View>

        {/* Unified Medications List */}
        <View style={styles.medicationsContainer}>
          {filteredMedications.map((medication) => (
            <View key={medication.id} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationNameRow}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: medication.isActive ? colors.success : colors.warning }]}>
                    <Text style={styles.statusText}>
                      {medication.isActive 
                        ? (language === 'en' ? 'Active' : 'Aktif')
                        : (language === 'en' ? 'Inactive' : 'Tidak Aktif')
                      }
                    </Text>
                  </View>
                </View>
                
                <View style={styles.medicationMeta}>
                  <Text style={styles.medicationDosage}>
                    {medication.dosage} • {medication.frequency}
                  </Text>
                  {medication.startDate && (
                    <Text style={styles.medicationDuration}>
                      {language === 'en' ? 'Duration:' : 'Tempoh:'} {getDuration(medication.startDate, medication.endDate)}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.medicationDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{medication.instructions}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{medication.prescribedBy}</Text>
                </View>
                
                {medication.startDate && (
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.detailText}>
                      {language === 'en' ? 'Started:' : 'Dimulakan:'} {formatDate(medication.startDate)}
                      {medication.endDate && !medication.isActive && (
                        <Text> • {language === 'en' ? 'Ended:' : 'Berakhir:'} {formatDate(medication.endDate)}</Text>
                      )}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.medicationActionsRow}>
                <View style={styles.switchContainer}>
                  <Switch
                    value={medication.isActive}
                    onValueChange={() => toggleMedicationStatus(medication.id)}
                    trackColor={{ false: colors.gray300, true: colors.successAlpha }}
                    thumbColor={medication.isActive ? colors.success : colors.gray500}
                  />
                  <Text style={styles.switchLabel}>
                    {medication.isActive 
                      ? (language === 'en' ? 'Active' : 'Aktif')
                      : (language === 'en' ? 'Inactive' : 'Tidak Aktif')
                    }
                  </Text>
                </View>
                
                <View style={styles.actionButtons}>
                  {medication.isActive && (
                    <InteractiveFeedback
                      onPress={() => editMedication(medication.id, medication.name)}
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
                  )}
                  
                  <InteractiveFeedback
                    onPress={() => deleteMedication(medication.id, medication.name)}
                    feedbackType="scale"
                    hapticType="heavy"
                  >
                    <View style={[styles.actionButton, styles.deleteButton]}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={styles.deleteButtonText}>
                        {language === 'en' ? 'Delete' : 'Hapus'}
                      </Text>
                    </View>
                  </InteractiveFeedback>
                </View>
              </View>
            </View>
          ))}
        </View>

        {filteredMedications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No medications found' : 'Tiada ubat dijumpai'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'en' 
                ? 'Try adjusting your filter or add new medications'
                : 'Cuba laraskan penapis anda atau tambah ubat baharu'
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  medicationCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  medicationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveMedicationCard: {
    backgroundColor: colors.gray50,
    opacity: 0.7,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  medicationDoctor: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  inactiveText: {
    color: colors.textMuted,
  },
  medicationActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
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
  deleteButton: {
    backgroundColor: colors.errorAlpha,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.error,
  },
  bottomPadding: {
    height: 24,
  },
  // New styles from ViewAllMedicationsScreen
  filterContainer: {
    marginBottom: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
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
  filterCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
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
  medicationsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  medicationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  medicationMeta: {
    gap: 2,
  },
  medicationDuration: {
    fontSize: 12,
    color: colors.textMuted,
  },
  medicationDetails: {
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
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
});