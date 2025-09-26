import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';

interface Props {
  navigation?: any;
}

export function ContactSupportScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useModernAlert();

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
  const [supportRequest, setSupportRequest] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  const categories = [
    { value: 'general', labelEn: 'General Question', labelMs: 'Soalan Umum' },
    { value: 'technical', labelEn: 'Technical Issue', labelMs: 'Isu Teknikal' },
    { value: 'account', labelEn: 'Account Help', labelMs: 'Bantuan Akaun' },
    { value: 'health', labelEn: 'Health Data', labelMs: 'Data Kesihatan' },
    { value: 'billing', labelEn: 'Billing Question', labelMs: 'Soalan Bil' }
  ];

  const contactMethods = [
    {
      type: 'email',
      title: language === 'en' ? 'Email Support' : 'Sokongan E-mel',
      subtitle: 'borneobytesabah@gmail.com',
      description: language === 'en'
        ? 'Get help via email within 24 hours'
        : 'Dapatkan bantuan melalui e-mel dalam 24 jam',
      icon: 'mail',
      color: colors.secondary
    }
  ];

  const handleSubmitRequest = async () => {
    if (!supportRequest.subject.trim() || !supportRequest.message.trim()) {
      showAlert({
        title: language === 'en' ? 'Missing Information' : 'Maklumat Hilang',
        message: language === 'en'
          ? 'Please fill in both subject and message fields.'
          : 'Sila isi kedua-dua medan subjek dan mesej.',
        type: 'warning',
        buttons: [{
          text: language === 'en' ? 'OK' : 'Baik',
          style: 'primary',
          onPress: hideAlert
        }]
      });
      return;
    }

    setIsLoading(true);
    startDotsAnimation();
    hapticFeedback.success();

    // Simulate request submission
    setTimeout(() => {
      setIsLoading(false);
      stopDotsAnimation();
      showAlert({
        title: language === 'en' ? 'Request Submitted' : 'Permintaan Dihantar',
        message: language === 'en'
          ? 'Your support request has been submitted. We\'ll get back to you within 24 hours.'
          : 'Permintaan sokongan anda telah dihantar. Kami akan menghubungi anda dalam 24 jam.',
        type: 'success',
        buttons: [
          {
            text: language === 'en' ? 'OK' : 'Baik',
            style: 'primary',
            onPress: () => {
              setSupportRequest({ subject: '', message: '', category: 'general' });
              navigation?.goBack();
            }
          }
        ]
      });
    }, 2000);
  };

  const handleContactMethod = (method: string, contact: string) => {
    hapticFeedback.light();
    switch (method) {
      case 'email':
        Linking.openURL(`mailto:${contact}?subject=Nely Support Request`);
        break;
      case 'phone':
        Linking.openURL(`tel:${contact.replace(/[^+\d]/g, '')}`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${contact.replace(/[^+\d]/g, '')}&text=Hello, I need help with Nely app`);
        break;
    }
  };

  return (
    <SafeAreaWrapper gradientVariant="profile" includeTabBarPadding={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.secondary, colors.info]}
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
                {language === 'en' ? 'Contact Support' : 'Hubungi Sokongan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'We\'re here to help you' : 'Kami di sini untuk membantu anda'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content - always visible, overlay will cover when loading */}
          <>
            {/* Quick Contact Methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Quick Contact' : 'Hubungan Pantas'}
              </Text>
              
              {contactMethods.map((method) => (
                <InteractiveFeedback
                  key={method.type}
                  onPress={() => handleContactMethod(method.type, method.subtitle)}
                  feedbackType="scale"
                  hapticType="light"
                >
                  <View style={styles.contactMethodCard}>
                    <View style={[styles.contactIcon, { backgroundColor: `${method.color}15` }]}>
                      <Ionicons name={method.icon as any} size={24} color={method.color} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactTitle}>{method.title}</Text>
                      <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
                      <Text style={styles.contactDescription}>{method.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </InteractiveFeedback>
              ))}
            </View>

            {/* Support Request Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Submit Support Request' : 'Hantar Permintaan Sokongan'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Category' : 'Kategori'}
                </Text>
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <InteractiveFeedback
                      key={category.value}
                      onPress={() => {
                        hapticFeedback.light();
                        setSupportRequest(prev => ({ ...prev, category: category.value }));
                      }}
                      feedbackType="scale"
                      hapticType="light"
                    >
                      <View style={[
                        styles.categoryButton,
                        supportRequest.category === category.value && styles.categoryButtonSelected
                      ]}>
                        <Text style={[
                          styles.categoryText,
                          supportRequest.category === category.value && styles.categoryTextSelected
                        ]}>
                          {language === 'en' ? category.labelEn : category.labelMs}
                        </Text>
                      </View>
                    </InteractiveFeedback>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Subject' : 'Subjek'} *
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={supportRequest.subject}
                  onChangeText={(value) => setSupportRequest(prev => ({ ...prev, subject: value }))}
                  placeholder={language === 'en' ? 'Brief description of your issue' : 'Penerangan ringkas mengenai isu anda'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'Message' : 'Mesej'} *
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={supportRequest.message}
                  onChangeText={(value) => setSupportRequest(prev => ({ ...prev, message: value }))}
                  placeholder={language === 'en' 
                    ? 'Please provide detailed information about your issue...'
                    : 'Sila berikan maklumat terperinci mengenai isu anda...'
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Frequently Asked Questions' : 'Soalan Lazim'}
              </Text>
              
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>
                  {language === 'en' 
                    ? 'How do I add a family member?'
                    : 'Bagaimana saya menambah ahli keluarga?'
                  }
                </Text>
                <Text style={styles.faqAnswer}>
                  {language === 'en'
                    ? 'Go to Profile → Invite Family Members and send an invitation via email.'
                    : 'Pergi ke Profil → Jemput Ahli Keluarga dan hantar jemputan melalui e-mel.'
                  }
                </Text>
              </View>


              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>
                  {language === 'en'
                    ? 'Is my health data secure?'
                    : 'Adakah data kesihatan saya selamat?'
                  }
                </Text>
                <Text style={styles.faqAnswer}>
                  {language === 'en'
                    ? 'Yes, all health data is encrypted and stored securely according to Malaysian healthcare standards.'
                    : 'Ya, semua data kesihatan dienkripsi dan disimpan dengan selamat mengikut piawaian penjagaan kesihatan Malaysia.'
                  }
                </Text>
              </View>
            </View>
          </>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Submit Button */}
        <View style={styles.footer}>
          <InteractiveFeedback
            onPress={isLoading ? undefined : handleSubmitRequest}
            feedbackType="scale"
            hapticType="medium"
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {isLoading ? (
                <View style={styles.loadingDots}>
                  <Animated.View style={[styles.dotWhite, { opacity: dot1Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot2Anim }]} />
                  <Animated.View style={[styles.dotWhite, { opacity: dot3Anim }]} />
                </View>
              ) : (
                <>
                  <Ionicons name="send" size={20} color={colors.white} />
                  <Text style={styles.submitButtonText}>
                    {language === 'en' ? 'Submit Request' : 'Hantar Permintaan'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </InteractiveFeedback>
        </View>


      {/* Modern Alert */}
      {alertConfig && (
        <ModernAlert
          visible={visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
          onClose={hideAlert}
        />
      )}
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
    marginBottom: 16,
  },

  // Contact Methods
  contactMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Form
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.gray100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primaryAlpha,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // FAQ
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  bottomPadding: {
    height: 20,
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
});