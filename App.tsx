import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { VerifyScreen } from './src/screens/VerifyScreen';
import { BoardingScreen } from './src/screens/BoardingScreen';
import { CreateFamilyGroupScreen } from './src/screens/CreateFamilyGroupScreen';
import { CreateUsersScreen } from './src/screens/CreateUsersScreen';
import { JoinFamilyRequestScreen } from './src/screens/JoinFamilyRequestScreen';
import { WaitingApprovalScreen } from './src/screens/WaitingApprovalScreen';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PermissionProvider } from './src/context/PermissionContext';
import { useCurrentUserJoinRequestStatus } from './src/hooks/useDatabase';

type AppState = 'loading' | 'onboarding' | 'auth' | 'verify' | 'createProfile' | 'boarding' | 'createFamily' | 'joinRequest' | 'waitingApproval' | 'authenticated';

function AppContent() {
  const { user, loading, isAuthenticated, hasCompletedProfileSetup, hasCompletedBoarding } = useAuth();
  const { status: joinRequestStatus, loading: joinRequestLoading } = useCurrentUserJoinRequestStatus();
  const [appState, setAppState] = useState<AppState>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(true);
  const [splashCompleted, setSplashCompleted] = useState<boolean>(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const animateStateTransition = useCallback((callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Add small delay to let the new screen initialize
      setTimeout(() => {
        callback();
        // Slightly longer fade in for smoother transition
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 50);
    });
  }, [fadeAnim]);

  useEffect(() => {
    console.log('🚦 Navigation Logic Check:', {
      loading,
      joinRequestLoading,
      splashCompleted,
      appState,
      isAuthenticated,
      hasCompletedProfileSetup,
      hasCompletedBoarding,
      joinRequestStatus,
    });

    // Only transition from loading state if both auth loading is done AND splash is completed
    if (!loading && !joinRequestLoading && splashCompleted && appState === 'loading') {
      console.log('✅ All loading complete, determining navigation...');

      if (isAuthenticated && user) {
        console.log('👤 User authenticated, checking profile and boarding status...');

        // Check for pending join requests first (highest priority)
        if (joinRequestStatus === 'pending') {
          console.log('⏳ Pending join request found, going to waitingApproval');
          animateStateTransition(() => setAppState('waitingApproval'));
        } else if (joinRequestStatus === 'approved') {
          console.log('✅ Join request approved, going to authenticated');
          // User was approved, go to main app
          animateStateTransition(() => setAppState('authenticated'));
        } else if (!hasCompletedProfileSetup) {
          console.log('📝 Profile not complete, going to createProfile');
          // User authenticated but hasn't completed profile setup
          animateStateTransition(() => setAppState('createProfile'));
        } else if (hasCompletedBoarding) {
          console.log('🏠 Boarding complete, no pending requests, going to authenticated');
          // User has completed everything and no pending requests - go to main app
          animateStateTransition(() => setAppState('authenticated'));
        } else {
          console.log('🚪 Profile complete but boarding not done, going to boarding');
          // User has profile but hasn't completed boarding - send to boarding screen
          animateStateTransition(() => setAppState('boarding'));
        }
      } else {
        console.log('🔐 User not authenticated, checking first time user...');
        if (isFirstTimeUser) {
          console.log('👋 First time user, going to onboarding');
          animateStateTransition(() => setAppState('onboarding'));
        } else {
          console.log('🔑 Returning user, going to auth');
          animateStateTransition(() => setAppState('auth'));
        }
      }
    }
  }, [loading, joinRequestLoading, isAuthenticated, user, hasCompletedProfileSetup, hasCompletedBoarding, joinRequestStatus, isFirstTimeUser, appState, splashCompleted, animateStateTransition]);

  // Handle sign out navigation - when user signs out from authenticated state
  useEffect(() => {
    if (!loading && splashCompleted && !isAuthenticated && appState === 'authenticated') {
      // User signed out, navigate back to auth screen
      animateStateTransition(() => setAppState('auth'));
    }
  }, [loading, isAuthenticated, appState, splashCompleted, animateStateTransition]);

  const handleSplashComplete = useCallback(() => {
    setSplashCompleted(true);
    // The actual state transition will be handled by useEffect
    // when both splash is complete and auth loading is done
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    animateStateTransition(() => setAppState('auth'));
  }, [animateStateTransition]);

  const handleAuthSuccess = useCallback((email: string, isLogin: boolean = false) => {
    setUserEmail(email);
    if (isLogin) {
      // Existing user logging in - go straight to main app
      animateStateTransition(() => setAppState('authenticated'));
    } else {
      // New user registering - go to verification
      animateStateTransition(() => setAppState('verify'));
    }
  }, [animateStateTransition]);

  const handleVerifySuccess = useCallback(() => {
    animateStateTransition(() => setAppState('createProfile'));
  }, [animateStateTransition]);

  const handleProfileSetupComplete = useCallback(() => {
    animateStateTransition(() => setAppState('boarding'));
  }, [animateStateTransition]);

  const handleCreateFamily = useCallback(() => {
    animateStateTransition(() => setAppState('createFamily'));
  }, [animateStateTransition]);

  const handleJoinFamily = useCallback(() => {
    // Navigate to join request screen
    animateStateTransition(() => setAppState('joinRequest'));
  }, [animateStateTransition]);

  const handleJoinRequestSubmitted = useCallback(() => {
    // After join request is submitted, go to waiting approval screen
    animateStateTransition(() => setAppState('waitingApproval'));
  }, [animateStateTransition]);

  const handleWaitingApprovalBack = useCallback(() => {
    // Go back to auth screen from waiting approval
    animateStateTransition(() => setAppState('auth'));
  }, [animateStateTransition]);

  const handleApprovalCompleted = useCallback(() => {
    // User approved, go to main app
    animateStateTransition(() => setAppState('authenticated'));
  }, [animateStateTransition]);

  const handleFamilyCreated = useCallback((familyCode: string) => {
    // Family successfully created, go to main app
    animateStateTransition(() => setAppState('authenticated'));
  }, [animateStateTransition]);

  const handleBackToBoarding = useCallback(() => {
    // Go back from CreateFamily to Boarding screen
    animateStateTransition(() => setAppState('boarding'));
  }, [animateStateTransition]);

  const renderCurrentScreen = useMemo(() => {
    switch (appState) {
      case 'loading':
        return <SplashScreen onLoadingComplete={handleSplashComplete} />;

      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;

      case 'auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      case 'verify':
        return (
          <VerifyScreen
            onVerifySuccess={handleVerifySuccess}
            email={userEmail}
          />
        );

      case 'createProfile':
        return (
          <CreateUsersScreen
            onSetupComplete={handleProfileSetupComplete}
          />
        );

      case 'boarding':
        return (
          <BoardingScreen
            onCreateFamily={handleCreateFamily}
            onJoinFamily={handleJoinFamily}
          />
        );

      case 'createFamily':
        return (
          <CreateFamilyGroupScreen
            onFamilyCreated={handleFamilyCreated}
            onBack={handleBackToBoarding}
          />
        );

      case 'joinRequest':
        return (
          <JoinFamilyRequestScreen
            onBack={handleBackToBoarding}
            onRequestCreated={handleJoinRequestSubmitted}
          />
        );

      case 'waitingApproval':
        return (
          <WaitingApprovalScreen
            onBackToAuth={handleWaitingApprovalBack}
            onApproved={handleApprovalCompleted}
          />
        );

      case 'authenticated':
        return (
          <NavigationContainer
            theme={{
              dark: false,
              colors: {
                primary: '#10B981',
                background: '#F8FAFC',
                card: '#FFFFFF',
                text: '#0F172A',
                border: '#E2E8F0',
                notification: '#DC2626',
              },
              fonts: {
                regular: {
                  fontFamily: 'System',
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: 'System',
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: 'System',
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: 'System',
                  fontWeight: '900',
                },
              },
            }}
          >
            <BottomTabNavigator />
          </NavigationContainer>
        );

      default:
        return <SplashScreen onLoadingComplete={handleSplashComplete} />;
    }
  }, [
    appState,
    handleSplashComplete,
    handleOnboardingComplete,
    handleAuthSuccess,
    handleVerifySuccess,
    handleProfileSetupComplete,
    handleCreateFamily,
    handleJoinFamily,
    handleJoinRequestSubmitted,
    handleFamilyCreated,
    handleBackToBoarding,
    handleWaitingApprovalBack,
    handleApprovalCompleted,
    userEmail,
  ]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {renderCurrentScreen}
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PermissionProvider>
            <LanguageProvider>
              <AppContent />
              <StatusBar style="auto" />
            </LanguageProvider>
          </PermissionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
