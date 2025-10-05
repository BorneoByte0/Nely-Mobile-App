import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { useNotifications } from '../context/NotificationContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation: any;
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { preferences, updatePreferences, hasPermission, pushToken, initializeNotifications, scheduleLocalNotification } = useNotifications();
  const { alertConfig, visible, showAlert, hideAlert, showSuccess, showError } = useModernAlert();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);


  // Sync with context when preferences change
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPreferences, value: any) => {
    hapticFeedback.light();
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    hapticFeedback.light();
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));
  };

  const handleQuietHoursTime = (type: 'start' | 'end', time: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [type]: time
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      hapticFeedback.medium();

      await updatePreferences(localPreferences);

      showSuccess(
        language === 'en' ? 'Settings Saved' : 'Tetapan Disimpan',
        language === 'en'
          ? 'Your notification preferences have been updated.'
          : 'Pilihan pemberitahuan anda telah dikemas kini.'
      );
    } catch (error) {
      showError(
        language === 'en' ? 'Save Failed' : 'Gagal Simpan',
        language === 'en'
          ? 'Unable to save notification settings. Please try again.'
          : 'Tidak dapat menyimpan tetapan pemberitahuan. Sila cuba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      hapticFeedback.light();

      if (!hasPermission) {
        Alert.alert(
          language === 'en' ? 'Permissions Required' : 'Kebenaran Diperlukan',
          language === 'en'
            ? 'Please enable notifications in your device settings to receive test notifications.'
            : 'Sila aktifkan pemberitahuan dalam tetapan peranti anda untuk menerima pemberitahuan ujian.',
          [
            { text: language === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
            {
              text: language === 'en' ? 'Enable' : 'Aktifkan',
              onPress: initializeNotifications
            }
          ]
        );
        return;
      }

      const notificationId = await scheduleLocalNotification(
        '🧪 Test Notification',
        language === 'en'
          ? 'This is a test notification from Nely Healthcare App!'
          : 'Ini adalah pemberitahuan ujian dari Aplikasi Kesihatan Nely!',
        { type: 'test' }
      );

      if (notificationId) {
        showSuccess(
          language === 'en' ? 'Test Sent' : 'Ujian Dihantar',
          language === 'en'
            ? 'Test notification sent! Check your notification tray.'
            : 'Pemberitahuan ujian dihantar! Semak dulang pemberitahuan anda.'
        );
      }
    } catch (error) {
      showError(
        language === 'en' ? 'Test Failed' : 'Ujian Gagal',
        language === 'en'
          ? 'Unable to send test notification. Please try again.'
          : 'Tidak dapat menghantar pemberitahuan ujian. Sila cuba lagi.'
      );
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
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
                {language === 'en' ? 'Notifications' : 'Pemberitahuan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Manage your notification preferences' : 'Urus pilihan pemberitahuan anda'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View style={styles.container}>
          {/* Permission Status */}
          <View style={[styles.card, !hasPermission && styles.warningCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name={hasPermission ? "checkmark-circle" : "warning"}
                  size={24}
                  color={hasPermission ? colors.success : colors.warning}
                />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>
                  {language === 'en' ? 'Notification Status' : 'Status Pemberitahuan'}
                </Text>
                <Text style={[styles.cardSubtitle, { color: hasPermission ? colors.success : colors.warning }]}>
                  {hasPermission
                    ? (language === 'en' ? 'Enabled' : 'Diaktifkan')
                    : (language === 'en' ? 'Disabled - Enable in Settings' : 'Dilumpuhkan - Aktifkan dalam Tetapan')
                  }
                </Text>
              </View>
            </View>

            {!hasPermission && (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={initializeNotifications}
              >
                <Text style={styles.enableButtonText}>
                  {language === 'en' ? 'Enable Notifications' : 'Aktifkan Pemberitahuan'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Push Token Info (for debugging) */}
          {__DEV__ && pushToken && (
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>Push Token: {pushToken.substring(0, 20)}...</Text>
            </View>
          )}

          {/* Notification Types */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Notification Types' : 'Jenis Pemberitahuan'}
            </Text>

            {/* Medication Reminders */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.successAlpha }]}>
                  <Ionicons name="medical" size={20} color={colors.success} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {language === 'en' ? 'Medication Reminders' : 'Peringatan Ubat'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {language === 'en' ? 'Daily medication schedules and missed doses' : 'Jadual ubat harian dan dos tertinggal'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.medicationReminders}
                onValueChange={(value) => handleToggle('medicationReminders', value)}
                trackColor={{ false: colors.gray200, true: colors.successAlpha }}
                thumbColor={localPreferences.medicationReminders ? colors.success : colors.gray400}
                ios_backgroundColor={colors.gray200}
              />
            </View>

            {/* Health Alerts */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.warningAlpha }]}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {language === 'en' ? 'Health Alerts' : 'Amaran Kesihatan'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {language === 'en' ? 'Critical and concerning vital signs' : 'Tanda vital kritikal dan membimbangkan'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.healthAlerts}
                onValueChange={(value) => handleToggle('healthAlerts', value)}
                trackColor={{ false: colors.gray200, true: colors.warningAlpha }}
                thumbColor={localPreferences.healthAlerts ? colors.warning : colors.gray400}
                ios_backgroundColor={colors.gray200}
              />
            </View>

            {/* Family Updates */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.infoAlpha }]}>
                  <Ionicons name="people" size={20} color={colors.info} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {language === 'en' ? 'Family Updates' : 'Kemaskini Keluarga'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {language === 'en' ? 'Activity from other family members' : 'Aktiviti dari ahli keluarga lain'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.familyUpdates}
                onValueChange={(value) => handleToggle('familyUpdates', value)}
                trackColor={{ false: colors.gray200, true: colors.infoAlpha }}
                thumbColor={localPreferences.familyUpdates ? colors.info : colors.gray400}
                ios_backgroundColor={colors.gray200}
              />
            </View>

            {/* Critical Only Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.errorAlpha }]}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {language === 'en' ? 'Critical Only' : 'Kritikal Sahaja'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {language === 'en' ? 'Only receive urgent health alerts' : 'Hanya terima amaran kesihatan mendesak'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.criticalOnly}
                onValueChange={(value) => handleToggle('criticalOnly', value)}
                trackColor={{ false: colors.gray200, true: colors.errorAlpha }}
                thumbColor={localPreferences.criticalOnly ? colors.error : colors.gray400}
                ios_backgroundColor={colors.gray200}
              />
            </View>
          </View>

          {/* Quiet Hours */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Quiet Hours' : 'Waktu Senyap'}
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryAlpha }]}>
                  <Ionicons name="moon" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {language === 'en' ? 'Enable Quiet Hours' : 'Aktifkan Waktu Senyap'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {language === 'en' ? 'Pause non-critical notifications' : 'Jeda pemberitahuan bukan kritikal'}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.quietHours.enabled}
                onValueChange={handleQuietHoursToggle}
                trackColor={{ false: colors.gray200, true: colors.primaryAlpha }}
                thumbColor={localPreferences.quietHours.enabled ? colors.primary : colors.gray400}
                ios_backgroundColor={colors.gray200}
              />
            </View>

            {localPreferences.quietHours.enabled && (
              <View style={styles.timeRangeContainer}>
                <Text style={styles.timeRangeLabel}>
                  {language === 'en' ? 'Quiet from:' : 'Senyap dari:'}
                </Text>
                <View style={styles.timeRangeRow}>
                  <Text style={styles.timeText}>
                    {formatTime(localPreferences.quietHours.start)}
                  </Text>
                  <Text style={styles.timeToText}>
                    {language === 'en' ? 'to' : 'hingga'}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTime(localPreferences.quietHours.end)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Test Notification */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Test Notifications' : 'Ujian Pemberitahuan'}
            </Text>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Ionicons name="send" size={20} color={colors.primary} />
              <Text style={styles.testButtonText}>
                {language === 'en' ? 'Send Test Notification' : 'Hantar Pemberitahuan Ujian'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <View style={styles.footer}>
            <InteractiveFeedback
              onPress={handleSave}
              feedbackType="scale"
              hapticType="medium"
              disabled={isSaving}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              >
                <Ionicons name="checkmark" size={24} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? (language === 'en' ? 'Saving...' : 'Menyimpan...')
                    : (language === 'en' ? 'Save Settings' : 'Simpan Tetapan')
                  }
                </Text>
              </LinearGradient>
            </InteractiveFeedback>
          </View>
        </View>
      </ScrollView>

      {alertConfig && (
        <ModernAlert
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={hideAlert}
          buttons={alertConfig.buttons}
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
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    borderColor: colors.warning,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  debugCard: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeRangeContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  timeToText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
