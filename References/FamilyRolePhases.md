# Family Role Management System - Comprehensive Implementation Phases

## Overview
This document outlines the complete implementation phases for the Nely family role management system, based on FamilyRole.md requirements and the database foundation that has been established.

## Database Foundation Status  COMPLETED
The following database migrations have been successfully implemented:
-  `09_create_appointment_outcomes.sql` - Appointment outcomes with family-based RLS
-  `10_create_user_family_roles.sql` - Core family role management system
-  `11_update_family_group_function.sql` - Family creation/joining with role assignment
-  `12_create_family_join_requests.sql` - Admin approval workflow for family joining

## Family Role Requirements Summary
Based on FamilyRole.md, the system must implement:

### Auto-Assignment Rules:
- **Family Creators**: Both elderly and non-elderly users who create a family group automatically become **Admin**
- **Family Joiners**: Both elderly and non-elderly users who join via family code automatically become **Family Viewer**

### Role Permissions:
- **Admin**: Full access to all features and settings + role management
- **Carer**: Can manage health data, medications, and appointments
- **Family Viewer**: Can only view health information (read-only)

### Access Control:
- Profile screen role management section: **Admin-only access**
- Role management screen: **Admin-only** - can change user roles and accept join requests

## Implementation Phases

---

### Phase 1: Core Backend Integration
**Duration: 3-4 days | Priority: CRITICAL**

#### 1A: Database Hooks Enhancement
- [ ] **Update `useDatabase.ts`** with family role functions:
  ```typescript
  // Join Request Management
  useCreateFamilyJoinRequest(familyCode: string, message?: string)
  useReviewFamilyJoinRequest(requestId: string, action: 'approve' | 'reject', message?: string)
  usePendingJoinRequests(familyId: string) // Admin only
  useUserJoinRequestStatus(familyCode: string)

  // Role Management
  useUserFamilyRole(userId?: string, familyId?: string)
  useFamilyMembersWithRoles(familyId: string)
  useUpdateUserFamilyRole(userId: string, newRole: FamilyRole)
  useIsCurrentUserAdmin(familyId?: string)

  // Permission Utilities
  useRolePermissions(role?: FamilyRole)
  ```

- [ ] **Update family creation/joining flows** to use new role-enabled functions
- [ ] **Add comprehensive error handling** for all role-related operations
- [ ] **Test all database operations** with TypeScript integration

#### 1B: Authentication & Context Updates
- [ ] **Update AuthContext** to include current user's family role
- [ ] **Add role-based permission context** for app-wide access control
- [ ] **Implement role state management** across app components
- [ ] **Add role change event handling** and state updates

---

### Phase 2: Family Join Request System
**Duration: 4-5 days | Priority: HIGH**

#### 2A: Join Request Creation Flow
- [ ] **Create JoinFamilyRequestScreen.tsx**:
  - Family code input with validation
  - Optional request message field
  - Real-time validation (family exists, user not already member)
  - Success/error feedback with clear messaging
  - Request status tracking display

- [ ] **Update family joining navigation**:
  - Replace direct joining with request creation
  - Add request status checking
  - Handle edge cases (already in family, invalid codes)

#### 2B: Admin Join Request Management
- [ ] **Create FamilyJoinRequestsScreen.tsx** (Admin-only):
  - Display pending requests with user information
  - Show request message and timestamp
  - Approve/reject actions with optional response messages
  - Confirmation dialogs for admin actions
  - Real-time updates for new requests

- [ ] **Add navigation to join requests** from profile/admin sections
- [ ] **Implement request notifications** for admins
- [ ] **Add request history and status tracking**

#### 2C: Request Status & User Feedback
- [ ] **Add join request status to user profile**
- [ ] **Implement request withdrawal functionality**
- [ ] **Show request history and current status**
- [ ] **Add push notifications for status changes**

---

### Phase 3: Role Management Interface
**Duration: 4-5 days | Priority: HIGH**

#### 3A: Role Management Screen (Admin-Only)
- [ ] **Create RoleManagementScreen.tsx**:
  - Display all family members with current roles
  - Role change dropdowns with validation
  - Role descriptions and permission explanations
  - Confirmation dialogs for role changes
  - Audit trail for role assignments

