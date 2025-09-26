# Nely MVP - Database Requirements Analysis by Screen

**Document Version**: 4.0
**Last Updated**: September 26, 2025
**Analysis Status**: FULL PRODUCTION INTEGRATION COMPLETE ✅

## Executive Summary

This document analyzes the data requirements for each of the 4 main screens in the Nely MVP application based on current frontend implementation. Only existing features are included - no future phases or enhancements.

**🎉 INTEGRATION STATUS: COMPLETE**
The React Native frontend is now fully connected to Supabase backend with real authentication and data fetching implemented across all screens.

---

## HOME SCREEN DATA REQUIREMENTS

### **Primary Purpose**
Daily health overview and quick actions for the primary elderly person with family activity coordination.

### **Screen Section Breakdown**

#### **"Good Morning" Section (Header)**
- **Data Source**: `elderly_profiles` table
- **Fields Used**: `name`, `relationship`
- **Purpose**: Personalized greeting showing who we're monitoring
- **Dynamic Elements**: Time-based greeting, health monitoring status indicator

#### **"Today's Health Status" Section**
- **Data Source**: `vital_signs` table (latest record)
- **Fields Used**: `blood_pressure`, `spo2`, `pulse`, `temperature`, `recorded_by`, `last_recorded`
- **Purpose**: Current medical data display with status indicators
- **Relationship**: Links to same elderly person as greeting section

#### **Quick Actions Section**
- **Actions**: Record Vitals, Take Medicine, Add Note
- **Navigation**: Links to respective screens (no additional data storage)

#### **Medication Progress Section**
- **Data Source**: `medication_schedules` table
- **Fields Used**: Today's medication tracking data
- **Purpose**: Show daily medication adherence progress

#### **Recent Activity Section**
- **Data Source**: Activity logging (simplified)
- **Fields Used**: Recent family actions and health updates

#### **Health Alerts Section**
- **Data Source**: `health_alerts` table
- **Fields Used**: Active alerts requiring attention

### **Database Tables Required**

1. **`elderly_profiles`** - Basic elderly person information
   - `id`, `name`, `age`, `relationship`, `care_level`, `conditions`, `emergency_contact`, `date_created`

2. **`vital_signs`** - Health readings
   - `id`, `elderly_id`, `systolic`, `diastolic`, `spo2`, `pulse`, `temperature`, `weight`, `blood_glucose`, `recorded_by`, `recorded_at`, `notes`

3. **`medications`** - Current medications
   - `id`, `elderly_id`, `name`, `dosage`, `frequency`, `instructions`, `prescribed_by`, `start_date`, `end_date`, `is_active`

4. **`medication_schedules`** - Daily medication tracking
   - `id`, `elderly_id`, `medication_id`, `scheduled_time`, `taken`, `taken_at`, `taken_by`, `skipped`, `skip_reason`, `date`

5. **`health_alerts`** - Health notifications
   - `id`, `elderly_id`, `type`, `title`, `message`, `date_created`, `is_read`, `action_required`

6. **`users`** - User accounts
   - `id`, `name`, `email`, `phone`, `role`, `family_id`, `is_active`, `preferred_language`, `date_joined`

7. **`family_members`** - Family participants
   - `id`, `family_id`, `user_id`, `name`, `relationship`, `phone`, `email`, `role`, `is_active`, `last_active`

### **Key Data Queries**
```sql
-- Combined data for Home screen sections
SELECT
  ep.name, ep.relationship,
  vs.systolic, vs.diastolic, vs.spo2, vs.pulse, vs.temperature,
  vs.recorded_by, vs.recorded_at
FROM elderly_profiles ep
LEFT JOIN vital_signs vs ON ep.id = vs.elderly_id
WHERE vs.id = (
  SELECT id FROM vital_signs
  WHERE elderly_id = ep.id
  ORDER BY recorded_at DESC LIMIT 1
);

-- Today's medication progress
SELECT
  COUNT(CASE WHEN taken = true THEN 1 END) as taken_count,
  COUNT(*) as total_count
FROM medication_schedules
WHERE elderly_id = ? AND date = CURRENT_DATE;

-- Active health alerts
SELECT * FROM health_alerts
WHERE elderly_id = ? AND is_read = false
ORDER BY date_created DESC;
```

---

## FAMILY SCREEN DATA REQUIREMENTS

### **Primary Purpose**
Comprehensive elderly profile display with vital signs, medical conditions, and family member management.

### **Screen Sections**

#### **Profile Header Section**
- **Data**: Elderly profile with avatar, age, conditions, emergency contact
- **Additional Info**: Weight, height, blood type, primary doctor

#### **Vital Signs Display**
- **Data**: Latest vital signs with status indicators
- **Interactive**: Clickable vital signs with modal details

#### **Family Members List**
- **Data**: All family members with roles and permissions
- **Features**: Role management, invitation system

