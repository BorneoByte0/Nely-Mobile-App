# Nely MVP - Database Migration Guide

## Overview

This directory contains comprehensive SQL migration files for the Nely healthcare management application. These migrations create a complete, production-ready PostgreSQL database schema optimized for Supabase.

## Database Architecture

- **Family-based multi-tenancy**: Data isolation by `family_id`
- **Role-based access control**: Admin, Carer, Family Viewer roles
- **Row Level Security (RLS)**: Enforced data access policies
- **Time-series optimized**: Efficient vital signs and medication tracking
- **Audit-ready**: Complete tracking of who/when for all operations

## Migration Files

### Core Migrations (Required)

1. **01_create_core_tables.sql**
   - Creates all 13 core tables
   - Includes constraints, defaults, and basic indexes
   - Auto-generates 6-character family codes
   - Tables: family_groups, users, user_family_roles, elderly_profiles, vital_signs, medications, medication_schedules, appointments, appointment_outcomes, care_notes, family_join_requests, family_invitations, family_members

2. **02_enable_rls_policies.sql**
   - Enables Row Level Security on all tables
   - Implements family-based data isolation
   - Role-based permission policies
   - Prevents cross-family data access

3. **03_create_functions_triggers.sql**
   - Database functions for business logic
   - Auto-role assignment on family creation/join
   - Join request workflow (create, review, approve/reject)
   - Health status calculation functions
   - Cache synchronization triggers
   - Security definer functions for RLS bypass when needed

4. **04_create_indexes.sql**
   - Performance indexes for common queries
   - Composite indexes for complex filters
   - Covering indexes to reduce table lookups
   - Full-text search indexes (requires pg_trgm extension)
   - Critical data access optimization

### Optional Migrations

5. **05_seed_data.sql**
   - Sample data for development/testing
   - Demo family with users and roles
   - Example elderly profiles with health data
   - DO NOT run in production

## Migration Order

**IMPORTANT: Execute migrations in this exact order:**

```bash
# Step 1: Core Tables
psql -h <host> -U <user> -d <database> -f 01_create_core_tables.sql

# Step 2: Row Level Security
psql -h <host> -U <user> -d <database> -f 02_enable_rls_policies.sql

# Step 3: Functions & Triggers
psql -h <host> -U <user> -d <database> -f 03_create_functions_triggers.sql

# Step 4: Performance Indexes
psql -h <host> -U <user> -d <database> -f 04_create_indexes.sql

# Step 5: Seed Data (OPTIONAL - Development only)
psql -h <host> -U <user> -d <database> -f 05_seed_data.sql
```

## Supabase-Specific Instructions

### Option A: Supabase SQL Editor (Recommended)

1. Login to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query for each migration file
4. Copy-paste the SQL content
5. Execute in order (01 → 02 → 03 → 04)
6. Verify success in Table Editor

### Option B: Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npx supabase db push

# Or run individual files
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f Database/01_create_core_tables.sql
```

### Option C: Using psql directly

```bash
# Using connection pooler (recommended for production)
PGPASSWORD='your-password' psql \
  -h db.xzjhjsrcgggdcqtsozfx.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f Database/01_create_core_tables.sql

# Repeat for each migration file in order
```

## Database Schema Overview

### Core Tables

#### 1. Family & User Management
- **family_groups**: Family units with unique 6-char codes
- **users**: User profiles with notification preferences
- **user_family_roles**: Role assignments (admin/carer/family_viewer)
- **family_join_requests**: Join request workflow
- **family_invitations**: Admin-initiated invitations
- **family_members**: Legacy member tracking

#### 2. Elderly Health Profiles
- **elderly_profiles**: Detailed elderly person information
- **vital_signs**: Time-series health measurements
- **medications**: Active and historical medication records
- **medication_schedules**: Daily adherence tracking

#### 3. Medical Management
- **appointments**: Appointment scheduling
- **appointment_outcomes**: Post-appointment clinical records
- **care_notes**: Family communication and observations

### Key Database Functions

#### Auto-Assignment
```sql
auto_assign_family_role(user_id, family_id, is_elderly, is_creator)
```
- Auto-assigns 'admin' to creators
- Auto-assigns 'family_viewer' to joiners

#### Join Request Workflow
```sql
create_family_join_request(family_code, message)
review_family_join_request(request_id, 'approve'/'reject', review_message)
```

#### Role Management
```sql
get_user_family_role(user_id, family_id)
update_user_family_role_secure(target_user_id, family_id, new_role)
is_family_admin(user_id, family_id)
```

#### Health Status Calculations
```sql
calculate_blood_pressure_status(systolic, diastolic)
calculate_spo2_status(value)
calculate_pulse_status(value)
calculate_temperature_status(value)
calculate_blood_glucose_status(value, test_type)
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following principles:

