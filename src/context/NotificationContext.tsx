import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import { useAuth } from './AuthContext';
import { notificationService, NotificationPreferences, NotificationType } from '../services/notificationService';

interface NotificationContextType {
  // Permission and setup
  isInitialized: boolean;
  pushToken: string | null;
  hasPermission: boolean;

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;

  // Quick notification methods
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<string | null>;
  sendMedicationReminder: (medicationName: string, time: Date, elderlyName: string) => Promise<string | null>;
  sendHealthAlert: (severity: 'concerning' | 'critical', vitalType: string, value: string, elderlyName: string, recordedBy: string) => Promise<string | null>;
  sendFamilyUpdate: (activityType: 'vitals' | 'medication' | 'note' | 'appointment', elderlyName: string, actionBy: string, details: string) => Promise<string | null>;

  // Utility methods
  cancelAllNotifications: () => Promise<void>;
  initializeNotifications: () => Promise<void>;

  // Last received notification
  lastNotification: Notifications.Notification | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationService.getPreferences());
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  // Notification listeners
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Initialize notifications when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeNotifications();
    }
  }, [user, isInitialized]);

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setLastNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationData = response.notification.request.content.data;

      // Handle notification tap actions based on type
      if (notificationData?.type) {
        handleNotificationTap(notificationData.type as NotificationType, notificationData);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {

      const token = await notificationService.initialize();
      if (token) {
        setPushToken(token);
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }

      // Load user preferences
      await notificationService.loadPreferences();
      setPreferences(notificationService.getPreferences());

      setIsInitialized(true);
    } catch (error) {
      setIsInitialized(true); // Mark as initialized even if it failed
    }
  };

  const handleNotificationTap = (type: NotificationType, data: any) => {

    // Here you can implement navigation logic based on notification type
    switch (type) {
      case 'medication_reminder':
      case 'medication_missed':
        // Navigate to medication screen
        // navigation.navigate('TakeMedication', { medicationId: data.medicationId });
        break;

      case 'health_alert_concerning':
      case 'health_alert_critical':
        // Navigate to vital signs or family screen
        // navigation.navigate('FamilyScreen');
        break;

      case 'family_activity':
        // Navigate to activity or family screen
        // navigation.navigate('FamilyScreen');
        break;

      case 'appointment_reminder':
        // Navigate to appointments screen
        // navigation.navigate('ViewUpcomingAppointments');
        break;

      default:
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    await notificationService.updatePreferences(newPreferences);
    setPreferences(notificationService.getPreferences());
  };

  const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
    return await notificationService.scheduleNotification('family_activity', title, body, data);
  };

  const sendMedicationReminder = async (medicationName: string, time: Date, elderlyName: string) => {
    return await notificationService.scheduleMedicationReminder(medicationName, time, elderlyName);
  };

  const sendHealthAlert = async (
    severity: 'concerning' | 'critical',
    vitalType: string,
    value: string,
    elderlyName: string,
    recordedBy: string
  ) => {
    return await notificationService.sendHealthAlert(severity, vitalType, value, elderlyName, recordedBy);
  };

  const sendFamilyUpdate = async (
    activityType: 'vitals' | 'medication' | 'note' | 'appointment',
    elderlyName: string,
    actionBy: string,
    details: string
  ) => {
    return await notificationService.sendFamilyActivityUpdate(activityType, elderlyName, actionBy, details);
  };

  const cancelAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
  };

  const value: NotificationContextType = {
    isInitialized,
    pushToken,
    hasPermission,
    preferences,
    updatePreferences,
    scheduleLocalNotification,
    sendMedicationReminder,
    sendHealthAlert,
    sendFamilyUpdate,
    cancelAllNotifications,
    initializeNotifications,
    lastNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};