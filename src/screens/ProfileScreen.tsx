import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile, useUserFamilyRole, useRolePermissions } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
}

export function ProfileScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { showAlert, alertConfig, hideAlert } = useModernAlert();
  const { userProfile, loading, error, refetch: refetchUserProfile } = useUserProfile();
  const { isAdmin, canPerformAction } = usePermissions();
  const { role: familyRole, loading: familyRoleLoading, refetch: refetchFamilyRole } = useUserFamilyRole();
  const rolePermissions = useRolePermissions(familyRole);

  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // Simple flag to track initial load (same pattern as HomeScreen)
  const isInitialMount = useRef(true);

  // Auto-refresh functionality - refresh data when returning to screen
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount, only refresh on subsequent focuses
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Only refresh if we have valid refetch functions
      if (refetchUserProfile && refetchFamilyRole) {
        const timer = setTimeout(() => {
          refetchUserProfile();
          refetchFamilyRole();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, []) // Empty dependency array - profile is tied to current user which doesn't change
  );


  if (loading || familyRoleLoading) {
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
            refetchUserProfile?.();
            refetchFamilyRole?.();
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
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: isSigningOut
            ? (language === 'en' ? 'Signing Out...' : 'Menglog Keluar...')
            : (language === 'en' ? 'Sign Out' : 'Log Keluar'),
          style: 'destructive',
          onPress: async () => {
            if (isSigningOut) return;

            setIsSigningOut(true);
            try {
              await signOut();
              hideAlert();
              // Navigation will be handled automatically by App.tsx useEffect
              console.log('✅ User signed out successfully');
            } catch (error) {
              console.error('❌ Sign out error:', error);
              setIsSigningOut(false);
              hideAlert();

              // Show error alert
              setTimeout(() => {
                showAlert({
                  title: language === 'en' ? 'Sign Out Failed' : 'Log Keluar Gagal',
                  message: language === 'en'
                    ? 'Failed to sign out. Please check your connection and try again.'
                    : 'Gagal log keluar. Sila semak sambungan anda dan cuba lagi.',
                  type: 'error',
                  buttons: [
                    {
                      text: 'OK',
                      style: 'primary',
                      onPress: hideAlert
                    }
                  ]
                });
              }, 100);
            }
          }
        }
      ]
    });
  };

  // Helper function to get family role display text
  const getFamilyRoleDisplayText = () => {
    switch (familyRole) {
      case 'admin':
        return language === 'en' ? 'Family Administrator' : 'Pentadbir Keluarga';
      case 'carer':
        return language === 'en' ? 'Family Carer' : 'Penjaga Keluarga';
      case 'family_viewer':
        return language === 'en' ? 'Family Viewer' : 'Pelihat Keluarga';
      case 'none':
        return language === 'en' ? 'No Family Role' : 'Tiada Peranan Keluarga';
      default:
        return language === 'en' ? 'Unknown Role' : 'Peranan Tidak Diketahui';
    }
  };

  // Helper function to get family role color
  const getFamilyRoleColor = () => {
    switch (familyRole) {
      case 'admin':
        return colors.error;
      case 'carer':
        return colors.warning;
      case 'family_viewer':
        return colors.info;
      case 'none':
        return colors.gray400;
      default:
        return colors.gray400;
    }
  };

  // Helper function to get family role description
  const getFamilyRoleDescription = () => {
    switch (familyRole) {
      case 'admin':
        return language === 'en'
          ? 'Full access and family management'
          : 'Akses penuh dan pengurusan keluarga';
      case 'carer':
        return language === 'en'
          ? 'Can manage health data and appointments'
          : 'Boleh urus data kesihatan dan temujanji';
      case 'family_viewer':
        return language === 'en'
          ? 'View-only access to health information'
          : 'Akses lihat sahaja untuk maklumat kesihatan';
      case 'none':
        return language === 'en'
          ? 'Not part of any family group'
          : 'Bukan ahli mana-mana kumpulan keluarga';
      default:
        return '';
    }
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

              {/* User Type Role */}
              <View style={styles.roleContainer}>
                <View style={styles.userRole}>
                  <Text style={styles.roleText}>
                    {language === 'en'
                      ? userProfile.role === 'elderly' ? 'Elderly' : 'Caregiver'
                      : userProfile.role === 'elderly' ? 'Warga Emas' : 'Penjaga'
                    }
                  </Text>
                </View>

                {/* Family Role Badge */}
                <View style={[styles.familyRole, { backgroundColor: `${getFamilyRoleColor()}20`, borderColor: getFamilyRoleColor() }]}>
                  <Text style={[styles.familyRoleText, { color: getFamilyRoleColor() }]}>
                    {getFamilyRoleDisplayText()}
                  </Text>
                </View>
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

        {/* Family Role Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Family Role & Permissions' : 'Peranan & Kebenaran Keluarga'}
          </Text>

          {/* Current Role Display */}
          <View style={styles.roleStatusCard}>
            <View style={styles.roleStatusHeader}>
              <View style={[styles.roleBadge, { backgroundColor: getFamilyRoleColor() }]}>
                <Ionicons
                  name={familyRole === 'admin' ? 'shield' : familyRole === 'carer' ? 'medical' : 'eye'}
                  size={16}
                  color={colors.white}
                />
              </View>
              <View style={styles.roleStatusInfo}>
                <Text style={styles.roleStatusTitle}>{getFamilyRoleDisplayText()}</Text>
                <Text style={styles.roleStatusDescription}>{getFamilyRoleDescription()}</Text>
              </View>
            </View>

            {/* Permissions List */}
            {familyRole !== 'none' && (
              <View style={styles.permissionsList}>
                <Text style={styles.permissionsTitle}>
                  {language === 'en' ? 'Your Permissions:' : 'Kebenaran Anda:'}
                </Text>

                {rolePermissions.canEditHealth && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Manage health data' : 'Urus data kesihatan'}
                    </Text>
                  </View>
                )}

                {rolePermissions.canViewHealth && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'View health information' : 'Lihat maklumat kesihatan'}
                    </Text>
                  </View>
                )}

                {rolePermissions.canChangeRoles && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Manage family roles' : 'Urus peranan keluarga'}
                    </Text>
                  </View>
                )}

                {rolePermissions.canInviteMembers && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Invite family members' : 'Jemput ahli keluarga'}
                    </Text>
                  </View>
                )}

                {rolePermissions.canManageFamily && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Manage family group' : 'Urus kumpulan keluarga'}
                    </Text>
                  </View>
                )}

                {familyRole === 'family_viewer' && (
                  <View style={styles.permissionItem}>
                    <Ionicons name="close-circle" size={16} color={colors.gray400} />
                    <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                      {language === 'en' ? 'Cannot edit health data' : 'Tidak boleh edit data kesihatan'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Family Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Family Management' : 'Pengurusan Keluarga'}
          </Text>

          {/* Admin-only: Invite Family Members */}
          {canPerformAction('invite_family_member') && (
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
          )}

          {/* Admin-only: Join Requests Management */}
          {isAdmin && (
            <InteractiveFeedback
              onPress={() => navigation?.navigate('FamilyJoinRequests')}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.warningAlpha }]}>
                    <Ionicons name="mail" size={20} color={colors.warning} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>
                      {language === 'en' ? 'Join Requests' : 'Permintaan Sertai'}
                    </Text>
                    <Text style={styles.menuItemSubtitle}>
                      {language === 'en' ? 'Review pending family requests' : 'Kaji permintaan keluarga tertunda'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </InteractiveFeedback>
          )}

          {/* Admin-only: Role Management */}
          {canPerformAction('change_user_role') && (
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
          )}
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
          disabled={isSigningOut}
        >
          <View style={[
            styles.signOutButton,
            isSigningOut && { opacity: 0.6, backgroundColor: colors.gray50 }
          ]}>
            <Ionicons
              name={isSigningOut ? "refresh-outline" : "log-out-outline"}
              size={20}
              color={isSigningOut ? colors.textMuted : colors.error}
            />
            <Text style={[
              styles.signOutText,
              isSigningOut && { color: colors.textMuted }
            ]}>
              {isSigningOut
                ? (language === 'en' ? 'Signing Out...' : 'Menglog Keluar...')
                : (language === 'en' ? 'Sign Out' : 'Log Keluar')
              }
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
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  familyRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  familyRoleText: {
    fontSize: 11,
    fontWeight: '600',
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

  // Family Role Status Styles
  roleStatusCard: {
    backgroundColor: colors.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  roleStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  roleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleStatusInfo: {
    flex: 1,
  },
  roleStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleStatusDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  permissionsList: {
    gap: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
});