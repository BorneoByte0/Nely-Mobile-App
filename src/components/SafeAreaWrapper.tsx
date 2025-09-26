import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { colors } from '../constants/colors';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  includeTop?: boolean;
  includeBottom?: boolean;
  gradientVariant?: 'home' | 'family' | 'insights' | 'profile' | 'auth' | 'onboarding' | 'vitals' | 'medicine' | 'note' | 'splash';
  includeTabBarPadding?: boolean;
}

export function SafeAreaWrapper({ 
  children, 
  style, 
  includeTop = true, 
  includeBottom = true,
  gradientVariant,
  includeTabBarPadding = false 
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  // Tab bar takes 70px + bottom safe area, so we need to add 70px for tab screens
  // For non-tab screens, we still need normal bottom safe area
  const bottomPadding = includeTabBarPadding 
    ? 70 + (includeBottom ? insets.bottom : 0)
    : (includeBottom ? insets.bottom : 0);

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingTop: includeTop ? insets.top : 0,
          paddingBottom: bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (gradientVariant) {
    return (
      <GradientBackground variant={gradientVariant}>
        {content}
      </GradientBackground>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});