-- =====================================================
-- NELY MVP - Migration Verification Script
-- Purpose: Verify all migrations completed successfully
-- =====================================================

\echo '==========================================';
\echo 'NELY MVP - DATABASE MIGRATION VERIFICATION';
\echo '==========================================';
\echo '';

-- =====================================================
-- 1. CHECK DATABASE CONNECTION
-- =====================================================

\echo '1. Database Connection Info:';
\echo '-------------------------------------------';
SELECT
    current_database() as database_name,
    current_user as connected_user,
    version() as postgres_version;
\echo '';

-- =====================================================
-- 2. CHECK EXTENSIONS
-- =====================================================

\echo '2. Installed Extensions:';
\echo '-------------------------------------------';
SELECT
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm')
ORDER BY extname;
\echo '';

-- =====================================================
-- 3. COUNT TABLES
-- =====================================================

\echo '3. Tables Created:';
\echo '-------------------------------------------';
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

\echo '';
\echo 'Table List:';
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
\echo '';

-- =====================================================
-- 4. CHECK ROW LEVEL SECURITY
-- =====================================================

\echo '4. Row Level Security Status:';
\echo '-------------------------------------------';
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
\echo '';

\echo 'RLS Summary:';
SELECT
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
    COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';
\echo '';

-- =====================================================
-- 5. COUNT RLS POLICIES
-- =====================================================

\echo '5. RLS Policies Count:';
\echo '-------------------------------------------';
SELECT
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
\echo '';

\echo 'Total RLS Policies:';
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
\echo '';

-- =====================================================
-- 6. CHECK FUNCTIONS
-- =====================================================

\echo '6. Database Functions Created:';
\echo '-------------------------------------------';
SELECT
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
\echo '';

\echo 'Function Count:';
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public';
\echo '';

-- =====================================================
-- 7. CHECK TRIGGERS
-- =====================================================

\echo '7. Triggers Created:';
\echo '-------------------------------------------';
SELECT
    trigger_name,
    event_object_table as table_name,
    action_timing as timing,
    event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
\echo '';

\echo 'Trigger Count:';
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';
\echo '';

-- =====================================================
-- 8. CHECK INDEXES
-- =====================================================

\echo '8. Indexes Summary:';
\echo '-------------------------------------------';
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
\echo '';

\echo 'Total Indexes:';
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';
\echo '';

-- =====================================================
-- 9. CHECK CONSTRAINTS
-- =====================================================

\echo '9. Constraints Summary:';
\echo '-------------------------------------------';
SELECT
    table_name,
    constraint_type,
    COUNT(*) as count
FROM information_schema.table_constraints
WHERE table_schema = 'public'
GROUP BY table_name, constraint_type
ORDER BY table_name, constraint_type;
\echo '';

-- =====================================================
-- 10. VERIFY CRITICAL TABLES EXIST
-- =====================================================

\echo '10. Critical Tables Verification:';
\echo '-------------------------------------------';
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_groups')
        THEN '✓ family_groups'
        ELSE '✗ family_groups MISSING'
    END as check1
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
        THEN '✓ users'
        ELSE '✗ users MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_family_roles')
        THEN '✓ user_family_roles'
        ELSE '✗ user_family_roles MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'elderly_profiles')
        THEN '✓ elderly_profiles'
        ELSE '✗ elderly_profiles MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vital_signs')
        THEN '✓ vital_signs'
        ELSE '✗ vital_signs MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medications')
        THEN '✓ medications'
        ELSE '✗ medications MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_schedules')
        THEN '✓ medication_schedules'
        ELSE '✗ medication_schedules MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments')
        THEN '✓ appointments'
        ELSE '✗ appointments MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'care_notes')
        THEN '✓ care_notes'
        ELSE '✗ care_notes MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_join_requests')
        THEN '✓ family_join_requests'
        ELSE '✗ family_join_requests MISSING'
    END;
\echo '';

-- =====================================================
-- 11. VERIFY CRITICAL FUNCTIONS EXIST
-- =====================================================

\echo '11. Critical Functions Verification:';
\echo '-------------------------------------------';
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_family_code')
        THEN '✓ generate_family_code()'
        ELSE '✗ generate_family_code() MISSING'
    END as check1
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_family_join_request')
        THEN '✓ create_family_join_request()'
        ELSE '✗ create_family_join_request() MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'review_family_join_request')
        THEN '✓ review_family_join_request()'
        ELSE '✗ review_family_join_request() MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'auto_assign_family_role')
        THEN '✓ auto_assign_family_role()'
        ELSE '✗ auto_assign_family_role() MISSING'
    END
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_family_role')
        THEN '✓ get_user_family_role()'
        ELSE '✗ get_user_family_role() MISSING'
    END;
\echo '';

-- =====================================================
-- 12. TEST FAMILY CODE GENERATION
-- =====================================================

\echo '12. Test Family Code Generation:';
\echo '-------------------------------------------';
SELECT generate_family_code() as sample_family_code;
\echo '';

-- =====================================================
-- 13. DATABASE SIZE
-- =====================================================

\echo '13. Database Size Information:';
\echo '-------------------------------------------';
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\echo '';

\echo 'Total Database Size:';
SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;
\echo '';

-- =====================================================
-- 14. FINAL SUMMARY
-- =====================================================

\echo '==========================================';
\echo 'MIGRATION VERIFICATION SUMMARY';
\echo '==========================================';

SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes;

\echo '';
\echo '==========================================';
\echo 'Expected Values:';
\echo '  Tables: 13';
\echo '  RLS Enabled: 13';
\echo '  RLS Policies: 50+';
\echo '  Functions: 15+';
\echo '  Triggers: 4+';
\echo '  Indexes: 45+';
\echo '==========================================';
\echo '';
\echo 'If all checks pass, your database is ready!';
\echo '';
