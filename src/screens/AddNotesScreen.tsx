import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { ModernAlert } from '../components/ModernAlert';
import { useSuccessAnimation } from '../hooks/useSuccessAnimation';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useAddCareNote, useUserProfile } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

const noteCategories = [
  { key: 'general', labelEn: 'General', labelMs: 'Umum', icon: 'document-text' },
  { key: 'health', labelEn: 'Health', labelMs: 'Kesihatan', icon: 'medical' },
  { key: 'medication', labelEn: 'Medication', labelMs: 'Ubat-ubatan', icon: 'medical-outline' },
  { key: 'appointment', labelEn: 'Appointment', labelMs: 'Temujanji', icon: 'calendar' },
  { key: 'daily_care', labelEn: 'Daily Care', labelMs: 'Penjagaan Harian', icon: 'heart' },
  { key: 'behavior', labelEn: 'Behavior', labelMs: 'Tingkah Laku', icon: 'person' },
  { key: 'emergency', labelEn: 'Emergency', labelMs: 'Kecemasan', icon: 'warning' },
];

const quickSuggestions = [
  {
    categoryEn: 'Health',
    categoryMs: 'Kesihatan',
    suggestions: [
      { en: 'Feeling well today', ms: 'Berasa sihat hari ini' },
      { en: 'Complained of headache', ms: 'Mengadu sakit kepala' },
      { en: 'Good appetite at lunch', ms: 'Nafsu makan baik semasa makan tengah hari' },
      { en: 'Slept well last night', ms: 'Tidur nyenyak malam semalam' },
    ]
  },
  {
    categoryEn: 'Medication',
    categoryMs: 'Ubat-ubatan',
    suggestions: [
      { en: 'Took morning medication on time', ms: 'Mengambil ubat pagi tepat pada waktunya' },
      { en: 'Missed evening medication', ms: 'Terlepas ubat petang' },
      { en: 'Side effects noted', ms: 'Kesan sampingan diperhatikan' },
      { en: 'Medication refill needed', ms: 'Perlu mengisi semula ubat' },
    ]
  },
  {
    categoryEn: 'Daily Care',
    categoryMs: 'Penjagaan Harian',
    suggestions: [
      { en: 'Assisted with bathing', ms: 'Dibantu mandi' },
      { en: 'Independent with meals', ms: 'Bebas dengan makan' },
      { en: 'Needs help with walking', ms: 'Memerlukan bantuan berjalan' },
      { en: 'Enjoyed family time', ms: 'Menikmati masa bersama keluarga' },
    ]
  },
];

