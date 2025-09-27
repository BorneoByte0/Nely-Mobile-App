import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signUp: (email: string, password: string, userData: any) => Promise<{error: any}>;
  signInWithGoogle: () => Promise<{error: any}>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: any) => Promise<{error: any}>;
  createUserProfile: (userData: any) => Promise<{error: any}>;
  isAuthenticated: boolean;
  hasCompletedProfileSetup: boolean;
  hasCompletedBoarding: boolean;
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
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
          console.log('User profile not found - user needs to complete boarding');
          return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
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
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('Attempting signup for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    console.log('Signup result:', { data: data?.user?.id, error: error?.message });

    if (!error && data.user) {
      // Create user profile in our users table
      console.log('Creating user profile for:', data.user.id);
      const { data: profileData, error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: userData.name,
        email: email,
        phone: userData.phone,
        role: userData.role || 'not elderly',
        preferred_language: userData.language || 'en',
      });

      console.log('Profile creation result:', { profileData, error: profileError?.message });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      // Configure WebBrowser for authentication
      WebBrowser.maybeCompleteAuthSession();

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'com.nely.app',
      });

      console.log('Redirect URI:', redirectUri);

      // Create the auth request
      const request = new AuthSession.AuthRequest({
        clientId: '215870229724-a215kti872ttje24nbgh9fa1hkvavqvd.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      // Open browser for authentication
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      console.log('Auth result:', result);

      if (result.type === 'success') {
        // Exchange code for token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            code: result.params.code,
            clientId: '215870229724-a215kti872ttje24nbgh9fa1hkvavqvd.apps.googleusercontent.com',
            redirectUri,
            extraParams: {},
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        if (tokenResult.accessToken) {
          // Get user profile from Google
          const userResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
          );
          const userData = await userResponse.json();

          console.log('Google user data:', userData);

          if (userData.email) {
            // For now, show success message and handle manually
            // This requires Supabase to have proper Google OAuth configured
            // Alternative: Use magic link or handle OAuth tokens properly

            // Try to sign in with OAuth token directly
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: tokenResult.idToken || tokenResult.accessToken,
            });

            if (error) {
              // Fallback: Show that Google sign-in worked but needs backend setup
              console.log('Google OAuth successful, but Supabase integration needs setup');
              console.log('User data:', userData);
              return {
                error: new Error('Google Sign-In successful! However, the backend integration is not fully configured. Please contact support or use email/password authentication.')
              };
            }

            return { error: null };
          } else {
            return { error: new Error('Could not get user email from Google') };
          }
        } else {
          return { error: new Error('Failed to get access token') };
        }
      } else if (result.type === 'cancel') {
        return { error: new Error('Google Sign-In was cancelled') };
      } else {
        return { error: new Error('Google Sign-In failed') };
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return { error: error instanceof Error ? error : new Error('Unknown Google Sign-In error') };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const updateUserProfile = async (updates: any) => {
    try {
      if (!user?.id) {
        console.log('updateUserProfile: User not authenticated');
        return { error: new Error('User not authenticated') };
      }

      console.log('updateUserProfile: Updating user', user.id, 'with data:', updates);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('updateUserProfile: Database error:', error);
        return { error };
      }

      console.log('updateUserProfile: Success, updated profile:', data);
      // Update local profile state
      setUserProfile(data);
      return { error: null };
    } catch (error) {
      console.error('updateUserProfile: Exception:', error);
      return { error };
    }
  };

  const createUserProfile = async (userData: any) => {
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
        console.error('Error creating user profile:', error);
        return { error };
      }

      // Update local profile state
      setUserProfile(data);
      return { error: null };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { error };
    }
  };


  const value: AuthContextType = {
    session,
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    createUserProfile,
    isAuthenticated: !!session,
    hasCompletedProfileSetup: !!userProfile &&
      !!userProfile.name &&
      userProfile.name !== user?.email?.split('@')[0] &&
      (userProfile.role === 'elderly' || userProfile.role === 'not elderly'),
    hasCompletedBoarding: !!userProfile?.family_id,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};