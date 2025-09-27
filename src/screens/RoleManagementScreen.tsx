import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

interface FamilyMemberWithRole {
  id: string;
  name: string;
  relationship: string;
  role: string;
  isActive: boolean;
  permissions: {
    viewHealth: boolean;
    editHealth: boolean;
    manageAppointments: boolean;
    manageMedications: boolean;
    inviteMembers: boolean;
    manageRoles: boolean;
  };
}

interface PendingMember {
  id: string;
  name: string;
  email?: string;
  invitedBy: string;
  invitedAt: Date;
  inviteCode: string;
  status: 'pending' | 'expired';
}

export function RoleManagementScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { alertConfig, visible, showAlert, hideAlert, showSuccess, showError, showWarning, showConfirm } = useModernAlert();
  
  // Success animation state
  const [successAnimation, setSuccessAnimation] = useState({
    visible: false,
    title: '',
    message: ''
  });
  
  // Mock pending members data
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([
    {
      id: 'pending-001',
      name: 'Dr. Lim Wei Ming',
      email: 'dr.lim@gmail.com',
      invitedBy: 'Ahmad Hassan',
      invitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      inviteCode: '843756',
      status: 'pending'
    },
    {
      id: 'pending-002',
      name: 'Aminah Binti Rashid',
      invitedBy: 'Siti Fatimah',
      invitedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      inviteCode: '267891',
      status: 'pending'
    },
    {
      id: 'pending-003',
      name: 'Hassan Ali',
      email: 'hassan.ali@outlook.com',
      invitedBy: 'Ahmad Hassan',
      invitedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago (expired)
      inviteCode: '954321',
      status: 'expired'
    }
  ]);
  
  // Enhanced mock data with role permissions
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberWithRole[]>([
    {
      id: 'user-001',
      name: 'Ahmad Hassan',
      relationship: 'Son',
      role: 'admin',
      isActive: true,
      permissions: {
        viewHealth: true,
        editHealth: true,
        manageAppointments: true,
        manageMedications: true,
        inviteMembers: true,
        manageRoles: true,
      }
    },
    {
      id: 'user-002',
      name: 'Siti Fatimah',
      relationship: 'Daughter',
      role: 'not elderly',
      isActive: true,
      permissions: {
        viewHealth: true,
        editHealth: true,
        manageAppointments: true,
        manageMedications: true,
        inviteMembers: false,
        manageRoles: false,
      }
    },
    {
      id: 'user-003',
      name: 'Nurul Ain',
      relationship: 'Daughter-in-law',
      role: 'viewer',
      isActive: true,
      permissions: {
        viewHealth: true,
        editHealth: false,
        manageAppointments: false,
        manageMedications: false,
        inviteMembers: false,
        manageRoles: false,
      }
    }
  ]);

  const roles = [
    {
      value: 'admin',
      labelEn: 'Administrator',
      labelMs: 'Pentadbir',
      description: language === 'en' 
        ? 'Full access to all features and settings'
        : 'Akses penuh kepada semua ciri dan tetapan'
    },
    {
      value: 'not elderly',
      labelEn: 'Primary Caregiver',
      labelMs: 'Penjaga Utama',
      description: language === 'en'
        ? 'Can manage health data and appointments'
        : 'Boleh menguruskan data kesihatan dan temujanji'
    },
    {
      value: 'viewer',
      labelEn: 'Family Viewer',
      labelMs: 'Pemerhati Keluarga',
      description: language === 'en'
        ? 'Can only view health information'
        : 'Hanya boleh melihat maklumat kesihatan'
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return language === 'en' 
        ? `${diffInMinutes}m ago`
        : `${diffInMinutes}m yang lalu`;
    } else if (diffInHours < 24) {
      return language === 'en' 
        ? `${diffInHours}h ago`
        : `${diffInHours}j yang lalu`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return language === 'en' 
        ? `${diffInDays}d ago`
        : `${diffInDays}h yang lalu`;
    }
  };

  const handleAcceptMember = (memberId: string) => {
    const member = pendingMembers.find(m => m.id === memberId);
    showConfirm(
      language === 'en' ? 'Accept Member' : 'Terima Ahli',
      language === 'en'
        ? `Accept ${member?.name} to your family care circle?`
        : `Terima ${member?.name} ke lingkaran penjagaan keluarga anda?`,
      () => {
        hideAlert();
        setPendingMembers(prev => prev.filter(member => member.id !== memberId));
        
        setSuccessAnimation({
          visible: true,
          title: language === 'en' ? 'Member Accepted' : 'Ahli Diterima',
          message: language === 'en'
            ? `${member?.name} has been added to your family care circle.`
            : `${member?.name} telah ditambah ke lingkaran penjagaan keluarga anda.`
        });
      },
      undefined,
      language === 'en' ? 'Accept' : 'Terima',
      language === 'en' ? 'Cancel' : 'Batal'
    );
  };

  const handleDeclineMember = (memberId: string) => {
    const member = pendingMembers.find(m => m.id === memberId);
    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Decline Member' : 'Tolak Ahli',
      message: language === 'en'
        ? `Are you sure you want to decline ${member?.name}?`
        : `Adakah anda pasti mahu menolak ${member?.name}?`,
      buttons: [
        {
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: language === 'en' ? 'Decline' : 'Tolak',
          style: 'destructive',
          onPress: () => {
            hideAlert();
            setPendingMembers(prev => prev.filter(member => member.id !== memberId));
            
            setSuccessAnimation({
              visible: true,
              title: language === 'en' ? 'Member Declined' : 'Ahli Ditolak',
              message: language === 'en'
                ? `${member?.name} has been declined.`
                : `${member?.name} telah ditolak.`
            });
          }
        }
      ]
    });
  };

  const handleRemoveExpired = (memberId: string) => {
    const member = pendingMembers.find(m => m.id === memberId);
    setPendingMembers(prev => prev.filter(member => member.id !== memberId));
    
    setSuccessAnimation({
      visible: true,
      title: language === 'en' ? 'Invitation Removed' : 'Jemputan Dibuang',
      message: language === 'en'
        ? `${member?.name} has been removed.`
        : `${member?.name} telah dibuang.`
    });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    const roleInfo = roles.find(r => r.value === newRole);
    const roleLabel = language === 'en' ? roleInfo?.labelEn : roleInfo?.labelMs;
    
    showAlert({
      type: 'warning',
      title: language === 'en' ? 'Change Role' : 'Tukar Peranan',
      message: language === 'en'
        ? `Change ${member?.name} to "${roleLabel}"?`
        : `Tukar ${member?.name} kepada "${roleLabel}"?`,
      buttons: [
        {
          text: language === 'en' ? 'Cancel' : 'Batal',
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: language === 'en' ? 'Change' : 'Tukar',
          style: 'primary',
          onPress: () => {
            hideAlert();
            setFamilyMembers(prev => prev.map(member => {
              if (member.id === memberId) {
                const newPermissions = getRolePermissions(newRole);
                return { ...member, role: newRole, permissions: newPermissions };
              }
              return member;
            }));
            
            setSuccessAnimation({
              visible: true,
              title: language === 'en' ? 'Role Updated' : 'Peranan Dikemas kini',
              message: language === 'en'
                ? `${member?.name} is now "${roleLabel}".`
                : `${member?.name} kini "${roleLabel}".`
            });
          }
        }
      ]
    });
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          viewHealth: true,
          editHealth: true,
          manageAppointments: true,
          manageMedications: true,
          inviteMembers: true,
          manageRoles: true,
        };
      case 'not elderly':
        return {
          viewHealth: true,
          editHealth: true,
          manageAppointments: true,
          manageMedications: true,
          inviteMembers: false,
          manageRoles: false,
        };
      case 'viewer':
        return {
          viewHealth: true,
          editHealth: false,
          manageAppointments: false,
          manageMedications: false,
          inviteMembers: false,
          manageRoles: false,
        };
      default:
        return {
          viewHealth: true,
          editHealth: false,
          manageAppointments: false,
          manageMedications: false,
          inviteMembers: false,
          manageRoles: false,
        };
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.error;
      case 'not elderly':
        return colors.primary;
      case 'viewer':
        return colors.info;
      default:
        return colors.gray300;
    }
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.info, colors.primary]}
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
                {language === 'en' ? 'Role Management' : 'Pengurusan Peranan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Manage family member permissions and access' : 'Urus kebenaran dan akses ahli keluarga'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Role Descriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Available Roles' : 'Peranan Tersedia'}
          </Text>
          
          {roles.map((role) => (
            <View key={role.value} style={styles.roleDescriptionCard}>
              <View style={styles.roleHeader}>
                <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(role.value) }]} />
                <Text style={styles.roleName}>
                  {language === 'en' ? role.labelEn : role.labelMs}
                </Text>
              </View>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
          ))}
        </View>

        {/* Pending Members Section */}
        {pendingMembers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Pending Accepting Members' : 'Ahli Menunggu Penerimaan'}
              </Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingMembers.length}</Text>
              </View>
            </View>
            
            {pendingMembers.map((member) => (
              <View key={member.id} style={[
                styles.pendingMemberCard,
                member.status === 'expired' && styles.pendingMemberCardExpired
              ]}>
                <View style={styles.pendingMemberHeader}>
                  <View style={styles.pendingMemberInfo}>
                    <View style={styles.pendingMemberAvatar}>
                      <Text style={styles.pendingMemberInitial}>{member.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.pendingMemberDetails}>
                      <Text style={styles.pendingMemberName}>{member.name}</Text>
                      {member.email && (
                        <Text style={styles.pendingMemberEmail}>{member.email}</Text>
                      )}
                      <View style={styles.pendingMemberMeta}>
                        <Text style={styles.pendingMemberMetaText}>
                          {language === 'en' ? 'Invited by' : 'Dijemput oleh'} {member.invitedBy}
                        </Text>
                        <Text style={styles.pendingMemberTime}>
                          • {formatTimeAgo(member.invitedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: member.status === 'pending' ? colors.warning : colors.error }
                  ]}>
                    <Text style={styles.statusText}>
                      {member.status === 'pending' 
                        ? (language === 'en' ? 'Pending' : 'Menunggu')
                        : (language === 'en' ? 'Expired' : 'Tamat')
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.inviteCodeContainer}>
                  <Text style={styles.inviteCodeLabel}>
                    {language === 'en' ? 'Invite Code:' : 'Kod Jemputan:'}
                  </Text>
                  <Text style={styles.inviteCodeText}>{member.inviteCode}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.pendingActionsContainer}>
                  {member.status === 'pending' ? (
                    <>
                      <InteractiveFeedback
                        onPress={() => handleDeclineMember(member.id)}
                        feedbackType="scale"
                        hapticType="light"
                      >
                        <View style={[styles.pendingActionButton, styles.declineButton]}>
                          <Ionicons name="close" size={16} color={colors.error} />
                          <Text style={[styles.pendingActionText, styles.declineText]}>
                            {language === 'en' ? 'Decline' : 'Tolak'}
                          </Text>
                        </View>
                      </InteractiveFeedback>

                      <InteractiveFeedback
                        onPress={() => handleAcceptMember(member.id)}
                        feedbackType="scale"
                        hapticType="medium"
                      >
                        <View style={[styles.pendingActionButton, styles.acceptButton]}>
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                          <Text style={[styles.pendingActionText, styles.acceptText]}>
                            {language === 'en' ? 'Accept' : 'Terima'}
                          </Text>
                        </View>
                      </InteractiveFeedback>
                    </>
                  ) : (
                    <InteractiveFeedback
                      onPress={() => handleRemoveExpired(member.id)}
                      feedbackType="scale"
                      hapticType="light"
                    >
                      <View style={[styles.pendingActionButton, styles.removeButton]}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={[styles.pendingActionText, styles.removeText]}>
                          {language === 'en' ? 'Remove' : 'Buang'}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Family Member Roles' : 'Peranan Ahli Keluarga'}
          </Text>
          
          {familyMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{member.name.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRelation}>
                    {language === 'en' ? member.relationship : getRelationshipMS(member.relationship)}
                  </Text>
                </View>
                <View style={[styles.roleIndicator, { backgroundColor: getRoleColor(member.role) }]} />
              </View>

              {/* Current Role */}
              <View style={styles.currentRoleContainer}>
                <Text style={styles.currentRoleLabel}>
                  {language === 'en' ? 'Current Role:' : 'Peranan Semasa:'}
                </Text>
                <Text style={[styles.currentRole, { color: getRoleColor(member.role) }]}>
                  {roles.find(r => r.value === member.role)?.[language === 'en' ? 'labelEn' : 'labelMs']}
                </Text>
              </View>

              {/* Permissions Display */}
              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsTitle}>
                  {language === 'en' ? 'Permissions:' : 'Kebenaran:'}
                </Text>
                <View style={styles.permissionsGrid}>
                  <View style={styles.permissionItem}>
                    <Ionicons 
                      name={member.permissions.viewHealth ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={member.permissions.viewHealth ? colors.success : colors.error} 
                    />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'View Health' : 'Lihat Kesihatan'}
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons 
                      name={member.permissions.editHealth ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={member.permissions.editHealth ? colors.success : colors.error} 
                    />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Edit Health' : 'Edit Kesihatan'}
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons 
                      name={member.permissions.manageAppointments ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={member.permissions.manageAppointments ? colors.success : colors.error} 
                    />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Appointments' : 'Temujanji'}
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons 
                      name={member.permissions.manageRoles ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={member.permissions.manageRoles ? colors.success : colors.error} 
                    />
                    <Text style={styles.permissionText}>
                      {language === 'en' ? 'Manage Roles' : 'Urus Peranan'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Role Change Buttons */}
              {member.id !== 'user-001' && ( // Prevent admin from changing own role
                <View style={styles.roleButtonsContainer}>
                  {roles.map((role) => (
                    <InteractiveFeedback
                      key={role.value}
                      onPress={() => {
                        if (role.value !== member.role) {
                          hapticFeedback.light();
                          handleRoleChange(member.id, role.value);
                        }
                      }}
                      feedbackType="scale"
                      hapticType="light"
                    >
                      <View style={[
                        styles.roleButton,
                        member.role === role.value && styles.roleButtonSelected,
                        { borderColor: getRoleColor(role.value) }
                      ]}>
                        <Text style={[
                          styles.roleButtonText,
                          member.role === role.value && { color: getRoleColor(role.value) }
                        ]}>
                          {language === 'en' ? role.labelEn : role.labelMs}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      
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
      
      {/* Success Animation */}
      <SuccessAnimation
        visible={successAnimation.visible}
        title={successAnimation.title}
        message={successAnimation.message}
        onComplete={() => setSuccessAnimation({ visible: false, title: '', message: '' })}
      />
    </SafeAreaWrapper>
  );
}

// Helper function for Malay relationship translation
function getRelationshipMS(relationship: string) {
  const relationships = {
    'Son': 'Anak lelaki',
    'Daughter': 'Anak perempuan',
    'Daughter-in-law': 'Menantu perempuan',
    'Son-in-law': 'Menantu lelaki',
  };
  return relationships[relationship as keyof typeof relationships] || relationship;
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

  // Role Descriptions
  roleDescriptionCard: {
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 22,
  },

  // Member Cards
  memberCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Current Role
  currentRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentRoleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  currentRole: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Permissions
  permissionsContainer: {
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  permissionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Role Buttons
  roleButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  roleButtonSelected: {
    backgroundColor: colors.primaryAlpha,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Pending Members Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Pending Member Cards
  pendingMemberCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingMemberCardExpired: {
    borderColor: colors.errorAlpha,
    backgroundColor: colors.gray50,
    opacity: 0.8,
  },
  pendingMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pendingMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingMemberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingMemberInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pendingMemberDetails: {
    flex: 1,
  },
  pendingMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pendingMemberEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pendingMemberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingMemberMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  pendingMemberTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },

  // Invite Code Display
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  inviteCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },

  // Pending Action Buttons
  pendingActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pendingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.errorAlpha,
  },
  removeButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.errorAlpha,
  },
  pendingActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptText: {
    color: colors.white,
  },
  declineText: {
    color: colors.error,
  },
  removeText: {
    color: colors.error,
  },

  bottomPadding: {
    height: 20,
  },
});