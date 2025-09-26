import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface InteractiveFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  hapticType?: 'light' | 'medium' | 'heavy';
  feedbackType?: 'scale' | 'highlight' | 'pulse' | 'none';
  disabled?: boolean;
  style?: any;
}

export const InteractiveFeedback = React.memo<InteractiveFeedbackProps>(({
  children,
  onPress,
  hapticType = 'light',
  feedbackType = 'scale',
  disabled = false,
  style,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    // Only provide haptic feedback if feedbackType is not "none"
    if (feedbackType !== 'none') {
      // Use setTimeout to avoid scheduling updates during render
      setTimeout(() => {
        switch (hapticType) {
          case 'light':
            hapticFeedback.light();
            break;
          case 'medium':
            hapticFeedback.medium();
            break;
          case 'heavy':
            hapticFeedback.heavy();
            break;
        }
      }, 0);
    }

    switch (feedbackType) {
      case 'scale':
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
        break;
      case 'highlight':
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
        break;
      case 'pulse':
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      case 'none':
        // No animation feedback
        break;
    }
  }, [disabled, feedbackType, hapticType, scaleAnim, highlightAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    switch (feedbackType) {
      case 'scale':
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        break;
      case 'highlight':
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
        break;
      case 'none':
        // No animation feedback
        break;
    }
  }, [disabled, feedbackType, scaleAnim, highlightAnim]);

  const animatedStyle = useMemo(() => {
    switch (feedbackType) {
      case 'scale':
      case 'pulse':
        return {
          transform: [{ scale: scaleAnim }],
        };
      case 'highlight':
        return {
          opacity: highlightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.8],
          }),
          backgroundColor: highlightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', colors.primaryAlpha],
          }),
        };
      case 'none':
      default:
        return {};
    }
  }, [feedbackType, scaleAnim, highlightAnim]);

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          animatedStyle,
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

// Success/Error Feedback Toast Component
interface FeedbackToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export const FeedbackToast = React.memo<FeedbackToastProps>(({
  visible,
  type,
  message,
  onDismiss,
  duration = 3000,
}) => {
  const { language } = useLanguage();
  const translateAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateAnim, opacityAnim, onDismiss]);

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: colors.white,
          backgroundColor: colors.successToast,
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: colors.white,
          backgroundColor: colors.errorToast,
        };
      case 'warning':
        return {
          icon: 'warning',
          color: colors.white,
          backgroundColor: colors.warningToast,
        };
      case 'info':
        return {
          icon: 'information-circle',
          color: colors.white,
          backgroundColor: colors.infoToast,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.backgroundColor },
        {
          transform: [{ translateY: translateAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.toastIcon}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>
      <Text style={[styles.toastMessage, { color: config.color }]}>
        {message}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});