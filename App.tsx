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
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

type AppState = 'loading' | 'onboarding' | 'auth' | 'verify' | 'createProfile' | 'boarding' | 'createFamily' | 'authenticated';

function AppContent() {
  const { user, loading, isAuthenticated, hasCompletedProfileSetup, hasCompletedBoarding } = useAuth();
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
    // Only transition from loading state if both auth loading is done AND splash is completed
    if (!loading && splashCompleted && appState === 'loading') {
      if (isAuthenticated && user) {
        // Check profile setup completion first, then boarding
        if (!hasCompletedProfileSetup) {
          // User authenticated but hasn't completed profile setup
          animateStateTransition(() => setAppState('createProfile'));
        } else if (hasCompletedBoarding) {
          // User has completed everything - go to main app
          animateStateTransition(() => setAppState('authenticated'));
        } else {
          // User has profile but hasn't completed boarding - send to boarding screen
          animateStateTransition(() => setAppState('boarding'));
        }
      } else {
        if (isFirstTimeUser) {
          animateStateTransition(() => setAppState('onboarding'));
        } else {
          animateStateTransition(() => setAppState('auth'));
        }
      }
    }
  }, [loading, isAuthenticated, user, hasCompletedProfileSetup, hasCompletedBoarding, isFirstTimeUser, appState, splashCompleted, animateStateTransition]);

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
    // For demo - go straight to main app
    // In real app, handle family joining logic
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
    handleFamilyCreated,
    handleBackToBoarding,
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
          <LanguageProvider>
            <AppContent />
            <StatusBar style="auto" />
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
