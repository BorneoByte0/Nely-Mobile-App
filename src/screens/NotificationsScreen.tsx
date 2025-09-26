import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ModernAlert } from '../components/ModernAlert';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

export function NotificationsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showConfirm, hideAlert } = useModernAlert();
  
  const [notifications, setNotifications] = useState({
    healthAlerts: true,
    medicationReminders: true,
    appointmentReminders: true,
    familyActivity: true,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const handleToggle = (key: string, value: boolean) => {
    hapticFeedback.light();
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    showConfirm(
      language === 'en' ? 'Reset Notifications' : 'Set Semula Pemberitahuan',
      language === 'en'
        ? 'This will reset all notification settings to defaults. Continue?'
        : 'Ini akan menetapkan semula semua tetapan pemberitahuan kepada lalai. Teruskan?',
      () => {
        hapticFeedback.success();
        setNotifications({
          healthAlerts: true,
          medicationReminders: true,
          appointmentReminders: true,
          familyActivity: true,
          emailNotifications: true,
          pushNotifications: true,
          soundEnabled: true,
          vibrationEnabled: true,
        });
        
        showSuccess({
          title: language === 'en' ? 'Settings Reset!' : 'Tetapan Direset!',
          message: language === 'en'
            ? 'Notification settings have been reset to defaults.'
            : 'Tetapan pemberitahuan telah direset kepada lalai.',
          duration: 1000,
        });
      },
      () => {
        hapticFeedback.light();
      },
      language === 'en' ? 'Reset' : 'Set Semula',
      language === 'en' ? 'Cancel' : 'Batal'
    );
  };

  return (
    <>
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.warning, colors.primary]}
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
                {language === 'en' ? 'Notifications' : 'Pemberitahuan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Manage your notification preferences' : 'Urus pilihan pemberitahuan anda'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Health Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Health Notifications' : 'Pemberitahuan Kesihatan'}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={20} color={colors.error} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Health Alerts' : 'Amaran Kesihatan'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Critical health readings and emergencies' : 'Bacaan kesihatan kritikal dan kecemasan'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.healthAlerts}
              onValueChange={(value) => handleToggle('healthAlerts', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.healthAlerts ? colors.primary : colors.gray300}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="medical" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Medication Reminders' : 'Peringatan Ubat'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Medicine times and missed doses' : 'Masa ubat dan dos yang terlepas'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.medicationReminders}
              onValueChange={(value) => handleToggle('medicationReminders', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.medicationReminders ? colors.primary : colors.gray300}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={20} color={colors.secondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Appointment Reminders' : 'Peringatan Temujanji'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Upcoming doctor visits' : 'Lawatan doktor yang akan datang'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.appointmentReminders}
              onValueChange={(value) => handleToggle('appointmentReminders', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.appointmentReminders ? colors.primary : colors.gray300}
            />
          </View>
        </View>

        {/* Family Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Family Notifications' : 'Pemberitahuan Keluarga'}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="people" size={20} color={colors.info} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Family Activity' : 'Aktiviti Keluarga'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'When family members record health data' : 'Apabila ahli keluarga merekod data kesihatan'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.familyActivity}
              onValueChange={(value) => handleToggle('familyActivity', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.familyActivity ? colors.primary : colors.gray300}
            />
          </View>

        </View>

        {/* Delivery Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Delivery Methods' : 'Kaedah Penghantaran'}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail" size={20} color={colors.secondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Email Notifications' : 'Pemberitahuan E-mel'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Receive notifications via email' : 'Terima pemberitahuan melalui e-mel'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.emailNotifications}
              onValueChange={(value) => handleToggle('emailNotifications', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.emailNotifications ? colors.primary : colors.gray300}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={20} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Push Notifications' : 'Pemberitahuan Tolak'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Show notifications on your device' : 'Tunjukkan pemberitahuan pada peranti anda'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={(value) => handleToggle('pushNotifications', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.pushNotifications ? colors.primary : colors.gray300}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Sound & Vibration' : 'Bunyi & Getaran'}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high" size={20} color={colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Sound' : 'Bunyi'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Play sound for notifications' : 'Mainkan bunyi untuk pemberitahuan'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.soundEnabled ? colors.primary : colors.gray300}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={20} color={colors.info} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {language === 'en' ? 'Vibration' : 'Getaran'}
                </Text>
                <Text style={styles.settingDescription}>
                  {language === 'en' ? 'Vibrate for notifications' : 'Getar untuk pemberitahuan'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              trackColor={{ false: colors.gray300, true: colors.primaryAlpha }}
              thumbColor={notifications.vibrationEnabled ? colors.primary : colors.gray300}
            />
          </View>

        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={resetToDefaults}
          feedbackType="scale"
          hapticType="medium"
        >
          <View style={styles.resetButton}>
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={styles.resetButtonText}>
              {language === 'en' ? 'Reset to Defaults' : 'Set Semula kepada Lalai'}
            </Text>
          </View>
        </InteractiveFeedback>
      </View>
    </SafeAreaWrapper>

    {/* Success Animation */}
    {successConfig && (
      <SuccessAnimation
        visible={visible}
        title={successConfig.title}
        message={successConfig?.message || ''}
        onComplete={hideSuccess}
        duration={successConfig?.duration || 1500}
      />
    )}

    {/* Modern Alert */}
    {alertConfig && (
      <ModernAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    )}
    </>
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

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Footer
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
    gap: 12,
  },
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },

  bottomPadding: {
    height: 20,
  },
});