import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/authService';
import { Colors, type AppColors } from '@/src/theme/colors';

const toBool = (value: string | undefined): boolean => value === 'true';

export default function VerificationStatusScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const params = useLocalSearchParams<{
    email?: string;
    phone?: string;
    emailVerified?: string;
    phoneVerified?: string;
    role?: string;
  }>();

  const email = params.email ?? '';
  const phone = params.phone ?? '';
  const emailVerified = toBool(params.emailVerified);
  const phoneVerified = toBool(params.phoneVerified);
  const userRole = params.role ?? 'pending';
  const hasRole = userRole !== 'pending';

  const statusText = useMemo(() => {
    if (!emailVerified && !phoneVerified) {
      return 'Email and phone verification are required before role selection.';
    }

    if (!emailVerified) {
      return 'Your email is not verified yet.';
    }

    if (!phoneVerified) {
      return 'Your phone number is not verified yet.';
    }

    return 'All verifications are complete. Continue to role selection.';
  }, [emailVerified, phoneVerified]);

  const goToEmailVerification = () => {
    if (!email) {
      router.replace('/(auth)/login');
      return;
    }

    const commonParams = {
      type: 'email' as const,
      contact: email,
      role: userRole,
    };

    if (phoneVerified) {
      router.push({
        pathname: '/(auth)/otp-verify',
        params: {
          ...commonParams,
          nextRoute: '/(onboarding)/role-select',
        },
      });
    } else {
      router.push({
        pathname: '/(auth)/otp-verify',
        params: {
          ...commonParams,
          nextType: 'phone',
          nextContact: phone,
          nextRoute: '/(onboarding)/role-select',
        },
      });
    }
  };

  const goToPhoneVerification = () => {
    if (!phone) {
      router.replace('/(auth)/login');
      return;
    }

    router.push({
      pathname: '/(auth)/otp-verify',
      params: {
        type: 'phone',
        contact: phone,
        role: userRole,
        nextRoute: '/(onboarding)/role-select',
      },
    });
  };

  const continueToRole = () => {
    router.replace('/(onboarding)/role-select');
  };

  const continueToDashboard = async () => {
    try {
      const [[, pendingEmail], [, pendingPassword]] = await AsyncStorage.multiGet(['pendingAuthEmail', 'pendingAuthPassword']);
      if (!pendingEmail || !pendingPassword) {
        router.replace('/(auth)/login');
        return;
      }
      const response = await authService.login({ email: pendingEmail, password: pendingPassword });
      const payload = response.data.data;
      await AsyncStorage.multiSet([
        ['accessToken', payload.accessToken],
        ['refreshToken', payload.refreshToken],
        ['role', payload.user.role],
        ['user', JSON.stringify(payload.user)],
      ]);
      await AsyncStorage.multiRemove(['pendingAuthEmail', 'pendingAuthPassword']);
      router.replace(payload.user.role === 'provider' ? '/(provider)/home' : '/(client)/home');
    } catch {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={36} color={C.primary} />
        </View>

        <Text style={styles.title}>Complete Verification</Text>
        <Text style={styles.subtitle}>{statusText}</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Email</Text>
            <Text style={[styles.statusValue, { color: emailVerified ? C.success : C.error }]}>
              {emailVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Phone</Text>
            <Text style={[styles.statusValue, { color: phoneVerified ? C.success : C.error }]}>
              {phoneVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>

        {!emailVerified ? (
          <TouchableOpacity style={styles.primaryButton} onPress={goToEmailVerification}>
            <Text style={styles.primaryButtonText}>Verify Email</Text>
          </TouchableOpacity>
        ) : null}

        {emailVerified && !phoneVerified ? (
          <TouchableOpacity style={styles.primaryButton} onPress={goToPhoneVerification}>
            <Text style={styles.primaryButtonText}>Verify Phone</Text>
          </TouchableOpacity>
        ) : null}

        {!emailVerified && !phoneVerified ? (
          <TouchableOpacity style={styles.secondaryButton} disabled>
            <Text style={styles.secondaryButtonText}>Verify Phone (after email)</Text>
          </TouchableOpacity>
        ) : null}

        {emailVerified && phoneVerified && !hasRole ? (
          <TouchableOpacity style={styles.primaryButton} onPress={continueToRole}>
            <Text style={styles.primaryButtonText}>Continue to Role Selection</Text>
          </TouchableOpacity>
        ) : null}

        {emailVerified && phoneVerified && hasRole ? (
          <TouchableOpacity style={styles.primaryButton} onPress={continueToDashboard}>
            <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backText}>Back to Login</Text>
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
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
      gap: 14,
    },
    iconCircle: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    statusCard: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      backgroundColor: C.card,
      padding: 14,
      gap: 12,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLabel: {
      fontSize: 14,
      color: C.textSecondary,
      fontWeight: '600',
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    statusDivider: {
      height: 1,
      backgroundColor: C.divider,
    },
    primaryButton: {
      marginTop: 8,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: C.textHint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
    },
    backText: {
      marginTop: 10,
      textAlign: 'center',
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
