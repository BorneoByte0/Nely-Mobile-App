import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { LanguageToggle } from '../components/LanguageToggle';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  icon: string; // Ionicon name
  titleEn: string;
  titleMs: string;
  subtitleEn: string;
  subtitleMs: string;
  backgroundColor: string;
  iconColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: 'people',
    titleEn: 'Keep your family connected to what matters most',
    titleMs: 'Pastikan keluarga anda berhubung dengan perkara yang paling penting',
    subtitleEn: 'Track elderly health together, wherever you are',
    subtitleMs: 'Pantau kesihatan warga emas bersama-sama, di mana sahaja anda berada',
    backgroundColor: colors.primaryAlpha,
    iconColor: colors.primary,
  },
  {
    id: 2,
    icon: 'medical',
    titleEn: 'Simple health tracking for peace of mind',
    titleMs: 'Pengesanan kesihatan mudah untuk ketenangan fikiran',
    subtitleEn: 'Blood pressure, medications, appointments - all in one place',
    subtitleMs: 'Tekanan darah, ubat-ubatan, temujanji - semua dalam satu tempat',
    backgroundColor: colors.successAlpha,
    iconColor: colors.success,
  },
  {
    id: 3,
    icon: 'phone-portrait',
    titleEn: 'Your whole family stays informed',
    titleMs: 'Seluruh keluarga anda sentiasa dimaklumkan',
    subtitleEn: 'Real-time updates when health data is recorded',
    subtitleMs: 'Kemaskini masa sebenar apabila data kesihatan direkodkan',
    backgroundColor: colors.secondaryAlpha,
    iconColor: colors.secondary,
  },
  {
    id: 4,
    icon: 'location',
    titleEn: 'Because family care shouldn\'t be complicated',
    titleMs: 'Kerana penjagaan keluarga tidak sepatutnya rumit',
    subtitleEn: 'Focuses on simplicity and reducing family stress',
    subtitleMs: 'Fokus pada kesederhanaan dan mengurangkan tekanan keluarga',
    backgroundColor: colors.infoAlpha,
    iconColor: colors.info,
  },
  {
    id: 5,
    icon: 'star',
    titleEn: 'Ready to start caring together?',
    titleMs: 'Bersedia untuk mula menjaga bersama-sama?',
    subtitleEn: 'Join thousands of Malaysian families already using Nely',
    subtitleMs: 'Sertai ribuan keluarga Malaysia yang sudah menggunakan Nely',
    backgroundColor: colors.primaryAlpha,
    iconColor: colors.primary,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { language, texts } = useLanguage();

  // Memoize image sources for better performance
  const slideImages = useMemo(() => ({
    1: require('../../assets/welcome-onboarding-flow/slide-1.png'),
    2: require('../../assets/welcome-onboarding-flow/slide-2.png'),
    3: require('../../assets/welcome-onboarding-flow/slide-3.png'),
    4: require('../../assets/welcome-onboarding-flow/slide-4.png'),
    5: require('../../assets/welcome-onboarding-flow/slide-5.png'),
  }), []);

  // Function to get slide image
  const getSlideImage = (slideId: number) => {
    return slideImages[slideId as keyof typeof slideImages] || slideImages[1];
  };

  // Animation values
  const slideAnimations = useRef(slides.map(() => new Animated.Value(0.3))).current;
  const scaleAnimations = useRef(slides.map(() => new Animated.Value(0.8))).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  // Dot animations
  const dotAnimations = useRef(slides.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))).current;

  // Animate slide entrance
  useEffect(() => {
    animateSlideEntrance(currentSlide);
  }, [currentSlide]);

  const animateSlideEntrance = (slideIndex: number) => {
    // Animate slide content
    slideAnimations.forEach((anim, index) => {
      if (index === slideIndex) {
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimations[index], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        anim.setValue(0.3);
        scaleAnimations[index].setValue(0.8);
      }
    });

    // Animate dots smoothly
    dotAnimations.forEach((dotAnim, index) => {
      Animated.timing(dotAnim, {
        toValue: index === slideIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);

    if (roundIndex !== currentSlide) {
      setCurrentSlide(roundIndex);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    scrollViewRef.current?.scrollTo({
      x: slideIndex * width,
      animated: true,
    });
  };

  const handleGetStarted = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaWrapper gradientVariant="onboarding" style={styles.container}>
      {/* Header with Language Toggle */}
      <View style={styles.header}>
        <InteractiveFeedback onPress={handleSkip} feedbackType="scale" hapticType="light">
          <View style={styles.skipButton}>
            <Text style={styles.skipText}>
              {texts.onboarding.skip}
            </Text>
          </View>
        </InteractiveFeedback>
        <LanguageToggle />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Animated.View
              style={[
                styles.slideContainer,
                {
                  opacity: slideAnimations[index],
                  transform: [
                    { scale: scaleAnimations[index] },
                    {
                      translateY: slideAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ImageBackground
                source={getSlideImage(slide.id)}
                style={styles.slideContent}
                resizeMode="cover"
              >
                {/* Light overlay for text readability */}
                <View style={styles.imageOverlay} />

                {/* Enhanced Content - moved to bottom */}
                <View style={styles.textContent}>
                  <Text style={styles.title}>
                    {language === 'en' ? slide.titleEn : slide.titleMs}
                  </Text>
                  <Text style={styles.subtitle}>
                    {language === 'en' ? slide.subtitleEn : slide.subtitleMs}
                  </Text>
                </View>
              </ImageBackground>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Modernized Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Enhanced Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <InteractiveFeedback
              key={index}
              onPress={() => goToSlide(index)}
              feedbackType="scale"
              hapticType="light"
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [colors.gray300, colors.primary],
                    }),
                    transform: [{
                      scaleX: dotAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2],
                      }),
                    }],
                    shadowOpacity: dotAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.activeDotInner,
                    {
                      opacity: dotAnimations[index],
                    },
                  ]}
                />
              </Animated.View>
            </InteractiveFeedback>
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {/* Previous Button */}
          {currentSlide > 0 && (
            <InteractiveFeedback
              onPress={() => goToSlide(currentSlide - 1)}
              feedbackType="scale"
              hapticType="light"
            >
              <View style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={styles.navButtonText}>
                  {language === 'en' ? 'Previous' : 'Sebelumnya'}
                </Text>
              </View>
            </InteractiveFeedback>
          )}

          {/* Next/Get Started Button */}
          <InteractiveFeedback
            onPress={currentSlide === slides.length - 1 ? handleGetStarted : () => goToSlide(currentSlide + 1)}
            feedbackType="scale"
            hapticType="medium"
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>
                {currentSlide === slides.length - 1
                  ? texts.onboarding.getStarted
                  : (language === 'en' ? 'Next' : 'Seterusnya')
                }
              </Text>
              <Ionicons
                name={currentSlide === slides.length - 1 ? "checkmark" : "chevron-forward"}
                size={20}
                color={colors.white}
              />
            </LinearGradient>
          </InteractiveFeedback>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 20,
  },
  slideContainer: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 40,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 32,
  },


  // Enhanced Text Content
  textContent: {
    alignItems: 'center',
    maxWidth: 320,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 17,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Enhanced Bottom Section
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  activeDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },

  // Navigation Container
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});