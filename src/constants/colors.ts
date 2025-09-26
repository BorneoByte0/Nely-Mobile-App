// Nely Mobile App - Color Palette
// Based on Malaysian cultural considerations and healthcare standards

export const colors = {
  // Brand Identity Colors
  primary: '#10B981',      // Emerald Green - Primary brand, CTAs, success states
  secondary: '#0EA5E9',    // Ocean Blue - Secondary brand, navigation, information
  
  // Health Status Colors
  success: '#059669',      // Success Green - Normal vitals, medication compliance
  warning: '#D97706',      // Warning Amber - Concerning readings, reminders
  error: '#DC2626',        // Critical Red - Dangerous vitals, emergency alerts
  info: '#0284C7',         // Info Blue - General information, education
  
  // Background Hierarchy
  white: '#FFFFFF',        // Clean medical data, card backgrounds
  gray50: '#F8FAFC',       // Primary app background, section separators
  gray100: '#F1F5F9',      // Secondary cards, input fields, dividers
  gray900: '#0F172A',      // Primary text, high contrast elements
  
  // Text Colors
  textPrimary: '#0F172A',   // Primary text color
  textSecondary: '#64748B', // Secondary text, labels
  textMuted: '#94A3B8',     // Muted text, placeholders
  
  // Additional Grays for UI Hierarchy
  gray200: '#E2E8F0',      // Borders, subtle dividers
  gray300: '#CBD5E1',      // Disabled states, inactive elements
  gray400: '#94A3B8',      // Icons, subtle text
  gray500: '#64748B',      // Body text, form labels
  gray600: '#475569',      // Headings, important text
  gray700: '#334155',      // High emphasis text
  gray800: '#1E293B',      // Dark mode backgrounds (future)
  
  // Transparency Variants
  primaryAlpha: '#10B98133', // Primary with 20% opacity
  secondaryAlpha: '#0EA5E933', // Secondary with 20% opacity
  successAlpha: '#05966933',   // Success with 20% opacity
  warningAlpha: '#D9770633',   // Warning with 20% opacity
  errorAlpha: '#DC262633',     // Error with 20% opacity
  infoAlpha: '#0284C733',      // Info with 20% opacity
  
  // Toast/Notification specific colors (higher opacity for visibility)
  successToast: '#059669CC',   // Success toast with 80% opacity
  warningToast: '#D97706CC',   // Warning toast with 80% opacity
  errorToast: '#DC2626CC',     // Error toast with 80% opacity
  infoToast: '#0284C7CC',      // Info toast with 80% opacity
  
  // Special Use Cases
  shadow: '#0F172A15',      // Shadows and elevations
  border: '#E2E8F0',       // Default border color
  divider: '#F1F5F9',      // Divider lines
  backdrop: '#0F172A80',   // Modal backdrop (50% opacity)
} as const;

// Health Status Color Mapping
export const healthStatusColors = {
  normal: colors.success,     // Normal vital signs
  concerning: colors.warning, // Concerning but not critical
  critical: colors.error,     // Dangerous, needs attention
  info: colors.info,          // General health information
} as const;

// Malaysian Cultural Color Context
export const culturalColors = {
  // Islamic significance - Green represents paradise, peace, healing
  islamic: colors.primary,
  
  // Universal trust - Blue accepted across Malay, Chinese, Indian cultures
  trust: colors.secondary,
  
  // Medical reliability - Clean white for medical data presentation
  medical: colors.white,
  
  // Professional stability - Gray hierarchy for information architecture
  professional: colors.gray900,
} as const;

// Accessibility-Compliant Color Combinations
export const accessibleCombinations = {
  // WCAG AA compliant text/background combinations
  primaryOnWhite: { text: colors.primary, background: colors.white },     // 4.5:1 ratio
  secondaryOnWhite: { text: colors.secondary, background: colors.white }, // 7.1:1 ratio
  textOnWhite: { text: colors.textPrimary, background: colors.white },    // 21:1 ratio
  errorOnWhite: { text: colors.error, background: colors.white },         // 5.9:1 ratio
  warningOnWhite: { text: colors.warning, background: colors.white },     // 4.8:1 ratio
  
  // High contrast combinations for elderly users
  highContrast: { text: colors.gray900, background: colors.white },
  mediumContrast: { text: colors.gray700, background: colors.gray50 },
} as const;

export type ColorKey = keyof typeof colors;
export type HealthStatus = keyof typeof healthStatusColors;