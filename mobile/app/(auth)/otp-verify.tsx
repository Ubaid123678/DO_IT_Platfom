import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

import { authService, type OtpFlowType } from '@/src/services/authService';
import { Colors, type AppColors } from '@/src/theme/colors';

const OTP_LENGTH = 6;
const INITIAL_TIMER = 60;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const maskContact = (value: string, type: OtpFlowType): string => {
  if (!value) {
    return '';
  }

  if (type === 'email') {
    const [name, domain] = value.split('@');
    if (!domain || !name) {
      return value;
    }
    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(0, name.length - 2))}@${domain}`;
  }

  if (value.length <= 4) {
    return value;
  }

  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

export default function OtpVerifyScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const params = useLocalSearchParams<{
    type?: string;
    contact?: string;
    email?: string;
    phone?: string;
    nextType?: string;
    nextContact?: string;
    nextRoute?: string;
    debugOtp?: string;
    nextDebugOtp?: string;
    role?: string;
  }>();

  const flowType: OtpFlowType =
    params.type === 'email' || params.type === 'phone' || params.type === 'reset'
      ? params.type
      : params.phone
        ? 'phone'
        : 'email';

  const rawContact = params.contact ?? params.email ?? params.phone ?? '';
  const nextType = params.nextType === 'email' || params.nextType === 'phone' ? params.nextType : undefined;
  const nextContact = params.nextContact;
  const nextDebugOtp = params.nextDebugOtp;
  const userRole = params.role ?? '';
  const contact = useMemo(() => maskContact(rawContact, flowType), [flowType, rawContact]);
  const resolvedNextRoute = (params.nextRoute || '/(auth)/login') as Href;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugOtp, setDebugOtp] = useState(params.debugOtp ?? '');

  const otpRefs = useRef<Array<TextInput | null>>([]);

  const allFilled = otp.every((digit) => digit.length === 1);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timer]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const redirectAfterVerification = async () => {
      if (userRole && userRole !== 'pending') {
        try {
          const [[, pendingEmail], [, pendingPassword]] = await AsyncStorage.multiGet(['pendingAuthEmail', 'pendingAuthPassword']);
          if (pendingEmail && pendingPassword) {
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
            return;
          }
        } catch {
          // fall through to default route
        }
      }

      router.replace(resolvedNextRoute);
    };

    const timeoutId = setTimeout(redirectAfterVerification, 1500);
    return () => clearTimeout(timeoutId);
  }, [resolvedNextRoute, router, success, userRole]);

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = cleanValue;
    setOtp(nextOtp);
    setError('');

    if (cleanValue && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') {
      return;
    }

    if (otp[index]) {
      return;
    }

    if (index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!allFilled) {
      setError('Enter the full 6-digit code.');
      return;
    }

    if (!rawContact) {
      setError('Contact information is missing for verification.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authService.verifyOTP({
        type: flowType,
        contact: rawContact,
        otp: otp.join(''),
      });

      if (nextType && nextContact) {
        router.replace({
          pathname: '/(auth)/otp-verify',
          params: {
            type: nextType,
            contact: nextContact,
            nextRoute: resolvedNextRoute as string,
            debugOtp: nextDebugOtp,
          },
        });
        return;
      }

      setSuccess(true);
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !rawContact) {
      return;
    }

    try {
      setError('');
      const response = await authService.resendOTP({
        type: flowType,
        contact: rawContact,
      });

      const resentOtp = response.data.data.debugOtp ?? '';
      setDebugOtp(resentOtp);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(INITIAL_TIMER);
      otpRefs.current[0]?.focus();
    } catch {
      setError('Unable to resend code right now.');
    }
  };

  const isEmailFlow = flowType === 'email';

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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify Account</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.contentWrap}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isEmailFlow ? 'mail' : 'phone-portrait'}
                size={32}
                color={C.primary}
              />
            </View>

            <Text style={styles.title}>{isEmailFlow ? 'Check Your Email' : 'Check Your Phone'}</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to{`\n`}</Text>
            <Text style={styles.contactText}>{contact || 'your contact'}</Text>
            <Text style={styles.contactHintText}>{rawContact || ''}</Text>

            {debugOtp ? (
              <View style={styles.debugCodeWrap}>
                <Text style={styles.debugCodeLabel}>Testing Code</Text>
                <Text style={styles.debugCodeValue}>{debugOtp}</Text>
              </View>
            ) : null}

            <View style={styles.otpRow}>
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = digit.length > 0;

                return (
                  <TextInput
                    key={`otp-${index}`}
                    ref={(ref) => {
                      otpRefs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    maxLength={1}
                    keyboardType="number-pad"
                    style={[
                      styles.otpInput,
                      isFocused
                        ? styles.otpInputFocused
                        : isFilled
                          ? styles.otpInputFilled
                          : styles.otpInputIdle,
                    ]}
                    selectionColor={C.primary}
                  />
                );
              })}
            </View>

            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>Resend available in</Text>
              <Text style={styles.timerValue}>{formatTime(timer)}</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.verifyButton, { backgroundColor: allFilled ? C.primary : C.textHint }]}
              onPress={handleVerify}
              disabled={loading || !allFilled}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>Didn't receive code? </Text>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                <Text style={[styles.resendAction, { color: timer === 0 ? C.primary : C.textHint }]}>Resend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {success ? (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color="white" />
          </View>
          <Text style={styles.successText}>Verified!</Text>
        </View>
      ) : null}
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
      flexGrow: 1,
      paddingHorizontal: 32,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    headerSpacer: {
      width: 32,
      height: 32,
    },
    contentWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
    },
    title: {
      marginTop: 20,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: C.textPrimary,
    },
    subtitle: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 22,
    },
    contactText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    contactHintText: {
      marginTop: 4,
      textAlign: 'center',
      fontSize: 12,
      color: C.textSecondary,
    },
    debugCodeWrap: {
      marginTop: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      paddingVertical: 10,
      paddingHorizontal: 14,
      alignItems: 'center',
    },
    debugCodeLabel: {
      fontSize: 12,
      color: C.textSecondary,
      marginBottom: 2,
    },
    debugCodeValue: {
      fontSize: 20,
      fontWeight: '700',
      color: C.primary,
      letterSpacing: 2,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 32,
      gap: 10,
      width: '100%',
    },
    otpInput: {
      width: 48,
      height: 56,
      borderRadius: 10,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: C.textPrimary,
      borderWidth: 1.5,
    },
    otpInputIdle: {
      backgroundColor: C.inputBg,
      borderColor: C.inputBorder,
    },
    otpInputFilled: {
      backgroundColor: C.inputBg,
      borderColor: C.primary,
    },
    otpInputFocused: {
      backgroundColor: C.primaryLight,
      borderColor: C.primary,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 16,
    },
    timerLabel: {
      fontSize: 13,
      color: C.textSecondary,
    },
    timerValue: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    verifyButton: {
      marginTop: 32,
      width: '100%',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifyButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    resendRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resendPrompt: {
      fontSize: 13,
      color: C.textSecondary,
    },
    resendAction: {
      fontSize: 13,
      fontWeight: '600',
    },
    errorText: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 13,
      color: C.error,
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successText: {
      marginTop: 20,
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
    },
  });
