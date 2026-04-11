import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const ACTIVE_DOT_WIDTH = 24;
const INACTIVE_DOT_WIDTH = 8;

const slides: Array<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
}> = [
  {
    icon: 'briefcase-outline',
    title: 'Get Any Service Done',
    desc: 'Post any job - local or digital - and get proposals from nearby verified providers.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified Providers Only',
    desc: 'Every provider is KYC-verified. Your safety and quality guaranteed.',
  },
  {
    icon: 'wallet-outline',
    title: 'Pay Safely Worldwide',
    desc: 'Built-in wallet with automatic currency conversion. Pay in your currency.',
  },
];

export default function WelcomeOnboardingScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const [currentSlide, setCurrentSlide] = useState(0);

  const dots = useRef([
    new Animated.Value(ACTIVE_DOT_WIDTH),
    new Animated.Value(INACTIVE_DOT_WIDTH),
    new Animated.Value(INACTIVE_DOT_WIDTH),
  ]).current;

  useEffect(() => {
    dots.forEach((dot, index) => {
      Animated.timing(dot, {
        toValue: index === currentSlide ? ACTIVE_DOT_WIDTH : INACTIVE_DOT_WIDTH,
        duration: 220,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSlide, dots]);

  const activeSlide = useMemo(() => slides[currentSlide], [currentSlide]);

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.illustrationCard}>
          <View style={styles.iconCircle}>
            <Ionicons name={activeSlide.icon} size={40} color={C.primary} />
          </View>
        </View>

        <View style={styles.dotsRow}>
          {dots.map((dot, index) => {
            const isActive = index === currentSlide;
            const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
              width: dot,
            };

            return (
              <Animated.View
                key={`dot-${index}`}
                style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive, animatedStyle]}
              />
            );
          })}
        </View>

        <Text style={styles.title}>{activeSlide.title}</Text>
        <Text style={styles.desc}>{activeSlide.desc}</Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={currentSlide < slides.length - 1 ? handleNext : handleGetStarted}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>{currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    topRow: {
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 6,
    },
    skipText: {
      fontSize: 14,
      color: C.primary,
      fontWeight: '600',
    },
    contentWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 36,
    },
    illustrationCard: {
      marginHorizontal: 24,
      height: 220,
      width: '100%',
      maxWidth: 360,
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      backgroundColor: C.primary,
    },
    dotInactive: {
      backgroundColor: C.cardBorder,
    },
    title: {
      marginTop: 24,
      paddingHorizontal: 24,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
    },
    desc: {
      marginTop: 8,
      paddingHorizontal: 32,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 22,
      color: C.textSecondary,
    },
    ctaButton: {
      marginHorizontal: 20,
      marginTop: 32,
      width: '90%',
      maxWidth: 360,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primary,
    },
    ctaText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });
