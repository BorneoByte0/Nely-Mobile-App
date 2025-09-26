import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

export function UnitsScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Triple dots animation
  const dot1Anim = useState(new Animated.Value(0.4))[0];
  const dot2Anim = useState(new Animated.Value(0.4))[0];
  const dot3Anim = useState(new Animated.Value(0.4))[0];
  
  const startDotsAnimation = () => {
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 200),
      animateDot(dot3Anim, 400),
    ]).start();
  };

  const stopDotsAnimation = () => {
    dot1Anim.stopAnimation();
    dot2Anim.stopAnimation();
    dot3Anim.stopAnimation();
    dot1Anim.setValue(0.4);
    dot2Anim.setValue(0.4);
    dot3Anim.setValue(0.4);
  };
  
  const [selectedUnits, setSelectedUnits] = useState({
    bloodPressure: 'mmHg',
    bloodGlucose: 'mmol/L',
    weight: 'kg',
    height: 'cm',
    temperature: 'celsius'
  });

  const unitOptions = {
    bloodPressure: [
      { value: 'mmHg', label: 'mmHg', description: language === 'en' ? 'Millimeters of mercury (standard)' : 'Milimeter merkuri (piawai)' },
    ],
    bloodGlucose: [
      { value: 'mmol/L', label: 'mmol/L', description: language === 'en' ? 'Millimoles per liter (Malaysia standard)' : 'Milimol per liter (piawai Malaysia)' },
      { value: 'mg/dL', label: 'mg/dL', description: language === 'en' ? 'Milligrams per deciliter (US standard)' : 'Miligram per desiliter (piawai AS)' }
    ],
    weight: [
      { value: 'kg', label: 'kg', description: language === 'en' ? 'Kilograms (metric)' : 'Kilogram (metrik)' },
      { value: 'lb', label: 'lb', description: language === 'en' ? 'Pounds (imperial)' : 'Paun (imperial)' }
    ],
    height: [
      { value: 'cm', label: 'cm', description: language === 'en' ? 'Centimeters (metric)' : 'Sentimeter (metrik)' },
      { value: 'ft', label: 'ft/in', description: language === 'en' ? 'Feet and inches (imperial)' : 'Kaki dan inci (imperial)' }
    ],
    temperature: [
      { value: 'celsius', label: '°C', description: language === 'en' ? 'Celsius (metric)' : 'Celsius (metrik)' },
      { value: 'fahrenheit', label: '°F', description: language === 'en' ? 'Fahrenheit (imperial)' : 'Fahrenheit (imperial)' }
    ]
  };

  const handleUnitChange = (category: string, unit: string) => {
    hapticFeedback.light();
    setSelectedUnits(prev => ({ ...prev, [category]: unit }));
  };

  const saveSettings = () => {
    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.light();
    
    // Simulate saving delay
    setTimeout(() => {
      setIsLoading(false);
      stopDotsAnimation();
      hapticFeedback.success();
      
      showSuccess({
        title: language === 'en' ? 'Units Saved!' : 'Unit Disimpan!',
        message: language === 'en' ? 'Units have been updated successfully.' : 'Unit telah dikemaskini dengan jayanya.',
        duration: 1500,
        onComplete: () => {
          setTimeout(() => {
            navigation?.goBack();
          }, 200);
        }
      });
    }, 1000); // 1 second loading animation
  };

  const resetToDefaults = () => {
    Alert.alert(
      language === 'en' ? 'Reset Units' : 'Set Semula Unit',
      language === 'en'
        ? 'This will reset all units to Malaysian standards. Continue?'
        : 'Ini akan menetapkan semula semua unit kepada piawai Malaysia. Teruskan?',
      [
        { text: language === 'en' ? 'Cancel' : 'Batal', style: 'cancel' },
        {
          text: language === 'en' ? 'Reset' : 'Set Semula',
          style: 'destructive',
          onPress: () => {
            hapticFeedback.success();
            setSelectedUnits({
              bloodPressure: 'mmHg',
              bloodGlucose: 'mmol/L',
              weight: 'kg',
              height: 'cm',
              temperature: 'celsius'
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
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
                {language === 'en' ? 'Units' : 'Unit'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Choose your preferred measurement units' : 'Pilih unit pengukuran pilihan anda'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Blood Pressure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Blood Pressure' : 'Tekanan Darah'}
          </Text>
          <Text style={styles.sectionDescription}>
            {language === 'en' 
              ? 'Unit for measuring blood pressure readings'
              : 'Unit untuk mengukur bacaan tekanan darah'
            }
          </Text>
          
          {unitOptions.bloodPressure.map((option) => (
            <InteractiveFeedback
              key={option.value}
              onPress={() => handleUnitChange('bloodPressure', option.value)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.optionCard,
                selectedUnits.bloodPressure === option.value && styles.optionCardSelected
              ]}>
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    selectedUnits.bloodPressure === option.value && styles.radioButtonSelected
                  ]}>
                    {selectedUnits.bloodPressure === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      selectedUnits.bloodPressure === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.exampleValue}>120/80</Text>
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        {/* Blood Glucose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Blood Glucose' : 'Gula Darah'}
          </Text>
          <Text style={styles.sectionDescription}>
            {language === 'en' 
              ? 'Unit for measuring blood sugar levels'
              : 'Unit untuk mengukur tahap gula dalam darah'
            }
          </Text>
          
          {unitOptions.bloodGlucose.map((option) => (
            <InteractiveFeedback
              key={option.value}
              onPress={() => handleUnitChange('bloodGlucose', option.value)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.optionCard,
                selectedUnits.bloodGlucose === option.value && styles.optionCardSelected
              ]}>
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    selectedUnits.bloodGlucose === option.value && styles.radioButtonSelected
                  ]}>
                    {selectedUnits.bloodGlucose === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      selectedUnits.bloodGlucose === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.exampleValue}>
                  {option.value === 'mmol/L' ? '5.5' : '99'}
                </Text>
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        {/* Weight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Weight' : 'Berat Badan'}
          </Text>
          <Text style={styles.sectionDescription}>
            {language === 'en' 
              ? 'Unit for measuring body weight'
              : 'Unit untuk mengukur berat badan'
            }
          </Text>
          
          {unitOptions.weight.map((option) => (
            <InteractiveFeedback
              key={option.value}
              onPress={() => handleUnitChange('weight', option.value)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.optionCard,
                selectedUnits.weight === option.value && styles.optionCardSelected
              ]}>
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    selectedUnits.weight === option.value && styles.radioButtonSelected
                  ]}>
                    {selectedUnits.weight === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      selectedUnits.weight === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.exampleValue}>
                  {option.value === 'kg' ? '65' : '143'}
                </Text>
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        {/* Height */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Height' : 'Tinggi Badan'}
          </Text>
          <Text style={styles.sectionDescription}>
            {language === 'en' 
              ? 'Unit for measuring body height'
              : 'Unit untuk mengukur tinggi badan'
            }
          </Text>
          
          {unitOptions.height.map((option) => (
            <InteractiveFeedback
              key={option.value}
              onPress={() => handleUnitChange('height', option.value)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.optionCard,
                selectedUnits.height === option.value && styles.optionCardSelected
              ]}>
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    selectedUnits.height === option.value && styles.radioButtonSelected
                  ]}>
                    {selectedUnits.height === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      selectedUnits.height === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.exampleValue}>
                  {option.value === 'cm' ? '165' : '5\'5"'}
                </Text>
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        {/* Temperature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Temperature' : 'Suhu Badan'}
          </Text>
          <Text style={styles.sectionDescription}>
            {language === 'en' 
              ? 'Unit for measuring body temperature'
              : 'Unit untuk mengukur suhu badan'
            }
          </Text>
          
          {unitOptions.temperature.map((option) => (
            <InteractiveFeedback
              key={option.value}
              onPress={() => handleUnitChange('temperature', option.value)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={[
                styles.optionCard,
                selectedUnits.temperature === option.value && styles.optionCardSelected
              ]}>
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    selectedUnits.temperature === option.value && styles.radioButtonSelected
                  ]}>
                    {selectedUnits.temperature === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      selectedUnits.temperature === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.exampleValue}>
                  {option.value === 'celsius' ? '36.5' : '97.7'}
                </Text>
              </View>
            </InteractiveFeedback>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={resetToDefaults}
          feedbackType="scale"
          hapticType="light"
        >
          <View style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color={colors.error} />
            <Text style={styles.resetButtonText}>
              {language === 'en' ? 'Reset to Defaults' : 'Set Semula kepada Lalai'}
            </Text>
          </View>
        </InteractiveFeedback>
        
        <InteractiveFeedback
          onPress={saveSettings}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.success, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.saveButton, isLoading && styles.saveButtonLoading]}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Save Settings' : 'Simpan Tetapan'}
                </Text>
              </>
            )}
          </LinearGradient>
        </InteractiveFeedback>
      </View>
      
      <SuccessAnimation
        visible={visible}
        title={successConfig?.title || ''}
        message={successConfig?.message || ''}
        onComplete={hideSuccess}
        duration={successConfig?.duration || 1500}
      />
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

  // Sections
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // Option Cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  exampleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },

  // Footer
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonLoading: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  
  // Loading animations
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },

  bottomPadding: {
    height: 20,
  },
});