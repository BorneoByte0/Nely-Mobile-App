import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  medicationReminders: boolean;
  healthAlerts: boolean;
  familyUpdates: boolean;
  criticalOnly: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
  };
}

export type NotificationType =
  | 'medication_reminder'
  | 'medication_missed'
  | 'health_alert_concerning'
  | 'health_alert_critical'
  | 'family_activity'
  | 'appointment_reminder';

class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences = {
    medicationReminders: true,
    healthAlerts: true,
    familyUpdates: true,
    criticalOnly: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  };

  /**
   * Request notification permission from user
   * Should only be called after showing context/explanation to user
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        // After permission granted, initialize and get token
        await this.initialize();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check permission status without requesting
   */
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (error) {
      return 'denied';
    }
  }

  async initialize() {
    try {
      // Check existing permissions (DO NOT request automatically)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        return null;
      }

      const finalStatus = existingStatus;

      // Get push token
      if (Device.isDevice) {
        // Try to get project ID from various sources
        const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId ??
                         (Constants.expoConfig as any)?.projectId;

        let token;
        try {
          if (projectId) {
            // Use EAS project ID if available (production/EAS builds)
            token = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
          } else {
            // Fallback method for development/Expo Go
            token = await Notifications.getExpoPushTokenAsync();
          }
        } catch (error) {
          // Ultimate fallback for any environment
          try {
            token = await Notifications.getExpoPushTokenAsync();
          } catch (fallbackError) {
            throw fallbackError;
          }
        }
        this.expoPushToken = token.data;

        // Save token to database
        await this.savePushTokenToDatabase(this.expoPushToken);

        return this.expoPushToken;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  private async savePushTokenToDatabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
      } else {
      }
    } catch (error) {
    }
  }

  async scheduleNotification(
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
    trigger?: Date | { seconds: number }
  ) {
    try {
      // Check if notifications are allowed for this type
      if (!this.shouldSendNotification(type)) {
        return null;
      }

      // Check quiet hours
      if (this.isInQuietHours()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, ...data },
          sound: true,
          priority: type.includes('critical') ? 'high' : 'default',
        },
        trigger: trigger
          ? (trigger instanceof Date
              ? { type: SchedulableTriggerInputTypes.DATE, date: trigger }
              : { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: trigger.seconds, repeats: false })
          : null, // null means send immediately
      });

      return notificationId;
    } catch (error) {
      return null;
    }
  }

  // Medication reminder notifications
  async scheduleMedicationReminder(
    medicationName: string,
    time: Date,
    elderlyName: string
  ) {
    const title = 'Medication Reminder';
    const body = `Time to take ${medicationName} for ${elderlyName}`;

    return await this.scheduleNotification(
      'medication_reminder',
      title,
      body,
      { medicationName, elderlyName },
      time
    );
  }

  async scheduleMissedMedicationAlert(
    medicationName: string,
    elderlyName: string,
    hoursLate: number
  ) {
    const title = 'Missed Medication';
    const body = `${elderlyName} missed ${medicationName} (${hoursLate}h late)`;

    return await this.scheduleNotification(
      'medication_missed',
      title,
      body,
      { medicationName, elderlyName, hoursLate }
    );
  }

  // Health alert notifications
  async sendHealthAlert(
    severity: 'concerning' | 'critical',
    vitalType: string,
    value: string,
    elderlyName: string,
    recordedBy: string
  ) {
    const isCritical = severity === 'critical';
    const title = isCritical ? '🚨 Critical Health Alert' : '⚠️ Health Concern';
    const body = isCritical
      ? `URGENT: ${elderlyName}'s ${vitalType} is ${value}. Contact doctor immediately.`
      : `${elderlyName}'s ${vitalType} is ${value}. Recorded by ${recordedBy}.`;

    return await this.scheduleNotification(
      isCritical ? 'health_alert_critical' : 'health_alert_concerning',
      title,
      body,
      { severity, vitalType, value, elderlyName, recordedBy }
    );
  }

  // Family activity notifications
  async sendFamilyActivityUpdate(
    activityType: 'vitals' | 'medication' | 'note' | 'appointment',
    elderlyName: string,
    actionBy: string,
    details: string
  ) {
    const icons = {
      vitals: '📊',
      medication: '💊',
      note: '📝',
      appointment: '📅'
    };

    const title = `${icons[activityType]} Family Update`;
    const body = `${actionBy} ${details} for ${elderlyName}`;

    return await this.scheduleNotification(
      'family_activity',
      title,
      body,
      { activityType, elderlyName, actionBy, details }
    );
  }

  // Appointment reminder notifications
  async scheduleAppointmentReminder(
    doctorName: string,
    clinic: string,
    time: Date,
    elderlyName: string,
    hoursBeforeOptions: number[] = [24, 2] // 24h and 2h before
  ) {
    const notifications = [];

    for (const hoursBefore of hoursBeforeOptions) {
      const reminderTime = new Date(time.getTime() - (hoursBefore * 60 * 60 * 1000));

      if (reminderTime > new Date()) { // Only schedule future reminders
        const title = hoursBefore === 24 ? 'Appointment Tomorrow' : 'Appointment Soon';
        const body = hoursBefore === 24
          ? `${elderlyName} has appointment with ${doctorName} tomorrow at ${time.toLocaleTimeString()}`
          : `${elderlyName}'s appointment with ${doctorName} in 2 hours at ${clinic}`;

        const notificationId = await this.scheduleNotification(
          'appointment_reminder',
          title,
          body,
          { doctorName, clinic, elderlyName, hoursBefore },
          reminderTime
        );

        if (notificationId) {
          notifications.push(notificationId);
        }
      }
    }

    return notifications;
  }

  // Preference management
  async updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences };

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: this.preferences })
        .eq('id', user.id);

      if (error) {
      } else {
      }
    } catch (error) {
    }
  }

  async loadPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        return;
      }

      if (data?.notification_preferences) {
        this.preferences = { ...this.preferences, ...data.notification_preferences };
      }
    } catch (error) {
    }
  }

  private shouldSendNotification(type: NotificationType): boolean {
    if (this.preferences.criticalOnly && !type.includes('critical')) {
      return false;
    }

    switch (type) {
      case 'medication_reminder':
      case 'medication_missed':
        return this.preferences.medicationReminders;

      case 'health_alert_concerning':
      case 'health_alert_critical':
        return this.preferences.healthAlerts;

      case 'family_activity':
        return this.preferences.familyUpdates;

      case 'appointment_reminder':
        return this.preferences.medicationReminders; // Use medication setting for appointments

      default:
        return true;
    }
  }

  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const start = this.preferences.quietHours.start;
    const end = this.preferences.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  // Utility methods
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();