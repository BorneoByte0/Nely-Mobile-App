import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

interface ReminderTime {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  type: 'medication' | 'vitals' | 'appointment';
}

export function ReminderTimingsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { alertConfig, visible: alertVisible, showAlert, showSuccess, showError, hideAlert, showConfirm } = useModernAlert();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const [reminders, setReminders] = useState<ReminderTime[]>([
    {
      id: '1',
      name: language === 'en' ? 'Morning Medications' : 'Ubat Pagi',
      time: '08:00',
      enabled: true,
      type: 'medication'
    },
    {
      id: '2',
      name: language === 'en' ? 'Afternoon Medications' : 'Ubat Tengah Hari',
      time: '14:00',
      enabled: true,
      type: 'medication'
    },
    {
      id: '3',
      name: language === 'en' ? 'Evening Medications' : 'Ubat Petang',
      time: '19:00',
      enabled: true,
      type: 'medication'
    },
    {
      id: '4',
      name: language === 'en' ? 'Morning Vitals Check' : 'Pemeriksaan Vital Pagi',
      time: '09:00',
      enabled: true,
      type: 'vitals'
    },
    {
      id: '5',
      name: language === 'en' ? 'Evening Vitals Check' : 'Pemeriksaan Vital Petang',
      time: '18:00',
      enabled: false,
      type: 'vitals'
    },
    {
      id: '6',
      name: language === 'en' ? 'Appointment Reminder' : 'Peringatan Temujanji',
      time: '09:00',
      enabled: true,
      type: 'appointment'
    }
  ]);

  const toggleReminder = (id: string) => {
    hapticFeedback.light();
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder
    ));
  };

  const editReminderTime = (id: string) => {
    hapticFeedback.light();
    setEditingReminderId(id);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && editingReminderId) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      setReminders(prev => prev.map(reminder =>
        reminder.id === editingReminderId
          ? { ...reminder, time: timeString }
          : reminder
      ));

      showSuccess(
        language === 'en' ? 'Time Updated' : 'Masa Dikemaskini',
        language === 'en'
          ? `Reminder time updated to ${timeString}`
          : `Masa peringatan dikemaskini kepada ${timeString}`
      );
    }
    setEditingReminderId(null);
  };

  const deleteReminder = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    showConfirm(
      language === 'en' ? 'Delete Reminder' : 'Padam Peringatan',
      language === 'en'
        ? `Are you sure you want to delete "${reminder.name}"?`
        : `Adakah anda pasti mahu memadam "${reminder.name}"?`,
      () => {
        setReminders(prev => prev.filter(r => r.id !== id));
        hapticFeedback.success();
        showSuccess(
          language === 'en' ? 'Reminder Deleted' : 'Peringatan Dipadamkan',
          language === 'en' ? 'Reminder has been deleted successfully.' : 'Peringatan telah berjaya dipadamkan.'
        );
      },
      () => {},
      language === 'en' ? 'Delete' : 'Padam',
      language === 'en' ? 'Cancel' : 'Batal'
    );
  };

  const canDelete = (type: string) => {
    return type === 'medication' || type === 'vitals';
  };

  const getCurrentTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    return date;
  };

  const ReminderCard = ({ reminder }: { reminder: ReminderTime }) => {
    return (
      <View style={styles.reminderCard}>
        <View style={styles.reminderInfo}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeBackgroundColor(reminder.type) }]}>
            <Ionicons name={getTypeIcon(reminder.type)} size={20} color={getTypeColor(reminder.type)} />
          </View>
          <View style={styles.reminderDetails}>
            <Text style={styles.reminderName}>{reminder.name}</Text>
            {reminder.type === 'appointment' ? (
              <Text style={styles.reminderDescription}>
                {language === 'en' ? 'Notify 24 hours before appointment' : 'Beritahu 24 jam sebelum temujanji'}
              </Text>
            ) : (
              <Text style={styles.reminderTime}>{reminder.time}</Text>
            )}
          </View>
        </View>

        <View style={styles.reminderActions}>
          {reminder.type !== 'appointment' && (
            <InteractiveFeedback
              onPress={() => editReminderTime(reminder.id)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.editButton}>
                <Ionicons name="time" size={16} color={colors.primary} />
              </View>
            </InteractiveFeedback>
          )}

          <InteractiveFeedback
            onPress={() => toggleReminder(reminder.id)}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={[
              styles.toggleButton,
              reminder.enabled && styles.toggleButtonEnabled
            ]}>
              <Ionicons
                name={reminder.enabled ? 'checkmark' : 'close'}
                size={16}
                color={reminder.enabled ? colors.white : colors.textMuted}
              />
            </View>
          </InteractiveFeedback>

          {canDelete(reminder.type) && (
            <InteractiveFeedback
              onPress={() => deleteReminder(reminder.id)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.deleteButton}>
                <Ionicons name="trash" size={16} color={colors.error} />
              </View>
            </InteractiveFeedback>
          )}
        </View>
      </View>
    );
  };

  const addNewReminder = () => {
    hapticFeedback.medium();
    navigation?.navigate('AddReminder');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return 'medical';
      case 'vitals':
        return 'heart';
      case 'appointment':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medication':
        return colors.primary;
      case 'vitals':
        return colors.error;
      case 'appointment':
        return colors.secondary;
      default:
        return colors.info;
    }
  };

  const getTypeBackgroundColor = (type: string) => {
    switch (type) {
      case 'medication':
        return colors.primaryAlpha;
      case 'vitals':
        return colors.errorAlpha;
      case 'appointment':
        return colors.secondaryAlpha;
      default:
        return colors.infoAlpha;
    }
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.success, colors.primary]}
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
                {language === 'en' ? 'Reminder Timings' : 'Masa Peringatan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Manage when you get health reminders' : 'Urus bila anda mendapat peringatan kesihatan'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Medication Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Medication Reminders' : 'Peringatan Ubat'}
          </Text>

          {reminders.filter(r => r.type === 'medication').map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </View>

        {/* Vitals Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Vitals Check Reminders' : 'Peringatan Pemeriksaan Vital'}
          </Text>

          {reminders.filter(r => r.type === 'vitals').map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </View>

        {/* Appointment Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Appointment Reminders' : 'Peringatan Temujanji'}
          </Text>
          
          {reminders.filter(r => r.type === 'appointment').map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </View>

        {/* Add New Reminder */}
        <View style={styles.section}>
          <InteractiveFeedback
            onPress={addNewReminder}
            feedbackType="scale"
            hapticType="medium"
          >
            <View style={styles.addReminderButton}>
              <Ionicons name="add" size={24} color={colors.primary} />
              <Text style={styles.addReminderText}>
                {language === 'en' ? 'Add New Reminder' : 'Tambah Peringatan Baru'}
              </Text>
            </View>
          </InteractiveFeedback>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && editingReminderId && (
        <DateTimePicker
          value={getCurrentTime(reminders.find(r => r.id === editingReminderId)?.time || '09:00')}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
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

  // Sections
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Reminder Cards
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  reminderDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Actions
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonEnabled: {
    backgroundColor: colors.success,
  },

  // Add Reminder
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  addReminderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  bottomPadding: {
    height: 20,
  },

  // Delete Button (matches editButton and toggleButton style)
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.errorAlpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
});