import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/authService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometric, setBiometric] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Login currently supports email. Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const payload = response.data.data;

      if (!payload.user.emailVerified || !payload.user.phoneVerified) {
        await AsyncStorage.multiSet([
          ['pendingAuthEmail', email.trim().toLowerCase()],
          ['pendingAuthPassword', password],
        ]);

        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'role', 'user']);

        router.replace({
          pathname: '/(auth)/verification-status',
          params: {
            email: payload.user.email,
            phone: payload.user.phone,
            emailVerified: String(payload.user.emailVerified),
            phoneVerified: String(payload.user.phoneVerified),
          },
        });
        return;
      }

      if (payload.user.role === 'pending') {
        await AsyncStorage.multiSet([
          ['pendingAuthEmail', email.trim().toLowerCase()],
          ['pendingAuthPassword', password],
        ]);

        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'role', 'user']);
        router.replace('/(onboarding)/role-select');
        return;
      }

      await AsyncStorage.multiSet([
        ['accessToken', payload.accessToken],
        ['refreshToken', payload.refreshToken],
        ['role', payload.user.role],
        ['user', JSON.stringify(payload.user)],
      ]);

      if (payload.user.role === 'provider') {
        router.replace('/(provider)/home');
        return;
      }

      router.replace('/(client)/home');
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message === 'string'
          ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Unable to sign in. Please check your credentials and try again.';

      setError(message || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>D</Text>
            </View>
            <Text style={styles.brandText}>Do It</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subText}>Sign in to continue</Text>
          </View>

          <View style={styles.formWrap}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="at-outline" size={20} color={C.textHint} style={styles.leftIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="Enter your email"
                placeholderTextColor={C.textHint}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={C.textHint} style={styles.leftIcon} />
              <TextInput
                style={styles.inputText}
                placeholder="Enter password"
                placeholderTextColor={C.textHint}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass((prev) => !prev)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textHint} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotLinkWrap}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={C.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.biometricRow}
              onPress={() => setBiometric((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons name="finger-print" size={28} color={C.primary} />
              <Text style={styles.biometricText}>Use Biometrics</Text>
              {biometric ? <Ionicons name="checkmark-circle" size={18} color={C.primary} /> : null}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}> OR </Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.9}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    keyboard: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    topSection: {
      marginTop: 48,
      alignItems: 'center',
    },
    logoCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: 'white',
      fontSize: 20,
      fontWeight: '800',
    },
    brandText: {
      marginTop: 8,
      fontSize: 20,
      fontWeight: '700',
      color: C.primary,
      textAlign: 'center',
    },
    welcomeText: {
      marginTop: 20,
      fontSize: 26,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    subText: {
      marginTop: 4,
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
    },
    formWrap: {
      marginTop: 36,
      gap: 16,
    },
    label: {
      marginBottom: -6,
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    inputRow: {
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    leftIcon: {
      marginRight: 10,
    },
    inputText: {
      flex: 1,
      color: C.textPrimary,
      fontSize: 14,
    },
    forgotLinkWrap: {
      alignSelf: 'flex-end',
      marginTop: -8,
    },
    forgotLinkText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    errorBanner: {
      marginTop: -8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 8,
      padding: 10,
      backgroundColor: C.background === '#0D1F1E' ? '#2E1010' : '#FDECEA',
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: C.error,
    },
    signInButton: {
      marginTop: 8,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    biometricRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    biometricText: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
    dividerRow: {
      marginVertical: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: C.divider,
    },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 13,
      color: C.textHint,
    },
    googleButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    googleG: {
      fontSize: 18,
      fontWeight: '800',
      color: '#DB4437',
    },
    googleText: {
      fontSize: 15,
      color: C.textPrimary,
      fontWeight: '600',
    },
    registerRow: {
      marginTop: 16,
      marginBottom: 32,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    registerPrompt: {
      fontSize: 13,
      color: C.textSecondary,
    },
    registerLink: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
  });
