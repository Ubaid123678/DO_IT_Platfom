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

type WithdrawMethodId = 'bank' | 'wallet' | 'new';

const quickAmounts = [10, 25, 50, 100, 200] as const;

const payoutMethods: Array<{
  id: WithdrawMethodId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing: string;
  dashed?: boolean;
}> = [
  { id: 'bank', icon: 'business-outline', label: 'Bank Account', trailing: 'ending 4242' },
  { id: 'wallet', icon: 'phone-portrait', label: 'Mobile Wallet', trailing: 'ending 8821' },
  { id: 'new', icon: 'add-circle-outline', label: 'Add New', trailing: 'Connect method', dashed: true },
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

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethodId>('bank');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableBalance = 3330;
  const providerCurrency: string = 'PKR';
  const rate = 278.5;
  const amountNumber = Number.parseFloat(amount || '0');
  const hasAmount = Number.isFinite(amountNumber) && amountNumber > 0;
  const converted = useMemo(() => (hasAmount ? amountNumber * rate : 0), [amountNumber, hasAmount]);
  const showConversionCard = providerCurrency !== 'USD';

  const onWithdrawPress = () => {
    if (!hasAmount || loading) {
      return;
    }
    setShowConfirm(true);
  };

  const onConfirmWithdraw = () => {
    if (loading) {
      return;
    }

    setLoading(true);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }

    confirmTimerRef.current = setTimeout(() => {
      setLoading(false);
      setShowConfirm(false);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.availableBanner}>
          <Ionicons name="checkmark-circle" size={22} color={C.success} />
          <Text style={styles.availableText}>{`Available: $${availableBalance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Enter Withdrawal Amount</Text>

          <View style={styles.amountRow}>
            <Text style={styles.dollarSymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(value) => setAmount(sanitizeAmount(value))}
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
          <Text style={styles.methodsTitle}>Send to</Text>

          {payoutMethods.map((method) => {
            const selected = selectedMethod === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  method.dashed ? styles.methodCardDashed : null,
                  selected ? styles.methodCardSelected : null,
                ]}
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

        {showConversionCard ? (
          <View style={styles.conversionCard}>
            <View style={styles.conversionTopRow}>
              <Ionicons name="information-circle" size={20} color={C.amber} />
              <Text style={styles.conversionTitle}>{`$${(hasAmount ? amountNumber : 100).toFixed(2)} USD = ${providerCurrency} ${(
                (hasAmount ? amountNumber : 100) * rate
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <Text style={styles.conversionRateText}>{`Rate: 1 USD = ${rate} ${providerCurrency}`}</Text>
            <Text style={styles.conversionHintText}>Rate valid for 15 minutes</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color={C.textHint} />
          <Text style={styles.infoText}>Arrives in 1-3 business days</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color={C.success} />
          <Text style={styles.feeText}>Platform fee: $0.00 (waived)</Text>
        </View>

        <TouchableOpacity
          style={[styles.withdrawButton, !hasAmount ? styles.withdrawButtonDisabled : null]}
          onPress={onWithdrawPress}
          disabled={!hasAmount || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.withdrawButtonText}>{`Withdraw $${amount || '0.00'} → ${providerCurrency} ${converted.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showConfirm ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Withdrawal?</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{`$${amount || '0.00'}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Receive</Text>
              <Text style={styles.summaryValue}>{`${providerCurrency} ${converted.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Method</Text>
              <Text style={styles.summaryValue}>{payoutMethods.find((m) => m.id === selectedMethod)?.label}</Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirm(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onConfirmWithdraw}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    availableBanner: {
      marginTop: 16,
      borderRadius: 12,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? '#0F2E1F' : '#E8F8F2',
    },
    availableText: {
      fontSize: 15,
      fontWeight: '700',
      color: C.success,
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
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    methodCardDashed: {
      borderStyle: 'dashed',
      borderColor: C.primary,
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
      backgroundColor: isDark ? '#152E2C' : C.card,
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
    conversionCard: {
      marginTop: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.amber,
      borderLeftWidth: 3,
      borderLeftColor: C.amber,
      backgroundColor: isDark ? '#2A1F00' : C.amberLight,
      padding: 14,
    },
    conversionTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    conversionTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    conversionRateText: {
      marginTop: 8,
      fontSize: 12,
      color: C.textSecondary,
    },
    conversionHintText: {
      marginTop: 4,
      fontSize: 11,
      color: C.amber,
    },
    infoRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 13,
      color: C.textSecondary,
    },
    feeText: {
      fontSize: 13,
      color: C.success,
    },
    withdrawButton: {
      marginTop: 20,
      marginBottom: 32,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    withdrawButtonDisabled: {
      backgroundColor: C.textHint,
    },
    withdrawButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 18,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    summaryLabel: {
      fontSize: 13,
      color: C.textSecondary,
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    modalActionsRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    modalButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.background,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    confirmButton: {
      backgroundColor: C.primary,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'white',
    },
  });
