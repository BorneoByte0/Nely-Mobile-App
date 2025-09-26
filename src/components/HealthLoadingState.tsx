import React from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

interface HealthLoadingStateProps {
  type?: 'vitals' | 'medications' | 'appointments' | 'general';
  size?: 'small' | 'large';
  overlay?: boolean;
  message?: string;
}

export const HealthLoadingState: React.FC<HealthLoadingStateProps> = ({
  type = 'general',
  size = 'large',
  overlay = false,
  message,
}) => {
  const { language } = useLanguage();

  const getLoadingConfig = () => {
    switch (type) {
      case 'vitals':
        return {
          messageEn: 'Loading health data...',
          messageMs: 'Memuatkan data kesihatan...',
        };
      case 'medications':
        return {
          messageEn: 'Loading medications...',
          messageMs: 'Memuatkan ubat-ubatan...',
        };
      case 'appointments':
        return {
          messageEn: 'Loading appointments...',
          messageMs: 'Memuatkan temujanji...',
        };
      default:
        return {
          messageEn: 'Loading...',
          messageMs: 'Memuatkan...',
        };
    }
  };

  const config = getLoadingConfig();
  const displayMessage = message || (language === 'en' ? config.messageEn : config.messageMs);

  const content = (
    <View style={[styles.container, overlay && styles.overlay]}>
      <View style={[styles.content, size === 'small' && styles.contentSmall]}>
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'large'}
          color={colors.primary}
          style={styles.spinner}
        />
        <Text style={[styles.message, size === 'small' && styles.messageSmall]}>
          {displayMessage}
        </Text>
      </View>
    </View>
  );

  return overlay ? (
    <View style={styles.overlayContainer}>
      {content}
    </View>
  ) : content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  contentSmall: {
    gap: 8,
  },
  spinner: {
    // No additional styles needed
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageSmall: {
    fontSize: 12,
  },
});