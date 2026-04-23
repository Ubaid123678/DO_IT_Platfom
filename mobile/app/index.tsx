import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useColorScheme } from 'react-native';

const ONBOARDING_KEY = 'hasSeenOnboarding';
const TOKEN_KEYS = ['accessToken', 'token', 'authToken', '@accessToken', '@auth_token'];
const ROLE_KEYS = ['role', 'userRole', '@role', 'authRole'];
const USER_KEYS = ['user', 'authUser', 'currentUser', '@user'];

const readFirstValue = async (keys: string[]): Promise<string | null> => {
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
};

const resolveRoleFromStorage = async (): Promise<'client' | 'provider' | null> => {
  const role = await readFirstValue(ROLE_KEYS);
  if (role === 'client' || role === 'provider') {
    return role;
  }

  const userRaw = await readFirstValue(USER_KEYS);
  if (!userRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(userRaw) as { role?: string; user?: { role?: string } };
    const parsedRole = parsed.role ?? parsed.user?.role;
    if (parsedRole === 'client' || parsedRole === 'provider') {
      return parsedRole;
    }
  } catch {
    return null;
  }

  return null;
};

type StoredUser = {
  role?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export default function SplashScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const bgColor = isDark ? '#0D1F1E' : '#1A9E8F';
  const styles = makeStyles(bgColor);

  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 450,
          delay: 0,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 450,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    );

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 450,
          delay: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

        if (!hasSeenOnboarding) {
          router.replace('/(onboarding)/welcome');
          return;
        }

        const authToken = await readFirstValue(TOKEN_KEYS);
        if (!authToken) {
          router.replace('/(auth)/login');
          return;
        }

        const userRaw = await readFirstValue(USER_KEYS);
        if (userRaw) {
          try {
            const parsed = JSON.parse(userRaw) as StoredUser;

            if (parsed.emailVerified === false || parsed.phoneVerified === false) {
              router.replace({
                pathname: '/(auth)/verification-status',
                params: {
                  email: parsed.email ?? '',
                  phone: parsed.phone ?? '',
                  emailVerified: String(Boolean(parsed.emailVerified)),
                  phoneVerified: String(Boolean(parsed.phoneVerified)),
                },
              });
              return;
            }

            if (parsed.role === 'pending') {
              router.replace('/(onboarding)/role-select');
              return;
            }
          } catch {
            // Fall through to role resolution below.
          }
        }

        const role = await resolveRoleFromStorage();
        if (role === 'provider') {
          router.replace('/(provider)/home');
          return;
        }

        if (role === 'client') {
          router.replace('/(client)/home');
          return;
        }

        router.replace('/(auth)/login');
      })();
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.centerContent}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>D</Text>
        </View>

        <Text style={styles.brandText}>Do It</Text>
        <Text style={styles.taglineText}>Any service. Anywhere.</Text>
      </View>

      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
      </View>
    </View>
  );
}

const makeStyles = (bgColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 3,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoLetter: {
      fontSize: 40,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    brandText: {
      marginTop: 16,
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    taglineText: {
      marginTop: 6,
      fontSize: 14,
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
    },
    dotsRow: {
      position: 'absolute',
      bottom: 60,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 6,
      backgroundColor: '#FFFFFF',
    },
  });
