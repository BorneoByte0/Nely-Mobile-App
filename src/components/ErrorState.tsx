import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { InteractiveFeedback } from './InteractiveFeedback';

interface ErrorStateProps {
  type?: 'network' | 'data' | 'auth' | 'general';
  message?: string;
  onRetry?: () => void;
  size?: 'small' | 'large';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'general',
  message,
  onRetry,
  size = 'large',
}) => {
  const { language } = useLanguage();

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: 'wifi-outline' as const,
          messageEn: 'Connection failed',
          messageMs: 'Sambungan gagal',
          detailEn: 'Please check your internet connection and try again.',
          detailMs: 'Sila semak sambungan internet dan cuba lagi.',
        };
      case 'data':
        return {
          icon: 'medical-outline' as const,
          messageEn: 'Unable to load health data',
          messageMs: 'Tidak dapat memuatkan data kesihatan',
          detailEn: 'There was a problem loading your health information.',
          detailMs: 'Terdapat masalah memuatkan maklumat kesihatan anda.',
        };
      case 'auth':
        return {
          icon: 'person-outline' as const,
          messageEn: 'Authentication required',
          messageMs: 'Pengesahan diperlukan',
          detailEn: 'Please sign in to access your data.',
          detailMs: 'Sila log masuk untuk mengakses data anda.',
        };
      default:
        return {
          icon: 'alert-circle-outline' as const,
          messageEn: 'Something went wrong',
          messageMs: 'Berlaku kesilapan',
          detailEn: 'An unexpected error occurred.',
          detailMs: 'Kesilapan yang tidak dijangka berlaku.',
        };
    }
  };

  const config = getErrorConfig();
  const displayMessage = message || (language === 'en' ? config.messageEn : config.messageMs);
  const displayDetail = language === 'en' ? config.detailEn : config.detailMs;

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <View style={[styles.content, size === 'small' && styles.contentSmall]}>
        <View style={[styles.iconContainer, size === 'small' && styles.iconContainerSmall]}>
          <Ionicons
            name={config.icon}
            size={size === 'small' ? 24 : 32}
            color={colors.error}
          />
        </View>

        <Text style={[styles.message, size === 'small' && styles.messageSmall]}>
          {displayMessage}
        </Text>

        {size === 'large' && (
          <Text style={styles.detail}>
            {displayDetail}
          </Text>
        )}

        {onRetry && (
          <InteractiveFeedback
            style={[styles.retryButton, size === 'small' && styles.retryButtonSmall]}
            onPress={onRetry}
          >
            <View style={styles.retryButtonContent}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.retryButtonText}>
                {language === 'en' ? 'Try Again' : 'Cuba Lagi'}
              </Text>
            </View>
          </InteractiveFeedback>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  containerSmall: {
    padding: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 280,
  },
  contentSmall: {
    gap: 8,
    maxWidth: 200,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.errorAlpha,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 0,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  messageSmall: {
    fontSize: 14,
    fontWeight: '500',
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.gray50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginTop: 8,
  },
  retryButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});