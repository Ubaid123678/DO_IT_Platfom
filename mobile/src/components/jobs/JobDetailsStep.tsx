import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function JobDetailsStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const { title, description } = state.formData;

  const titleChars = title.length;
  const descChars = description.length;

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
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>

          <Text style={styles.title}>Job Details</Text>
          <Text style={styles.subtitle}>Describe what you need done</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Job Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Need living room painted"
              value={title}
              onChangeText={(v) => dispatch({ type: 'UPDATE_FORM', field: 'title', value: v })}
              maxLength={120}
              autoCapitalize="words"
            />
            <Text style={[styles.charCount, titleChars < 5 && styles.charCountError]}>
              {titleChars}/120 characters (min 5)
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the work in detail. Include specific requirements, materials needed, access instructions, etc."
              value={description}
              onChangeText={(v) => dispatch({ type: 'UPDATE_FORM', field: 'description', value: v })}
              maxLength={5000}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
            <Text style={[styles.charCount, descChars < 20 && styles.charCountError]}>
              {descChars}/5000 characters (min 20)
            </Text>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for a great job post:</Text>
            <Text style={styles.tipItem}>• Be specific about what needs to be done</Text>
            <Text style={styles.tipItem}>• Mention any special tools or materials required</Text>
            <Text style={styles.tipItem}>• Include access instructions (parking, building entry, etc.)</Text>
            <Text style={styles.tipItem}>• Specify preferred timing if flexible</Text>
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
    fieldGroup: { marginBottom: 24 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    required: { color: C.error },
    input: {
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 10,
      height: 52,
      paddingHorizontal: 16,
      fontSize: 16,
      color: C.textPrimary,
    },
    textArea: { height: 160, paddingTop: 12 },
    charCount: { fontSize: 11, color: C.textHint, textAlign: 'right', marginTop: 6 },
    charCountError: { color: C.error },
    tips: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, marginTop: 16 },
    tipsTitle: { fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 8 },
    tipItem: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });