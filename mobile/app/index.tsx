import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, useColorScheme } from 'react-native';

ExpoSplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'hasSeenOnboarding';
const TOKEN_KEYS = ['accessToken', 'token', 'authToken', '@accessToken', '@auth_token'];
const ROLE_KEYS = ['role', 'userRole', '@role', 'authRole'];
const USER_KEYS = ['user', 'authUser', 'currentUser', '@user'];

const readFirstValue = async (keys: string[]): Promise<string | null> => {
    for (const key of keys) {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                return value;
            }
        } catch (e) {
            console.warn(`AsyncStorage.getItem(${key}) failed:`, e);
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
    } catch (e) {
        console.warn('resolveRoleFromStorage parse error:', e);
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
    const [hasError, setHasError] = useState(false);
    const [navigated, setNavigated] = useState(false);

    const dot1Opacity = useRef(new Animated.Value(0.3)).current;
    const dot2Opacity = useRef(new Animated.Value(0.3)).current;
    const dot3Opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop1 = Animated.loop(
            Animated.sequence([
                Animated.timing(dot1Opacity, { toValue: 1, duration: 450, delay: 0, useNativeDriver: true }),
                Animated.timing(dot1Opacity, { toValue: 0.3, duration: 450, useNativeDriver: true }),
            ]),
        );
        const loop2 = Animated.loop(
            Animated.sequence([
                Animated.timing(dot2Opacity, { toValue: 1, duration: 450, delay: 300, useNativeDriver: true }),
                Animated.timing(dot2Opacity, { toValue: 0.3, duration: 450, useNativeDriver: true }),
            ]),
        );
        const loop3 = Animated.loop(
            Animated.sequence([
                Animated.timing(dot3Opacity, { toValue: 1, duration: 450, delay: 600, useNativeDriver: true }),
                Animated.timing(dot3Opacity, { toValue: 0.3, duration: 450, useNativeDriver: true }),
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

    const navigateOnce = useCallback((path: string | object) => {
        if (navigated) return;
        setNavigated(true);
        router.replace(path);
    }, [router, navigated]);

    const handleFatalError = useCallback((error: unknown, context: string) => {
        console.error(`[SplashScreen] ${context}:`, error);
        setHasError(true);
        if (!navigated) {
            navigateOnce('/(auth)/login');
        }
    }, [navigateOnce, navigated]);

    useEffect(() => {
        let mounted = true;
        const timer = setTimeout(async () => {
            if (!mounted) return;
            try {
                await ExpoSplashScreen.hideAsync();
            } catch (e) {
                console.warn('ExpoSplashScreen.hideAsync failed:', e);
            }

            if (!mounted) return;

            try {
                const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
                if (!mounted) return;

                if (!hasSeenOnboarding) {
                    navigateOnce('/(onboarding)/welcome');
                    return;
                }

                const authToken = await readFirstValue(TOKEN_KEYS);
                if (!mounted) return;

                if (!authToken) {
                    navigateOnce('/(auth)/login');
                    return;
                }

                const userRaw = await readFirstValue(USER_KEYS);
                if (!mounted) return;

                if (userRaw) {
                    try {
                        const parsed = JSON.parse(userRaw) as StoredUser;
                        if (parsed.emailVerified === false || parsed.phoneVerified === false) {
                            navigateOnce({
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
                            navigateOnce('/(onboarding)/role-select');
                            return;
                        }
                    } catch (e) {
                        console.warn('userRaw parse error:', e);
                    }
                }

                const role = await resolveRoleFromStorage();
                if (!mounted) return;

                if (role === 'provider') {
                    navigateOnce('/(provider)/home');
                    return;
                }
                if (role === 'client') {
                    navigateOnce('/(client)/home');
                    return;
                }

                navigateOnce('/(auth)/login');
            } catch (error) {
                handleFatalError(error, 'Splash screen navigation logic');
            }
        }, 1500);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [navigateOnce, handleFatalError]);

    useEffect(() => {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            const msg = args.join(' ');
            if (msg.includes('unhandled') || msg.includes('rejection')) {
                handleFatalError(new Error(msg), 'Console error detected');
            }
        };
        return () => { console.error = originalConsoleError; };
    }, [handleFatalError]);

    if (hasError) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.centerContent}>
                    <Text style={styles.brandText}>Do It</Text>
                    <Text style={styles.taglineText}>Loading...</Text>
                </View>
            </View>
        );
    }

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
        container: { flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' },
        centerContent: { alignItems: 'center', justifyContent: 'center' },
        logoCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
        logoLetter: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
        brandText: { marginTop: 16, fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
        taglineText: { marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
        dotsRow: { position: 'absolute', bottom: 60, flexDirection: 'row', alignItems: 'center' },
        dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 6, backgroundColor: '#FFFFFF' },
    });