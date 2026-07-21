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

export default function ProviderWithdrawScreen() {
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
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 8,
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
      padding: 14,
      borderRadius: 16,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    availableText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    amountCard: {
      marginTop: 16,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
    },
    amountLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    amountRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dollarSymbol: {
      fontSize: 28,
      fontWeight: '700',
      color: C.textPrimary,
      marginRight: 4,
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: '700',
      color: C.textPrimary,
      paddingVertical: 0,
    },
    amountDivider: {
      marginTop: 16,
      height: 1,
      backgroundColor: C.divider,
    },
    quickPillsWrap: {
      marginTop: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    quickPill: {
      minWidth: 56,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    quickPillIdle: {
      borderColor: C.cardBorder,
      backgroundColor: C.background,
    },
    quickPillSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    quickPillTextIdle: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    quickPillTextSelected: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    methodsWrap: {
      marginTop: 18,
    },
    methodsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 10,
    },
    methodCard: {
      minHeight: 66,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      paddingHorizontal: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    methodCardDashed: {
      borderStyle: 'dashed',
    },
    methodCardSelected: {
      borderColor: C.primary,
      backgroundColor: isDark ? '#122C29' : C.primaryLight,
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: C.textHint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: C.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.primary,
    },
    methodLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    methodTrailing: {
      fontSize: 12,
      color: C.textSecondary,
    },
    conversionCard: {
      marginTop: 14,
      borderRadius: 16,
      padding: 16,
      backgroundColor: isDark ? '#0F2E1F' : C.amberLight,
    },
    conversionTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    conversionTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
      lineHeight: 20,
    },
    conversionRateText: {
      marginTop: 8,
      fontSize: 12,
      color: C.textSecondary,
    },
    conversionHintText: {
      marginTop: 4,
      fontSize: 12,
      color: C.textHint,
    },
    infoRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
    },
    feeText: {
      flex: 1,
      fontSize: 13,
      color: C.success,
    },
    withdrawButton: {
      marginTop: 18,
      height: 52,
      borderRadius: 14,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    withdrawButtonDisabled: {
      opacity: 0.5,
    },
    withdrawButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
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
      gap: 12,
    },
    modalButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: C.background,
      borderWidth: 1,
      borderColor: C.cardBorder,
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
