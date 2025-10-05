import React, { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant: 'home' | 'family' | 'insights' | 'profile' | 'auth' | 'onboarding' | 'vitals' | 'medicine' | 'note' | 'splash';
  style?: ViewStyle;
}

export const GradientBackground = React.memo<GradientBackgroundProps>(({ children, variant, style }) => {
  const gradientColors = useMemo((): [string, string] => {
    switch (variant) {
      case 'onboarding':
        // Solid light colors for standalone build compatibility
        return ['#E0F2FE', '#D1FAE5']; // Light blue to light green
      case 'auth':
        // Solid light colors for standalone build compatibility
        return ['#D1FAE5', '#E0F2FE']; // Light green to light blue
      case 'splash':
        return [colors.primary, colors.secondary]; // Full strength gradient for splash
      case 'home':
        return [colors.primary + '15', colors.secondary + '10']; // Light emerald to light ocean blue
      case 'family':
        return [colors.secondary + '15', colors.primary + '10']; // Light ocean blue to light emerald
      case 'insights':
        return [colors.primary + '10', colors.secondary + '15']; // Very light emerald to light ocean blue
      case 'profile':
        return [colors.secondary + '10', colors.primary + '15']; // Very light ocean blue to light emerald
      case 'vitals':
        return [colors.primary + '12', colors.secondary + '08']; // Medical focused - light emerald
      case 'medicine':
        return [colors.secondary + '12', colors.primary + '08']; // Medicine focused - light ocean blue
      case 'note':
        return [colors.primary + '08', colors.secondary + '12']; // Note focused - very light gradient
      default:
        return [colors.primary + '10', colors.secondary + '10'];
    }
  }, [variant]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, style]}
      >
        {children}
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
