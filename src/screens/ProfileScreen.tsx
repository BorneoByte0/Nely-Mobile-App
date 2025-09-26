import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
}

export function ProfileScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { showAlert, alertConfig, hideAlert } = useModernAlert();
  const { userProfile, loading, error } = useUserProfile();

  if (loading) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading profile...' : 'Memuatkan profil...'}
        />
      </SafeAreaWrapper>
    );
  }

  // Handle error states
  if (error) {
    const hasNetworkError = error.includes('network');
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <ErrorState
          type={hasNetworkError ? 'network' : 'data'}
          message={error}
          onRetry={() => {
            // In a real app, you would refetch the data
            window.location.reload();
          }}
        />
      </SafeAreaWrapper>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
        <View style={styles.section}>
          <Text>Profile not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Navigation functions for Terms of Service and Privacy Policy
  const openTermsOfService = async () => {
    try {
      await Linking.openURL('https://youtu.be/dQw4w9WgXcQ?si=9-a8Kv8d87dUVyQ2');
    } catch (error) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'Unable to open Terms of Service. Please try again later.'
          : 'Tidak dapat membuka Terma Perkhidmatan. Sila cuba lagi kemudian.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      await Linking.openURL('https://youtu.be/dQw4w9WgXcQ?si=9-a8Kv8d87dUVyQ2');
    } catch (error) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'Unable to open Privacy Policy. Please try again later.'
          : 'Tidak dapat membuka Dasar Privasi. Sila cuba lagi kemudian.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleSignOut = () => {
    showAlert({
      title: language === 'en' ? 'Sign Out' : 'Log Keluar',
      message: language === 'en'
        ? 'Are you sure you want to sign out? You will need to sign in again to access your family\'s health data.'
        : 'Adakah anda pasti mahu log keluar? Anda perlu log masuk semula untuk mengakses data kesihatan keluarga anda.',
      type: 'warning',
      buttons: [
        {
          text: language === 'en' ? 'No' : 'Tidak',
          style: 'destructive',
          onPress: hideAlert
        },
        {
          text: language === 'en' ? 'Yes' : 'Ya',
          style: 'primary',
          onPress: async () => {
            hideAlert();
            try {
              await signOut();
            } catch (error) {
              Alert.alert(
                language === 'en' ? 'Error' : 'Ralat',
                language === 'en'
                  ? 'Failed to sign out. Please try again.'
                  : 'Gagal log keluar. Sila cuba lagi.'
              );
            }
          }
        }
      ]
    });
  };

  
  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.secondary, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {userProfile.avatar ? (
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <View style={styles.userRole}>
                <Text style={styles.roleText}>
                  {language === 'en'
                    ? userProfile.role === 'elderly' ? 'Elderly' : 'Caregiver'
                    : userProfile.role === 'elderly' ? 'Warga Emas' : 'Penjaga'
                  }
                </Text>
              </View>
              {userProfile.phone && <Text style={styles.userContact}>{userProfile.phone}</Text>}
              <Text style={styles.userContact}>{userProfile.email}</Text>
            </View>
            
            <InteractiveFeedback 
              onPress={() => navigation?.navigate('EditUserProfile')}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.editButton}>
                <Ionicons name="pencil" size={16} color={colors.white} />
                <Text style={styles.editButtonText}>
                  {language === 'en' ? 'Edit' : 'Edit'}
                </Text>
              </View>
            </InteractiveFeedback>
          </View>
        </LinearGradient>

        {/* Family Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Family Management' : 'Pengurusan Keluarga'}
          </Text>
          
          <InteractiveFeedback 
            onPress={() => navigation?.navigate('InviteFamilyMembers')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.successAlpha }]}>
                  <Ionicons name="person-add" size={20} color={colors.success} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>
                    {language === 'en' ? 'Invite Family Members' : 'Jemput Ahli Keluarga'}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>
                    {language === 'en' ? 'Manage family access' : 'Urus akses keluarga'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </InteractiveFeedback>
          
          <InteractiveFeedback 
            onPress={() => navigation?.navigate('RoleManagement')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.infoAlpha }]}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.info} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>
                    {language === 'en' ? 'Role Management' : 'Pengurusan Peranan'}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>
                    {language === 'en' ? 'Manage permissions and access' : 'Urus kebenaran dan akses'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </InteractiveFeedback>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'App Settings' : 'Tetapan Aplikasi'}
          </Text>
          
          <InteractiveFeedback 
            onPress={() => navigation?.navigate('Notifications')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.warningAlpha }]}>
                  <Ionicons name="notifications" size={20} color={colors.warning} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>
                    {language === 'en' ? 'Notifications' : 'Pemberitahuan'}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>
                    {language === 'en' ? 'Health alerts, reminders' : 'Amaran kesihatan, peringatan'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </InteractiveFeedback>
          
          <InteractiveFeedback 
            onPress={() => navigation?.navigate('Language')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.secondaryAlpha }]}>
                  <Ionicons name="language" size={20} color={colors.secondary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>
                    {language === 'en' ? 'Language' : 'Bahasa'}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>
                    {language === 'en' ? 'English' : 'Bahasa Malaysia'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </InteractiveFeedback>
        </View>

        {/* Health Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Health Preferences' : 'Pilihan Kesihatan'}
          </Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('Units')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primaryAlpha }]}>
                <Ionicons name="resize" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'Units' : 'Unit'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'mmHg, mmol/L, kg' : 'mmHg, mmol/L, kg'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('ReminderTimings')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.successAlpha }]}>
                <Ionicons name="alarm" size={20} color={colors.success} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'Reminder Timings' : 'Masa Peringatan'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'Medication, vitals check' : 'Ubat, pemeriksaan vital'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Support & Help' : 'Sokongan & Bantuan'}
          </Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('ContactSupport')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondaryAlpha }]}>
                <Ionicons name="chatbubbles" size={20} color={colors.secondary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'Contact Support' : 'Hubungi Sokongan'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'Get help from our team' : 'Dapatkan bantuan dari pasukan kami'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('UserGuide')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primaryAlpha }]}>
                <Ionicons name="book" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'User Guide' : 'Panduan Pengguna'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'Learn how to use the app' : 'Pelajari cara menggunakan aplikasi'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About & Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'About & Legal' : 'Mengenai & Undang-undang'}
          </Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.infoAlpha }]}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'App Version' : 'Versi Aplikasi'}
                </Text>
                <Text style={styles.menuItemSubtitle}>1.0.0 (MVP)</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.menuItem} onPress={openTermsOfService}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.errorAlpha }]}>
                <Ionicons name="document-text" size={20} color={colors.error} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'Terms of Service' : 'Terma Perkhidmatan'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'Legal terms and conditions' : 'Terma dan syarat undang-undang'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={openPrivacyPolicy}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.warningAlpha }]}>
                <Ionicons name="shield" size={20} color={colors.warning} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>
                  {language === 'en' ? 'Privacy Policy' : 'Dasar Privasi'}
                </Text>
                <Text style={styles.menuItemSubtitle}>
                  {language === 'en' ? 'How we protect your data' : 'Bagaimana kami melindungi data anda'}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>


        {/* Sign Out Button */}
        <InteractiveFeedback
          onPress={handleSignOut}
          feedbackType="scale"
          hapticType="medium"
        >
          <View style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>
              {language === 'en' ? 'Sign Out' : 'Log Keluar'}
            </Text>
          </View>
        </InteractiveFeedback>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modern Alert */}
      {alertConfig && (
        <ModernAlert
          visible={!!alertConfig}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
        />
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // Modern Gradient Header
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
  avatarContainer: {
    // No additional margin needed due to gap in headerContent
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  userRole: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userContact: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  // Modern Menu Sections
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  // Modern Edit Button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modern Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  bottomPadding: {
    height: 20,
  },
});