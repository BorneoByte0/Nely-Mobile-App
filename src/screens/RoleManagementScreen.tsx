import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { useModernAlert } from '../hooks/useModernAlert';
import {
  useFamilyMembersWithRoles,
  useUpdateUserFamilyRole,
  ROLE_PERMISSIONS,
} from '../hooks/useDatabase';

interface Props {
  navigation?: any;
}

export function RoleManagementScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { userProfile } = useAuth();
  const { canPerformAction } = usePermissions();
  const { alertConfig, visible, showAlert, hideAlert } = useModernAlert();

  const [selectedMemberRole, setSelectedMemberRole] = useState<{
    memberId: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  const [expandedPermissions, setExpandedPermissions] = useState<string | null>(null);

  // Get family members with roles
  const {
    members: familyMembers,
    loading: membersLoading,
    refetch: refetchMembers
  } = useFamilyMembersWithRoles(userProfile?.family_id || '');


  // Update role hook
  const { updateRole, loading: updateLoading } = useUpdateUserFamilyRole();


  const texts = {
    en: {
      title: 'Role Management',
      subtitle: 'Manage family member roles and permissions',
      familyMembers: 'Family Members',
      noMembers: 'No family members found',
      currentRole: 'Current Role',
      changeRole: 'Change Role',
      permissions: 'Permissions',
      roles: {
        admin: 'Admin',
        carer: 'Carer',
        family_viewer: 'Family Viewer'
      },
      roleDescriptions: {
        admin: 'Full access to all features and role management',
        carer: 'Can manage health data, medications, and appointments',
        family_viewer: 'Can only view health information (read-only)'
      },
      permissionLabels: {
        canViewHealth: 'View Health Data',
        canEditHealth: 'Edit Health Data',
        canManageMedications: 'Manage Medications',
        canManageAppointments: 'Manage Appointments',
        canManageFamily: 'Manage Family',
        canInviteMembers: 'Invite Members',
        canChangeRoles: 'Change Roles',
        canDeleteData: 'Delete Data'
      },
      actions: {
        updateRole: 'Update Role',
        cancel: 'Cancel',
        confirm: 'Confirm'
      },
      confirmations: {
        changeRoleTitle: 'Change Role',
        changeRoleMessage: 'Are you sure you want to change {memberName}\'s role from {currentRole} to {newRole}?',
        lastAdminWarning: 'Warning: You are the only admin. Changing your role will leave the family without an administrator.',
      },
      success: {
        roleUpdated: 'Role updated successfully',
      },
      errors: {
        cannotChangeOwnRole: 'You cannot remove your own admin role when you are the only admin',
        updateFailed: 'Failed to update role',
      },
      you: '(You)',
    },
    ms: {
      title: 'Pengurusan Peranan',
      subtitle: 'Urus peranan dan kebenaran ahli keluarga',
      familyMembers: 'Ahli Keluarga',
      noMembers: 'Tiada ahli keluarga dijumpai',
      currentRole: 'Peranan Semasa',
      changeRole: 'Tukar Peranan',
      permissions: 'Kebenaran',
      roles: {
        admin: 'Pentadbir',
        carer: 'Penjaga',
        family_viewer: 'Pemerhati Keluarga'
      },
      roleDescriptions: {
        admin: 'Akses penuh kepada semua ciri dan pengurusan peranan',
        carer: 'Boleh mengurus data kesihatan, ubat-ubatan, dan temu janji',
        family_viewer: 'Hanya boleh melihat maklumat kesihatan (baca sahaja)'
      },
      permissionLabels: {
        canViewHealth: 'Lihat Data Kesihatan',
        canEditHealth: 'Edit Data Kesihatan',
        canManageMedications: 'Urus Ubat-ubatan',
        canManageAppointments: 'Urus Temu Janji',
        canManageFamily: 'Urus Keluarga',
        canInviteMembers: 'Jemput Ahli',
        canChangeRoles: 'Tukar Peranan',
        canDeleteData: 'Padam Data'
      },
      actions: {
        updateRole: 'Kemaskini Peranan',
        cancel: 'Batal',
        confirm: 'Sahkan'
      },
      confirmations: {
        changeRoleTitle: 'Tukar Peranan',
        changeRoleMessage: 'Adakah anda pasti ingin menukar peranan {memberName} daripada {currentRole} kepada {newRole}?',
        lastAdminWarning: 'Amaran: Anda adalah satu-satunya pentadbir. Menukar peranan anda akan menyebabkan keluarga tiada pentadbir.',
      },
      success: {
        roleUpdated: 'Peranan berjaya dikemaskini',
      },
      errors: {
        cannotChangeOwnRole: 'Anda tidak boleh membuang peranan pentadbir anda apabila anda adalah satu-satunya pentadbir',
        updateFailed: 'Gagal mengemaskini peranan',
      },
      you: '(Anda)',
    },
  };

  const t = texts[language];

  // Check admin permissions
  useEffect(() => {
    if (!canPerformAction('change_user_role') && !membersLoading) {
      showAlert({
        type: 'error',
        title: 'Access Denied',
        message: 'Only family administrators can manage roles.',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              hideAlert();
              navigation?.goBack();
            }
          }
        ]
      });
    }
  }, [canPerformAction, membersLoading]);


  const handleRoleChange = (memberId: string, currentRole: string, newRole: string) => {
    // Check if user is trying to remove their own admin role when they're the only admin
    const isCurrentUser = userProfile?.id === memberId;
    const adminCount = familyMembers?.filter(m => m.role === 'admin').length || 0;

    if (isCurrentUser && currentRole === 'admin' && newRole !== 'admin' && adminCount <= 1) {
      showAlert({
        type: 'warning',
        title: t.confirmations.changeRoleTitle,
        message: t.confirmations.lastAdminWarning,
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }]
      });
      return;
    }

    const member = familyMembers?.find(m => m.userId === memberId);
    if (!member) return;

    setSelectedMemberRole({ memberId, currentRole, newRole });

    showAlert({
      type: 'warning',
      title: t.confirmations.changeRoleTitle,
      message: t.confirmations.changeRoleMessage
        .replace('{memberName}', member.name)
        .replace('{currentRole}', t.roles[currentRole as keyof typeof t.roles])
        .replace('{newRole}', t.roles[newRole as keyof typeof t.roles]),
      buttons: [
        { text: t.actions.cancel, style: 'default', onPress: hideAlert },
        {
          text: t.actions.confirm,
          style: 'primary',
          onPress: confirmRoleChange
        }
      ]
    });
  };

  const confirmRoleChange = async () => {
    if (!selectedMemberRole) return;

    hideAlert();

    try {
      const success = await updateRole(selectedMemberRole.memberId, userProfile?.family_id || '', selectedMemberRole.newRole as any);

      if (success) {
        showAlert({
          type: 'success',
          title: t.success.roleUpdated,
          message: '',
          buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }]
        });
        refetchMembers();
      } else {
        showAlert({
          type: 'error',
          title: t.errors.updateFailed,
          message: '',
          buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }]
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: t.errors.updateFailed,
        message: '',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }]
      });
    }

    setSelectedMemberRole(null);
  };



  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.error;
      case 'carer':
        return colors.primary;
      case 'family_viewer':
        return colors.secondary;
      default:
        return colors.gray400;
    }
  };

  const togglePermissions = (memberId: string) => {
    setExpandedPermissions(prev => prev === memberId ? null : memberId);
  };

  const renderMemberCard = (member: any) => {
    const isCurrentUser = userProfile?.id === member.user_id;
    const rolePermissions = ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || {};
    const isExpanded = expandedPermissions === member.user_id;
    const permissionCount = Object.values(rolePermissions).filter(Boolean).length;

    return (
      <View key={member.user_id} style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {member.name} {isCurrentUser && t.you}
            </Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
            <Text style={styles.roleBadgeText}>
              {t.roles[member.role as keyof typeof t.roles]}
            </Text>
          </View>
        </View>

        <Text style={styles.roleDescription}>
          {t.roleDescriptions[member.role as keyof typeof t.roleDescriptions]}
        </Text>

        {/* Collapsible Permissions */}
        <View style={styles.permissionsContainer}>
          <InteractiveFeedback onPress={() => togglePermissions(member.user_id)}>
            <View style={styles.permissionsHeader}>
              <View style={styles.permissionsInfo}>
                <Text style={styles.permissionsTitle}>{t.permissions}</Text>
                <Text style={styles.permissionsSummary}>
                  {permissionCount} {language === 'en' ? 'permissions granted' : 'kebenaran diberikan'}
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.gray400}
              />
            </View>
          </InteractiveFeedback>

          {isExpanded && (
            <View style={styles.permissionsList}>
              {Object.entries(rolePermissions).map(([permission, hasPermission]) => (
                <View key={permission} style={styles.permissionItem}>
                  <Ionicons
                    name={hasPermission ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={hasPermission ? colors.success : colors.gray400}
                  />
                  <Text style={[
                    styles.permissionText,
                    { color: hasPermission ? colors.textPrimary : colors.gray400 }
                  ]}>
                    {t.permissionLabels[permission as keyof typeof t.permissionLabels] || permission}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Role Change Buttons */}
        {!isCurrentUser && member.role !== 'admin' && (
          <View style={styles.roleActions}>
            {['admin', 'carer', 'family_viewer'].map((role) => (
              role !== member.role && (
                <InteractiveFeedback
                  key={role}
                  onPress={() => handleRoleChange(member.user_id, member.role, role)}
                  disabled={updateLoading}
                >
                  <View style={[styles.roleButton, { borderColor: getRoleColor(role) }]}>
                    <Text style={[styles.roleButtonText, { color: getRoleColor(role) }]}>
                      {t.roles[role as keyof typeof t.roles]}
                    </Text>
                  </View>
                </InteractiveFeedback>
              )
            ))}
          </View>
        )}

        {(isCurrentUser || member.role === 'admin') && (
          <View style={styles.currentUserNote}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.currentUserNoteText}>
              {member.role === 'admin'
                ? (language === 'en' ? 'Admin role cannot be changed' : 'Peranan pentadbir tidak boleh ditukar')
                : (language === 'en' ? 'You cannot change your own role' : 'Anda tidak boleh menukar peranan sendiri')
              }
            </Text>
          </View>
        )}
      </View>
    );
  };


  if (!canPerformAction('change_user_role')) {
    return null; // Will be handled by useEffect
  }

  return (
    <SafeAreaWrapper gradientVariant="insights" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Compact Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
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
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>


        {/* Family Members */}
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t.familyMembers}</Text>
                <Text style={styles.sectionSubtitle}>
                  {familyMembers && familyMembers.length > 0
                    ? `${familyMembers.length} ${familyMembers.length === 1 ? (language === 'en' ? 'member' : 'ahli') : (language === 'en' ? 'members' : 'ahli')}`
                    : (language === 'en' ? 'No members yet' : 'Belum ada ahli')
                  }
                </Text>
              </View>
            </View>
          </View>
          {familyMembers && familyMembers.length > 0 ? (
            familyMembers.map((member) => (
              <View key={member.userId}>
                {renderMemberCard(member)}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.gray400} />
              <Text style={styles.emptyText}>{t.noMembers}</Text>
            </View>
          )}
        </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

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
  bottomPadding: {
    height: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberCount: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionsContainer: {
    marginBottom: 16,
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionsInfo: {
    flex: 1,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  permissionsSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  permissionsList: {
    gap: 6,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
  },
  currentUserNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primaryAlpha,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  currentUserNoteText: {
    fontSize: 13,
    color: colors.primary,
    flex: 1,
    fontWeight: '500',
  },
});