import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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

import BottomSheet from '@/src/components/common/BottomSheet';
import { authService } from '@/src/services/authService';
import { Colors, type AppColors } from '@/src/theme/colors';

type FieldName = 'fullName' | 'email' | 'phone' | 'password' | 'confirmPass' | 'country';

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPass?: string;
  country?: string;
  agreedTerms?: string;
  general?: string;
};

type CountryOption = {
  code: string;
  dialCode: string;
  name: string;
};

const COUNTRIES: CountryOption[] = [
  { code: 'PK', dialCode: '+92', name: 'Pakistan' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates' },
  { code: 'US', dialCode: '+1', name: 'United States' },
];

const getPasswordStrength = (value: string): 0 | 1 | 2 | 3 | 4 => {
  if (!value) {
    return 0;
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
};

export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [country, setCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthText = useMemo(() => {
    if (strength <= 1) {
      return { label: 'Weak', color: C.error };
    }
    if (strength === 2) {
      return { label: 'Fair', color: C.amber };
    }
    if (strength === 3) {
      return { label: 'Strong', color: C.primaryMid };
    }
    return { label: 'Very Strong', color: C.primary };
  }, [C.amber, C.error, C.primary, C.primaryMid, strength]);

  const allValid = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      /.+@.+\..+/.test(email.trim()) &&
      phone.trim().length >= 7 &&
      password.length >= 8 &&
      confirmPass === password &&
      Boolean(country.name) &&
      agreedTerms
    );
  }, [agreedTerms, confirmPass, country.name, email, fullName, password, phone]);

  const getInputStyle = (field: FieldName) => {
    const hasError = Boolean(errors[field]);
    return [
      styles.inputRow,
      focusedField === field ? styles.inputRowFocused : null,
      hasError ? styles.inputRowError : null,
    ];
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/.+@.+\..+/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPass) {
      nextErrors.confirmPass = 'Please confirm your password.';
    } else if (confirmPass !== password) {
      nextErrors.confirmPass = 'Passwords do not match.';
    }

    if (!country.name) nextErrors.country = 'Please select a country.';
    if (!agreedTerms) nextErrors.agreedTerms = 'You must accept Terms and Privacy Policy.';

    return nextErrors;
  };

  const handleRegister = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const normalizedPhone = `${country.dialCode}${phone.trim()}`;
      await authService.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        password,
        role: 'client',
        countryCode: country.code,
      });

      router.replace({
        pathname: '/(auth)/otp-verify',
        params: {
          email: email.trim(),
          phone: normalizedPhone,
        },
      });
    } catch {
      setErrors({ general: 'Registration failed. Please try again.' });
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>D</Text>
            </View>
            <Text style={styles.logoText}>Do It</Text>
          </View>

          <View style={styles.formGroup}>
            <View>
              <Text style={styles.label}>Full Name</Text>
              <View style={getInputStyle('fullName')}>
                <Ionicons name="person-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.inputText}
                  placeholder="Enter your full name"
                  placeholderTextColor={C.textHint}
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <View style={getInputStyle('email')}>
                <Ionicons name="mail-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.inputText}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textHint}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View>
              <Text style={styles.label}>Phone</Text>
              <View style={getInputStyle('phone')}>
                <TouchableOpacity style={styles.dialCodeChip} onPress={() => setCountrySheetOpen(true)}>
                  <Text style={styles.dialCodeText}>{country.code}</Text>
                  <Text style={styles.dialCodeText}>{country.dialCode}</Text>
                </TouchableOpacity>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.inputText}
                  placeholder="3001234567"
                  placeholderTextColor={C.textHint}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <View style={getInputStyle('password')}>
                <Ionicons name="lock-closed-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.inputText}
                  placeholder="Enter password"
                  placeholderTextColor={C.textHint}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass((prev) => !prev)}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={C.textHint}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarsWrap}>
                  {[0, 1, 2, 3].map((index) => (
                    <View
                      key={`strength-${index}`}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            strength === 0 || index >= strength
                              ? C.cardBorder
                              : strength === 1
                                ? C.error
                                : strength === 2
                                  ? C.amber
                                  : strength === 3
                                    ? C.primaryMid
                                    : C.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: strengthText.color }]}>{strengthText.label}</Text>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <View>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={getInputStyle('confirmPass')}>
                <Ionicons name="lock-closed-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <TextInput
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  onFocus={() => setFocusedField('confirmPass')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.inputText}
                  placeholder="Confirm password"
                  placeholderTextColor={C.textHint}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm((prev) => !prev)}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={C.textHint}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPass ? <Text style={styles.errorText}>{errors.confirmPass}</Text> : null}
            </View>

            <View>
              <Text style={styles.label}>Country</Text>
              <TouchableOpacity
                style={getInputStyle('country')}
                onPress={() => setCountrySheetOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="globe-outline" size={20} color={C.textHint} style={styles.leadingIcon} />
                <Text style={[styles.inputText, country.name ? styles.countryValue : styles.countryPlaceholder]}>
                  {country.name || 'Select country'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={C.textHint} />
              </TouchableOpacity>
              {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
            </View>

            <View style={styles.termsRow}>
              <TouchableOpacity style={[styles.checkbox, agreedTerms ? styles.checkboxChecked : null]} onPress={() => setAgreedTerms((prev) => !prev)}>
                {agreedTerms ? <Ionicons name="checkmark" size={14} color="white" /> : null}
              </TouchableOpacity>
              <Text style={styles.termsText}> I agree to the </Text>
              <TouchableOpacity onPress={() => void Linking.openURL('https://example.com/terms')}>
                <Text style={styles.termsLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> and </Text>
              <TouchableOpacity onPress={() => void Linking.openURL('https://example.com/privacy')}>
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
            {errors.agreedTerms ? <Text style={styles.errorText}>{errors.agreedTerms}</Text> : null}
            {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: allValid ? C.primary : C.textHint }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Text style={styles.googleLogo}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={countrySheetOpen} onClose={() => setCountrySheetOpen(false)} title="Select Country">
        {COUNTRIES.map((option) => {
          const selected = option.code === country.code;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.countryOption, selected ? styles.countryOptionSelected : null]}
              onPress={() => {
                setCountry(option);
                setCountrySheetOpen(false);
              }}
            >
              <Text style={styles.countryOptionText}>{`${option.name} (${option.dialCode})`}</Text>
              {selected ? <Ionicons name="checkmark-circle" size={18} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>
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
    headerRightSpacer: {
      width: 32,
      height: 32,
    },
    logoRow: {
      marginTop: 16,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    logoBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoLetter: {
      color: 'white',
      fontSize: 16,
      fontWeight: '800',
    },
    logoText: {
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    formGroup: {
      gap: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textSecondary,
      marginBottom: 6,
    },
    inputRow: {
      height: 52,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputRowFocused: {
      borderColor: C.inputFocus,
    },
    inputRowError: {
      borderColor: C.error,
    },
    leadingIcon: {
      marginRight: 10,
    },
    inputText: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    dialCodeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 10,
      paddingRight: 10,
      borderRightWidth: 1,
      borderRightColor: C.divider,
    },
    dialCodeText: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '600',
    },
    countryValue: {
      color: C.textPrimary,
    },
    countryPlaceholder: {
      color: C.textHint,
    },
    strengthRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    strengthBarsWrap: {
      flex: 1,
      flexDirection: 'row',
      marginRight: 8,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      marginRight: 4,
    },
    strengthText: {
      fontSize: 11,
      fontWeight: '600',
    },
    termsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: C.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    termsText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    termsLink: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    createButton: {
      marginTop: 24,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    dividerRow: {
      marginVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.divider,
    },
    dividerText: {
      marginHorizontal: 16,
      color: C.textHint,
      fontSize: 13,
      fontWeight: '500',
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
    googleLogo: {
      fontSize: 20,
      fontWeight: '800',
      color: C.error,
    },
    googleText: {
      fontSize: 15,
      color: C.textPrimary,
      fontWeight: '500',
    },
    loginRow: {
      marginTop: 12,
      marginBottom: 32,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginPrompt: {
      color: C.textSecondary,
      fontSize: 13,
    },
    loginLink: {
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    errorText: {
      marginTop: 4,
      color: C.error,
      fontSize: 12,
    },
    countryOption: {
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.card,
    },
    countryOptionSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    countryOptionText: {
      color: C.textPrimary,
      fontSize: 14,
    },
  });