- [ ] **Implement role assignment functionality**:
  - Dropdown selectors for each family member
  - Real-time role updates
  - Prevent admin from removing their own admin role (if only admin)
  - Role change notifications to affected users

#### 3B: Profile Screen Integration
- [ ] **Update profile screen with conditional role management access**:
  - Show "Role Management" section only to admins
  - Display current user's role badge
  - Add navigation to role management screen
  - Show family role status and permissions

- [ ] **Add role indicators throughout the app**:
  - User profile displays
  - Family member lists
  - Navigation elements
  - Permission-based UI elements

---

### Phase 4: Permission-Based UI System
**Duration: 3-4 days | Priority: HIGH**

#### 4A: Screen-Level Access Control
- [ ] **Update all health-related screens** with role-based permissions:
  - **Admin & Carer**: Full read/write access to health data
  - **Family Viewer**: Read-only access (hide edit/delete buttons)
  - **No Role**: No access (redirect to join family flow)

- [ ] **Implement screen-level permission checks**:
  - VitalSignModal: Admin/Carer can edit, Family Viewer can view
  - ManageMedicationsScreen: Admin/Carer access only
  - ManageAppointmentsScreen: Admin/Carer access only
  - All viewing screens: All roles can access

#### 4B: Component-Level Permission Integration
- [ ] **Create permission utility hooks**:
  ```typescript
  const useCanManageHealth = () => boolean
  const useCanViewHealth = () => boolean
  const useCanManageRoles = () => boolean
  const useCanAccessScreen = (screenName: string) => boolean
  ```

- [ ] **Update navigation components**:
  - Hide/show menu items based on role
  - Add role-based conditional rendering
  - Implement permission-aware routing

#### 4C: Data Access Control
- [ ] **Implement permission-based data queries**:
  - Ensure all database queries respect role permissions
  - Add client-side permission validation
  - Handle permission errors gracefully
  - Implement read-only mode for Family Viewers

---

### Phase 5: User Experience Enhancement
**Duration: 3-4 days | Priority: MEDIUM**

#### 5A: Onboarding & Role Education
- [ ] **Update onboarding flow** to explain family roles:
  - Role descriptions during family creation/joining
  - Permission explanations for each role
  - Interactive tutorial for admins on role management

- [ ] **Add contextual help** throughout the app:
  - Role-specific help sections
  - Tooltips explaining permission restrictions
  - FAQ section for family management

#### 5B: Navigation & Dashboard Customization
- [ ] **Implement role-based dashboard**:
  - Admin: Full dashboard with role management access
  - Carer: Health management focused dashboard
  - Family Viewer: Read-only health overview dashboard

- [ ] **Update main navigation**:
  - Role-appropriate menu structure
  - Hide unavailable features
  - Add role indicators in navigation

#### 5C: Notifications & Alerts
- [ ] **Implement role-based notifications**:
  - Admin: Join requests, role changes, family events
  - Carer: Health alerts, medication reminders
  - Family Viewer: General family updates

- [ ] **Add notification preferences** by role
- [ ] **Implement email notifications** for important role events

---

### Phase 6: Advanced Features & Polish
**Duration: 2-3 days | Priority: LOW**

#### 6A: Family Management Enhancements
- [ ] **Add family member removal** (Admin-only):
  - Remove member from family
  - Handle data cleanup
  - Confirmation dialogs and notifications

- [ ] **Implement family settings**:
  - Family preferences management
  - Privacy settings
  - Data retention policies

#### 6B: Audit & Security Features
- [ ] **Add comprehensive audit logging**:
  - Role change history
  - Family join/leave events
  - Admin action tracking

- [ ] **Implement security features**:
  - Session timeout based on role
  - Failed permission attempt logging
  - Role escalation monitoring

---

## Technical Implementation Details

