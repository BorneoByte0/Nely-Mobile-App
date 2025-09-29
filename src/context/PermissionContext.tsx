import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ROLE_PERMISSIONS, useUserFamilyRole } from '../hooks/useDatabase';
import type { FamilyRole } from '../types';

export interface Permissions {
  canViewHealth: boolean;
  canEditHealth: boolean;
  canManageMedications: boolean;
  canManageAppointments: boolean;
  canManageFamily: boolean;
  canInviteMembers: boolean;
  canChangeRoles: boolean;
  canDeleteData: boolean;
}

interface PermissionContextType {
  permissions: Permissions;
  hasPermission: (permission: keyof Permissions) => boolean;
  canPerformAction: (action: string) => boolean;
  isAdmin: boolean;
  isCarer: boolean;
  isViewer: boolean;
  familyRole: FamilyRole | 'none';
  roleLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  // Use the fixed useUserFamilyRole hook instead of AuthContext
  const { role: familyRole, loading: roleLoading } = useUserFamilyRole();

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[familyRole] || ROLE_PERMISSIONS.none;
  }, [familyRole]);

  const isAdmin = familyRole === 'admin';

  const hasPermission = (permission: keyof Permissions): boolean => {
    return permissions[permission];
  };

  const canPerformAction = (action: string): boolean => {
    // Map common actions to permissions
    const actionMap: Record<string, keyof Permissions> = {
      'view_health': 'canViewHealth',
      'edit_health': 'canEditHealth',
      'record_vitals': 'canEditHealth',
      'view_vitals': 'canViewHealth',
      'add_medication': 'canManageMedications',
      'edit_medication': 'canManageMedications',
      'delete_medication': 'canDeleteData',
      'take_medication': 'canEditHealth',
      'view_medications': 'canViewHealth',
      'add_appointment': 'canManageAppointments',
      'edit_appointment': 'canManageAppointments',
      'delete_appointment': 'canDeleteData',
      'view_appointments': 'canViewHealth',
      'complete_appointment': 'canManageAppointments',
      'add_care_note': 'canEditHealth',
      'view_care_notes': 'canViewHealth',
      'delete_care_note': 'canDeleteData',
      'invite_family_member': 'canInviteMembers',
      'manage_family_members': 'canManageFamily',
      'change_user_role': 'canChangeRoles',
      'view_family_members': 'canViewHealth',
      'review_join_requests': 'canManageFamily',
      'manage_elderly_profile': 'canManageFamily',
      'edit_elderly_profile': 'canEditHealth',
      'view_elderly_profile': 'canViewHealth',
    };

    const permissionKey = actionMap[action];
    if (permissionKey) {
      return hasPermission(permissionKey);
    }

    // Default to false for unknown actions
    console.warn(`Unknown action: ${action}`);
    return false;
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    canPerformAction,
    isAdmin,
    isCarer: familyRole === 'carer',
    isViewer: familyRole === 'family_viewer',
    familyRole,
    roleLoading,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Utility hooks for common permission checks
export const useCanEditHealth = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('canEditHealth');
};

export const useCanManageMedications = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('canManageMedications');
};

export const useCanManageAppointments = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('canManageAppointments');
};

export const useCanManageFamily = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('canManageFamily');
};

export const useCanDeleteData = () => {
  const { hasPermission } = usePermissions();
  return hasPermission('canDeleteData');
};

export const useIsAdminOrCarer = () => {
  const { isAdmin, isCarer } = usePermissions();
  return isAdmin || isCarer;
};

// Component for conditional rendering based on permissions
interface PermissionGateProps {
  permission?: keyof Permissions;
  action?: string;
  role?: FamilyRole | 'admin' | 'carer' | 'viewer' | 'none';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  action,
  role,
  fallback = null,
  children
}) => {
  const { hasPermission, canPerformAction, familyRole, isAdmin, isCarer, isViewer } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (action) {
    hasAccess = canPerformAction(action);
  } else if (role) {
    switch (role) {
      case 'admin':
        hasAccess = isAdmin;
        break;
      case 'carer':
        hasAccess = isCarer;
        break;
      case 'viewer':
      case 'family_viewer':
        hasAccess = isViewer;
        break;
      case 'none':
        hasAccess = familyRole === 'none';
        break;
      default:
        hasAccess = familyRole === role;
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Hook for role-based navigation guards
export const useRoleGuard = () => {
  const { familyRole, isAdmin, roleLoading } = usePermissions();

  const canAccessScreen = (screenName: string): boolean => {
    // Define screen access rules
    const screenRules: Record<string, (role: FamilyRole | 'none') => boolean> = {
      'RoleManagement': (role) => role === 'admin',
      'InviteFamilyMembers': (role) => role === 'admin' || role === 'carer',
      'ManageMedications': (role) => role === 'admin' || role === 'carer',
      'AddMedication': (role) => role === 'admin' || role === 'carer',
      'EditMedication': (role) => role === 'admin' || role === 'carer',
      'TakeMedication': (role) => role !== 'none',
      'AddAppointment': (role) => role === 'admin' || role === 'carer',
      'EditAppointment': (role) => role === 'admin' || role === 'carer',
      'RecordVitalReading': (role) => role !== 'none' && role !== 'family_viewer',
      'AddNotes': (role) => role !== 'none' && role !== 'family_viewer',
      'EditElderlyProfile': (role) => role === 'admin' || role === 'carer',
      // Add more screen rules as needed
    };

    const rule = screenRules[screenName];
    if (rule) {
      return rule(familyRole);
    }

    // Default: allow access for all authenticated users
    return familyRole !== 'none';
  };

  const requireAdmin = (): boolean => {
    return isAdmin;
  };

  const requireCarerOrAdmin = (): boolean => {
    return familyRole === 'admin' || familyRole === 'carer';
  };

  return {
    canAccessScreen,
    requireAdmin,
    requireCarerOrAdmin,
    roleLoading,
  };
};