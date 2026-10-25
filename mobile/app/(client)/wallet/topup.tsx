import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { walletService } from '@/src/services/walletService';
import { useCurrency } from '@/src/context/CurrencyContext';
import { Colors, type AppColors } from '@/src/theme/colors';

// Presets are canonical USD amounts; the UI renders/converts them to the
// selected display currency.
const PRESET_USD = [10, 25, 50, 100, 200, 500];

export default function TopUpScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { currency, fmt, toUsdCents, fromUsdCents } = useCurrency();
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handlePresetAmount = (presetUsd: number) => {
    // Preset is a round USD figure; show its local equivalent in the input.
    setAmount(String(Math.round(fromUsdCents(presetUsd * 100) * 100) / 100));
  };

  const handleCustomAmount = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(filtered);
    }
  };

  // Convert the entered display-currency amount to canonical USD cents.
  const amountCents = amount ? toUsdCents(parseFloat(amount) || 0) : 0;

  const handleTopUp = async () => {
    if (!amount || amountCents < 100) {
      Alert.alert('Error', `Minimum top-up is ${fmt(100)}`);
      return;
    }
    if (amountCents > 10000000) {
      Alert.alert('Error', `Maximum top-up is ${fmt(10000000)}`);
      return;
    }

    setLoading(true);
    try {
      // Test-mode demo: credit the wallet directly (no live card flow).
      await walletService.demoTopUp(amountCents);
      Alert.alert('Success', `${fmt(amountCents)} added to your wallet.`);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to top up';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCancel = () => {
    setClientSecret(null);
  };

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Add Funds</Text>
          <Text style={styles.subtitle}>{`Minimum ${fmt(100)} • Maximum ${fmt(10000000)}`}</Text>

          <View style={styles.amountCard}>
            <View style={styles.amountDisplay}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleCustomAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={styles.amountHint}>Enter amount or tap a preset below</Text>

            <View style={styles.presetContainer}>
              <Text style={styles.presetLabel}>Quick Amounts</Text>
              <View style={styles.presetButtons}>
                {PRESET_USD.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetBtn,
                      amount === String(preset) && styles.presetBtnActive,
                    ]}
                    onPress={() => handlePresetAmount(preset)}
                    disabled={loading || confirming}
                  >
                    <Text style={[
                      styles.presetBtnText,
                      amount === String(preset) && styles.presetBtnTextActive,
                    ]}>
                      {fmt(preset * 100)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.feeInfo}>
            <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
            <Text style={styles.feeText}>
              No fees for top-ups. 10% platform fee applies when funds are released from escrow.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.continueBtn,
              (!amount || parseFloat(amount) < 1) && styles.continueBtnDisabled,
            ]}
            onPress={handleTopUp}
            disabled={!amount || parseFloat(amount) < 1 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>Add Funds (Test Mode)</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    keyboardAvoiding: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 13, color: C.textHint, marginBottom: 24 },
    amountCard: { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.cardBorder },
    amountDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    currencySymbol: { fontSize: 32, fontWeight: '700', color: C.textPrimary, marginRight: 8 },
    amountInput: {
      flex: 1,
      fontSize: 32,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'right',
    },
    amountHint: { fontSize: 12, color: C.textHint, marginBottom: 20 },
    presetContainer: { marginBottom: 20 },
    presetLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 12 },
    presetButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    presetBtn: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
    },
    presetBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    presetBtnText: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    presetBtnTextActive: { color: '#fff' },
    feeInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      backgroundColor: C.primaryLight,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.primary,
    },
    feeText: { fontSize: 12, color: C.textSecondary, flex: 1, lineHeight: 18 },
    stripeContainer: { marginTop: 16 },
    stripeTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    stripeHint: { fontSize: 12, color: C.textHint, marginBottom: 16 },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: C.primary,
    },
    confirmBtnDisabled: { opacity: 0.7 },
    confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.textSecondary },
    continueBtn: {
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
    },
    continueBtnDisabled: { opacity: 0.5, backgroundColor: C.primary },
    continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });