import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

export function LanguageScreen({ navigation }: Props) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = (selectedLanguage: 'en' | 'ms') => {
    if (selectedLanguage !== language) {
      hapticFeedback.success();
      setLanguage(selectedLanguage);
      // Navigate back after selection
      setTimeout(() => {
        navigation?.goBack();
      }, 300);
    }
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.secondary, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <InteractiveFeedback
              onPress={() => navigation?.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Language' : 'Bahasa'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Choose your preferred language' : 'Pilih bahasa pilihan anda'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Language Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Available Languages' : 'Bahasa Tersedia'}
          </Text>

          {/* English Option */}
          <InteractiveFeedback
            onPress={() => handleLanguageSelect('en')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={[styles.languageItem, language === 'en' && styles.languageItemSelected]}>
              <View style={styles.languageInfo}>
                <View style={styles.languageText}>
                  <Text style={[styles.languageTitle, language === 'en' && styles.languageTitleSelected]}>
                    English
                  </Text>
                  <Text style={styles.languageSubtitle}>
                    English (United Kingdom)
                  </Text>
                </View>
              </View>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </View>
          </InteractiveFeedback>

          {/* Bahasa Malaysia Option */}
          <InteractiveFeedback
            onPress={() => handleLanguageSelect('ms')}
            feedbackType="scale"
            hapticType="light"
          >
            <View style={[styles.languageItem, language === 'ms' && styles.languageItemSelected]}>
              <View style={styles.languageInfo}>
                <View style={styles.languageText}>
                  <Text style={[styles.languageTitle, language === 'ms' && styles.languageTitleSelected]}>
                    Bahasa Malaysia
                  </Text>
                  <Text style={styles.languageSubtitle}>
                    Bahasa Malaysia
                  </Text>
                </View>
              </View>
              {language === 'ms' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </View>
          </InteractiveFeedback>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <View style={styles.noteIcon}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
          </View>
          <Text style={styles.noteText}>
            {language === 'en' 
              ? 'The app will restart to apply the language change.' 
              : 'Aplikasi akan dimulakan semula untuk menerapkan perubahan bahasa.'}
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  // Section
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Language Items
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  languageItemSelected: {
    backgroundColor: colors.primaryAlpha,
    borderColor: colors.primary,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageText: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  languageTitleSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  languageSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray50,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  noteIcon: {
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  bottomPadding: {
    height: 20,
  },
});