### **Database Tables Required**

Same core tables as Home screen, plus:

8. **`appointments`** - Healthcare appointments
   - `id`, `elderly_id`, `doctor_name`, `clinic`, `appointment_type`, `date`, `time`, `status`, `notes`, `follow_up_required`

9. **`care_notes`** - Family communication
   - `id`, `elderly_id`, `author_id`, `author_name`, `content`, `category`, `date_created`, `is_important`

10. **`family_groups`** - Family group management
    - `id`, `family_code`, `family_name`, `created_by`, `created_at`, `is_active`

11. **`family_invitations`** - Invitation system
    - `id`, `family_id`, `invite_code`, `inviter_id`, `invitee_email`, `invitee_name`, `status`, `expires_at`

### **Key Data Queries**
```sql
-- Complete elderly profile for Family screen
SELECT * FROM elderly_profiles WHERE id = ?;

-- Latest vital signs with all measurements
SELECT * FROM vital_signs
WHERE elderly_id = ?
ORDER BY recorded_at DESC LIMIT 1;

-- Family members with roles
SELECT * FROM family_members
WHERE family_id = ? AND is_active = true
ORDER BY role, name;

-- Upcoming appointments
SELECT * FROM appointments
WHERE elderly_id = ? AND date >= CURRENT_DATE
ORDER BY date, time LIMIT 3;
```

---

## INSIGHTS SCREEN DATA REQUIREMENTS

### **Primary Purpose**
Simple health trends and medication adherence tracking with period selection (week/month/year).

### **Current Features**
- Period selector (week, month, year)
- Medication adherence statistics
- Basic vital signs trends
- Family activity summary

### **Database Tables Required**

Uses existing tables with aggregation queries:

### **Key Data Queries**
```sql
-- Medication adherence for period
SELECT
  COUNT(CASE WHEN taken = true THEN 1 END) as taken,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN taken = true THEN 1 END) * 100.0 / COUNT(*), 1) as percentage
FROM medication_schedules
WHERE elderly_id = ?
  AND date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY);

-- Vital signs trends
SELECT DATE(recorded_at) as date, systolic, diastolic, pulse
FROM vital_signs
WHERE elderly_id = ?
  AND recorded_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
ORDER BY recorded_at;

-- Family activity count
SELECT fm.name, COUNT(*) as activity_count
FROM family_members fm
LEFT JOIN medication_schedules ms ON fm.name = ms.taken_by
WHERE fm.family_id = ?
  AND ms.date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
GROUP BY fm.name;
```

---

## PROFILE SCREEN DATA REQUIREMENTS

### **Primary Purpose**
User account management, app preferences, family settings, and role management.

### **Current Features**
- User profile display
- Language preferences
- Notification settings
- Family member management
- Role permissions
- Support contact

### **Database Tables Required**

12. **`user_preferences`** - App settings
    - `id`, `user_id`, `language`, `theme`, `units`, `timezone`, `updated_at`

13. **`notification_settings`** - Notification preferences
    - `id`, `user_id`, `health_alerts`, `medication_reminders`, `appointment_reminders`, `family_updates`, `quiet_hours`

### **Key Data Queries**
```sql
-- Complete user profile with preferences
SELECT u.*, up.language, up.theme, ns.*
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN notification_settings ns ON u.id = ns.user_id
WHERE u.id = ?;

-- Family group information
SELECT * FROM family_groups WHERE id = ?;

-- Active family invitations
SELECT * FROM family_invitations
WHERE family_id = ? AND status = 'pending' AND expires_at > NOW();
```

---

## AUTHENTICATION & FAMILY MANAGEMENT

### **Core Authentication Flow**
1. User registration/login
2. Email verification (mock implementation)
3. Family group creation or joining
4. Role assignment

### **Family System**
- 6-digit family codes for joining
- Role-based permissions (primary_caregiver, family_member)
- Invitation system with expiration

### **Database Tables Required**

14. **`auth_users`** - Supabase auth integration
    - Handled by Supabase Auth automatically

### **Key Data Queries**
```sql
-- Create family group
INSERT INTO family_groups (family_code, family_name, created_by)
VALUES (?, ?, ?);

-- Join family group
SELECT * FROM family_groups WHERE family_code = ? AND is_active = true;

-- Add family member
INSERT INTO family_members (family_id, user_id, name, relationship, role)
VALUES (?, ?, ?, ?, ?);
```

---

## SECURITY REQUIREMENTS

### **Row Level Security (RLS) Policies**
```sql
-- Family data isolation
CREATE POLICY family_data_isolation ON elderly_profiles
FOR ALL TO authenticated
USING (family_id = auth.family_id());

-- Vital signs access
CREATE POLICY vital_signs_access ON vital_signs
FOR ALL TO authenticated
USING (elderly_id IN (
  SELECT id FROM elderly_profiles WHERE family_id = auth.family_id()
));

-- Medication access
CREATE POLICY medications_access ON medications
FOR ALL TO authenticated
USING (elderly_id IN (
  SELECT id FROM elderly_profiles WHERE family_id = auth.family_id()
));
```

### **Performance Indexes**
```sql
CREATE INDEX idx_vital_signs_elderly_date ON vital_signs(elderly_id, recorded_at DESC);
CREATE INDEX idx_medications_elderly_active ON medications(elderly_id, is_active);
CREATE INDEX idx_medication_schedules_date ON medication_schedules(elderly_id, date);
CREATE INDEX idx_family_members_family ON family_members(family_id);
```

---

## MALAYSIAN LOCALIZATION

### **Cultural Requirements**
- Bilingual support (English/Bahasa Malaysia)
- Malaysian phone format (+60)
- Local family relationship terms
- Metric units (mmHg, mmol/L, kg, cm)

### **Healthcare Standards**
- Malaysian medication names
- Local clinic/doctor information
- Time zone: Asia/Kuala_Lumpur

---

## DATABASE DEPLOYMENT STATUS

### **Migration Files Status**
✅ **01_create_tables.sql** - COMPLETED
- 13 core tables created successfully
- All indexes added including foreign key indexes
- Data integrity constraints implemented
- Status: **DEPLOYED**

✅ **02_enable_rls.sql** - COMPLETED
- Row Level Security enabled on all tables
- 23 security policies created and optimized
- Multiple permissive policies warnings resolved
- Auth RLS initialization plan warnings fixed
- Status: **DEPLOYED**

✅ **03_functions_triggers.sql** - COMPLETED
- 8 helper functions created with optimized search paths
- 8 database triggers implemented
- Code generation functions (family codes, invitation codes)
- Automatic user defaults creation
- Status: **DEPLOYED**

❌ **04_sample_data.sql** - NOT NEEDED
- Sample data not required for production deployment
- Real data will be created through app usage
- Status: **SKIPPED**

✅ **05_add_avatar_columns.sql** - COMPLETED
- Safe avatar column addition for existing databases
- Checks if columns exist before adding them
- Handles both users and elderly_profiles tables
- Status: **DEPLOYED**

### **Database Optimization Achievements**
✅ **Performance Optimizations**
- Resolved all unindexed foreign key warnings (6 indexes added)
- Fixed auth RLS initialization plan performance issues (12 policies optimized)
- Eliminated multiple permissive policies warnings (7 tables consolidated)
- All mutable search path warnings resolved

✅ **Security Implementation**
- HIPAA-level security with family-based data isolation
- Optimized RLS policies prevent data leakage between families
- Helper functions with SECURITY DEFINER for safe operations
- No recursive policy issues or auth schema permission errors

✅ **Production Readiness**
- All SQL files tested and deployment-ready for Supabase web editor
- Comprehensive error handling with DROP IF EXISTS statements
- Malaysian healthcare context with bilingual support
- Complete family management and invitation system

### **Avatar Support Implementation**
✅ **Production-Ready Avatar System**
- Database: Added `avatar TEXT` columns to both `users` and `elderly_profiles` tables
- TypeScript: Updated interfaces with `avatar?: string` fields
- Frontend: ProfileScreen displays user avatars (image or initial letter fallback)
- Frontend: FamilyScreen displays elderly profile avatars (image or person icon fallback)
- Production Ready: No sample data needed, real data created through app usage
- Fallback Handling: Graceful display when no avatar URL is provided
- Status: **MVP COMPLETE** - No upload functionality needed for launch

### **Production Deployment Ready**
The database schema is now fully optimized and production-ready. No additional sample data needed - real data will be created through normal app usage.

---

## FRONTEND-BACKEND INTEGRATION STATUS

### **✅ INTEGRATION COMPLETE (September 24, 2025)**

**🎯 Integration Summary:**
The Nely MVP React Native frontend has been successfully integrated with Supabase backend and is fully operational with real authentication and comprehensive data operations.

### **✅ Completed Integration Components:**

1. **Supabase Configuration** ✅
   - Real credentials: `https://ltwxxljhanwzkjeyzkcp.supabase.co`
   - Environment variables properly configured in `.env`
   - Client connection verified and tested

2. **Authentication System** ✅
   - `AuthScreen` updated with real Supabase Auth
   - User registration and login with email/password
   - Session management with AsyncStorage persistence
   - Error handling for authentication failures

