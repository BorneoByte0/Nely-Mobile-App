import React, { useCallback, useMemo, useRef } from 'react';
import { View, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

import { HomeStackNavigator } from './HomeStackNavigator';
import { FamilyStackNavigator } from './FamilyStackNavigator';
import { InsightsStackNavigator } from './InsightsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

// Custom animated tab button component
const AnimatedTabButton = React.memo<{
  focused: boolean;
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}>(({ focused, onPress, iconName, label }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const backgroundAnim = React.useRef(new Animated.Value(0)).current;

  // Memoize gradient colors to prevent recreation on every render
  const gradientColors = useMemo(() => [colors.secondary, colors.primary] as const, []);

  // Memoized styles to prevent object recreation
  const iconGradientStyle = useMemo(() => ({
    borderRadius: 12,
    padding: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }), []);

  const textContainerStyle = useMemo(() => ({
    marginTop: 2,
  }), []);

  const textGradientStyle = useMemo(() => ({
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  }), []);

  const focusedTextStyle = useMemo(() => ({
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  }), []);

  const unfocusedTextStyle = useMemo(() => ({
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  }), []);

  // Set initial animation values
  React.useEffect(() => {
    backgroundAnim.setValue(focused ? 1 : 0);
    scaleAnim.setValue(focused ? 1.05 : 1);
  }, []);

  React.useEffect(() => {
    // Use stagger instead of parallel for smoother performance
    Animated.stagger(50, [
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.05 : 1, // Reduced scale for better performance
        tension: 100, // Reduced tension for smoother animation
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: focused ? 1 : 0,
        duration: 150, // Reduced duration
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, backgroundAnim, scaleAnim]);

  const handlePress = useCallback(() => {
    // Debounce haptic feedback to prevent spam
    hapticFeedback.selection();

    // Simplified press animation
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.05 : 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });

    onPress();
  }, [focused, onPress, scaleAnim]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      }}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
        }}
      >
        
        {focused ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={iconGradientStyle}
          >
            <Ionicons
              name={iconName}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        ) : (
          <Ionicons
            name={iconName}
            size={24}
            color={colors.textSecondary}
          />
        )}

        {/* Simplified text rendering */}
        <Animated.View
          style={[
            textContainerStyle,
            {
              opacity: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ]}
        >
          {focused ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={textGradientStyle}
            >
              <Animated.Text style={focusedTextStyle}>
                {label}
              </Animated.Text>
            </LinearGradient>
          ) : (
            <Animated.Text style={unfocusedTextStyle}>
              {label}
            </Animated.Text>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

export function BottomTabNavigator() {
  const { texts } = useLanguage();
  const insets = useSafeAreaInsets();

  // Memoize tab configuration to prevent recreation
  const getTabConfig = useCallback((route: any, isFocused: boolean) => {
    const routeConfigs = {
      Home: {
        iconName: isFocused ? 'home' : 'home-outline',
        label: texts.navigation.home,
      },
      Family: {
        iconName: isFocused ? 'people' : 'people-outline',
        label: texts.navigation.family,
      },
      Insights: {
        iconName: isFocused ? 'analytics' : 'analytics-outline',
        label: texts.navigation.insights,
      },
      Profile: {
        iconName: isFocused ? 'person' : 'person-outline',
        label: texts.navigation.profile,
      },
    };

    return routeConfigs[route.name as keyof typeof routeConfigs] || {
      iconName: 'help-outline' as const,
      label: route.name,
    };
  }, [texts]);

  // Memoize tab bar style
  const tabBarStyle = useMemo(() => ({
    backgroundColor: colors.white,
    borderTopWidth: 0,
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    height: 70 + insets.bottom,
    paddingTop: 6,
    paddingBottom: insets.bottom + 6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute' as const,
  }), [insets.bottom]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarButton: (props) => {
          const navigationState = useNavigationState(state => state);
          const currentRoute = navigationState?.routes[navigationState.index];
          const isFocused = currentRoute?.name === route.name;
          const config = getTabConfig(route, isFocused);

          return (
            <AnimatedTabButton
              focused={isFocused}
              onPress={() => {
                if (props.onPress) {
                  props.onPress({} as any);
                }
              }}
              iconName={config.iconName as keyof typeof Ionicons.glyphMap}
              label={config.label}
            />
          );
        },
        tabBarStyle,
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={SwipeableHomeStack}
        options={{ title: texts.navigation.home }}
      />
      <Tab.Screen
        name="Family"
        component={SwipeableFamilyStack}
        options={{ title: texts.navigation.family }}
      />
      <Tab.Screen
        name="Insights"
        component={SwipeableInsightsStack}
        options={{ title: texts.navigation.insights }}
      />
      <Tab.Screen
        name="Profile"
        component={SwipeableProfileStack}
        options={{ title: texts.navigation.profile }}
      />
    </Tab.Navigator>
  );
}

// Higher-order component for swipeable stacks
function createSwipeableStack(StackComponent: React.ComponentType<any>, tabIndex: number) {
  return function SwipeableStackComponent() {
    const navigation = useNavigation();
    const translateX = useRef(new Animated.Value(0)).current;
    const gestureHandler = useRef(null);

    const { width } = Dimensions.get('window');

    // Tab names in order for swipe navigation
    const tabNames = ['Home', 'Family', 'Insights', 'Profile'];

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = useCallback((event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, velocityX } = event.nativeEvent;
        const swipeThreshold = width * 0.2;
        const velocityThreshold = 400;

        let targetTabIndex = tabIndex;

        // Determine swipe direction and target tab
        if (translationX > swipeThreshold || velocityX > velocityThreshold) {
          // Swipe right - go to previous tab
          targetTabIndex = Math.max(0, tabIndex - 1);
        } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
          // Swipe left - go to next tab
          targetTabIndex = Math.min(tabNames.length - 1, tabIndex + 1);
        }

        // Animate back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
        }).start();

        // Navigate if different tab
        if (targetTabIndex !== tabIndex) {
          hapticFeedback.selection();
          (navigation as any).navigate(tabNames[targetTabIndex]);
        }
      }
    }, [tabIndex, width, navigation, translateX]);

    return (
      <PanGestureHandler
        ref={gestureHandler}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-8, 8]}
        failOffsetY={[-40, 40]}
        shouldCancelWhenOutside={false}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{
              translateX: translateX.interpolate({
                inputRange: [-width, 0, width],
                outputRange: [-width * 0.1, 0, width * 0.1],
                extrapolate: 'clamp',
              })
            }]
          }}
        >
          <StackComponent />
        </Animated.View>
      </PanGestureHandler>
    );
  };
}

// Create swipeable versions of each stack
const SwipeableHomeStack = createSwipeableStack(HomeStackNavigator, 0);
const SwipeableFamilyStack = createSwipeableStack(FamilyStackNavigator, 1);
const SwipeableInsightsStack = createSwipeableStack(InsightsStackNavigator, 2);
const SwipeableProfileStack = createSwipeableStack(ProfileStackNavigator, 3);