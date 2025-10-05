import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, Database } from '../lib/supabase';
import type { FamilyRole } from '../types';
import { logger } from '../utils/logger';

// User profile type from database schema
export type UserProfile = Database['public']['Tables']['users']['Row'];

// User profile update type
export type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

// User profile creation type
export type UserProfileInsert = Database['public']['Tables']['users']['Insert'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  familyRole: FamilyRole | 'none';
  isAdmin: boolean;
  isLoading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{error: AuthError | null}>;
  signUp: (email: string, password: string, userData: UserProfileInsert) => Promise<{error: AuthError | Error | null}>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: UserProfileUpdate) => Promise<{error: Error | null}>;
  createUserProfile: (userData: UserProfileInsert) => Promise<{error: Error | null}>;
  refreshFamilyRole: () => Promise<void>;
  isAuthenticated: boolean;
  hasCompletedProfileSetup: boolean;
  hasCompletedBoarding: boolean;
  // Legacy loading for backwards compatibility
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyRole, setFamilyRole] = useState<FamilyRole | 'none'>('none');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user profile doesn't exist (PGRST116), that's expected for new users
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  };

  // Function to fetch user's family role
  const fetchFamilyRole = async (userId: string, familyId?: string) => {
    try {
      setRoleLoading(true);

      // If no family ID provided, get it from user profile
      let userFamilyId = familyId;
      if (!userFamilyId) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('family_id')
          .eq('id', userId)
          .single();

        if (userError || !userData?.family_id) {
          setFamilyRole('none');
          setIsAdmin(false);
          return;
        }
        userFamilyId = userData.family_id;
      }

      // Get user's role in the family
      const { data: roleData, error: roleError } = await supabase
        .from('user_family_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('family_id', userFamilyId)
        .eq('is_active', true)
        .single();

      if (roleError || !roleData) {
        setFamilyRole('none');
        setIsAdmin(false);
      } else {
        const role = roleData.role as FamilyRole;
        setFamilyRole(role);
        setIsAdmin(role === 'admin');
      }
    } catch (error) {
      setFamilyRole('none');
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  // Function to refresh family role (can be called from other components)
  const refreshFamilyRole = async () => {
    if (user?.id) {
      await fetchFamilyRole(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);

        // Fetch family role if user has completed boarding
        if (profile?.family_id) {
          await fetchFamilyRole(session.user.id, profile.family_id);
        } else {
          setFamilyRole('none');
          setIsAdmin(false);
          setRoleLoading(false);
        }
      } else {
        setUserProfile(null);
        setFamilyRole('none');
        setIsAdmin(false);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);

        // Fetch family role if user has completed boarding
        if (profile?.family_id) {
          await fetchFamilyRole(session.user.id, profile.family_id);
        } else {
          setFamilyRole('none');
          setIsAdmin(false);
          setRoleLoading(false);
        }
      } else {
        setUserProfile(null);
        setFamilyRole('none');
        setIsAdmin(false);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to sign in') };
    }
  };

  const signUp = async (email: string, password: string, userData: UserProfileInsert) => {
    try {
      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        return { error };
      }

      if (!data.user) {
        return { error: new Error('Signup succeeded but no user data returned') };
      }

      // Step 2: Create user profile in our users table with retry logic
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          name: userData.name,
          email: email,
          phone: userData.phone,
          role: userData.role || 'not elderly',
          preferred_language: userData.language || 'en',
        });

        if (!profileError) {
          // Success! Profile created
          return { error: null };
        }

        lastError = profileError;

        // If it's a duplicate key error, the profile already exists (should not happen, but safe)
        if (profileError.code === '23505') {
          return { error: null };
        }

        // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }

      // All retries failed - log the user out to prevent orphaned auth state
      // The orphaned auth user will be in the system but cannot be used
      // Database cleanup can be done via admin panel or scheduled task
      await supabase.auth.signOut();

      return {
        error: new Error(
          `Account creation failed after ${maxRetries} attempts. Please try signing up again. If the problem persists, contact support.`
        )
      };

    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to sign up') };
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to sign out');
    }
  };

  const updateUserProfile = async (updates: UserProfileUpdate) => {
    try {
      if (!user?.id) {
        return { error: new Error('User not authenticated') };
      }


      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      // Update local profile state
      setUserProfile(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const createUserProfile = async (userData: UserProfileInsert) => {
    try {
      if (!user?.id) {
        return { error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: userData.name || user.email?.split('@')[0] || 'User',
          email: user.email!,
          phone: userData.phone || null,
          role: userData.role || 'not elderly',
          preferred_language: userData.language || 'en',
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      // Update local profile state
      setUserProfile(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };


  const value: AuthContextType = {
    session,
    user,
    userProfile,
    familyRole,
    isAdmin,
    isLoading: loading,
    roleLoading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    createUserProfile,
    refreshFamilyRole,
    isAuthenticated: !!session,
    hasCompletedProfileSetup: !!userProfile &&
      !!userProfile.name &&
      !!userProfile.role &&
      (userProfile.role === 'elderly' || userProfile.role === 'not elderly'),
    hasCompletedBoarding: !!userProfile?.family_id,
    // Legacy loading for backwards compatibility
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};