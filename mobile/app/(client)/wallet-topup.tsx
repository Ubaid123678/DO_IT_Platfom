import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type PaymentMethodId = 'visa' | 'mastercard' | 'applepay';

const quickAmounts = [10, 25, 50, 100, 200] as const;

const methods: Array<{
  id: PaymentMethodId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing: string;
}> = [
  { id: 'visa', icon: 'card-outline', label: 'Visa Card', trailing: 'ending 4242' },
  { id: 'mastercard', icon: 'card', label: 'Mastercard', trailing: 'ending 1486' },
  { id: 'applepay', icon: 'logo-apple', label: 'Apple Pay', trailing: 'ending 4242' },
];

const sanitizeAmount = (value: string) => {
  const clean = value.replace(/[^0-9.]/g, '');
  const firstDot = clean.indexOf('.');

  if (firstDot === -1) {
    return clean;
  }

  const before = clean.slice(0, firstDot + 1);
  const after = clean
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);

  return `${before}${after}`;
};

export default function WalletTopUpScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('visa');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentBalance = 240;
  const amountNumber = Number.parseFloat(amount || '0');
  const hasAmount = Number.isFinite(amountNumber) && amountNumber > 0;

  const newBalance = useMemo(() => currentBalance + (hasAmount ? amountNumber : 0), [amountNumber, hasAmount]);

  const onAmountChange = (value: string) => {
    setAmount(sanitizeAmount(value));
  };

  const onTopUp = () => {
    if (!hasAmount || loading) {
      return;
    }

    setLoading(true);
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balancePill}>
          <Text style={styles.balancePillText}>Current balance: $240.00</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Enter Amount</Text>

          <View style={styles.amountRow}>
            <Text style={styles.dollarSymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={C.textHint}
              selectionColor={C.primary}
            />
          </View>

          <View style={styles.amountDivider} />

          <View style={styles.quickPillsWrap}>
            {quickAmounts.map((value) => {
              const selected = amount === value.toString();
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.quickPill, selected ? styles.quickPillSelected : styles.quickPillIdle]}
                  onPress={() => setAmount(value.toString())}
                >
                  <Text style={selected ? styles.quickPillTextSelected : styles.quickPillTextIdle}>{`$${value}`}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.methodsWrap}>
          <Text style={styles.methodsTitle}>Pay with</Text>

          {methods.map((method) => {
            const selected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, selected ? styles.methodCardSelected : null]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <Ionicons name={method.icon} size={24} color={C.primary} />

                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodTrailing}>{method.trailing}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={16} color={C.success} />
          <Text style={styles.securityText}>Secured by Stripe. We never store card data.</Text>
        </View>

        <TouchableOpacity
          style={[styles.topUpButton, !hasAmount ? styles.topUpButtonDisabled : null]}
          onPress={onTopUp}
          disabled={!hasAmount || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.topUpButtonText}>{`Add $${amount || '0.00'} to wallet`}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {success ? (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color="white" />
          </View>

          <Text style={styles.successTitle}>{`+$${amount || '0.00'} Added!`}</Text>
          <Text style={styles.successSubtitle}>{`New balance: $${newBalance.toFixed(2)}`}</Text>

          <TouchableOpacity style={styles.viewWalletButton} onPress={() => router.push('/(client)/wallet')}>
            <Text style={styles.viewWalletButtonText}>View Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    headerRow: {
      height: 48,
      marginTop: 8,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    balancePill: {
      alignSelf: 'center',
      marginTop: 16,
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    balancePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    amountCard: {
      marginTop: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 20,
    },
    amountLabel: {
      marginBottom: 12,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dollarSymbol: {
      marginRight: 4,
      fontSize: 28,
      fontWeight: '700',
      color: C.primary,
    },
    amountInput: {
      flex: 1,
      fontSize: 40,
      fontWeight: '800',
      color: C.primary,
      paddingVertical: 0,
    },
    amountDivider: {
      height: 1,
      marginVertical: 16,
      backgroundColor: C.divider,
    },
    quickPillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickPill: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    quickPillSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    quickPillIdle: {
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#0D1F1E' : C.background,
    },
    quickPillTextSelected: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    quickPillTextIdle: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    methodsWrap: {
      marginTop: 20,
    },
    methodsTitle: {
      marginBottom: 10,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    methodCard: {
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    methodCardSelected: {
      borderColor: C.primary,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
    },
    radioOuterSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'white',
    },
    methodLabel: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    methodTrailing: {
      fontSize: 12,
      color: C.textHint,
    },
    securityRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    securityText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    topUpButton: {
      marginTop: 20,
      marginBottom: 32,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topUpButtonDisabled: {
      backgroundColor: C.textHint,
    },
    topUpButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      marginTop: 20,
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
    viewWalletButton: {
      marginTop: 20,
      minWidth: 170,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    viewWalletButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
    },
  });