1. **Family Isolation**: Users can only access data within their family_id
2. **Role-Based Permissions**:
   - **Admin**: Full CRUD access to all family data
   - **Carer**: Can view all, edit health data, manage medications/appointments
   - **Family Viewer**: View-only access to health information

3. **Self-Management**: Users can always update their own profile

## Performance Considerations

### Indexes Created
- Family lookups: `idx_users_family_id`, `idx_elderly_profiles_family`
- Time-series queries: `idx_vital_signs_elderly_date`, `idx_med_schedules_date`
- Role checks: `idx_user_family_roles_user`, `idx_ufr_admin_lookups`
- Critical vitals: `idx_vital_signs_elderly_critical`
- Full-text search: `idx_care_notes_content_trgm` (requires pg_trgm)

### Query Optimization Tips
1. Always filter by `family_id` first
2. Use date ranges for vital signs queries
3. Leverage covering indexes for list views
4. Use `LIMIT` for pagination

## Data Validation

### Built-in Constraints
- **Vital Signs**: Range checks (BP: 0-300/0-200, SpO2: 0-100%, etc.)
- **Age**: 1-150 years
- **Family Code**: Exactly 6 characters
- **Roles**: Enum validation
- **Dates**: Start date ≤ End date

### Email Validation
- Regex pattern: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$`

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Full-text search (optional)
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure you're using the `postgres` role
   - Check RLS policies are correctly configured
   - Verify `auth.uid()` returns valid user ID

2. **Family Code Already Exists**
   - The trigger auto-generates unique codes
   - If manual insert, ensure code is unique

3. **RLS Blocks Legitimate Access**
   - Use SECURITY DEFINER functions for system operations
   - Verify user has correct role assignment

4. **Slow Queries**
   - Run `ANALYZE` on tables
   - Check index usage with `pg_stat_user_indexes`
   - Consider partitioning for large tables (>1M rows)

### Verification Queries

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- List all functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Test family code generation
INSERT INTO family_groups (family_name, created_by)
VALUES ('Test Family', auth.uid())
RETURNING family_code;
```

## Backup & Restore

### Backup Schema Only
```bash
pg_dump -h <host> -U postgres -d postgres \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  -f nely_schema_backup.sql
```

### Backup Schema + Data
```bash
pg_dump -h <host> -U postgres -d postgres \
  --schema=public \
  --no-owner \
  --no-acl \
  -f nely_full_backup.sql
```

### Restore
```bash
psql -h <host> -U postgres -d postgres -f nely_schema_backup.sql
```

## Future Enhancements

### Planned Features (Not in Current Schema)
1. **Multi-elderly Support**: Single family caring for multiple elderly
2. **Activity Logs**: Complete audit trail table
3. **Document Storage**: Medical documents and prescriptions
4. **Messaging System**: In-app family chat
5. **Analytics Tables**: Pre-computed health trends

### Scaling Considerations
- **Partitioning**: vital_signs, medication_schedules (when >1M rows)
- **Archiving**: Move old data to archive tables
- **Replication**: Read replicas for analytics
- **Caching**: Redis for frequently accessed data

## Security Best Practices

1. **Never disable RLS** in production
2. **Use parameterized queries** in application code
3. **Rotate database credentials** regularly
4. **Enable SSL/TLS** for connections
5. **Monitor function execution** for abuse
6. **Audit admin actions** via triggers
7. **Set statement timeouts** to prevent long-running queries

## Maintenance Tasks

### Weekly
- Run `ANALYZE` on high-traffic tables
- Check for unused indexes
- Review slow query log

### Monthly
- `VACUUM FULL` on tables with high delete/update activity
- Update table statistics
- Review and archive old data (>1 year)

### Quarterly
- Review and optimize RLS policies
- Audit function performance
- Check for missing indexes

## Support & Contact

For issues, questions, or contributions:
- Check application logs for error details
- Review RLS policies if data access issues occur
- Verify user role assignments in `user_family_roles` table
- Test with SECURITY DEFINER functions if RLS blocking legitimate operations

## Version History

- **v1.0.0** (2025-10-02): Initial migration
  - Complete schema for MVP
  - All core features implemented
  - Production-ready RLS policies
  - Performance optimized indexes
  - Business logic functions

---

**Last Updated**: October 2, 2025
**Database Version**: 1.0.0
**PostgreSQL Version**: 15+ (Supabase)
**Status**: Production Ready
