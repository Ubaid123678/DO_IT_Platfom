import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function JobBudgetStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const { type, amount, hourlyRate, estimatedHours } = state.formData.budget;

  const totalHourly = hourlyRate && estimatedHours
    ? (parseFloat(hourlyRate) * parseFloat(estimatedHours)).toFixed(2)
    : null;

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>

          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>How much are you willing to pay?</Text>

          <View style={styles.budgetTypeSelector}>
            <TouchableOpacity
              style={[
                styles.budgetTypeBtn,
                type === 'fixed' && styles.budgetTypeBtnActive,
              ]}
              onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'budget', field: 'type', value: 'fixed' })}
            >
              <Ionicons name="cash-outline" size={20} color={type === 'fixed' ? '#fff' : C.primary} />
              <Text style={[styles.budgetTypeLabel, type === 'fixed' && styles.budgetTypeLabelActive]}>Fixed Price</Text>
              <Text style={[styles.budgetTypeDesc, type === 'fixed' && styles.budgetTypeDescActive]}>One total amount</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.budgetTypeBtn,
                type === 'hourly' && styles.budgetTypeBtnActive,
              ]}
              onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'budget', field: 'type', value: 'hourly' })}
            >
              <Ionicons name="time-outline" size={20} color={type === 'hourly' ? '#fff' : C.primary} />
              <Text style={[styles.budgetTypeLabel, type === 'hourly' && styles.budgetTypeLabelActive]}>Hourly Rate</Text>
              <Text style={[styles.budgetTypeDesc, type === 'hourly' && styles.budgetTypeDescActive]}>Pay per hour worked</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {type === 'fixed' ? 'Total Budget' : 'Hourly Rate'} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.currencyInputField}
                placeholder={type === 'fixed' ? 'e.g. 500' : 'e.g. 50'}
                value={amount}
                onChangeText={(v) => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'budget', field: 'amount', value: v })}
                keyboardType="decimal-pad"
                autoCapitalize="none"
              />
            </View>
            {type === 'fixed' && amount && (
              <Text style={styles.estimatedTotal}>Platform fee (10%): ${(parseFloat(amount) * 0.1).toFixed(2)} | You pay: ${(parseFloat(amount) * 1.1).toFixed(2)}</Text>
            )}
          </View>

          {type === 'hourly' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Estimated Hours <Text style={styles.required}>*</Text></Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>hrs</Text>
                  <TextInput
                    style={styles.currencyInputField}
                    placeholder="e.g. 10"
                    value={estimatedHours}
                    onChangeText={(v) => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'budget', field: 'estimatedHours', value: v })}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              {totalHourly && (
                <View style={styles.estimatedTotal}>
                  Estimated total: ${totalHourly} | Platform fee (10%): ${(parseFloat(totalHourly) * 0.1).toFixed(2)} | You pay: ${(parseFloat(totalHourly) * 1.1).toFixed(2)}
                </View>
              )}
            </>
          )}

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
            <Text style={styles.noteText}>
              A 10% platform fee will be added to your payment. Funds are held in escrow until work is completed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, !canGoNext() && styles.nextBtnDisabled]} onPress={goNext} disabled={!canGoNext()}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    keyboardAvoiding: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    budgetTypeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    budgetTypeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 12,
    },
    budgetTypeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    budgetTypeLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    budgetTypeLabelActive: { color: '#fff' },
    budgetTypeDesc: { fontSize: 11, color: C.textHint },
    budgetTypeDescActive: { color: 'rgba(255,255,255,0.8)' },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    required: { color: C.error },
    currencyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10 },
    currencySymbol: { fontSize: 18, fontWeight: '600', color: C.textPrimary, paddingHorizontal: 16 },
    currencyInputField: { flex: 1, height: 52, paddingHorizontal: 16, fontSize: 18, fontWeight: '600', color: C.textPrimary },
    estimatedTotal: { fontSize: 12, color: C.textSecondary, marginTop: 6, fontWeight: '500' },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: C.primaryLight, borderRadius: 10, marginTop: 16 },
    noteText: { fontSize: 12, color: C.textSecondary, flex: 1 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });