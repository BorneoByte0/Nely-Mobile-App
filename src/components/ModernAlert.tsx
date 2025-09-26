import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InteractiveFeedback } from './InteractiveFeedback';
import { colors } from '../constants/colors';
import { hapticFeedback } from '../utils/haptics';

export interface ModernAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'destructive' | 'cancel' | 'default';
}

interface ModernAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons: ModernAlertButton[];
  onClose?: () => void;
}

export function ModernAlert({
  visible,
  type,
  title,
  message,
  buttons,
  onClose
}: ModernAlertProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    if (visible) {
      hapticFeedback.light();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          textColor: colors.white,
        };
      case 'destructive':
        return {
          backgroundColor: colors.error,
          textColor: colors.white,
        };
      case 'cancel':
        return {
          backgroundColor: 'transparent',
          textColor: colors.textSecondary,
        };
      default:
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
        };
    }
  };

  const handleBackdropPress = () => {
    if (onClose) {
      hapticFeedback.light();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      hardwareAccelerated={true}
      presentationStyle="overFullScreen"
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose ? handleBackdropPress : undefined}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {buttons && buttons.map((button, index) => {
                const buttonStyleConfig = getButtonStyle(button.style);
                const isLastButton = index === buttons.length - 1;
                const isFirstButton = index === 0;
                const isSingleButton = buttons.length === 1;
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      hapticFeedback.light();
                      button.onPress?.();
                    }}
                    style={[
                      styles.button,
                      { backgroundColor: buttonStyleConfig.backgroundColor },
                      isSingleButton && styles.singleButton,
                      isFirstButton && buttons.length > 1 && styles.firstButton,
                      isLastButton && buttons.length > 1 && styles.lastButton,
                      !isLastButton && buttons.length > 1 && styles.buttonWithGap,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: buttonStyleConfig.textColor },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 9999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    maxWidth: 300,
    width: '100%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    margin: 0,
    paddingHorizontal: 0,
  },
  singleButton: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  buttonWithGap: {
    marginRight: 1,
  },
  firstButton: {
    borderBottomLeftRadius: 12,
  },
  lastButton: {
    borderBottomRightRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});