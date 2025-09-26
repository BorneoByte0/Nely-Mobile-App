import React, { useState } from 'react';
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

interface GuideSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  color: string;
}

export function UserGuideScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: language === 'en' ? 'Getting Started' : 'Bermula',
      content: language === 'en' 
        ? 'Learn how to set up your family health tracking account, add elderly family members, and invite other caregivers to join your care circle.'
        : 'Pelajari cara menyediakan akaun penjejakan kesihatan keluarga anda, menambah ahli keluarga warga emas, dan menjemput penjaga lain untuk menyertai lingkaran penjagaan anda.',
      icon: 'rocket',
      color: colors.primary
    },
    {
      id: 'health-tracking',
      title: language === 'en' ? 'Health Tracking' : 'Penjejakan Kesihatan',
      content: language === 'en'
        ? 'Record vital signs including blood pressure, blood glucose, weight, and other health metrics. Set up medication reminders and track adherence.'
        : 'Rekodkan tanda-tanda vital termasuk tekanan darah, glukosa darah, berat badan, dan metrik kesihatan lain. Sediakan peringatan ubat dan jejak kepatuhan.',
      icon: 'heart',
      color: colors.error
    },
    {
      id: 'family-collaboration',
      title: language === 'en' ? 'Family Collaboration' : 'Kerjasama Keluarga',
      content: language === 'en'
        ? 'Understand how family members can work together, share responsibilities, and communicate about elderly care needs through the app.'
        : 'Fahami bagaimana ahli keluarga boleh bekerjasama, berkongsi tanggungjawab, dan berkomunikasi mengenai keperluan penjagaan warga emas melalui aplikasi.',
      icon: 'people',
      color: colors.info
    },
    {
      id: 'appointments',
      title: language === 'en' ? 'Managing Appointments' : 'Menguruskan Temujanji',
      content: language === 'en'
        ? 'Schedule and manage medical appointments, set reminders, and share appointment information with family members.'
        : 'Jadualkan dan uruskan temujanji perubatan, tetapkan peringatan, dan kongsi maklumat temujanji dengan ahli keluarga.',
      icon: 'calendar',
      color: colors.secondary
    },
    {
      id: 'medications',
      title: language === 'en' ? 'Medication Management' : 'Pengurusan Ubat',
      content: language === 'en'
        ? 'Add medications, set dosage schedules, track adherence, and manage pharmacy information for medication refills.'
        : 'Tambah ubat-ubatan, tetapkan jadual dos, jejak kepatuhan, dan urus maklumat farmasi untuk pengisian semula ubat.',
      icon: 'medical',
      color: colors.warning
    },
    {
      id: 'insights',
      title: language === 'en' ? 'Health Insights' : 'Wawasan Kesihatan',
      content: language === 'en'
        ? 'View health trends, generate reports for doctor visits, and understand health patterns over time using charts and analytics.'
        : 'Lihat trend kesihatan, jana laporan untuk lawatan doktor, dan fahami corak kesihatan dari masa ke masa menggunakan carta dan analitik.',
      icon: 'analytics',
      color: colors.success
    },
    {
      id: 'notifications',
      title: language === 'en' ? 'Notifications & Alerts' : 'Pemberitahuan & Amaran',
      content: language === 'en'
        ? 'Configure notification settings for medication reminders, health alerts, and family activity updates to stay informed.'
        : 'Konfigurasikan tetapan pemberitahuan untuk peringatan ubat, amaran kesihatan, dan kemas kini aktiviti keluarga untuk kekal termaklum.',
      icon: 'notifications',
      color: colors.info
    },
    {
      id: 'privacy-security',
      title: language === 'en' ? 'Privacy & Security' : 'Privasi & Keselamatan',
      content: language === 'en'
        ? 'Learn about data protection, privacy settings, and security features that keep your family\'s health information safe.'
        : 'Pelajari mengenai perlindungan data, tetapan privasi, dan ciri keselamatan yang memastikan maklumat kesihatan keluarga anda selamat.',
      icon: 'shield-checkmark',
      color: colors.primary
    }
  ];

  const toggleSection = (sectionId: string) => {
    hapticFeedback.light();
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
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
                {language === 'en' ? 'User Guide' : 'Panduan Pengguna'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'Learn how to use Nely effectively' : 'Pelajari cara menggunakan Nely dengan berkesan'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </View>
          <Text style={styles.welcomeTitle}>
            {language === 'en' ? 'Welcome to Nely!' : 'Selamat datang ke Nely!'}
          </Text>
          <Text style={styles.welcomeText}>
            {language === 'en' 
              ? 'Nely helps Malaysian families track elderly health together. This guide will help you get started and make the most of all features.'
              : 'Nely membantu keluarga Malaysia menjejak kesihatan warga emas bersama-sama. Panduan ini akan membantu anda bermula dan memanfaatkan semua ciri dengan sebaik-baiknya.'
            }
          </Text>
        </View>

        {/* Guide Sections */}
        <View style={styles.sectionsContainer}>
          {guideSections.map((section, index) => (
            <View key={section.id} style={styles.section}>
              <InteractiveFeedback
                onPress={() => toggleSection(section.id)}
                feedbackType="scale"
                hapticType="light"
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLeft}>
                    <View style={[styles.sectionIcon, { backgroundColor: `${section.color}15` }]}>
                      <Ionicons name={section.icon as any} size={20} color={section.color} />
                    </View>
                    <View style={styles.sectionTitleContainer}>
                      <Text style={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</Text>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
              </InteractiveFeedback>

              {expandedSection === section.id && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionText}>{section.content}</Text>
                  
                  {/* Additional Tips Based on Section */}
                  {section.id === 'getting-started' && (
                    <View style={styles.tipBox}>
                      <Text style={styles.tipTitle}>
                        {language === 'en' ? 'Quick Tip:' : 'Tip Pantas:'}
                      </Text>
                      <Text style={styles.tipText}>
                        {language === 'en'
                          ? 'Start by adding your elderly family member\'s basic information and invite one other family member to collaborate.'
                          : 'Mulakan dengan menambah maklumat asas ahli keluarga warga emas anda dan jemput seorang ahli keluarga lain untuk bekerjasama.'
                        }
                      </Text>
                    </View>
                  )}

                  {section.id === 'health-tracking' && (
                    <View style={styles.tipBox}>
                      <Text style={styles.tipTitle}>
                        {language === 'en' ? 'Best Practice:' : 'Amalan Terbaik:'}
                      </Text>
                      <Text style={styles.tipText}>
                        {language === 'en'
                          ? 'Record vitals at consistent times each day for accurate health trends and patterns.'
                          : 'Rekodkan vital pada masa yang konsisten setiap hari untuk trend dan corak kesihatan yang tepat.'
                        }
                      </Text>
                    </View>
                  )}

                  {section.id === 'family-collaboration' && (
                    <View style={styles.tipBox}>
                      <Text style={styles.tipTitle}>
                        {language === 'en' ? 'Family Tip:' : 'Tip Keluarga:'}
                      </Text>
                      <Text style={styles.tipText}>
                        {language === 'en'
                          ? 'Assign specific roles to family members - one for medication tracking, another for appointment scheduling.'
                          : 'Tugaskan peranan khusus kepada ahli keluarga - seorang untuk penjejakan ubat, yang lain untuk penjadualan temujanji.'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Help Footer */}
        <View style={styles.helpFooter}>
          <View style={styles.helpCard}>
            <Ionicons name="help-circle" size={24} color={colors.secondary} />
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>
                {language === 'en' ? 'Need More Help?' : 'Perlukan Bantuan Lagi?'}
              </Text>
              <Text style={styles.helpDescription}>
                {language === 'en' 
                  ? 'Contact our support team for personalized assistance'
                  : 'Hubungi pasukan sokongan kami untuk bantuan yang diperibadikan'
                }
              </Text>
            </View>
            <InteractiveFeedback
              onPress={() => navigation?.navigate('ContactSupport')}
              feedbackType="scale"
              hapticType="medium"
            >
              <View style={styles.helpButton}>
                <Text style={styles.helpButtonText}>
                  {language === 'en' ? 'Get Help' : 'Dapatkan Bantuan'}
                </Text>
              </View>
            </InteractiveFeedback>
          </View>
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

  // Welcome Section
  welcomeSection: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sections
  sectionsContainer: {
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Tip Box
  tipBox: {
    backgroundColor: colors.infoAlpha,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Help Footer
  helpFooter: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  helpCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  helpText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  helpButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  bottomPadding: {
    height: 20,
  },
});