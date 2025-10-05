-- =====================================================
-- NELY MVP - Seed Data (Optional)
-- Version: 1.0.0
-- Purpose: Initial data for development and testing
-- Created: 2025-10-02
-- =====================================================

-- =====================================================
-- IMPORTANT: This file contains sample data for development/testing only
-- DO NOT run this in production unless you want demo data
-- =====================================================

-- =====================================================
-- 1. DEMO FAMILY GROUP
-- =====================================================

-- Note: In production, families are created through the app
-- This creates a demo family for testing purposes

-- Example: Create demo family (you'll need to replace UUIDs with actual auth.users IDs)
/*
INSERT INTO family_groups (id, family_name, family_code, created_by, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Demo Family - The Johnsons',
    'DEMO01',
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    true
);
*/

-- =====================================================
-- 2. DEMO USERS
-- =====================================================

-- Note: Users are created through Supabase Auth
-- This shows the structure for reference
/*
INSERT INTO users (id, family_id, name, email, phone, role, preferred_language, is_active)
VALUES
    -- Admin user (family creator)
    (
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'John Doe',
        'john.doe@example.com',
        '+60123456789',
        'not elderly',
        'en',
        true
    ),
    -- Carer user
    (
        '22222222-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Jane Doe',
        'jane.doe@example.com',
        '+60129876543',
        'not elderly',
        'en',
        true
    ),
    -- Viewer user
    (
        '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Bob Smith',
        'bob.smith@example.com',
        '+60121234567',
        'not elderly',
        'en',
        true
    );
*/

-- =====================================================
-- 3. DEMO USER FAMILY ROLES
-- =====================================================

/*
INSERT INTO user_family_roles (user_id, family_id, role, user_name, user_email, assigned_by, is_active)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'admin',
        'John Doe',
        'john.doe@example.com',
        '11111111-1111-1111-1111-111111111111',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'carer',
        'Jane Doe',
        'jane.doe@example.com',
        '11111111-1111-1111-1111-111111111111',
        true
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'family_viewer',
        'Bob Smith',
        'bob.smith@example.com',
        '11111111-1111-1111-1111-111111111111',
        true
    );
*/

-- =====================================================
-- 4. DEMO ELDERLY PROFILES
-- =====================================================

/*
INSERT INTO elderly_profiles (
    id,
    family_id,
    name,
    age,
    relationship,
    care_level,
    conditions,
    emergency_contact,
    emergency_contact_phone,
    weight,
    height,
    blood_type,
    doctor_name,
    clinic_name
)
VALUES
    -- Elderly person 1: Grandma Rose (independent)
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Grandma Rose Johnson',
        78,
        'Grandmother',
        'independent',
        ARRAY['Hypertension', 'Type 2 Diabetes'],
        'John Doe',
        '+60123456789',
        62.5,
        158.0,
        'O+',
        'Dr. Sarah Chen',
        'Sunway Medical Centre'
    ),
    -- Elderly person 2: Grandpa Tom (dependent)
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Grandpa Tom Johnson',
        82,
        'Grandfather',
        'dependent',
        ARRAY['Heart Disease', 'Arthritis', 'Dementia (Early Stage)'],
        'Jane Doe',
        '+60129876543',
        71.2,
        172.0,
        'A+',
        'Dr. Michael Wong',
        'Gleneagles Hospital'
    );
*/

-- =====================================================
-- 5. DEMO VITAL SIGNS
-- =====================================================

/*
INSERT INTO vital_signs (
    elderly_id,
    systolic,
    diastolic,
    spo2,
    pulse,
    temperature,
    weight,
    blood_glucose,
    blood_glucose_type,
    recorded_by,
    recorded_at,
    notes
)
VALUES
    -- Recent vitals for Grandma Rose
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        128,
        82,
        97,
        72,
        36.6,
        62.5,
        6.2,
        'fasting',
        'Jane Doe',
        NOW() - INTERVAL '2 hours',
        'Morning checkup, feeling well'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        132,
        85,
        96,
        75,
        36.7,
        62.3,
        8.5,
        'post_meal',
        'John Doe',
        NOW() - INTERVAL '1 day',
        'After lunch'
    ),
    -- Recent vitals for Grandpa Tom
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        145,
        92,
        94,
        68,
        36.8,
        71.2,
        NULL,
        NULL,
        'Jane Doe',
        NOW() - INTERVAL '3 hours',
        'Slightly elevated BP, monitoring'
    );
*/

-- =====================================================
-- 6. DEMO MEDICATIONS
-- =====================================================

/*
INSERT INTO medications (
    id,
    elderly_id,
    name,
    dosage,
    frequency,
    instructions,
    prescribed_by,
    start_date,
    end_date,
    is_active
)
VALUES
    -- Medications for Grandma Rose
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Metformin',
        '500mg',
        'Twice daily',
        'Take with meals (breakfast and dinner)',
        'Dr. Sarah Chen',
        CURRENT_DATE - INTERVAL '6 months',
        NULL,
        true
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Amlodipine',
        '5mg',
        'Once daily',
        'Take in the morning',
        'Dr. Sarah Chen',
        CURRENT_DATE - INTERVAL '1 year',
        NULL,
        true
    ),
    -- Medications for Grandpa Tom
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Aspirin',
        '100mg',
        'Once daily',
        'Take after breakfast',
        'Dr. Michael Wong',
        CURRENT_DATE - INTERVAL '2 years',
        NULL,
        true
    ),
    (
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Donepezil',
        '5mg',
        'Once daily',
        'Take at bedtime for dementia management',
        'Dr. Michael Wong',
        CURRENT_DATE - INTERVAL '3 months',
        NULL,
        true
    );
*/

-- =====================================================
-- 7. DEMO MEDICATION SCHEDULES
-- =====================================================

/*
-- Today's schedule for Grandma Rose
INSERT INTO medication_schedules (
    elderly_id,
    medication_id,
    date,
    scheduled_time,
    taken,
    taken_at,
    taken_by
)
VALUES
    -- Morning Metformin - taken
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        CURRENT_DATE,
        '08:00:00',
        true,
        CURRENT_DATE + TIME '08:15:00',
        'Jane Doe'
    ),
    -- Morning Amlodipine - taken
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        CURRENT_DATE,
        '08:00:00',
        true,
        CURRENT_DATE + TIME '08:15:00',
        'Jane Doe'
    ),
    -- Evening Metformin - pending
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        CURRENT_DATE,
        '19:00:00',
        false,
        NULL,
        NULL
    );
*/

-- =====================================================
-- 8. DEMO APPOINTMENTS
-- =====================================================

/*
INSERT INTO appointments (
    id,
    elderly_id,
    doctor_name,
    clinic,
    appointment_type,
    date,
    time,
    status,
    notes,
    follow_up_required
)
VALUES
    -- Upcoming appointment for Grandma Rose
    (
        'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Dr. Sarah Chen',
        'Sunway Medical Centre',
        'Routine Checkup',
        CURRENT_DATE + INTERVAL '3 days',
        '10:30:00',
        'upcoming',
        'Regular diabetes monitoring',
        false
    ),
    -- Past appointment for Grandpa Tom
    (
        'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Dr. Michael Wong',
        'Gleneagles Hospital',
        'Follow-up',
        CURRENT_DATE - INTERVAL '1 week',
        '14:00:00',
        'completed',
        'Dementia assessment follow-up',
        true
    );
*/

-- =====================================================
-- 9. DEMO CARE NOTES
-- =====================================================

/*
INSERT INTO care_notes (
    elderly_id,
    author_id,
    author_name,
    content,
    category,
    is_important,
    date_created
)
VALUES
    -- Note about Grandma Rose
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'Jane Doe',
        'Grandma had a good night sleep. Appetite is normal. Took morning walk in the garden.',
        'daily_care',
        false,
        NOW() - INTERVAL '2 hours'
    ),
    -- Important note about Grandpa Tom
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'John Doe',
        'Grandpa seemed confused about day of the week this morning. Mentioned this to Dr. Wong. Monitoring closely.',
        'health',
        true,
        NOW() - INTERVAL '5 hours'
    ),
    -- Medication note
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'Jane Doe',
        'Grandma asked about changing her Metformin timing. Scheduled to discuss with Dr. Chen at next appointment.',
        'medication',
        false,
        NOW() - INTERVAL '1 day'
    );
*/

-- =====================================================
-- 10. DEMO JOIN REQUEST (Pending)
-- =====================================================

/*
INSERT INTO family_join_requests (
    family_id,
    family_code,
    user_id,
    user_name,
    user_email,
    request_message,
    status,
    requested_at
)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'DEMO01',
        '44444444-4444-4444-4444-444444444444',
        'Alice Brown',
        'alice.brown@example.com',
        'Hi, I am Grandma Rose''s niece. I would like to join to help with her care coordination.',
        'pending',
        NOW() - INTERVAL '2 hours'
    );
*/

-- =====================================================
-- 11. VERIFICATION QUERIES
-- Purpose: Check that seed data was inserted correctly
-- =====================================================

-- Count records in each table
/*
SELECT 'family_groups' as table_name, COUNT(*) as record_count FROM family_groups
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_family_roles', COUNT(*) FROM user_family_roles
UNION ALL
SELECT 'elderly_profiles', COUNT(*) FROM elderly_profiles
UNION ALL
SELECT 'vital_signs', COUNT(*) FROM vital_signs
UNION ALL
SELECT 'medications', COUNT(*) FROM medications
UNION ALL
SELECT 'medication_schedules', COUNT(*) FROM medication_schedules
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'care_notes', COUNT(*) FROM care_notes
UNION ALL
SELECT 'family_join_requests', COUNT(*) FROM family_join_requests
ORDER BY table_name;
*/

-- =====================================================
-- 12. CLEANUP COMMANDS (If needed)
-- Purpose: Remove seed data for fresh start
-- =====================================================

/*
-- WARNING: This will delete ALL data
-- Uncomment only if you want to completely reset the database

DELETE FROM family_join_requests;
DELETE FROM care_notes;
DELETE FROM appointment_outcomes;
DELETE FROM appointments;
DELETE FROM medication_schedules;
DELETE FROM medications;
DELETE FROM vital_signs;
DELETE FROM elderly_profiles;
DELETE FROM user_family_roles;
DELETE FROM family_invitations;
DELETE FROM family_members;
DELETE FROM users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);
DELETE FROM family_groups WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
*/

-- =====================================================
-- END OF SEED DATA
-- =====================================================
