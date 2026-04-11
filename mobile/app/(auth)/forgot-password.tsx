import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!submitted) {
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();

    const timeoutId = setTimeout(() => {
      router.push(
        resetToken
          ? `/(auth)/reset-password?token=${encodeURIComponent(resetToken)}`
          : '/(auth)/reset-password'
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [contact, fadeAnim, resetToken, router, submitted]);

  const handleSendResetCode = async () => {
    const contactValue = contact.trim();

    if (!contactValue) {
      setError('Enter your email or phone number.');
      return;
    }

    if (!contactValue.includes('@')) {
      setError('Please enter your email to reset password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authService.sendResetCode(contactValue);
      const tokenFromApi = response.data.data.debugResetToken ?? '';
      setResetToken(tokenFromApi);
      setSubmitted(true);
    } catch {
      setError('Unable to send reset code. Please try again.');
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
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Animated.View style={[styles.contentWrap, submitted ? { opacity: fadeAnim } : null]}>
            <View style={[styles.iconCircle, submitted ? styles.successIconCircle : null]}>
              <Ionicons
                name={submitted ? 'checkmark' : 'key'}
                size={submitted ? 40 : 36}
                color={submitted ? 'white' : C.primary}
              />
            </View>

            <Text style={styles.title}>{submitted ? 'Code Sent!' : 'Reset Your Password'}</Text>
            <Text style={styles.subtitle}>
              {submitted
                ? 'Check your email or SMS for the 6-digit code.'
                : "Enter your registered email or phone. We'll send you a reset code."}
            </Text>

            {!submitted ? (
              <>
                <View style={styles.inputRow}>
                  <Ionicons name="at-outline" size={20} color={C.textHint} style={styles.inputIcon} />
                  <TextInput
                    value={contact}
                    onChangeText={setContact}
                    style={styles.inputText}
                    placeholder="Email or phone number"
                    placeholderTextColor={C.textHint}
                    autoCapitalize="none"
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.sendButton} onPress={handleSendResetCode} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.loginRow}>
                  <Text style={styles.loginPrompt}>Remembered it?</Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Animated.View>
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
      flexGrow: 1,
      paddingHorizontal: 32,
      paddingBottom: 24,
    },
    headerRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
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
      alignItems: 'center',
      marginTop: 60,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    successIconCircle: {
      backgroundColor: C.success,
    },
    title: {
      marginTop: 24,
      fontSize: 22,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    inputRow: {
      marginTop: 36,
      width: '100%',
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    inputIcon: {
      marginRight: 10,
    },
    inputText: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    errorText: {
      marginTop: 8,
      width: '100%',
      color: C.error,
      fontSize: 13,
      textAlign: 'center',
    },
    sendButton: {
      marginTop: 24,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    loginRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    loginPrompt: {
      fontSize: 13,
      color: C.textSecondary,
    },
    loginLink: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
  });
