import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Clipboard, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useFamilyMembers } from '../hooks/useDatabase';

interface Props {
  navigation?: any;
}

export function InviteFamilyMembersScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Database hooks - using temporary family ID for now
  const { familyMembers, loading: membersLoading, error: membersError } = useFamilyMembers('temp-family-id');
  
  // Animation states
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const copySuccessAnim = useState(new Animated.Value(0))[0];
  const copyScaleAnim = useState(new Animated.Value(1))[0];
  const generateScaleAnim = useState(new Animated.Value(1))[0];
  const dot1Anim = useState(new Animated.Value(0.4))[0];
  const dot2Anim = useState(new Animated.Value(0.4))[0];
  const dot3Anim = useState(new Animated.Value(0.4))[0];

  // Triple dots animation
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

  // Generate invitation code (6 digits like Life360)
  const generateInviteCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
    
    setInviteCode(code);
    setExpiresAt(expiry);
    hapticFeedback.success();
  };

  // Format time remaining
  const formatTimeRemaining = (targetDate: Date) => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return language === 'en' ? 'Expired' : 'Tamat Tempoh';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return language === 'en' 
        ? `${hours}h ${minutes}m remaining` 
        : `${hours}j ${minutes}m lagi`;
    } else {
      return language === 'en' 
        ? `${minutes}m remaining` 
        : `${minutes}m lagi`;
    }
  };

  // Update time remaining every minute
  useEffect(() => {
    if (inviteCode) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(expiresAt));
      };
      
      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [inviteCode, expiresAt, language]);

  // Generate initial code on component mount
  useEffect(() => {
    generateInviteCode();
  }, []);

  const handleCopyCode = async () => {
    if (!inviteCode || isCopyLoading || copySuccess) return;

    // Start loading animation
    setIsCopyLoading(true);
    startDotsAnimation();
    hapticFeedback.light();

    // Scale animation for press feedback
    Animated.sequence([
      Animated.timing(copyScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(copyScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate loading time for triple dots
    setTimeout(async () => {
      await Clipboard.setString(inviteCode);
      
      stopDotsAnimation();
      setIsCopyLoading(false);
      setCopySuccess(true);
      hapticFeedback.success();

      // Success animation
      Animated.sequence([
        Animated.timing(copySuccessAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(copySuccessAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCopySuccess(false);
      });
    }, 800);
  };

  const handleGenerateNewCode = () => {
    if (isGenerateLoading || isCopyLoading) return;

    setIsGenerateLoading(true);
    startDotsAnimation();
    hapticFeedback.light();

    // Scale animation
    Animated.sequence([
      Animated.timing(generateScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(generateScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      generateInviteCode();
      stopDotsAnimation();
      setIsGenerateLoading(false);
      hapticFeedback.success();
    }, 600);
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.success, colors.primary]}
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
                {language === 'en' ? 'Invite Family Members' : 'Jemput Ahli Keluarga'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Share this code to invite family members' : 'Kongsi kod ini untuk menjemput ahli keluarga'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Invitation Code Section */}
        <View style={styles.codeSection}>
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="key" size={24} color={colors.primary} />
              <Text style={styles.codeTitle}>
                {language === 'en' ? 'Invitation Code' : 'Kod Jemputan'}
              </Text>
            </View>
            
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            
            <View style={styles.codeInfo}>
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={16} color={colors.warning} />
                <Text style={styles.timeText}>{timeRemaining}</Text>
              </View>
              <Text style={styles.codeInstructions}>
                {language === 'en' 
                  ? 'Family members can use this code to join your family on Nely' 
                  : 'Ahli keluarga boleh menggunakan kod ini untuk menyertai keluarga anda di Nely'}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Current Family Members' : 'Ahli Keluarga Semasa'}
          </Text>
          <Text style={styles.memberCount}>
            {familyMembers?.length || 0} {language === 'en' ? 'active members' : 'ahli aktif'}
          </Text>

          {familyMembers?.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{member.name.charAt(0)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRelation}>
                  {language === 'en' ? member.relationship : getRelationshipMS(member.relationship)}
                </Text>
                {member.role === 'primary_caregiver' && (
                  <Text style={styles.caregiverBadge}>
                    {language === 'en' ? 'Primary Caregiver' : 'Penjaga Utama'}
                  </Text>
                )}
              </View>
              <View style={[styles.statusDot, { backgroundColor: member.isActive ? colors.success : colors.gray300 }]} />
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        {/* Copy Code Button */}
        <Animated.View style={{ transform: [{ scale: copyScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleCopyCode}
            disabled={isCopyLoading}
            activeOpacity={0.8}
          >
            <View style={[
              styles.copyButton,
              copySuccess && styles.copyButtonSuccess,
              isCopyLoading && styles.copyButtonLoading
            ]}>
              {isCopyLoading ? (
                <View style={styles.loadingDots}>
                  <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
                  <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
                  <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
                </View>
              ) : copySuccess ? (
                <Animated.View style={{ opacity: copySuccessAnim }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                </Animated.View>
              ) : (
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              )}
              
              <Text style={[
                styles.copyButtonText,
                copySuccess && styles.copyButtonTextSuccess,
                isCopyLoading && styles.copyButtonTextLoading
              ]}>
                {isCopyLoading
                  ? (language === 'en' ? 'Copying...' : 'Menyalin...')
                  : copySuccess
                  ? (language === 'en' ? 'Copied!' : 'Disalin!')
                  : (language === 'en' ? 'Copy Code' : 'Salin Kod')
                }
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Generate New Code Button */}
        <Animated.View style={{ transform: [{ scale: generateScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleGenerateNewCode}
            disabled={isGenerateLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isGenerateLoading 
                ? [colors.gray300, colors.gray400] 
                : [colors.secondary, colors.primary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.generateButton, isGenerateLoading && styles.generateButtonLoading]}
            >
              {isGenerateLoading ? (
                <View style={styles.loadingDots}>
                  <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
                </View>
              ) : (
                <Ionicons name="refresh-outline" size={20} color={colors.white} />
              )}
              <Text style={[
                styles.generateButtonText,
                isGenerateLoading && styles.generateButtonTextLoading
              ]}>
                {isGenerateLoading
                  ? (language === 'en' ? 'Generating...' : 'Menjana...')
                  : (language === 'en' ? 'New Code' : 'Kod Baru')
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}

// Helper function for Malay relationship translation
function getRelationshipMS(relationship: string) {
  const relationships = {
    'Son': 'Anak lelaki',
    'Daughter': 'Anak perempuan',
    'Daughter-in-law': 'Menantu perempuan',
    'Son-in-law': 'Menantu lelaki',
  };
  return relationships[relationship as keyof typeof relationships] || relationship;
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

  // Invitation Code Section
  codeSection: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  codeCard: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codeDisplay: {
    backgroundColor: colors.gray50,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primaryAlpha,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeInfo: {
    gap: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  codeInstructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  memberCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // Member Cards
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  caregiverBadge: {
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primaryAlpha,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  copyButtonSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  copyButtonTextSuccess: {
    color: colors.white,
  },
  copyButtonLoading: {
    backgroundColor: colors.primaryAlpha,
    borderColor: colors.primary,
  },
  copyButtonTextLoading: {
    color: colors.primary,
  },
  generateButton: {
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
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  generateButtonLoading: {
    opacity: 0.8,
  },
  generateButtonTextLoading: {
    color: colors.white,
  },

  // Loading animations
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
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