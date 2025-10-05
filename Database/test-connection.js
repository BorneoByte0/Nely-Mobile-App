#!/usr/bin/env node

/**
 * NELY MVP - Supabase Connection Test
 * Tests database connection and verifies migrations
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.trim();

console.log('\n==========================================');
console.log('NELY MVP - SUPABASE CONNECTION TEST');
console.log('==========================================\n');

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('❌ ERROR: EXPO_PUBLIC_SUPABASE_URL not found in .env file');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  process.exit(1);
}

console.log('📡 Connection Details:');
console.log('   URL:', SUPABASE_URL);
console.log('   Service Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...\n');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTests() {
  let allTestsPassed = true;

  try {
    // Test 1: Basic Connection
    console.log('🔍 Test 1: Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('family_groups')
      .select('count')
      .limit(0);

    if (connectionError && connectionError.code !== 'PGRST116') {
      console.error('   ❌ Connection failed:', connectionError.message);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Connection successful!\n');
    }

    // Test 2: Check Tables
    console.log('🔍 Test 2: Checking tables...');
    const tables = [
      'family_groups',
      'users',
      'user_family_roles',
      'elderly_profiles',
      'vital_signs',
      'medications',
      'medication_schedules',
      'appointments',
      'appointment_outcomes',
      'care_notes',
      'family_join_requests',
      'family_invitations',
      'family_members'
    ];

    let tableCount = 0;
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (!error || error.code === 'PGRST116') {
        console.log(`   ✅ ${table}`);
        tableCount++;
      } else {
        console.log(`   ❌ ${table} - ${error.message}`);
        allTestsPassed = false;
      }
    }
    console.log(`   📊 Tables found: ${tableCount}/${tables.length}\n`);

    // Test 3: Test RPC Functions
    console.log('🔍 Test 3: Testing database functions...');

    // Test family code generation
    try {
      const { data: familyCode, error: codeError } = await supabase
        .rpc('generate_family_code');

      if (codeError) {
        console.log('   ❌ generate_family_code():', codeError.message);
        allTestsPassed = false;
      } else {
        console.log('   ✅ generate_family_code() -', familyCode);
      }
    } catch (err) {
      console.log('   ❌ generate_family_code():', err.message);
      allTestsPassed = false;
    }

    // Test role validation function
    try {
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_family_code_for_join', { family_code_param: 'TEST01' });

      if (validationError) {
        console.log('   ❌ validate_family_code_for_join():', validationError.message);
        allTestsPassed = false;
      } else {
        console.log('   ✅ validate_family_code_for_join() - working');
      }
    } catch (err) {
      console.log('   ❌ validate_family_code_for_join():', err.message);
      allTestsPassed = false;
    }

    console.log('');

    // Test 4: Check Extensions
    console.log('🔍 Test 4: Checking PostgreSQL extensions...');
    const { data: extensions, error: extError } = await supabase
      .rpc('query', {
        query: "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm')"
      });

    if (!extError) {
      console.log('   ✅ Extensions check passed');
    } else {
      console.log('   ⚠️  Could not check extensions (expected in Supabase)');
    }
    console.log('');

    // Summary
    console.log('==========================================');
    console.log('TEST SUMMARY');
    console.log('==========================================');

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\n📊 Database Status:');
      console.log(`   • ${tableCount} tables created`);
      console.log('   • Database functions working');
      console.log('   • Connection established');
      console.log('\n🎉 Your Nely MVP database is ready!\n');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\n⚠️  Please check the errors above and verify:');
      console.log('   1. All migration files ran successfully');
      console.log('   2. No errors in Supabase SQL Editor');
      console.log('   3. Database permissions are correct\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
