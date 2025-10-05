import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { colors } from '../constants/colors';
import { Asset } from 'expo-asset';

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadingComplete }) => {
  const logoOpacity = new Animated.Value(0);
  const logoScale = new Animated.Value(0.8);
  const taglineOpacity = new Animated.Value(0);

  useEffect(() => {
    // Preload onboarding images while showing splash
    const preloadAssets = async () => {
      try {
        await Asset.loadAsync([
          require('../../assets/welcome-onboarding-flow/slide-1.png'),
          require('../../assets/welcome-onboarding-flow/slide-2.png'),
          require('../../assets/welcome-onboarding-flow/slide-3.png'),
          require('../../assets/welcome-onboarding-flow/slide-4.png'),
          require('../../assets/welcome-onboarding-flow/slide-5.png'),
        ]);
      } catch (error) {
      }
    };

    // Start preloading immediately
    preloadAssets();

    // Logo animation sequence
    Animated.sequence([
      // Small delay before starting
      Animated.delay(300),
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      // Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 800,
        delay: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to onboarding after animation and preloading
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 4500); // Increased duration for better brand visibility

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, taglineOpacity, onLoadingComplete]);

  return (
    <SafeAreaWrapper gradientVariant="splash" style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          {/* App Logo */}
          <Image
            source={require('../../assets/nely-splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View 
          style={[
            styles.taglineContainer,
            { opacity: taglineOpacity }
          ]}
        >
          <Text style={styles.tagline}>
            Keep your family connected to what matters most
          </Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

// Loading dot component with animation
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const dotOpacity = new Animated.Value(0.3);

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, [dotOpacity, delay]);

  return (
    <Animated.View 
      style={[
        styles.dot,
        { opacity: dotOpacity }
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 240,
    height: 240,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  taglineContainer: {
    marginBottom: 80,
  },
  tagline: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 4,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
});