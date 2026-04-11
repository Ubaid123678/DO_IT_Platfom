import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; resetToken?: string }>();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fadeIn = useRef(new Animated.Value(0)).current;

  const token = params.token ?? params.resetToken ?? '';

  const rules = [
    { id: 1, label: 'At least 8 characters', met: pass.length >= 8 },
    { id: 2, label: 'Contains a number', met: /[0-9]/.test(pass) },
    { id: 3, label: 'Contains a special character', met: /[^a-zA-Z0-9]/.test(pass) },
    { id: 4, label: 'Passwords match', met: pass === confirm && confirm.length > 0 },
  ];

  const allRulesMet = useMemo(() => rules.every((rule) => rule.met), [rules]);

  const handleResetPassword = async () => {
    if (!allRulesMet) {
      setError('Please satisfy all password requirements.');
      return;
    }

    if (!token) {
      setError('Reset token is missing. Please request a new reset code.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await authService.resetPassword({
        token,
        newPassword: pass,
      });

      setSuccess(true);
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } catch {
      setError('Unable to reset password. Please try again.');
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
            <Text style={styles.headerTitle}>New Password</Text>
            <View style={styles.headerSpacer} />
          </View>

          {!success ? (
            <View style={styles.contentWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={C.primary} />
              </View>

              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>Min 8 characters with 1 number and 1 special character</Text>

              <View style={styles.inputRowFirst}>
                <Ionicons name="lock-closed-outline" size={20} color={C.textHint} style={styles.inputIcon} />
                <TextInput
                  value={pass}
                  onChangeText={setPass}
                  style={styles.inputText}
                  secureTextEntry={!showP1}
                  placeholder="New password"
                  placeholderTextColor={C.textHint}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowP1((prev) => !prev)}>
                  <Ionicons name={showP1 ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textHint} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputRowSecond}>
                <Ionicons name="lock-closed-outline" size={20} color={C.textHint} style={styles.inputIcon} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  style={styles.inputText}
                  secureTextEntry={!showP2}
                  placeholder="Confirm new password"
                  placeholderTextColor={C.textHint}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowP2((prev) => !prev)}>
                  <Ionicons name={showP2 ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textHint} />
                </TouchableOpacity>
              </View>

              <View style={styles.rulesWrap}>
                {rules.map((rule) => (
                  <View key={rule.id} style={styles.ruleRow}>
                    <Ionicons
                      name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={rule.met ? C.primary : C.textHint}
                    />
                    <Text style={[styles.ruleText, { color: rule.met ? C.primary : C.textSecondary }]}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: allRulesMet ? C.primary : C.textHint }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View style={[styles.successWrap, { opacity: fadeIn }]}> 
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={48} color="white" />
              </View>
              <Text style={styles.successTitle}>Password Reset!</Text>
              <Text style={styles.successSubtitle}>You can now sign in with your new password.</Text>

              <TouchableOpacity
                style={styles.goLoginButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.goLoginText}>Go to Login</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
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
      paddingHorizontal: 20,
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
      marginTop: 8,
      alignItems: 'center',
    },
    iconCircle: {
      marginTop: 24,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: 20,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: C.textPrimary,
    },
    subtitle: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: 13,
      color: C.textSecondary,
    },
    inputRowFirst: {
      marginTop: 32,
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      width: '100%',
    },
    inputRowSecond: {
      marginTop: 16,
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      width: '100%',
    },
    inputIcon: {
      marginRight: 10,
    },
    inputText: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    rulesWrap: {
      marginTop: 16,
      gap: 10,
      width: '100%',
    },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ruleText: {
      fontSize: 13,
    },
    errorText: {
      marginTop: 10,
      width: '100%',
      textAlign: 'center',
      color: C.error,
      fontSize: 13,
    },
    resetButton: {
      marginTop: 28,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    resetButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    successWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.background,
    },
    successCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: C.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      marginTop: 24,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
    },
    successSubtitle: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 14,
      color: C.textSecondary,
    },
    goLoginButton: {
      marginTop: 32,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    goLoginText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });
