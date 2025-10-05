# Comprehensive Project Context - Nely Healthcare Management Mobile App

**Version:** 1.0.0
**Platform:** React Native (Expo SDK 54)
**Database:** Supabase (PostgreSQL)
**Target Market:** Malaysian Families with Elderly Care Needs
**Last Updated:** October 2, 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Design](#3-architecture--design)
4. [Directory Structure](#4-directory-structure)
5. [Database & Data Models](#5-database--data-models)
6. [Core Features & Functionality](#6-core-features--functionality)
7. [Development Guidelines](#7-development-guidelines)
8. [Configuration & Environment](#8-configuration--environment)
9. [Build & Deployment](#9-build--deployment)
10. [Dependencies & Integrations](#10-dependencies--integrations)
11. [Known Issues & Considerations](#11-known-issues--considerations)
12. [Quick Reference](#12-quick-reference)

---

## 1. Project Overview

### 1.1 Project Name & Purpose

**Nely** - A comprehensive family healthcare management mobile application designed specifically for Malaysian families to coordinate elderly care across multiple family members.

**Vision:** Become Malaysia's most trusted family health coordination platform.

**Mission:** Help Malaysian families keep track of their elderly parents' health, together.

**Value Proposition:** "Finally, a simple way for the whole family to stay connected to elderly's health - whether you're in the same house or across the city."

### 1.2 Target Users

- **Primary:** Malaysian families with elderly parents (ages 65+)
- **Secondary:** Adult children (20-50) with smartphones managing elderly care
- **Tertiary:** Elderly persons who may or may not use smartphones themselves
- **Focus:** Lower/middle-class Malaysian families wanting better healthcare coordination

### 1.3 Core Problem Being Solved

1. Adult children worry about elderly parents living separately
2. Hard to coordinate health information among dispersed family members
3. Elderly forget medications or don't track health consistently
4. Family members don't know when to worry vs when things are fine
5. No centralized system for Malaysian family healthcare coordination

### 1.4 High-Level Architecture

**Architecture Pattern:** Client-Server with Real-time Sync
**Client:** React Native mobile app (iOS & Android)
**Backend:** Supabase (PostgreSQL + Real-time + Auth + Storage)
**Authentication:** Supabase Auth (Email/Password only - MVP)
**Data Security:** Row Level Security (RLS) policies for multi-tenant isolation

---

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 54.0.10 | React Native framework & build tooling |
| **React Native** | 0.81.4 | Cross-platform mobile development |
| **React** | 19.1.0 | UI library and component management |
| **TypeScript** | 5.9.2 | Type safety and developer experience |
| **Supabase** | 2.57.4 | Backend as a Service (BaaS) |
| **PostgreSQL** | 15+ | Database (via Supabase) |

### 2.2 Key Libraries & Dependencies

**Navigation:**
- `@react-navigation/native` (7.1.17) - Core navigation
- `@react-navigation/bottom-tabs` (7.4.7) - Tab navigation
- `@react-navigation/stack` (7.4.8) - Stack navigation
- `react-native-gesture-handler` (2.28.0) - Gesture handling

**UI & Animation:**
- `expo-linear-gradient` (15.0.7) - Gradient backgrounds
- `@expo/vector-icons` (15.0.2) - Icon library
- `react-native-svg` (15.12.1) - SVG rendering
- `react-native-chart-kit` (6.12.0) - Health data charts

**State & Storage:**
- `@react-native-async-storage/async-storage` (2.2.0) - Local storage
- React Context API - Global state management

**Authentication & Security:**
- `expo-auth-session` (7.0.8) - OAuth flows
- `expo-crypto` (15.0.7) - Cryptographic functions
- `expo-web-browser` (15.0.7) - OAuth browser sessions

**Platform Features:**
- `expo-notifications` (0.32.11) - Push notifications
- `expo-device` (8.0.8) - Device information
- `expo-haptics` (15.0.7) - Haptic feedback
- `@react-native-community/datetimepicker` (8.4.4) - Date/time pickers

### 2.3 Development Tools

- **Package Manager:** npm
- **Build System:** Expo Application Services (EAS)
- **Type Checking:** TypeScript compiler
- **Version Control:** Git
- **CI/CD:** EAS Build & Submit

### 2.4 Runtime Environments

- **Android:** API 21+ (Android 5.0 Lollipop and above)
- **iOS:** iOS 13.4+ (iPhone 6s and newer)
- **Database:** Supabase hosted in Singapore region

---

## 3. Architecture & Design

### 3.1 Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Client (React Native)          │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer                                      │
│  ├─ Screens (50+ screen components)                     │
│  ├─ Components (Reusable UI components)                 │
│  └─ Navigation (Tab + Stack navigators)                 │
├─────────────────────────────────────────────────────────┤
│  State Management Layer                                  │
│  ├─ Context Providers (Auth, Permissions, Language)     │
│  ├─ Custom Hooks (Database operations, UI state)        │
│  └─ Local Storage (AsyncStorage)                        │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                       │
│  ├─ Supabase Client (lib/supabase.ts)                  │
│  ├─ Database Hooks (useDatabase.ts)                     │
│  └─ API Services (notificationService.ts)               │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────┐
│              Supabase Backend (PostgreSQL)               │
├─────────────────────────────────────────────────────────┤
│  Authentication Layer                                    │
│  ├─ Supabase Auth (JWT-based, Email/Password)         │
│  └─ Session Management                                  │
├─────────────────────────────────────────────────────────┤
│  Database Layer                                          │
│  ├─ 13 Core Tables (users, elderly_profiles, etc.)     │
│  ├─ Row Level Security (RLS) Policies                   │
│  ├─ Database Functions (auto_assign_role, etc.)         │
│  ├─ Triggers (auto-update timestamps)                   │
│  └─ Indexes (Performance optimization)                  │
├─────────────────────────────────────────────────────────┤
│  Real-time Layer                                         │
│  └─ PostgreSQL Change Data Capture (CDC)                │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Design Patterns

**State Management:**
- **Context API** for global state (Auth, Permissions, Language, Notifications)
- **Custom Hooks** for data fetching and business logic
- **Component-local state** for UI interactions

**Navigation Pattern:**
- **Bottom Tab Navigation** (4 main tabs: Home, Family, Insights, Profile)
- **Stack Navigation** within each tab for nested screens
- **Custom swipeable tabs** with gesture handling
- **State-based routing** for authentication flows

**Data Access Pattern:**
- **Repository Pattern** via custom hooks (e.g., `useElderlyProfiles()`)
- **Reactive data fetching** with automatic refetch on screen focus
- **Optimistic UI updates** for better user experience
- **Error boundary handling** with user-friendly error states

**Security Pattern:**
- **Row Level Security (RLS)** for multi-tenant data isolation
- **Family-based access control** via `family_id` foreign keys
- **Role-based permissions** (admin, carer, family_viewer)
- **JWT authentication** with automatic token refresh

**UI/UX Patterns:**
- **Glassmorphism** for modern card designs
- **Gradient backgrounds** for visual hierarchy
- **Haptic feedback** for tactile interactions
- **Loading skeletons** for better perceived performance
- **Pull-to-refresh** for data synchronization

### 3.3 Component Architecture

**Component Hierarchy:**
```
App.tsx (Root)
├─ Providers (AuthProvider, PermissionProvider, LanguageProvider, NotificationProvider)
├─ AppContent (State-based routing)
│   ├─ SplashScreen
│   ├─ OnboardingScreen
│   ├─ AuthScreen
│   ├─ VerifyScreen
│   ├─ CreateUsersScreen (Profile setup)
│   ├─ BoardingScreen (Family join/create)
│   └─ NavigationContainer (Authenticated app)
│       └─ BottomTabNavigator
│           ├─ HomeStackNavigator
│           ├─ FamilyStackNavigator
│           ├─ InsightsStackNavigator
│           └─ ProfileStackNavigator
```

### 3.4 Data Flow Architecture

**User Authentication Flow:**
```
User Sign Up → Supabase Auth → Create User Profile →
Assign Family → Auto-assign Role → Load Permissions →
Main App Access
```

**Health Data Recording Flow:**
```
User Input (Screen) → Validation → Permission Check →
Supabase Insert → Real-time Update → UI Refresh →
Haptic Feedback → Success Toast
```

**Family Role Management Flow:**
```
Admin Action → Permission Verification → RLS Policy Check →
Database Function Execution → Role Assignment →
Permission Context Refresh → UI Update
```

---

## 4. Directory Structure

### 4.1 Complete Project Structure

```
nely-mobile-app/
├── Database/                          # Database migrations and documentation
│   ├── 01_create_tables.sql          # Initial schema (13 core tables)
│   ├── 02_enable_rls.sql             # Row Level Security policies
│   ├── 03_functions_triggers.sql     # Database functions and triggers
│   ├── 04_sample_data.sql            # Test data for development
│   ├── 05-09_*.sql                   # Schema enhancements
│   ├── 10_create_user_family_roles.sql   # Role management system
│   ├── 12_create_family_join_requests.sql # Join request workflow
│   ├── 19_add_notification_preferences.sql # Push notification support
│   ├── Backend_Context.md            # Database architecture docs
│   ├── roleDB.md                     # Supabase expert role definition
│   └── Google_Auth.md                # OAuth integration guide
│
├── References/                        # Design and development documentation
│   ├── Project_Context.md            # Product vision and MVP scope
│   ├── FamilyRole.md                 # Role-based access control rules
│   ├── User_Flow.md                  # User journey documentation
│   ├── UIUX.md                       # Design system and UI guidelines
│   ├── Color_Palettes.md             # Color scheme specifications
│   ├── Development_Progress_*.md     # Sprint completion logs (1-4)
│   └── FamilyRolePhases.md           # Role system implementation phases
│
├── src/                               # Application source code
│   ├── components/                    # Reusable UI components
│   │   ├── SafeAreaWrapper.tsx       # Safe area container with gradients
│   │   ├── GradientBackground.tsx    # Gradient background component
│   │   ├── VitalSignModal.tsx        # Vital signs detail modal
│   │   ├── HealthLoadingState.tsx    # Loading skeleton states
│   │   ├── ErrorState.tsx            # Error display component
│   │   ├── ModernAlert.tsx           # Custom alert dialogs
│   │   ├── SuccessAnimation.tsx      # Success feedback animations
│   │   ├── InteractiveFeedback.tsx   # Haptic and visual feedback
│   │   └── LanguageToggle.tsx        # Language switcher component
│   │
│   ├── screens/                       # Screen components (50+ screens)
│   │   ├── SplashScreen.tsx          # App initialization screen
│   │   ├── OnboardingScreen.tsx      # First-time user walkthrough
│   │   ├── AuthScreen.tsx            # Login/register screen
│   │   ├── VerifyScreen.tsx          # Email verification
│   │   ├── CreateUsersScreen.tsx     # User profile creation
│   │   ├── BoardingScreen.tsx        # Family join/create choice
│   │   ├── CreateFamilyGroupScreen.tsx # Create new family
│   │   ├── JoinFamilyRequestScreen.tsx # Request to join family
│   │   ├── WaitingApprovalScreen.tsx # Pending approval status
│   │   ├── HomeScreen.tsx            # Daily health overview
│   │   ├── FamilyScreen.tsx          # Elderly profile and health data
│   │   ├── InsightsScreen.tsx        # Health trends and analytics
│   │   ├── ProfileScreen.tsx         # User settings and preferences
│   │   ├── RecordVitalReadingScreen.tsx # Record vital signs
│   │   ├── TakeMedicationScreen.tsx  # Medication adherence tracking
│   │   ├── AddMedicationScreen.tsx   # Add new medication
│   │   ├── ManageMedicationsScreen.tsx # Medication list management
│   │   ├── AddAppointmentScreen.tsx  # Schedule appointments
│   │   ├── ManageAppointmentsScreen.tsx # Appointment list
│   │   ├── EditAppointmentScreen.tsx # Modify appointments
│   │   ├── AppointmentOutcomeScreen.tsx # Record appointment results
│   │   ├── AddNotesScreen.tsx        # Add care notes
│   │   ├── RoleManagementScreen.tsx  # Admin role management
│   │   ├── FamilyJoinRequestsScreen.tsx # Review join requests (admin)
│   │   ├── NotificationSettingsScreen.tsx # Notification preferences
│   │   └── ... (40+ more screens)
│   │
│   ├── navigation/                    # Navigation configuration
│   │   ├── BottomTabNavigator.tsx    # Main tab navigation
│   │   ├── HomeStackNavigator.tsx    # Home tab stack
│   │   ├── FamilyStackNavigator.tsx  # Family tab stack
│   │   ├── InsightsStackNavigator.tsx # Insights tab stack
│   │   └── ProfileStackNavigator.tsx # Profile tab stack
│   │
│   ├── context/                       # React Context providers
│   │   ├── AuthContext.tsx           # Authentication state & functions
│   │   ├── PermissionContext.tsx     # Role-based permissions
│   │   ├── LanguageContext.tsx       # Internationalization (EN/MS)
│   │   └── NotificationContext.tsx   # Push notification management
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useDatabase.ts            # Database CRUD operations (800+ lines)
│   │   ├── useModernAlert.ts         # Alert dialog management
│   │   └── useSuccessAnimation.ts    # Success feedback animations
│   │
│   ├── services/                      # External service integrations
│   │   └── notificationService.ts    # Expo push notifications
│   │
│   ├── lib/                           # Third-party library configuration
│   │   └── supabase.ts               # Supabase client initialization
│   │
│   ├── utils/                         # Utility functions
│   │   └── haptics.ts                # Haptic feedback helpers
│   │
│   ├── constants/                     # App constants
│   │   ├── colors.ts                 # Color palette definitions
│   │   └── languages.ts              # Translation strings (EN/MS)
│   │
│   └── types/                         # TypeScript type definitions
│       └── index.ts                  # Core type interfaces
│
├── assets/                            # Static assets
│   ├── icon-nely.png                 # App icon
│   ├── nely-splash.png               # Splash screen image
│   └── favicon.png                   # Web favicon
│
├── App.tsx                            # Root application component
├── index.ts                           # Expo entry point
├── app.json                           # Expo configuration
├── eas.json                           # EAS Build configuration
├── babel.config.js                   # Babel transpiler config
├── package.json                       # npm dependencies
├── tsconfig.json                      # TypeScript configuration
└── .gitignore                         # Git ignore rules
```

### 4.2 Key Files & Their Responsibilities

| File | Lines | Purpose |
|------|-------|---------|
| **App.tsx** | 317 | Root component, state-based routing logic, provider wrapping |
| **src/context/AuthContext.tsx** | 422 | Authentication, user profile management, session handling |
| **src/context/PermissionContext.tsx** | 258 | Role-based access control, permission checking |
| **src/hooks/useDatabase.ts** | 800+ | All database operations (CRUD for all entities) |
| **src/lib/supabase.ts** | 185 | Supabase client configuration, database connection |
| **src/screens/HomeScreen.tsx** | 1000+ | Daily health dashboard, quick actions |
| **src/screens/FamilyScreen.tsx** | 1200+ | Elderly profile, health data visualization |
| **src/navigation/BottomTabNavigator.tsx** | 363 | Custom animated tab bar, swipeable tabs |

---

## 5. Database & Data Models

### 5.1 Database Schema Overview

**Database Platform:** PostgreSQL 15+ (via Supabase)
**Schema Version:** 1.0.0 (Production Ready)
**Total Tables:** 13 core tables
**Security Model:** Row Level Security (RLS) enabled on all tables
**Extensions:** uuid-ossp, pg_trgm (full-text search)
**Migration Status:** ✅ Complete & Verified (October 2, 2025)

**Database Connection:**
- **URL:** `[CONFIGURED IN .env FILE]`
- **Project Ref:** `[PRIVATE]`
- **Region:** Singapore (ap-southeast-1)
- **Status:** ✅ Active & Operational

### 5.2 Core Tables

#### **1. family_groups** - Family Organizations
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
family_name TEXT NOT NULL
family_code TEXT UNIQUE NOT NULL (6 characters, auto-generated)
created_by UUID NOT NULL (references auth.users)
created_at TIMESTAMPTZ DEFAULT NOW()
is_active BOOLEAN DEFAULT true
```

**Purpose:** Multi-tenant family organization structure with auto-generated unique codes
**Key Feature:** Auto-generates unique 6-character alphanumeric family codes via trigger
**Indexes:**
- `idx_family_groups_code` (WHERE is_active = true)
- `idx_family_groups_created_by`
**Constraints:**
- Family code length must be exactly 6 characters
- Family name cannot be empty

#### **2. users** - User Profiles & Authentication
```sql
id UUID PRIMARY KEY (references auth.users)
family_id UUID (references family_groups ON DELETE SET NULL)
name TEXT NOT NULL
email TEXT NOT NULL UNIQUE
phone TEXT
role TEXT NOT NULL CHECK (role IN ('elderly', 'not elderly'))
preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms'))
avatar TEXT (URL or base64)
is_active BOOLEAN DEFAULT true
date_joined TIMESTAMPTZ DEFAULT NOW()
push_token TEXT (Expo push notification token)
notification_preferences JSONB DEFAULT '{...}'
```

**Purpose:** Extended user profile with notification preferences beyond Supabase Auth
**Key Relationships:** Links to family_groups, used by user_family_roles
**Indexes:**
- `idx_users_family_id` (WHERE family_id IS NOT NULL)
- `idx_users_email`
- `idx_users_push_token` (WHERE push_token IS NOT NULL)
**Constraints:**
- Name cannot be empty
- Email format validation via regex
- Role must be 'elderly' or 'not elderly'
- Language must be 'en' or 'ms'

**Default Notification Preferences:**
```json
{
  "medicationReminders": true,
  "healthAlerts": true,
  "familyUpdates": true,
  "criticalOnly": false,
  "quietHours": {
    "enabled": false,
    "start": "22:00",
    "end": "07:00"
  }
}
```

#### **3. user_family_roles** - Role-Based Access Control
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID NOT NULL (references auth.users)
family_id UUID NOT NULL (references family_groups ON DELETE CASCADE)
role TEXT NOT NULL CHECK (role IN ('admin', 'carer', 'family_viewer'))
user_name TEXT NOT NULL (cached for performance)
user_email TEXT NOT NULL (cached for performance)
assigned_by UUID (references auth.users)
assigned_at TIMESTAMPTZ DEFAULT NOW()
is_active BOOLEAN DEFAULT true
UNIQUE(user_id, family_id)
```

**Purpose:** Granular permissions within family groups with cached user data
**Auto-assignment Rules:**
- Family creator → admin (via auto_assign_admin_trigger)
- Family joiner → family_viewer (via review approval)
**Indexes:**
- `idx_user_family_roles_user` (WHERE is_active = true)
- `idx_user_family_roles_family` (WHERE is_active = true)
- `idx_user_family_roles_role`
**Triggers:**
- `sync_user_family_role_cache_trigger` - Keeps cached user data synchronized

#### **4. elderly_profiles** - Elderly Person Information
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
family_id UUID NOT NULL (references family_groups ON DELETE CASCADE)
name TEXT NOT NULL
age INTEGER NOT NULL CHECK (age > 0 AND age < 150)
relationship TEXT NOT NULL (e.g., 'Nenek', 'Atuk', 'Mama', 'Papa')
care_level TEXT NOT NULL CHECK (care_level IN ('independent', 'dependent', 'bedridden'))
conditions TEXT[] DEFAULT '{}' (array of medical conditions)
emergency_contact TEXT
emergency_contact_phone TEXT
avatar TEXT
weight NUMERIC(5,2) (kg)
height NUMERIC(5,2) (cm)
blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
doctor_name TEXT
clinic_name TEXT
date_created TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Central elderly person profile with comprehensive health context
**Key Relationships:** All health data tables link to this table
**Indexes:**
- `idx_elderly_profiles_family`
- `idx_elderly_profiles_name`
**Constraints:**
- Age must be between 1 and 149 years
- Weight: 0-500 kg (if provided)
- Height: 0-300 cm (if provided)
- Name cannot be empty

#### **5. vital_signs** - Time-Series Health Measurements
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
systolic INTEGER (blood pressure)
diastolic INTEGER (blood pressure)
spo2 INTEGER (oxygen saturation %)
pulse INTEGER (heart rate bpm)
temperature NUMERIC(4,2) (celsius)
weight NUMERIC(5,2) (kg)
blood_glucose NUMERIC(5,2) (mmol/L)
blood_glucose_type TEXT CHECK (blood_glucose_type IN ('fasting', 'random', 'post_meal'))
recorded_by TEXT NOT NULL (user name)
recorded_at TIMESTAMPTZ DEFAULT NOW()
notes TEXT
```

**Purpose:** Time-series health vital measurements with flexible recording
**Health Status Logic (via database functions):**
- Blood Pressure: Critical (≥180/110), Concerning (≥140/90 or <90/60), Normal
- SpO2: Critical (<90%), Concerning (<95%), Normal
- Pulse: Critical (>120 or <50 bpm), Concerning (>100 or <60 bpm), Normal
- Temperature: Critical (>39°C or <35°C), Concerning (38-39°C or 35-36°C), Normal
**Indexes:**
- `idx_vital_signs_elderly_date` (elderly_id, recorded_at DESC) - Time-series optimized
- `idx_vital_signs_recorded_at` (recorded_at DESC)
**Constraints:**
- Systolic: 0-300 mmHg
- Diastolic: 0-200 mmHg
- SpO2: 0-100%
- Pulse: 0-300 bpm
- Temperature: 30-50°C
- Weight: 0-500 kg
- Blood Glucose: 0-50 mmol/L

#### **6. medications** - Medication Records
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
name TEXT NOT NULL
dosage TEXT NOT NULL (e.g., '5mg', '500mg')
frequency TEXT NOT NULL (e.g., 'Daily', 'Twice daily')
instructions TEXT
prescribed_by TEXT (doctor name)
start_date DATE DEFAULT CURRENT_DATE
end_date DATE
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Active and historical medication records
**Indexes:**
- `idx_medications_elderly_active` (elderly_id) WHERE is_active = true
- `idx_medications_elderly_all` (elderly_id, created_at DESC)
**Constraints:**
- Name, dosage, and frequency cannot be empty
- End date must be >= start date (if provided)

#### **7. medication_schedules** - Daily Adherence Tracking
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
medication_id UUID NOT NULL (references medications ON DELETE CASCADE)
date DATE DEFAULT CURRENT_DATE
scheduled_time TIME NOT NULL
taken BOOLEAN DEFAULT false
taken_at TIMESTAMPTZ
taken_by TEXT (user name who administered)
dosage_taken TEXT (actual dosage if different)
skipped BOOLEAN DEFAULT false
skip_reason TEXT
notes TEXT
UNIQUE(elderly_id, medication_id, date, scheduled_time)
```

**Purpose:** Daily medication adherence tracking with who/when details
**Key Feature:** Records who administered medication and when, supports skip tracking
**Indexes:**
- `idx_medication_schedules_date` (date DESC, scheduled_time)
- `idx_medication_schedules_elderly` (elderly_id, date DESC)
- `idx_medication_schedules_medication` (medication_id, date DESC)
**Constraints:**
- Unique combination of elderly_id, medication_id, date, scheduled_time
- Taken fields consistency: if taken=true, must have taken_at and taken_by

#### **8. appointments** - Medical Appointment Scheduling
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
doctor_name TEXT NOT NULL
clinic TEXT NOT NULL
appointment_type TEXT (e.g., 'Follow-up', 'Routine', 'Emergency')
date DATE NOT NULL
time TIME NOT NULL
status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled'))
notes TEXT
follow_up_required BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Medical appointment scheduling and status tracking
**Indexes:**
- `idx_appointments_elderly_date` (elderly_id, date, time)
- `idx_appointments_status` (status, date) WHERE status = 'upcoming'
**Constraints:**
- Doctor name and clinic cannot be empty

#### **9. appointment_outcomes** - Post-Appointment Clinical Records
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
appointment_id UUID NOT NULL (references appointments ON DELETE CASCADE)
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
diagnosis TEXT NOT NULL
doctor_notes TEXT NOT NULL
test_results TEXT
vital_signs_recorded JSONB (vital signs from appointment)
new_medications TEXT
medication_changes TEXT
prescriptions TEXT
recommendations TEXT
follow_up_instructions TEXT
next_appointment_recommended BOOLEAN DEFAULT false
next_appointment_timeframe TEXT
referrals TEXT
outcome_recorded_by TEXT NOT NULL (user name)
outcome_recorded_at TIMESTAMPTZ DEFAULT NOW()
appointment_duration_minutes INTEGER
patient_satisfaction_rating INTEGER CHECK (rating >= 1 AND rating <= 5)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Detailed post-appointment clinical records and follow-up tracking
**Indexes:**
- `idx_appointment_outcomes_elderly` (elderly_id, outcome_recorded_at DESC)
- `idx_appointment_outcomes_appointment`
**Triggers:**
- `update_appointment_outcome_timestamp_trigger` - Auto-updates updated_at

#### **10. care_notes** - Family Communication & Observations
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
elderly_id UUID NOT NULL (references elderly_profiles ON DELETE CASCADE)
author_id UUID NOT NULL (references auth.users)
author_name TEXT NOT NULL
content TEXT NOT NULL
category TEXT NOT NULL CHECK (category IN ('general', 'health', 'medication',
                                            'appointment', 'emergency', 'daily_care', 'behavior'))
is_important BOOLEAN DEFAULT false
date_created TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Family coordination, observations, and care communication
**Categories:** general, health, medication, appointment, emergency, daily_care, behavior
**Indexes:**
- `idx_care_notes_elderly_date` (elderly_id, date_created DESC)
- `idx_care_notes_author` (author_id)
- `idx_care_notes_important` (is_important, date_created DESC) WHERE is_important = true
- `idx_care_notes_category` (category, date_created DESC)
**Constraints:**
- Content cannot be empty

#### **11. family_join_requests** - Join Request Workflow
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
family_id UUID NOT NULL (references family_groups ON DELETE CASCADE)
family_code TEXT NOT NULL
user_id UUID NOT NULL (references auth.users)
user_name TEXT NOT NULL (cached for performance)
user_email TEXT NOT NULL (cached for performance)
request_message TEXT
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
reviewed_by UUID (references auth.users)
reviewed_at TIMESTAMPTZ
review_message TEXT
requested_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
```

**Purpose:** Admin-approved family joining workflow with request expiration
**Workflow:** User submits → Admin reviews → Auto-assign role if approved
**Indexes:**
- `idx_join_requests_family_pending` (family_id, status) WHERE status = 'pending'
- `idx_join_requests_user` (user_id, requested_at DESC)
- `idx_join_requests_status` (status, requested_at DESC)
**Triggers:**
- `sync_family_join_request_cache_trigger` - Keeps cached user data synchronized
**Constraints:**
- Status transition validation: pending requests must not have review data

#### **12. family_invitations** - Admin-Initiated Invitations
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
family_id UUID NOT NULL (references family_groups ON DELETE CASCADE)
inviter_id UUID NOT NULL (references auth.users)
invitee_email TEXT NOT NULL
invitee_name TEXT
role TEXT DEFAULT 'family_viewer' CHECK (role IN ('admin', 'carer', 'family_viewer'))
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
message TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
accepted_at TIMESTAMPTZ
```

**Purpose:** Admin-initiated family invitations (alternative to join request workflow)
**Indexes:**
- `idx_invitations_family` (family_id, status)
- `idx_invitations_email` (invitee_email, status)
**Constraints:**
- Email format validation via regex

#### **13. family_members** - Legacy Family Member Tracking
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
family_id UUID NOT NULL (references family_groups ON DELETE CASCADE)
user_id UUID (references auth.users)
name TEXT NOT NULL
relationship TEXT NOT NULL
phone TEXT
email TEXT
role TEXT DEFAULT 'family_member'
is_active BOOLEAN DEFAULT true
last_active TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Purpose:** Alternative family member tracking (legacy table, may be deprecated)
**Indexes:**
- `idx_family_members_family` (family_id) WHERE is_active = true
- `idx_family_members_user` (user_id)

### 5.3 Key Database Functions

#### Family Code Generation
**`generate_family_code()`** → TEXT
- Generates unique 6-character alphanumeric codes
- Loops until unique code found
- Uses MD5(RANDOM()) for generation

**`generate_family_code_trigger()`** → TRIGGER
- Auto-generates family code on INSERT
- Triggers when family_code is NULL or empty

#### Role Assignment Functions
**`auto_assign_family_role(user_id, family_id, is_elderly, is_creator)`** → TEXT
- Automatically assigns appropriate role based on context
- **Rules:**
  - Creator (elderly or not) → **admin**
  - Joiner (elderly or not) → **family_viewer**
- Caches user name and email for performance
- Returns assigned role text
- **Security:** SECURITY DEFINER (bypasses RLS)

**`get_user_family_role(user_id, family_id)`** → TEXT
- Fetches user's current role in family
- Returns NULL if no role assigned

**`update_user_family_role_secure(target_user_id, family_id, new_role)`** → BOOLEAN
- Admin-only role updates with validation
- Verifies caller is admin before updating
- Updates cached user data
- Returns success status

**`is_family_admin(user_id, family_id)`** → BOOLEAN
- Quick admin verification check
- Returns true if user has admin role

#### Join Request Workflow Functions
**`create_family_join_request(family_code, request_message)`** → JSON
- Creates validated join request
- **Validations:**
  - User authenticated (auth.uid() not null)
  - User not already in a family
  - Valid family code exists
  - No duplicate pending request
- Returns JSON: `{success: true/false, error: "...", request_id: "..."}`
- **Security:** SECURITY DEFINER

**`review_family_join_request(request_id, action, review_message)`** → JSON
- Admin approve/reject join requests
- **Actions:** 'approve' or 'reject'
- **On Approval:**
  - Updates user's family_id
  - Auto-assigns family_viewer role
- Returns JSON result
- **Security:** SECURITY DEFINER

**`validate_family_code_for_join(family_code)`** → JSON
- Public function to validate family code exists
- Returns family name if valid
- Used for UI validation before request submission

**`get_user_join_request_status_detailed()`** → JSON
- Returns comprehensive request status for current user
- Includes family name, request status, review details

**`expire_old_join_requests()`** → INTEGER
- Utility function to cleanup expired requests
- Updates status to 'expired' for requests past expires_at
- Returns count of expired requests

#### Family Member Functions
**`get_family_members_with_roles(family_id)`** → TABLE
- Lists all family members with role information
- Returns: user_id, name, email, role, assigned_at
- **Sorting:** By role priority (admin → carer → family_viewer)

#### Health Status Calculation Functions
**`calculate_blood_pressure_status(systolic, diastolic)`** → TEXT
- Returns: 'critical', 'concerning', or 'normal'
- Critical: systolic ≥180 OR diastolic ≥110
- Concerning: systolic ≥140 OR diastolic ≥90 OR systolic <90 OR diastolic <60

**`calculate_spo2_status(value)`** → TEXT
- Returns: 'critical', 'concerning', or 'normal'
- Critical: value <90%
- Concerning: value <95%

**`calculate_pulse_status(value)`** → TEXT
- Returns: 'critical', 'concerning', or 'normal'
- Critical: value >120 OR value <50 bpm
- Concerning: value >100 OR value <60 bpm

**`calculate_temperature_status(value)`** → TEXT
- Returns: 'critical', 'concerning', or 'normal'
- Critical: value >39°C OR value <35°C
- Concerning: value ≥38°C OR value ≤36°C

**`calculate_blood_glucose_status(value, test_type)`** → TEXT
- Returns: 'critical', 'concerning', or 'normal'
- Logic varies by test_type ('fasting', 'random', 'post_meal')
- Critical: very high or very low readings
- Concerning: elevated readings based on test type

### 5.4 Automated Triggers

#### Auto-Assignment Triggers
**`auto_assign_admin_trigger`** on `family_groups` AFTER INSERT
- Automatically assigns admin role to family creator
- Calls `auto_assign_family_role()` with is_creator=true

**`set_family_code_trigger`** on `family_groups` BEFORE INSERT
- Auto-generates unique 6-character family code
- Only triggers when family_code is NULL or empty

#### Cache Synchronization Triggers
**`sync_user_family_role_cache_trigger`** on `users` AFTER UPDATE
- Updates cached user_name and user_email in user_family_roles
- Ensures cached data stays synchronized with users table

**`sync_family_join_request_cache_trigger`** on `users` AFTER UPDATE
- Updates cached user data in family_join_requests table
- Keeps join request cache in sync

#### Timestamp Triggers
**`update_appointment_outcome_timestamp_trigger`** on `appointment_outcomes` BEFORE UPDATE
- Automatically updates updated_at timestamp on record modification

### 5.5 Row Level Security (RLS) Policies

**Status:** ✅ Enabled on all 13 tables
**Total Policies:** 50+ granular policies
**Principle:** Family-based data isolation with role-based permissions

#### **family_groups** Policies
- ✅ Users can view their own family group
- ✅ Users can view family groups by code (for validation when joining)
- ✅ Users can create family groups (created_by = auth.uid())
- ✅ Family admins can update family groups

#### **users** Policies
- ✅ Users can view own profile
- ✅ Users can view family members' profiles
- ✅ Users can create own profile during registration
- ✅ Users can update own profile

#### **user_family_roles** Policies
- ✅ Users can view roles in their family
- ✅ Only admins can modify roles in their family
- ✅ Auto-assignment via SECURITY DEFINER functions

#### **elderly_profiles** Policies
- ✅ Users can read profiles in their family
- ✅ Only admin/carer can create elderly profiles
- ✅ Only admin/carer can update elderly profiles
- ✅ Only admin can delete elderly profiles

#### **vital_signs** Policies
- ✅ All family members can read vital signs
- ✅ Admin/carer can record vital signs
- ✅ Family viewers have read-only access

#### **medications** Policies
- ✅ All family members can read medications
- ✅ Only admin/carer can add/edit medications
- ✅ Only admin can delete medications

#### **medication_schedules** Policies
- ✅ All family members can read medication schedules
- ✅ Admin/carer can create schedules
- ✅ Admin/carer can mark medications as taken
- ✅ Family viewers can mark as taken (for assistance)

#### **appointments** Policies
- ✅ All family members can read appointments
- ✅ Admin/carer can create/edit appointments
- ✅ Only admin can delete appointments

#### **appointment_outcomes** Policies
- ✅ All family members can read outcomes
- ✅ Admin/carer can create/edit outcomes
- ✅ Only admin can delete outcomes

#### **care_notes** Policies
- ✅ All family members can read care notes
- ✅ Admin/carer can create care notes
- ✅ Authors can edit their own notes
- ✅ Only admin can delete any care note

#### **family_join_requests** Policies
- ✅ Users can view their own requests
- ✅ Admins can view pending requests for their family
- ✅ Admins can update (approve/reject) requests
- ✅ SECURITY DEFINER functions handle request creation

#### **family_invitations** Policies
- ✅ Admins can view invitations for their family
- ✅ Admins can create invitations
- ✅ Invitees can view invitations sent to their email

#### **family_members** Policies
- ✅ Users can view family members in their family
- ✅ Admin/carer can add family members
- ✅ Only admin can modify/delete family members

### 5.6 Performance Optimization

#### Indexes Created (45+)
**Primary & Foreign Key Indexes:** Auto-created on all primary keys and foreign keys

**Time-Series Indexes:**
- `idx_vital_signs_elderly_date` (elderly_id, recorded_at DESC)
- `idx_medication_schedules_date` (date DESC, scheduled_time)
- `idx_appointments_elderly_date` (elderly_id, date, time)
- `idx_care_notes_elderly_date` (elderly_id, date_created DESC)

**Role & Permission Indexes:**
- `idx_user_family_roles_user` (user_id) WHERE is_active = true
- `idx_user_family_roles_family` (family_id) WHERE is_active = true
- `idx_ufr_admin_lookups` - Composite index for admin checks

**Filtered/Partial Indexes:**
- `idx_medications_elderly_active` WHERE is_active = true
- `idx_appointments_status` WHERE status = 'upcoming'
- `idx_care_notes_important` WHERE is_important = true
- `idx_join_requests_family_pending` WHERE status = 'pending'

**Full-Text Search Indexes (pg_trgm):**
- `idx_elderly_name_trgm` - Elderly profile name search
- `idx_medications_name_trgm` - Medication name search
- `idx_care_notes_content_trgm` - Care notes content search

**Covering Indexes:**
- `idx_medications_list_covering` - Includes frequently accessed columns
- `idx_vital_signs_chart_covering` - Optimized for chart queries
- `idx_appointments_list_covering` - List view optimization

#### Query Optimization Tips
1. ✅ Always filter by `family_id` first (RLS enforces this)
2. ✅ Use date ranges for vital signs queries
3. ✅ Leverage covering indexes for list views
4. ✅ Use `LIMIT` for pagination of large result sets
5. ✅ Run `ANALYZE` periodically on high-traffic tables

### 5.7 Data Validation & Constraints

#### Vital Signs Constraints ✅
- Systolic BP: 0-300 mmHg
- Diastolic BP: 0-200 mmHg
- SpO2: 0-100%
- Pulse: 0-300 bpm
- Temperature: 30-50°C
- Weight: 0-500 kg
- Blood Glucose: 0-50 mmol/L

#### User & Profile Constraints ✅
- Age: 1-150 years
- Family code: Exactly 6 characters
- Email format validation (regex pattern)
- Roles: Enum-enforced ('admin', 'carer', 'family_viewer')
- Language: 'en' or 'ms'
- User role: 'elderly' or 'not elderly'

#### Business Logic Constraints ✅
- Family code uniqueness (enforced by unique constraint + trigger)
- Date ranges: start_date ≤ end_date
- Medication schedule uniqueness: (elderly_id, medication_id, date, scheduled_time)
- Taken field consistency: if taken=true, must have taken_at and taken_by
- Status transitions: Validated in join request workflow

### 5.8 Database Migration Files

**Location:** `/Database/`

**Migration Files:**
1. **01_create_core_tables.sql** (~650 lines)
   - Creates all 13 core tables
   - Includes constraints, defaults, and basic indexes
   - Auto-generates 6-character family codes
   - Status: ✅ Complete

2. **02_enable_rls_policies.sql** (~550 lines)
   - Enables Row Level Security on all tables
   - Implements 50+ family-based data isolation policies
   - Role-based permission policies
   - Status: ✅ Complete

3. **03_create_functions_triggers.sql** (~750 lines)
   - 15+ database functions for business logic
   - 4+ automated triggers
   - Auto-role assignment, join workflows, health calculations
   - Status: ✅ Complete

4. **04_create_indexes.sql** (~400 lines)
   - 45+ performance indexes
   - Full-text search indexes (requires pg_trgm)
   - Covering and partial indexes
   - Status: ✅ Complete

5. **05_seed_data.sql** (~350 lines)
   - Sample data for development/testing
   - Demo family with users and health data
   - Status: ⏭️ Optional (DO NOT run in production)

**Documentation Files:**
- **README.md** - Complete migration guide and troubleshooting
- **MIGRATION_SUMMARY.md** - Architecture overview and verification
- **Database_Progress.md** - Migration execution status and test results
- **verify_migrations.sql** - Verification queries
- **test-connection.js** - Node.js connection test script

**Migration Status:** ✅ COMPLETE & VERIFIED (October 2, 2025)

---

## 6. Core Features & Functionality

### 6.1 Authentication & Onboarding

**First-Time User Flow:**
```
1. Splash Screen → 2. Onboarding (5 slides) → 3. Auth Screen (Register) →
4. Verify Email → 5. Create Profile → 6. Boarding (Create/Join Family) →
7. Main App
```

**Returning User Flow:**
```
1. Splash Screen → 2. Main App (if authenticated)
or
1. Splash Screen → 2. Auth Screen (if session expired)
```

**Authentication Methods:**
- Email/Password (Primary, fully functional - MVP only method)

**Email Verification:**
- Required for new registrations
- 6-digit verification code
- Resend functionality available

### 6.2 Family Management

**Create Family Group:**
- Auto-generated 6-character family code
- Creator automatically assigned admin role
- Family name customization
- Generates shareable family code

**Join Existing Family:**
- Enter 6-character family code
- Submit join request with optional message
- Wait for admin approval
- Auto-assigned as family_viewer upon approval

**Family Roles:**

| Role | Can View Health | Can Edit Health | Can Manage Meds | Can Manage Appointments | Can Manage Family | Can Change Roles |
|------|----------------|-----------------|-----------------|------------------------|-------------------|------------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Carer** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Family Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Role Management Screen (Admin Only):**
- View all family members with current roles
- Change member roles (dropdown selection)
- Review pending join requests
- Approve/reject join requests with messages

### 6.3 Health Tracking

**Vital Signs Recording:**
- Blood Pressure (systolic/diastolic)
- SpO2 (Oxygen saturation)
- Pulse (Heart rate)
- Respiratory Rate
- Temperature
- Weight
- Blood Glucose (with test type: fasting/random/post-meal)

**Recording Features:**
- Large, touch-friendly input fields
- Real-time validation
- Health status indicators (normal/concerning/critical)
- Optional notes for context
- Records who entered data and timestamp
- Haptic feedback on data entry

**Vital Sign Status Calculation:**
```typescript
// Blood Pressure
if (systolic >= 180 || diastolic >= 110) → 'critical'
if (systolic >= 140 || diastolic >= 90) → 'concerning'
if (systolic < 90 || diastolic < 60) → 'concerning'
else → 'normal'

// SpO2
if (value < 90) → 'critical'
if (value < 95) → 'concerning'
else → 'normal'

// Pulse
if (value > 120 || value < 50) → 'critical'
if (value > 100 || value < 60) → 'concerning'
else → 'normal'
```

### 6.4 Medication Management

**Add Medication:**
- Medication name (Malaysian common medications)
- Dosage (e.g., "5mg", "500mg")
- Frequency (Daily, Twice daily, etc.)
- Administration time(s)
- Prescribing doctor
- Start/end dates
- Special instructions

**Medication Adherence Tracking:**
- Daily medication schedule view
- Mark as taken with timestamp
- Record who administered medication
- Skip medication with reason
- Weekly adherence compliance view
- Medication history

**Medication List Management:**
- View active medications
- View inactive/past medications
- Edit medication details
- Mark medications as inactive
- Delete medications (admin/carer only)

### 6.5 Appointment Management

**Schedule Appointment:**
- Doctor name
- Clinic/hospital name
- Appointment type (Routine, Follow-up, Specialist, etc.)
- Date and time
- Additional notes
- Follow-up requirement flag

**Appointment Tracking:**
- Upcoming appointments (sorted chronologically)
- Completed appointments with outcomes
- Cancelled appointments
- Appointment reminders (via notifications)

**Complete Appointment:**
- Record appointment outcome
- Mark completed/cancelled
- Schedule follow-up if needed
- Add doctor's notes/recommendations

### 6.6 Care Coordination

**Care Notes:**
- Write observations about elderly person
- Categorize notes (general, health, medication, appointment, emergency)
- Mark important notes
- View chronological note history
- Filter by category
- Author attribution

**Family Activity Feed:**
- Recent vital sign recordings
- Medication taken/skipped
- Appointments scheduled/completed
- New care notes
- Family member actions
- Real-time updates (pull-to-refresh)

### 6.7 Health Insights & Analytics

**Vital Sign Trends:**
- Blood pressure trends (line charts)
- SpO2 trends over time
- Pulse patterns
- Temperature tracking
- Weight monitoring
- Blood glucose patterns (by test type)

**Medication Compliance:**
- Weekly adherence rate
- Missed medication tracking
- Adherence patterns by time of day
- Medication history

**Health Summary:**
- Overall health status
- Critical alerts count
- Recent trends (improving/stable/declining)
- Upcoming appointments countdown

### 6.8 Notifications (Ready for Implementation)

**Database Support:**
- `notification_preferences` JSONB column in users table
- `push_token` storage for Expo push notifications
- Default preferences: all notifications enabled

**Notification Types (Configured):**
- Medication reminders
- Health alerts (critical readings)
- Family updates (new vital signs, notes)
- Appointment reminders
- Join request notifications (for admins)

**Quiet Hours:**
- Configurable start/end time (default 22:00-07:00)
- Critical-only mode during quiet hours
- Per-user customization

**Implementation Status:**
- NotificationContext.tsx created
- notificationService.ts with Expo push notification setup
- NotificationSettingsScreen.tsx for user preferences
- Backend migration 19 adds required database columns
- **Requires:** Expo push notification token registration and server-side scheduling

---

## 7. Development Guidelines

### 7.1 Code Style & Conventions

**TypeScript Standards:**
- Strict mode enabled (`tsconfig.json`)
- Explicit type annotations for function parameters and return values
- Interface definitions in `src/types/index.ts`
- Avoid `any` types; use `unknown` when type is truly unknown

**Naming Conventions:**
```typescript
// Components: PascalCase
export function HomeScreen() {}
export const SafeAreaWrapper = () => {}

// Hooks: camelCase with 'use' prefix
export const useElderlyProfiles = () => {}
export const useModernAlert = () => {}

// Functions: camelCase
const fetchUserProfile = async () => {}
const calculateHealthStatus = (value: number) => {}

// Constants: UPPER_SNAKE_CASE or camelCase (for objects)
const API_TIMEOUT = 5000;
export const colors = { primary: '#10B981' };

// Types/Interfaces: PascalCase
interface ElderlyProfile {}
type FamilyRole = 'admin' | 'carer' | 'family_viewer';
```

**File Organization:**
```typescript
// 1. Imports (React, third-party, local)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

// 2. Types/Interfaces
interface Props {
  navigation: any;
}

// 3. Component/Function definition
export function ScreenName({ navigation }: Props) {
  // 4. State declarations
  const [data, setData] = useState([]);

  // 5. Context/Hooks
  const { user } = useAuth();

  // 6. Effects
  useEffect(() => {}, []);

  // 7. Event handlers
  const handlePress = () => {};

  // 8. Render
  return <View>...</View>;
}

// 9. Styles
const styles = StyleSheet.create({});
```

### 7.2 Component Best Practices

**Screen Components:**
- Use `SafeAreaWrapper` for all screens to handle safe areas consistently
- Implement pull-to-refresh for data-heavy screens
- Show loading states (`HealthLoadingState`) during data fetching
- Handle error states gracefully (`ErrorState` component)
- Use `useFocusEffect` for data refetching on screen focus

**Reusable Components:**
- Keep components small and single-purpose
- Use `React.memo()` for performance optimization
- Accept props via TypeScript interfaces
- Provide default props when appropriate

**Performance Optimization:**
```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// Memoize callbacks
const handlePress = useCallback(() => {
  // handle press
}, [dependencies]);

// Use React.memo for components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <View>{/* render */}</View>;
});
```

### 7.3 State Management Guidelines

**When to Use Context:**
- Global state (auth, permissions, language, notifications)
- State needed by many components across the app
- Configuration that rarely changes

**When to Use Local State:**
- UI state (modals, dropdowns, form inputs)
- Component-specific data
- Temporary state that doesn't need persistence

**When to Use Custom Hooks:**
- Data fetching and caching
- Complex business logic
- Reusable stateful logic

**Database Operations:**
- Always use custom hooks from `useDatabase.ts`
- Implement optimistic UI updates when appropriate
- Handle loading and error states in the hook
- Provide refetch functions for manual refresh

### 7.4 Error Handling

**Database Errors:**
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*');

  if (error) {
    console.error('Database error:', error);
    showError('Failed to load data');
    return { data: null, error };
  }

  return { data, error: null };
} catch (err) {
  console.error('Unexpected error:', err);
  showError('An unexpected error occurred');
  return { data: null, error: err };
}
```

**User-Facing Errors:**
- Use `ModernAlert` component for error dialogs
- Provide actionable error messages
- Offer retry functionality when appropriate
- Log errors to console for debugging

### 7.5 Testing Strategy

**Current Testing Status:**
- No automated tests currently implemented
- Manual testing on physical devices (Android & iOS)

**Recommended Testing Approach:**
```typescript
// Unit tests for utility functions
describe('calculateHealthStatus', () => {
  it('should return critical for high BP', () => {
    expect(calculateHealthStatus(185, 115)).toBe('critical');
  });
});

// Integration tests for database hooks
describe('useElderlyProfiles', () => {
  it('should fetch elderly profiles', async () => {
    const { result } = renderHook(() => useElderlyProfiles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.elderlyProfiles).toBeDefined();
  });
});

// E2E tests for critical user flows
describe('User Registration Flow', () => {
  it('should allow user to register and create profile', async () => {
    // Test full registration flow
  });
});
```

### 7.6 Git Workflow

**Commit Message Format:**
```
<emoji> <type>: <description>

Examples:
✨ feat: Add medication reminder notifications
🐛 fix: Resolve authentication token refresh issue
♻️ refactor: Improve database query performance
📝 docs: Update API documentation
🎨 style: Update color palette for better accessibility
```

**Branch Strategy:**
- `main` - Production-ready code
- Feature branches for new development
- Commit frequently with descriptive messages

**Recent Commits (Reference):**
```
8e12a52 🚀 Major Role Management & Join Request System Enhancement
12d771f 🏗️ Complete Family Role Management System & Appointment Enhancement
123beca ✨ Add Family Join Request System & Implementation Phases
9a52439 🚀 Major System Enhancement - Complete Database Integration
94e8b59 🎉 Initial Release - Nely Healthcare Management Mobile App
```

---

## 8. Configuration & Environment

### 8.1 Environment Variables

**Required Environment Variables:**
```bash
# Supabase Configuration (Required)
# Get these from your Supabase project dashboard
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
EXPO_PUBLIC_ENV=development|production
NODE_ENV=development|production

# Legal Links (Production - Optional)
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://nely-healthcare.com/privacy-policy
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://nely-healthcare.com/terms-of-service
```

**Note:** Google OAuth has been removed from the MVP. Email/password authentication only.

**Environment Variable Loading:**
- Development: `.env` file (not committed to Git)
- Production: `eas.json` production profile env section
- Access in code: `process.env.EXPO_PUBLIC_*`

**Security Notes:**
- Supabase URL and anon key are safe to expose in client-side code (public keys)
- Security is enforced via Row Level Security (RLS) policies on the database
- No sensitive secrets should be stored in client environment variables
- For production: Use EAS Secrets to manage environment variables securely

### 8.2 App Configuration

**app.json Configuration:**
```json
{
  "expo": {
    "name": "Nely",
    "slug": "nely-mvp",
    "version": "1.0.0",
    "scheme": "com.nely.app",
    "newArchEnabled": true,
    "android": {
      "package": "com.nely.app",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.nely.app",
      "buildNumber": "1"
    }
  }
}
```

**Key Configuration Points:**
- **New Architecture Enabled:** Uses React Native's new architecture for better performance
- **Deep Linking:** `com.nely.app` URL scheme for OAuth redirects
- **Platform-Specific:** Separate iOS and Android bundle identifiers

### 8.3 Build Configuration

**eas.json - EAS Build Profiles:**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "env": { /* all environment variables */ },
      "android": { "buildType": "apk" },
      "ios": { "autoIncrement": "buildNumber" }
    }
  }
}
```

**Build Profiles:**
- **development:** For development builds with debugger
- **preview:** For internal testing (APK format)
- **production:** For production releases with all env vars

### 8.4 TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "esnext",
    "module": "esnext",
    "jsx": "react-native",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

**Key Settings:**
- Strict mode enabled for type safety
- React Native JSX transform
- ES module interop for compatibility

### 8.5 Babel Configuration

**babel.config.js:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Production: Remove console.log statements
      process.env.NODE_ENV === 'production'
        ? 'transform-remove-console'
        : null
    ].filter(Boolean)
  };
};
```

**Features:**
- Expo preset for React Native compatibility
- Console statement removal in production builds

---

## 9. Build & Deployment

### 9.1 Development Workflow

**Start Development Server:**
```bash
# Start Expo development server
npm start
# or
npx expo start

# Platform-specific
npm run android  # Launch Android emulator
npm run ios      # Launch iOS simulator
npm run web      # Launch web browser (limited functionality)
```

**Development Features:**
- Hot reload for instant code changes
- React DevTools integration
- Network debugging via Expo DevTools
- Console logging in terminal

### 9.2 Build Process

**Production APK Build:**
```bash
# Build Android APK for production
npx eas build --platform android --profile production

# Build iOS app for App Store
npx eas build --platform ios --profile production

# Build for both platforms
npx eas build --platform all --profile production
```

**Build Process Flow:**
1. Code uploaded to EAS Build servers (11 MB compressed)
2. Environment variables loaded from `eas.json`
3. Dependencies installed via npm
4. TypeScript compiled to JavaScript
5. Assets optimized and bundled
6. Platform-specific builds created
7. APK/IPA downloadable from Expo dashboard

**Build Output:**
- **Android:** APK file (~50-60 MB)
- **iOS:** IPA file (~60-70 MB)
- **Build ID:** Unique identifier for tracking (e.g., `1215ae5a-d938-4d83-89e5-f9686cacb7a7`)
- **Download:** Available via Expo dashboard or EAS CLI

### 9.3 Build Validation

**Pre-Build Checks:**
```bash
# Validate Expo configuration
npx expo-doctor

# Expected output: 17/17 checks passed
✓ Check Expo config for common issues
✓ Check package.json for common issues
✓ Check for legacy global expo-cli
✓ Check dependencies for packages that should not be installed directly
✓ Check Expo config (app.json/ app.config.js) schema
✓ Check for common TypeScript issues
✓ Check native tooling versions
...
```

**Build Quality Metrics:**
- Zero configuration errors
- Zero dependency issues
- Zero schema validation failures
- All environment variables loaded successfully

### 9.4 Deployment Strategy

**Current Deployment Status:**
- ✅ Production APK built successfully
- ✅ Internal testing ready
- ⏳ Google Play Store submission (pending)
- ⏳ Apple App Store submission (pending)

**Internal Testing Distribution:**
1. Download APK from EAS Build dashboard
2. Install on Android devices via APK file
3. Test critical user flows
4. Gather feedback from beta testers

**Google Play Store Deployment:**
```bash
# Submit to Play Store (when ready)
npx eas submit --platform android --profile production

# Requires:
# - google-service-account.json (service account key)
# - App listing prepared in Google Play Console
# - Privacy policy URL active
# - Terms of service URL active
```

**App Store (iOS) Deployment:**
```bash
# Submit to App Store (when ready)
npx eas submit --platform ios --profile production

# Requires:
# - Apple Developer account ($99/year)
# - App Store Connect app listing
# - Screenshots and app metadata
# - Privacy policy and terms
```

### 9.5 Over-the-Air (OTA) Updates

**Expo Updates Configuration:**
- **Automatic updates:** Enabled for JavaScript/asset changes
- **Update strategy:** Check on app launch
- **Rollback capability:** Revert to previous update if issues detected

**When OTA Updates Apply:**
- ✅ JavaScript code changes
- ✅ Asset updates (images, fonts)
- ✅ Configuration changes (colors, text)
- ❌ Native module changes (requires new build)
- ❌ Expo SDK upgrades (requires new build)

**Publishing OTA Update:**
```bash
# Publish update to production
npx eas update --branch production --message "Fix medication reminder bug"

# Publish to preview channel
npx eas update --branch preview --message "Test new feature"
```

### 9.6 Version Management

**Version Numbering:**
- **App Version:** 1.0.0 (SemVer format)
- **Android versionCode:** 1 (integer, auto-increments)
- **iOS buildNumber:** 1 (string, auto-increments)

**Version Increment Strategy:**
```
1.0.0 → 1.0.1 (Bug fixes)
1.0.1 → 1.1.0 (New features, backward compatible)
1.1.0 → 2.0.0 (Breaking changes, major redesign)
```

---

## 10. Dependencies & Integrations

### 10.1 Core Dependencies

**React Native & Expo:**
```json
{
  "expo": "54.0.10",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "@expo/cli": "^54.0.8",
  "typescript": "^5.9.2"
}
```

**Navigation:**
```json
{
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/bottom-tabs": "^7.4.7",
  "@react-navigation/stack": "^7.4.8",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

**UI & Visualization:**
```json
{
  "expo-linear-gradient": "^15.0.7",
  "@expo/vector-icons": "^15.0.2",
  "react-native-svg": "15.12.1",
  "react-native-chart-kit": "^6.12.0",
  "expo-image": "~3.0.8"
}
```

**Backend & Authentication:**
```json
{
  "@supabase/supabase-js": "^2.57.4",
  "expo-auth-session": "~7.0.8",
  "expo-web-browser": "~15.0.7",
  "expo-crypto": "~15.0.7",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

**Platform Features:**
```json
{
  "expo-notifications": "~0.32.11",
  "expo-device": "~8.0.8",
  "expo-haptics": "^15.0.7",
  "@react-native-community/datetimepicker": "8.4.4",
  "expo-constants": "~18.0.9"
}
```

### 10.2 Supabase Integration

**Client Configuration:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,           // Persist sessions
      autoRefreshToken: true,           // Auto-refresh JWT
      persistSession: true,             // Remember login
      detectSessionInUrl: false,        // Disable for mobile
    },
  }
);
```

**Features Used:**
- **Supabase Auth:** User registration, login, session management
- **Supabase Database:** PostgreSQL with real-time subscriptions
- **Row Level Security:** Multi-tenant data isolation
- **Database Functions:** Server-side business logic
- **Edge Functions:** (Future) Server-side API endpoints

**Connection Management:**
- Automatic connection pooling
- Automatic JWT token refresh (1 hour expiry)
- Persistent sessions via AsyncStorage
- WebSocket for real-time subscriptions

### 10.3 Google OAuth Integration

**Status:** NOT IMPLEMENTED - Removed from MVP scope

**Rationale:**
- MVP focuses on email/password authentication only
- Google OAuth adds complexity without immediate user benefit
- Can be added in post-MVP versions if user feedback demands it

**Previous Implementation Notes (for future reference):**
- OAuth 2.0 integration would require Supabase backend configuration
- Would need expo-auth-session for OAuth flow
- Redirect URI: `com.nely.app`

**Required for Full OAuth:**
1. Enable Google provider in Supabase dashboard
2. Add authorized redirect URIs in Google Cloud Console
3. Test OAuth flow end-to-end

### 10.4 Push Notifications (Expo)

**Service:** Expo Push Notification Service

**Implementation Files:**
- `src/services/notificationService.ts` - Notification sending logic
- `src/context/NotificationContext.tsx` - Notification state management
- `src/screens/NotificationSettingsScreen.tsx` - User preferences

**Database Support:**
```sql
-- users table columns
push_token TEXT -- Expo push token
notification_preferences JSONB -- User preferences
```

**Notification Types Configured:**
```json
{
  "medicationReminders": true,
  "healthAlerts": true,
  "familyUpdates": true,
  "criticalOnly": false,
  "quietHours": {
    "enabled": false,
    "start": "22:00",
    "end": "07:00"
  }
}
```

**Implementation Status:**
- ✅ Database schema supports push tokens
- ✅ NotificationContext provider created
- ✅ Notification settings screen implemented
- ⏳ Token registration flow (requires completion)
- ⏳ Server-side notification scheduling (requires implementation)

**Next Steps for Notifications:**
1. Register device for push notifications on app launch
2. Store Expo push token in users table
3. Implement server-side notification triggers (medication reminders, health alerts)
4. Test notification delivery on physical devices

### 10.5 Third-Party Services

**Currently Integrated:**
- **Supabase:** Backend, database, email/password authentication (fully integrated)
- **Expo Push Notifications:** Push notification delivery (partially implemented)

**Not Currently Integrated (Future):**
- Analytics (Firebase Analytics, Mixpanel)
- Crash reporting (Sentry, Bugsnag)
- Performance monitoring (Firebase Performance)
- In-app purchases (RevenueCat)
- SMS notifications (Twilio)
- Email services (SendGrid, AWS SES)

### 10.6 Dependency Management

**Package Manager:** npm (package-lock.json committed)

**Update Strategy:**
```bash
# Update Expo SDK and dependencies
npx expo install --fix

# Check for outdated packages
npm outdated

# Update specific package
npx expo install package-name@latest
```

**Compatibility:**
- Always use `npx expo install` for Expo-managed packages
- Ensures compatibility with current Expo SDK version
- Automatically resolves peer dependency conflicts

**Security Audits:**
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

---

## 11. Known Issues & Considerations

### 11.1 Current Limitations

**Authentication:**
- ✅ Email/Password authentication fully functional (MVP scope)
- ⚠️ Email verification required for all new registrations (no magic link fallback)
- ⚠️ Password reset flow not yet implemented (planned for post-MVP)

**Notifications:**
- ⏳ Push notification infrastructure prepared but not fully functional
- ⏳ Medication reminders require server-side scheduling implementation
- ⏳ Health alert notifications need trigger functions

**Data Synchronization:**
- ⚠️ Real-time subscriptions not implemented (using pull-to-refresh)
- ⚠️ Offline mode not supported (requires active internet connection)
- ⚠️ No data caching for offline viewing

**Multi-Elderly Support:**
- ❌ Currently limited to single elderly profile per family (MVP scope)
- 🔮 Multi-elderly support planned for Phase 2

**Language Support:**
- ✅ English fully supported
- ✅ Bahasa Malaysia fully supported
- ❌ Mandarin, Tamil not yet implemented (Phase 2)

### 11.2 Performance Considerations

**Database Query Optimization:**
- ✅ Indexes created on frequently queried columns
- ✅ Composite indexes for complex queries (e.g., `idx_vital_signs_elderly_date`)
- ⚠️ Large vital sign history may need pagination (currently loading all records)
- ⚠️ Medication schedules grow indefinitely (consider archiving old schedules)

**Mobile App Performance:**
- ✅ React.memo() used for expensive components
- ✅ useMemo() and useCallback() for optimization
- ✅ Image optimization via expo-image
- ⚠️ Chart rendering can be slow with large datasets (consider data sampling)
- ⚠️ Swipeable tabs may cause jank on older devices

**Network Performance:**
- ⚠️ No request caching (every screen mount fetches data)
- ⚠️ No batch requests (multiple separate database queries)
- ⚠️ Large payloads for elderly profiles with extensive history

**Optimization Opportunities:**
```typescript
// Consider implementing:
// 1. React Query for data caching
// 2. Pagination for vital signs history
// 3. Lazy loading for tab content
// 4. Virtual lists for long medication/appointment lists
// 5. Image lazy loading and caching
```

### 11.3 Security Considerations

**Data Security:**
- ✅ Row Level Security (RLS) enforced on all tables
- ✅ Family-based data isolation via family_id
- ✅ JWT authentication with automatic refresh
- ⚠️ No data encryption at rest (relies on Supabase default encryption)
- ⚠️ No end-to-end encryption for health data

**Access Control:**
- ✅ Role-based permissions implemented
- ✅ Admin-only access to role management
- ⚠️ No audit logging for sensitive actions (role changes, data deletion)
- ⚠️ No IP-based access restrictions

**API Security:**
- ✅ Supabase anon key safe for client exposure (RLS provides security)
- ✅ No hardcoded secrets in client code
- ⚠️ No rate limiting on database functions (could be abused)
- ⚠️ No input sanitization beyond database constraints

**Privacy Compliance:**
- ⏳ GDPR compliance pending (data export, deletion)
- ⏳ Malaysian PDPA compliance review needed
- ⏳ HIPAA-level security not yet certified
- ⏳ Privacy policy and terms of service URLs configured but content pending

### 11.4 Technical Debt

**Code Quality:**
- ⚠️ No automated tests (unit, integration, E2E)
- ⚠️ Inconsistent error handling patterns
- ⚠️ Some components exceed 300 lines (should be split)
- ⚠️ Duplicate code in database hooks (could be abstracted)

**Architecture:**
- ⚠️ Navigation types use `any` instead of proper type inference
- ⚠️ Some inline styles instead of StyleSheet (performance impact)
- ⚠️ Context providers could be modularized better
- ⚠️ Lack of separation between business logic and UI

**Documentation:**
- ⚠️ No JSDoc comments on complex functions
- ⚠️ No API documentation for database functions
- ⚠️ Limited inline code comments
- ✅ This comprehensive project context document

**Refactoring Priorities:**
```
1. Add TypeScript strict types for navigation
2. Extract business logic from screen components
3. Create abstraction layer for database operations
4. Add comprehensive error handling
5. Implement automated testing framework
```

### 11.5 Browser/Platform Compatibility

**Android:**
- ✅ Tested on Android 10-14
- ✅ Works on devices with API 21+ (Android 5.0+)
- ⚠️ Older devices may experience performance issues with animations
- ⚠️ Some manufacturers' custom Android builds may have gesture handler issues

**iOS:**
- ✅ iOS 13.4+ supported
- ✅ Designed for iPhone 6s and newer
- ⚠️ Not optimized for iPad (portrait orientation only)
- ⚠️ Some haptic feedback features iOS-exclusive

**Web:**
- ⚠️ Limited web support (Expo web mode works but not optimized)
- ⚠️ Some React Native libraries don't have web equivalents
- ❌ Not intended for production web deployment (mobile-first)

### 11.6 Scalability Considerations

**User Scalability:**
- ✅ Database schema supports thousands of families
- ✅ RLS policies ensure query performance per family
- ⚠️ No sharding strategy for very large scale
- ⚠️ Supabase free tier limitations (500MB database, 50GB bandwidth/month)

**Data Growth:**
- ⚠️ Vital signs accumulate indefinitely (no archiving strategy)
- ⚠️ Medication schedules grow daily (consider cleanup of old schedules)
- ⚠️ Care notes unlimited (may need pagination at scale)

**Concurrent Users:**
- ✅ Supabase connection pooling handles concurrency
- ⚠️ No load testing performed
- ⚠️ Real-time subscriptions not implemented (reduces connection load)

---

## 12. Quick Reference

### 12.1 Common Commands

**Development:**
```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios

# Clear cache and restart
npx expo start -c

# Check Expo configuration
npx expo-doctor

# Update Expo dependencies
npx expo install --fix

# TypeScript type checking
npx tsc --noEmit
```

**Building:**
```bash
# Build production APK (Android)
npx eas build --platform android --profile production

# Build for iOS
npx eas build --platform ios --profile production

# Build both platforms
npx eas build --platform all --profile production

# Check build status
npx eas build:list
```

**Database Management:**
```bash
# Connect to Supabase via psql
psql postgresql://[connection-string]

# Run migration
psql -f Database/19_add_notification_preferences.sql

# Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

# View database functions
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

**Debugging:**
```bash
# View logs
npx expo start

# Clear React Native cache
watchman watch-del-all
rm -rf node_modules
npm install

# Reset Expo cache
rm -rf .expo

# Clear AsyncStorage (iOS simulator)
xcrun simctl get_app_container booted host.exp.Exponent data
# Then delete Application Support directory
```

### 12.2 Important File Locations

**Entry Points:**
- `index.ts` - Expo entry point
- `App.tsx` - Root component with providers and routing

**Configuration:**
- `app.json` - Expo app configuration
- `eas.json` - Build configuration
- `babel.config.js` - Babel transpiler config
- `tsconfig.json` - TypeScript configuration

**Core Contexts:**
- `src/context/AuthContext.tsx` - Authentication state
- `src/context/PermissionContext.tsx` - Role-based permissions
- `src/context/LanguageContext.tsx` - Internationalization
- `src/context/NotificationContext.tsx` - Push notifications

**Database:**
- `src/lib/supabase.ts` - Supabase client configuration
- `src/hooks/useDatabase.ts` - All database operations
- `Database/01_create_tables.sql` - Initial schema

**Navigation:**
- `src/navigation/BottomTabNavigator.tsx` - Main tab bar
- `src/navigation/*StackNavigator.tsx` - Stack navigators per tab

**Key Screens:**
- `src/screens/HomeScreen.tsx` - Daily health dashboard
- `src/screens/FamilyScreen.tsx` - Elderly profile and health data
- `src/screens/RoleManagementScreen.tsx` - Family role administration

### 12.3 Common Modification Points

**Add New Screen:**
1. Create screen file in `src/screens/NewScreen.tsx`
2. Add to appropriate stack navigator (`src/navigation/*StackNavigator.tsx`)
3. Update navigation types if needed
4. Add permission checks if required

**Add New Database Table:**
1. Create migration SQL in `Database/XX_migration_name.sql`
2. Run migration in Supabase SQL editor
3. Add RLS policies for security
4. Update `src/types/index.ts` with new interface
5. Create database hook in `src/hooks/useDatabase.ts`

**Add New Permission:**
1. Update ROLE_PERMISSIONS in `src/hooks/useDatabase.ts`
2. Add action mapping in `PermissionContext.tsx`
3. Use `canPerformAction('action_name')` in components
4. Test with different roles

**Change Color Scheme:**
1. Update `src/constants/colors.ts`
2. Colors automatically applied throughout app
3. Test in light and dark themes (if applicable)

**Add Translation:**
1. Update `src/constants/languages.ts`
2. Add English and Bahasa Malaysia text
3. Access via `texts.category.key` from `useLanguage()`

### 12.4 Troubleshooting Guide

**App Won't Start:**
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

**Database Connection Fails:**
1. Check environment variables in `.env`
2. Verify Supabase URL and anon key
3. Check network connection
4. Verify RLS policies not blocking access

**Build Fails:**
1. Run `npx expo-doctor` to check configuration
2. Verify all environment variables in `eas.json`
3. Check for invalid `app.json` properties
4. Review build logs in Expo dashboard

**Authentication Issues:**
1. Check Supabase Auth settings in dashboard
2. Verify email confirmation template enabled
3. Check user exists in Supabase Auth dashboard
4. Clear AsyncStorage: App Settings → Clear Data

**Performance Issues:**
1. Check for unnecessary re-renders (React DevTools)
2. Verify useMemo/useCallback usage
3. Profile with React Native Performance Monitor
4. Check database query performance (Supabase dashboard)

### 12.5 Useful Database Queries

**Check User Roles:**
```sql
SELECT u.name, u.email, ufr.role
FROM users u
JOIN user_family_roles ufr ON u.id = ufr.user_id
WHERE u.family_id = 'family-uuid';
```

**View Family Members:**
```sql
SELECT * FROM get_family_members_with_roles('family-uuid');
```

**Check Pending Join Requests:**
```sql
SELECT * FROM get_pending_join_requests('family-uuid');
```

**View Recent Vital Signs:**
```sql
SELECT * FROM vital_signs
WHERE elderly_id = 'elderly-uuid'
ORDER BY recorded_at DESC
LIMIT 10;
```

**Medication Adherence Rate:**
```sql
SELECT
  COUNT(*) FILTER (WHERE taken = true) * 100.0 / COUNT(*) as adherence_rate
FROM medication_schedules
WHERE elderly_id = 'elderly-uuid'
  AND date >= CURRENT_DATE - INTERVAL '7 days';
```

### 12.6 External Resources

**Documentation:**
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)

**Supabase Dashboard:**
- URL: https://supabase.com/dashboard/project/ltwxxljhanwzkjeyzkcp
- Database: Table editor, SQL editor
- Authentication: User management
- API: Auto-generated API documentation

**Expo Dashboard:**
- URL: https://expo.dev/accounts/borneobyte0/projects/nely-mvp
- Builds: EAS Build history
- Updates: OTA update management
- Credentials: App signing certificates

**Design References:**
- Figma: (If design files exist)
- Color Palette: `References/Color_Palettes.md`
- UI/UX Guidelines: `References/UIUX.md`

---

## Appendix A: Database Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
│   (id: UUID)    │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│     users       │
│─────────────────│
│ id: UUID (PK)   │
│ family_id: UUID │──────┐
│ name: TEXT      │      │
│ email: TEXT     │      │
│ role: TEXT      │      │
└─────────────────┘      │
         │               │
         │ N:1           │ N:1
         ▼               ▼
┌──────────────────┐  ┌──────────────────┐
│ family_groups    │  │ elderly_profiles │
│──────────────────│  │──────────────────│
│ id: UUID (PK)    │◄─┤ id: UUID (PK)    │
│ family_code: TEXT│  │ family_id: UUID  │
│ family_name: TEXT│  │ name: TEXT       │
└──────────────────┘  │ age: INTEGER     │
         │            │ care_level: TEXT │
         │            └────────┬─────────┘
         │                     │
         │ 1:N                 │ 1:N
         ▼                     ├─────────────┬──────────────┬──────────────┐
┌──────────────────┐           ▼             ▼              ▼              ▼
│user_family_roles │    ┌─────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
│──────────────────│    │vital_signs  │ │medications│ │appointments  │ │care_notes│
│ id: UUID (PK)    │    │─────────────│ │──────────│ │──────────────│ │──────────│
│ user_id: UUID    │    │ elderly_id  │ │elderly_id│ │ elderly_id   │ │elderly_id│
│ family_id: UUID  │    │ systolic    │ │ name     │ │ doctor_name  │ │ author_id│
│ role: TEXT       │    │ diastolic   │ │ dosage   │ │ clinic       │ │ content  │
└──────────────────┘    │ spo2        │ │ frequency│ │ date         │ │ category │
         │              │ pulse       │ └─────┬────┘ │ time         │ └──────────┘
         │              │ temperature │       │      │ status       │
         │              └─────────────┘       │      └──────────────┘
         │                                    │ 1:N
         │ 1:N                                ▼
         ▼                           ┌───────────────────┐
┌───────────────────┐                │medication_schedules│
│family_join_requests│               │────────────────────│
│────────────────────│               │ medication_id: UUID│
│ user_id: UUID      │               │ scheduled_time     │
│ family_id: UUID    │               │ taken: BOOLEAN     │
│ status: TEXT       │               │ taken_by: TEXT     │
│ reviewed_by: UUID  │               │ date: DATE         │
└────────────────────┘               └────────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
1:1 = One-to-one relationship
1:N = One-to-many relationship
N:1 = Many-to-one relationship
```

---

## Appendix B: User Journey Flows

### B.1 New User Registration & Family Creation

```
START → Splash Screen (2s) → Onboarding (5 slides)
  ↓
Auth Screen (Sign Up mode)
  ↓ (Enter email & password)
Email Verification Screen
  ↓ (Enter 6-digit code from email)
Create Profile Screen
  ↓ (Enter name, phone, select elderly/not elderly)
Boarding Screen
  ↓ (Choose "Create Family Group")
Create Family Group Screen
  ↓ (Enter family name)
Family Created → Receive 6-digit family code
  ↓
Auto-assigned as ADMIN
  ↓
Home Screen (Main App) → END
```

### B.2 Join Existing Family Flow

```
START → ... (same up to Boarding Screen)
  ↓
Boarding Screen
  ↓ (Choose "Join Existing Family")
Join Family Request Screen
  ↓ (Enter 6-digit family code + optional message)
Request Submitted
  ↓
Waiting Approval Screen
  ↓ (Show pending status, allow cancel/sign out)
[Wait for admin approval]
  ↓ (Approved by admin)
Auto-assigned as FAMILY_VIEWER
  ↓
Home Screen (Main App) → END
```

### B.3 Record Vital Signs Flow

```
Home Screen → "Record Vitals" button
  ↓
Record Vital Reading Screen
  ↓ (Select vital sign types to record)
Enter Values
  ├─ Blood Pressure (systolic/diastolic)
  ├─ SpO2 (oxygen saturation)
  ├─ Pulse (heart rate)
  ├─ Temperature
  ├─ Weight
  └─ Blood Glucose (with test type)
  ↓
Add Optional Notes
  ↓
Submit → Permission Check (must be admin/carer)
  ↓
Save to Database
  ↓
Calculate Health Status (normal/concerning/critical)
  ↓
Show Success Animation + Haptic Feedback
  ↓
Return to Home Screen (updated data) → END
```

### B.4 Admin Role Management Flow

```
Profile Screen → "Role Management" (admin only)
  ↓
Role Management Screen
  ├─ Section 1: Family Members List
  │   ↓ (Tap member)
  │   Change Role Modal
  │   ↓ (Select admin/carer/family_viewer)
  │   Confirm → Database Update → Refresh List
  │
  └─ Section 2: Pending Join Requests
      ↓ (Tap request)
      Review Request Details
      ├─ Approve
      │   ↓ (Optional message)
      │   Add user to family
      │   Auto-assign family_viewer role
      │   ↓
      │   Success → Refresh List
      │
      └─ Reject
          ↓ (Optional message)
          Update request status to rejected
          ↓
          Success → Refresh List → END
```

---

## Appendix C: Permission Matrix

| Action | Admin | Carer | Family Viewer | Not in Family |
|--------|-------|-------|---------------|---------------|
| **View Health Data** | ✅ | ✅ | ✅ | ❌ |
| **Record Vital Signs** | ✅ | ✅ | ❌ | ❌ |
| **Add Medications** | ✅ | ✅ | ❌ | ❌ |
| **Edit Medications** | ✅ | ✅ | ❌ | ❌ |
| **Delete Medications** | ✅ | ❌ | ❌ | ❌ |
| **Mark Medication Taken** | ✅ | ✅ | ✅ | ❌ |
| **Add Appointments** | ✅ | ✅ | ❌ | ❌ |
| **Edit Appointments** | ✅ | ✅ | ❌ | ❌ |
| **Complete Appointments** | ✅ | ✅ | ❌ | ❌ |
| **Delete Appointments** | ✅ | ❌ | ❌ | ❌ |
| **Add Care Notes** | ✅ | ✅ | ❌ | ❌ |
| **View Care Notes** | ✅ | ✅ | ✅ | ❌ |
| **Delete Care Notes** | ✅ | ❌ | ❌ | ❌ |
| **Edit Elderly Profile** | ✅ | ✅ | ❌ | ❌ |
| **View Family Members** | ✅ | ✅ | ✅ | ❌ |
| **Invite Family Members** | ✅ | ✅ | ❌ | ❌ |
| **Change User Roles** | ✅ | ❌ | ❌ | ❌ |
| **Review Join Requests** | ✅ | ❌ | ❌ | ❌ |
| **View Insights/Trends** | ✅ | ✅ | ✅ | ❌ |

---

## Appendix D: Environment Setup Checklist

### For New Developers

**1. Prerequisites:**
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Android Studio (for Android development)
- [ ] Xcode (for iOS development, macOS only)
- [ ] Expo CLI: `npm install -g @expo/cli`

**2. Project Setup:**
- [ ] Clone repository: `git clone [repo-url]`
- [ ] Install dependencies: `npm install`
- [ ] Create `.env` file (copy from `.env.example` if available)
- [ ] Add Supabase credentials to `.env`
- [ ] Start development server: `npm start`

**3. Supabase Setup:**
- [ ] Create Supabase account
- [ ] Create new project (or get access to existing)
- [ ] Run all migrations in order (Database/01-19_*.sql)
- [ ] Configure RLS policies
- [ ] Enable email authentication
- [ ] Copy Supabase URL and anon key to `.env`

**4. Expo Account:**
- [ ] Create Expo account at expo.dev
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Configure project: `eas build:configure`

**5. Testing:**
- [ ] Start Expo: `npx expo start`
- [ ] Test on Android emulator or device
- [ ] Test on iOS simulator (macOS only)
- [ ] Verify database connection
- [ ] Test user registration and login

**6. Optional:**
- [ ] Install React DevTools
- [ ] Install React Native Debugger
- [ ] Configure VS Code extensions (ESLint, Prettier, TypeScript)

---

## Conclusion

This comprehensive project context document provides all the information needed for a new Claude Code session to immediately understand and work with the Nely healthcare management mobile application. The document covers:

- ✅ Complete project overview and business context
- ✅ Full technology stack and dependencies
- ✅ Detailed architecture and design patterns
- ✅ Complete directory structure and file organization
- ✅ Comprehensive database schema and data models
- ✅ All core features and functionality
- ✅ Development guidelines and best practices
- ✅ Configuration and environment setup
- ✅ Build and deployment procedures
- ✅ Integration details and external services
- ✅ Known issues and technical considerations
- ✅ Quick reference guides and troubleshooting

**Project Status:** Production-ready MVP, actively developed, ready for beta testing and market launch.

**Next Development Priorities:**
1. Complete push notification implementation
2. Implement real-time data synchronization
3. Add automated testing framework
4. Prepare for Google Play Store submission (Android MVP only)
5. Post-MVP: Consider Google OAuth if user feedback demands it

---

**Document Version:** 1.0.0
**Last Updated:** October 2, 2025
**Maintained By:** Development Team
**For:** Claude Code rapid onboarding and context establishment
