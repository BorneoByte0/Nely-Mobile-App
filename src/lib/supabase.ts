// Supabase client configuration for Nely MVP
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// Supabase configuration
// Environment variables must be set via EAS Secrets for production builds
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase configuration. ' +
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Development-only: Test database connection
if (__DEV__) {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      logger.debug('Database connection test:', error ? 'FAILED' : 'SUCCESS');
      if (error) logger.debug('Connection error:', error.message);
    } catch (err) {
      logger.debug('Database connection test: FAILED', err);
    }
  };

  // Run test after a short delay
  setTimeout(testConnection, 1000);
}

// Create Supabase client with React Native optimizations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
    fetch: (url, options = {}) => {
      // Set timeout for all network requests (30 seconds)
      const timeout = 30000;

      return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), timeout)
        ),
      ]);
    },
  },
});

// Development-only: Debug auth state changes
if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    logger.debug('Supabase auth state change:', event);
    if (session) {
      logger.debug('Session established, expires at:', new Date(session.expires_at! * 1000));
    }
  });
}

// Database table type definitions based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          family_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          role: 'elderly' | 'not elderly';
          preferred_language: 'en' | 'ms';
          avatar: string | null;
          is_active: boolean;
          date_joined: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          role: 'elderly' | 'not elderly';
          preferred_language?: 'en' | 'ms';
          avatar?: string | null;
          is_active?: boolean;
          date_joined?: string;
        };
        Update: {
          id?: string;
          family_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: 'elderly' | 'not elderly';
          preferred_language?: 'en' | 'ms';
          avatar?: string | null;
          is_active?: boolean;
          date_joined?: string;
        };
      };
      elderly_profiles: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          age: number;
          relationship: string;
          care_level: 'independent' | 'dependent' | 'bedridden';
          conditions: string[];
          emergency_contact: string | null;
          avatar: string | null;
          date_created: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          age: number;
          relationship: string;
          care_level: 'independent' | 'dependent' | 'bedridden';
          conditions?: string[];
          emergency_contact?: string | null;
          avatar?: string | null;
          date_created?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          age?: number;
          relationship?: string;
          care_level?: 'independent' | 'dependent' | 'bedridden';
          conditions?: string[];
          emergency_contact?: string | null;
          avatar?: string | null;
          date_created?: string;
        };
      };
      vital_signs: {
        Row: {
          id: string;
          elderly_id: string;
          systolic: number | null;
          diastolic: number | null;
          spo2: number | null;
          pulse: number | null;
          temperature: number | null;
          weight: number | null;
          blood_glucose: number | null;
          blood_glucose_type: 'fasting' | 'random' | 'post_meal' | null;
          recorded_by: string;
          recorded_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          elderly_id: string;
          systolic?: number | null;
          diastolic?: number | null;
          spo2?: number | null;
          pulse?: number | null;
          temperature?: number | null;
          weight?: number | null;
          blood_glucose?: number | null;
          blood_glucose_type?: 'fasting' | 'random' | 'post_meal' | null;
          recorded_by: string;
          recorded_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          elderly_id?: string;
          systolic?: number | null;
          diastolic?: number | null;
          spo2?: number | null;
          pulse?: number | null;
          temperature?: number | null;
          weight?: number | null;
          blood_glucose?: number | null;
          blood_glucose_type?: 'fasting' | 'random' | 'post_meal' | null;
          recorded_by?: string;
          recorded_at?: string;
          notes?: string | null;
        };
      };
    };
  };
}

// Type the supabase client
export type SupabaseClient = typeof supabase;