### Key Database Functions Available:
```sql
-- Family Group Management
create_family_group_secure(family_code, family_name, elderly_name, elderly_age, elderly_relationship)
join_family_group_secure(family_code) -- Now creates join request

-- Role Management
auto_assign_family_role(user_id, family_id, is_elderly, is_creator)
update_user_family_role(target_user_id, family_id, new_role, admin_user_id)
get_family_members_with_roles(family_id)
get_user_family_role(user_id, family_id)
is_family_admin(user_id, family_id)

-- Join Request Management
create_family_join_request(family_code, request_message)
review_family_join_request(request_id, action, review_message)
get_pending_join_requests(family_id)
get_user_join_request_status(family_code)
```

### Screen Architecture:
```
src/
   screens/
      FamilyManagement/
         JoinFamilyRequestScreen.tsx
         FamilyJoinRequestsScreen.tsx (Admin)
         RoleManagementScreen.tsx (Admin)
      Profile/
         ProfileScreen.tsx (Updated with role management)
      [All existing screens updated with role permissions]
   components/
      FamilyManagement/
         FamilyMemberCard.tsx
         RoleSelector.tsx
         JoinRequestCard.tsx
         PermissionWrapper.tsx
      Common/
          RoleBadge.tsx
          PermissionGate.tsx
   hooks/
      useRolePermissions.ts
      useFamilyRole.ts
      usePermissionCheck.ts
   utils/
       permissions.ts
       roleValidation.ts
```

### Permission Matrix:
| Feature | Admin | Carer | Family Viewer |
|---------|-------|-------|---------------|
| View Health Data |  |  |  |
| Edit Health Data |  |  | L |
| Manage Medications |  |  | L |
| Manage Appointments |  |  | L |
| Role Management |  | L | L |
| Accept Join Requests |  | L | L |
| Family Settings |  | L | L |

---

## Quality Assurance & Testing

### Critical Test Cases:
- [ ] **Role Assignment Tests**:
  - Family creators become admin (elderly and non-elderly)
  - Family joiners become family_viewer (elderly and non-elderly)
  - Role changes by admin work correctly
  - Non-admins cannot change roles

- [ ] **Permission Tests**:
  - Family Viewers cannot edit health data
  - Carers can manage health but not roles
  - Admins have full access
  - Unauthorized access is properly blocked

- [ ] **Join Request Tests**:
  - Request creation works properly
  - Admin approval/rejection functions correctly
  - Status updates reach users appropriately
  - Only admins can manage requests

### Security Validation:
- [ ] **RLS Policy Testing**: Verify all database policies prevent unauthorized access
- [ ] **Role Escalation Prevention**: Ensure users cannot elevate their own roles
- [ ] **Family Isolation**: Confirm users can only access their family's data
- [ ] **Admin Protection**: Prevent family from being left without an admin

---

## Success Metrics

### Phase 1-2 Success Criteria:
- [ ] Family creation auto-assigns admin role correctly
- [ ] Join requests are created instead of direct joining
- [ ] Admin approval workflow functions without errors
- [ ] All role assignments follow FamilyRole.md rules

### Phase 3-4 Success Criteria:
- [ ] Role management interface works intuitively for admins
- [ ] Permission-based UI hides/shows appropriate features
- [ ] All screens respect role-based access control
- [ ] Family Viewers have read-only access to health data

### Overall Success Metrics:
- [ ] 100% compliance with FamilyRole.md requirements
- [ ] Zero unauthorized access to role management features
- [ ] Family role operations complete in <2 seconds
- [ ] User satisfaction >4.5/5 for family management features

---

## Risk Mitigation

### Technical Risks:
- **Database Performance**: RLS policies may impact query performance with large families
- **State Management**: Role state synchronization across app components
- **Permission Complexity**: Ensuring consistent permission checks throughout app

### User Experience Risks:
- **Role Confusion**: Clear role descriptions and visual indicators needed
- **Admin Burden**: Streamlined approval workflows to prevent admin fatigue
- **Permission Frustration**: Clear messaging when users lack permissions

### Security Risks:
- **Privilege Escalation**: Thorough testing of role assignment functions
- **Family Data Leakage**: Validation of family-based data isolation
- **Admin Account Compromise**: Audit trails and role change notifications

---

**Document Status**: Comprehensive Implementation Guide v2.0
**Database Foundation**:  Complete (4 migrations applied)
**Last Updated**: 2025-09-28
**Ready for Implementation**: Phase 1 (Backend Integration)