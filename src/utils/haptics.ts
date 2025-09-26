import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  // Light impact for subtle interactions
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Medium impact for button presses
  medium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Heavy impact for important actions
  heavy: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Success notification
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Warning notification
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Error notification
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },

  // Selection feedback for tab switches, etc.
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Haptic feedback not available on this device
    }
  },
};

// Health status haptic feedback mapping
export const healthStatusHaptics = {
  normal: hapticFeedback.success,
  concerning: hapticFeedback.warning,
  critical: hapticFeedback.error,
};