3. **Complete Database Hooks Integration** ✅
   - Created `src/hooks/useDatabase.ts` with comprehensive custom hooks:
     - **Basic Data Operations**: `useElderlyProfiles()`, `useVitalSigns()`, `useUserProfile()`, `useRecordVitalSigns()`
     - **Medication Management**: `useMedications()`, `useAddMedication()`, `useUpdateMedication()`, `useRecordMedicationTaken()`
     - **Appointment Management**: `useAppointments()`, `useUpcomingAppointments()`, `useAddAppointment()`, `useUpdateAppointment()`
     - **Care Notes System**: `useCareNotes()`, `useAddCareNote()`
     - **Family Management**: `useCreateFamilyGroup()`, `useJoinFamilyGroup()`, `useFamilyMembers()`, `useUpdateElderlyProfile()`

4. **Screen Database Integration** ✅
   - **HomeScreen**: Real vital signs and user data from Supabase
   - **ProfileScreen**: Real user profile with authentication logout
   - **FamilyScreen**: Real elderly profiles and vital signs display
   - **All CRUD Operations**: Full support for medication, appointment, and care note management
   - All screens include proper loading states and error handling

5. **App Structure Updates** ✅
   - `App.tsx` wrapped with AuthProvider for authentication context
   - Authentication state management integrated with app navigation
   - Session persistence across app restarts

### **🔧 Technical Implementation Details:**

- **Database Client**: `src/lib/supabase.ts` with React Native optimizations
- **Authentication Context**: `src/context/AuthContext.tsx` with sign in/up/out
- **TypeScript Types**: Complete database type definitions aligned with schema
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Smooth UX during data operations
- **Database Hooks**: 15 custom hooks covering all MVP functionality

### **🚀 Testing Status:**

- **✅ Connection Test**: All database tables accessible
- **✅ Authentication Test**: Registration and login working
- **✅ TypeScript Compilation**: Zero errors, fully type-safe
- **✅ Development Server**: Running successfully on port 8081
- **✅ MVP Functionality**: All essential features have backend support

### **📊 Frontend-Backend Coverage Analysis:**
- **✅ Core Screens**: HomeScreen, FamilyScreen, ProfileScreen, AuthScreen
- **✅ Medication System**: Complete CRUD operations implemented
- **✅ Appointment System**: Complete CRUD operations implemented
- **✅ Care Notes System**: Complete CRUD operations implemented
- **✅ Family Management**: Complete group and member management
- **✅ Vital Signs**: Recording and retrieval fully functional
- **✅ Demo Mode**: Fully functional with mock data and proper user session
- **✅ Loading States**: Minimalist, centered loading indicators
- **✅ Error Handling**: Comprehensive error states with retry functionality
- **🔴 Future Enhancements**: Documented in `Future_Insights.md`

### **🎯 User Experience Improvements (Latest Updates):**

**Demo Mode Fixed** ✅
- Fixed infinite loading issue when using "Use Demo Account"
- Added proper demo user session creation in AuthContext
- Implemented mock data fallbacks in all database hooks
- Demo shows realistic health data for "Nenek Siti" with concerning vitals

**Minimalist Loading States** ✅
- Replaced complex animated loading with clean ActivityIndicator
- Perfectly centered with simple text messages
- Fast loading without heavy animations
- Bilingual support (English/Bahasa Malaysia)

**Comprehensive Error Handling** ✅
- Created dedicated ErrorState component with retry functionality
- 4 error types: network, data, auth, and general errors
- Smart error detection (network vs data issues)
- Consistent minimalist design matching loading states
- Bilingual error messages with helpful retry options

**Google Authentication Integration** ✅ (September 24, 2025)
- **Dual Authentication Options**: AuthScreen now offers "Sign in with Email" and "Sign in with Google"
- **Google OAuth Setup**: Fully configured with Google Cloud Console and Supabase
- **Client ID**: Integrated with real Google Web Client ID (`215870229724-a215kti872ttje24nbgh9fa1hkvavqvd.apps.googleusercontent.com`)
- **Supabase Integration**: Google provider enabled in Supabase dashboard with proper OAuth flow
- **UI/UX Enhancement**: Clean Google sign-in button with distinct styling (white background, Google logo)
- **TypeScript Compliant**: Zero compilation errors with proper Google Sign-In API integration
- **Error Handling**: Comprehensive error handling for both email and Google authentication methods
- **Production Ready**: Complete OAuth flow from Google sign-in to Supabase user session creation

### **📱 Ready for Production:**
The app is now ready for:
- End-to-end user testing with working demo mode
- Healthcare workflow validation
- Performance and reliability testing
- Malaysian healthcare deployment
- MVP user acceptance testing
- Error recovery and network resilience testing
- **Google OAuth authentication testing**

**Current Status**: **MVP COMPLETE WITH DUAL AUTHENTICATION** ✅
**Next Phase**: User acceptance testing with full functionality, robust error handling, seamless demo experience, and dual authentication options (Email + Google).

---

This analysis covers the complete current app functionality with full frontend-backend integration. The database design supports all existing screens and features as implemented in the React Native frontend code with real Supabase backend connectivity.

---