import React, { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant: 'home' | 'family' | 'insights' | 'profile' | 'auth' | 'onboarding' | 'vitals' | 'medicine' | 'note' | 'splash';
  style?: ViewStyle;
}

export const GradientBackground = React.memo<GradientBackgroundProps>(({ children, variant, style }) => {
  const gradientColors = useMemo((): [string, string] => {
    switch (variant) {
      case 'home':
        return [colors.primary + '15', colors.secondary + '10']; // Light emerald to light ocean blue
      case 'family':
        return [colors.secondary + '15', colors.primary + '10']; // Light ocean blue to light emerald
      case 'insights':
        return [colors.primary + '10', colors.secondary + '15']; // Very light emerald to light ocean blue
      case 'profile':
        return [colors.secondary + '10', colors.primary + '15']; // Very light ocean blue to light emerald
      case 'auth':
        return [colors.primary + '20', colors.secondary + '15']; // Medium emerald to light ocean blue
      case 'onboarding':
        return [colors.secondary + '20', colors.primary + '15']; // Medium ocean blue to light emerald
      case 'vitals':
        return [colors.primary + '12', colors.secondary + '08']; // Medical focused - light emerald
      case 'medicine':
        return [colors.secondary + '12', colors.primary + '08']; // Medicine focused - light ocean blue
      case 'note':
        return [colors.primary + '08', colors.secondary + '12']; // Note focused - very light gradient
      case 'splash':
        return [colors.primary, colors.secondary]; // Full strength gradient for splash
      default:
        return [colors.primary + '10', colors.secondary + '10'];
    }
  }, [variant]);
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});