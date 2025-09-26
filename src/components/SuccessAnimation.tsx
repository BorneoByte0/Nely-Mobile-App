import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { hapticFeedback } from '../utils/haptics';

interface SuccessAnimationProps {
  visible: boolean;
  title: string;
  message: string;
  onComplete: () => void;
  duration?: number; // How long to show the success (default 2500ms)
}

export function SuccessAnimation({
  visible,
  title,
  message,
  onComplete,
  duration = 1200
}: SuccessAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger success haptic feedback
      hapticFeedback.success();
      
      // Fast checkmark animation sequence
      Animated.sequence([
        // 1. Quick scale up checkmark with bounce + fade in
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 200,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        // 2. Hold for a short moment
        Animated.delay(duration - 450), // Adjusted for smoother timing
        // 3. Smooth fade out with both opacity and scale
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Reset animations for next time
        scaleAnim.setValue(0.5);
        opacityAnim.setValue(0);
        onComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.success, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons 
              name="checkmark" 
              size={50} 
              color={colors.white} 
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});