export function AddNotesScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const { successConfig, visible, showSuccess, hideSuccess } = useSuccessAnimation();
  const { alertConfig, visible: alertVisible, showError, hideAlert } = useModernAlert();

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { userProfile } = useUserProfile();
  const { addCareNote } = useAddCareNote();
  
  const [noteContent, setNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);

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

  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      showError(
        language === 'en' ? 'Empty Note' : 'Nota Kosong',
        language === 'en'
          ? 'Please enter some content for the note.'
          : 'Sila masukkan kandungan untuk nota.'
      );
      return;
    }

    if (!currentElderly) {
      showError(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'No elderly profile found. Please try again.'
          : 'Tiada profil warga emas dijumpai. Sila cuba lagi.'
      );
      return;
    }

    setIsLoading(true);
    startDotsAnimation();

    try {
      const noteData = {
        elderlyId: currentElderly.id,
        authorId: userProfile?.id || '',
        authorName: userProfile?.name || 'Unknown User',
        content: noteContent.trim(),
        category: selectedCategory as 'general' | 'health' | 'medication' | 'appointment' | 'emergency' | 'daily_care' | 'behavior',
        isImportant: isImportant,
      };

      const success = await addCareNote(noteData);

      if (success) {
        hapticFeedback.success();

        showSuccess({
          title: language === 'en' ? 'Note Added!' : 'Nota Ditambah!',
          message: language === 'en'
            ? 'Care note has been added successfully.'
            : 'Nota penjagaan telah ditambah dengan jayanya.',
          onComplete: () => navigation.goBack(),
          duration: 800,
        });
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      hapticFeedback.error();
      showError(
        language === 'en' ? 'Error' : 'Ralat',
        language === 'en'
          ? 'Failed to add note. Please try again.'
          : 'Gagal menambah nota. Sila cuba lagi.'
      );
    } finally {
      setIsLoading(false);
      stopDotsAnimation();
    }
  };

  const insertSuggestion = (suggestion: { en: string; ms: string }) => {
    const textToInsert = language === 'en' ? suggestion.en : suggestion.ms;
    setNoteContent(prev => prev ? `${prev}\n${textToInsert}` : textToInsert);
    setShowQuickSuggestions(false);
  };

  const getCategoryIcon = (categoryKey: string) => {
    const category = noteCategories.find(cat => cat.key === categoryKey);
    return category?.icon || 'document-text';
  };

  const getCategoryColor = (categoryKey: string) => {
    const colorMap: { [key: string]: string } = {
      general: colors.primary,
      health: colors.success,
      medication: colors.info,
      appointment: colors.secondary,
      daily_care: colors.warning,
      behavior: colors.textSecondary,
      emergency: colors.error,
    };
    return colorMap[categoryKey] || colors.primary;
  };

  if (profilesLoading) {
    return (
      <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading profiles...' : 'Memuatkan profil...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError) {
    return (
      <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <>
    <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <InteractiveFeedback
              onPress={() => navigation.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'Add Care Note' : 'Tambah Nota Penjagaan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Document important care observations' : 'Dokumentkan pemerhatian penjagaan penting'}
              </Text>
            </View>

            <InteractiveFeedback
              onPress={() => {
                hapticFeedback.light();
                setShowQuickSuggestions(!showQuickSuggestions);
              }}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.suggestionsButton}>
                <Ionicons name="bulb-outline" size={20} color={colors.white} />
              </View>
            </InteractiveFeedback>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>


        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Category' : 'Kategori'} *
          </Text>
          <View style={styles.categoriesGrid}>
            {noteCategories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonSelected,
                  { borderColor: getCategoryColor(category.key) }
                ]}
                onPress={() => {
                  hapticFeedback.light();
                  setSelectedCategory(category.key);
                }}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={20} 
                  color={selectedCategory === category.key ? colors.white : getCategoryColor(category.key)} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.key && styles.categoryButtonTextSelected
                ]}>
                  {language === 'en' ? category.labelEn : category.labelMs}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Note Content' : 'Kandungan Nota'} *
          </Text>
          <TextInput
            style={styles.textInput}
            value={noteContent}
            onChangeText={setNoteContent}
            placeholder={language === 'en' 
              ? 'Enter your observations, care notes, or important information...' 
              : 'Masukkan pemerhatian, nota penjagaan, atau maklumat penting...'
            }
            placeholderTextColor={colors.textMuted}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {noteContent.length}/1000 {language === 'en' ? 'characters' : 'aksara'}
          </Text>
        </View>

        {/* Quick Suggestions */}
        {showQuickSuggestions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Quick Suggestions' : 'Cadangan Pantas'}
            </Text>
            {quickSuggestions.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.suggestionsGroup}>
                <Text style={styles.suggestionsGroupTitle}>
                  {language === 'en' ? group.categoryEn : group.categoryMs}
                </Text>
                <View style={styles.suggestionsContainer}>
                  {group.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => {
                        hapticFeedback.light();
                        insertSuggestion(suggestion);
                      }}
                    >
                      <Text style={styles.suggestionText}>
                        {language === 'en' ? suggestion.en : suggestion.ms}
                      </Text>
                      <Ionicons name="add" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Priority Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.priorityToggle}
            onPress={() => {
              hapticFeedback.light();
              setIsImportant(!isImportant);
            }}
          >
            <View style={styles.priorityToggleLeft}>
              <Ionicons 
                name={isImportant ? "flag" : "flag-outline"} 
                size={20} 
                color={isImportant ? colors.error : colors.textMuted} 
              />
              <Text style={[
                styles.priorityToggleText,
                isImportant && styles.priorityToggleTextActive
              ]}>
                {language === 'en' ? 'Mark as Important' : 'Tandakan sebagai Penting'}
              </Text>
            </View>
            <View style={[
              styles.priorityToggleSwitch,
              isImportant && styles.priorityToggleSwitchActive
            ]}>
              <View style={[
                styles.priorityToggleSwitchThumb,
                isImportant && styles.priorityToggleSwitchThumbActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <InteractiveFeedback
          onPress={handleCreateNote}
          feedbackType="scale"
          hapticType="medium"
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            {isLoading ? (
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
              </View>
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {language === 'en' ? 'Add Note' : 'Tambah Nota'}
                </Text>
              </>
            )}
          </LinearGradient>
        </InteractiveFeedback>
      </View>
    </SafeAreaWrapper>

      {/* Success Animation */}
      {successConfig && (
        <SuccessAnimation
          visible={visible}
          title={successConfig.title}
          message={successConfig.message}
          onComplete={hideSuccess}
          duration={successConfig.duration}
        />
      )}

      {/* Modern Alert */}
      {alertConfig && (
        <ModernAlert
          visible={alertVisible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 16,
    margin: 20,
    marginBottom: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  suggestionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    gap: 6,
    minWidth: '45%',
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  categoryButtonTextSelected: {
    color: colors.white,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 120,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  suggestionsGroup: {
    marginBottom: 16,
  },
  suggestionsGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAlpha,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  priorityToggleTextActive: {
    color: colors.error,
  },
  priorityToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    padding: 2,
    justifyContent: 'center',
  },
  priorityToggleSwitchActive: {
    backgroundColor: colors.errorAlpha,
  },
  priorityToggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityToggleSwitchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.error,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Loading Styles
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
    height: 24,
  },
});