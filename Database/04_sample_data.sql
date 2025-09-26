-- Nely MVP Database Schema
-- Migration 04: Sample Data for Testing
-- For Supabase Web SQL Editor
-- Malaysian Healthcare Context

-- Note: This is sample data for testing. In production, data will be created through the app.
-- The auth.users entries need to be created through Supabase Auth first.

-- Sample data assumes you have test users created via Supabase Auth
-- Replace these UUIDs with actual user IDs from your auth.users table

-- Insert sample family group
INSERT INTO family_groups (id, family_code, family_name, created_by, created_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '123456',
  'Keluarga Abdullah',
  '550e8400-e29b-41d4-a716-446655440001', -- Replace with actual auth user ID
  '2024-01-01 10:00:00+08'
);

-- Insert sample users (these need to match auth.users IDs)
INSERT INTO users (id, family_id, name, email, phone, role, preferred_language, avatar, is_active, date_joined)
VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Ahmad Hassan',
  'ahmad.hassan@email.com',
  '+60123456789',
  'caregiver',
  'en',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  true,
  '2024-01-01 10:00:00+08'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Siti Fatimah Omar',
  'siti.fatimah@email.com',
  '+60198765432',
  'caregiver',
  'ms',
  'https://images.unsplash.com/photo-1494790108755-2616b612b417?w=150&h=150&fit=crop&crop=face',
  true,
  '2024-01-01 11:00:00+08'
);

-- Insert sample elderly profile
INSERT INTO elderly_profiles (id, family_id, name, age, relationship, care_level, conditions, emergency_contact, avatar, date_created)
VALUES (
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Aminah Abdullah',
  74,
  'Grandmother',
  'dependent',
  ARRAY['Hypertension', 'Type 2 Diabetes', 'High Cholesterol'],
  '+60123456789',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
  '2024-01-01 10:00:00+08'
);

-- Insert sample family members
INSERT INTO family_members (id, family_id, user_id, name, relationship, phone, email, role, is_active, last_active)
VALUES
(
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440001',
  'Ahmad Hassan',
  'Son',
  '+60123456789',
  'ahmad.hassan@email.com',
  'primary_caregiver',
  true,
  NOW()
),
(
  '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '550e8400-e29b-41d4-a716-446655440002',
  'Siti Fatimah Omar',
  'Daughter',
  '+60198765432',
  'siti.fatimah@email.com',
  'family_member',
  true,
  NOW()
);

-- Insert sample vital signs
INSERT INTO vital_signs (id, elderly_id, systolic, diastolic, spo2, pulse, temperature, weight, blood_glucose, blood_glucose_type, recorded_by, recorded_at, notes)
VALUES
(
  '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  145,
  90,
  98,
  72,
  36.5,
  65.0,
  8.2,
  'random',
  'Ahmad (Son)',
  '2024-09-06 09:30:00+08',
  'Grandmother felt slightly dizzy this morning.'
),
(
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  138,
  85,
  97,
  75,
  36.4,
  64.8,
  7.8,
  'fasting',
  'Siti Fatimah',
  '2024-09-05 08:00:00+08',
  'Morning reading before breakfast'
);

-- Insert sample medications
INSERT INTO medications (id, elderly_id, name, dosage, frequency, instructions, prescribed_by, start_date, is_active)
VALUES
(
  '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Amlodipine',
  '5mg',
  'Once daily',
  'Take in the morning after breakfast',
  'Dr. Siti Nurhaliza - Bandar Health Clinic',
  '2024-01-15',
  true
),
(
  '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Metformin',
  '500mg',
  'Twice daily',
  'Take after morning and evening meals',
  'Dr. Siti Nurhaliza - Bandar Health Clinic',
  '2024-01-15',
  true
),
(
  '6ba7b817-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Simvastatin',
  '20mg',
  'Once daily',
  'Take at night before bedtime',
  'Dr. Ahmad Rahman - Kuala Lumpur Hospital',
  '2024-02-01',
  true
);

-- Insert sample medication schedules for today
INSERT INTO medication_schedules (id, elderly_id, medication_id, scheduled_time, taken, taken_at, taken_by, skipped, date)
VALUES
(
  '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
  '08:00',
  true,
  '2024-09-06 08:15:00+08',
  'Ahmad (Son)',
  false,
  '2024-09-06'
),
(
  '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
  '08:30',
  true,
  '2024-09-06 08:35:00+08',
  'Ahmad (Son)',
  false,
  '2024-09-06'
),
(
  '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
  '20:00',
  false,
  NULL,
  NULL,
  false,
  '2024-09-06'
),
(
  '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b817-9dad-11d1-80b4-00c04fd430c8',
  '22:00',
  false,
  NULL,
  NULL,
  false,
  '2024-09-06'
);

-- Insert sample health alerts
INSERT INTO health_alerts (id, elderly_id, type, title, message, is_read, action_required, date_created)
VALUES
(
  '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'yellow',
  'High Blood Pressure',
  'Blood pressure reading of 145/90 mmHg exceeds normal range. Please monitor more frequently.',
  false,
  true,
  '2024-09-06 09:30:00+08'
),
(
  '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'yellow',
  'High Blood Sugar',
  'Blood glucose level of 8.2 mmol/L is slightly high. Please ensure diet is controlled.',
  false,
  true,
  '2024-09-06 09:30:00+08'
),
(
  '6ba7b81e-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'green',
  'Medication Adherence Excellent',
  'All medications have been taken on time for the past 7 days. Keep up the good work!',
  false,
  false,
  '2024-09-05 10:00:00+08'
);

-- Insert sample appointments
INSERT INTO appointments (id, elderly_id, doctor_name, clinic, appointment_type, date, time, status, notes, follow_up_required)
VALUES
(
  '6ba7b81f-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Dr. Siti Nurhaliza',
  'Bandar Tun Razak Health Clinic',
  'Routine Checkup',
  '2024-09-15',
  '10:30',
  'upcoming',
  'Bring latest blood test results',
  false
),
(
  '6ba7b820-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'Dr. Ahmad Rahman',
  'Kuala Lumpur Hospital - Cardiology Department',
  'Heart Examination',
  '2024-09-22',
  '14:00',
  'upcoming',
  'Follow-up examination for hypertension',
  true
);

-- Insert sample care notes
INSERT INTO care_notes (id, elderly_id, author_id, author_name, content, category, is_important, date_created)
VALUES
(
  '6ba7b821-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '550e8400-e29b-41d4-a716-446655440001',
  'Ahmad',
  'Grandmother slept well last night. Blood pressure this morning is normal. Has taken medications according to schedule.',
  'general',
  false,
  '2024-09-06 09:00:00+08'
),
(
  '6ba7b822-9dad-11d1-80b4-00c04fd430c8',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  '550e8400-e29b-41d4-a716-446655440002',
  'Siti Fatimah',
  'Grandmother complained of leg pain yesterday. May need to make an appointment with the doctor.',
  'health',
  true,
  '2024-09-05 19:30:00+08'
);

-- Insert sample family invitation (expired example)
INSERT INTO family_invitations (id, family_id, invite_code, inviter_id, invitee_email, invitee_name, status, expires_at, created_at)
VALUES
(
  '6ba7b823-9dad-11d1-80b4-00c04fd430c8',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '789012',
  '550e8400-e29b-41d4-a716-446655440001',
  'nurul.ain@email.com',
  'Nurul Ain Ahmad',
  'pending',
  NOW() + INTERVAL '24 hours',
  NOW()
);