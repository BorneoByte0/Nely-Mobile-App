import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

interface LanguageToggleProps {
  position?: 'topRight' | 'inline';
  size?: 'small' | 'medium';
}

export function LanguageToggle({ position = 'inline', size = 'medium' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();
  
  const isTopRight = position === 'topRight';
  const isSmall = size === 'small';
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isTopRight && styles.topRightPosition,
        isSmall && styles.smallContainer
      ]}
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      <View style={[
        styles.toggleBackground,
        isSmall && styles.smallToggle
      ]}>
        <Text style={[
          styles.languageText,
          language === 'en' && styles.activeText,
          isSmall && styles.smallText
        ]}>
          EN
        </Text>
        <Text style={[
          styles.separator,
          isSmall && styles.smallSeparator
        ]}>
          |
        </Text>
        <Text style={[
          styles.languageText,
          language === 'ms' && styles.activeText,
          isSmall && styles.smallText
        ]}>
          MS
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  topRightPosition: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  toggleBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallContainer: {
    alignSelf: 'flex-start',
  },
  smallToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  activeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
  },
  separator: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  smallSeparator: {
    fontSize: 12,
  },
});