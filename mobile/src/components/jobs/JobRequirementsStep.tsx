import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0-2 years)',
  intermediate: 'Intermediate (2-5 years)',
  expert: 'Expert (5+ years)',
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ur: 'Urdu',
  hi: 'Hindi',
  zh: 'Mandarin',
  de: 'German',
  pt: 'Portuguese',
  other: 'Other',
};

export default function JobRequirementsStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const { categories, skillItems, experienceLevel, languages, certificationsRequired, vehicleRequired } = state.formData.requirements;

  const [availableCategories, setAvailableCategories] = React.useState<Array<{ id: string; name: string; job_type: string }>>([]);

  const loadCategories = async () => {
    try {
      const cats = await verificationService.getCategories();
      // Filter by job type
      const filtered = cats.filter((c) => c.job_type === state.jobType);
      setAvailableCategories(filtered);
    } catch {
      // Ignore
    }
  };

  const toggleCategory = (catId: string) => {
    const next = categories.includes(catId)
      ? categories.filter((c) => c !== catId)
      : [...categories, catId].slice(0, 3); // Max 3
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'categories', value: next });
  };

  const toggleLanguage = (lang: string) => {
    const next = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang];
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'languages', value: next });
  };

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
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>

          <Text style={styles.title}>Requirements</Text>
          <Text style={styles.subtitle}>What skills and experience are needed?</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Categories <Text style={styles.required}>*</Text></Text>
            <Text style={styles.fieldHint}>Select 1-3 categories that match your job</Text>
            <View style={styles.chipRow}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categories.includes(cat.id) && styles.chipActive]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={[styles.chipText, categories.includes(cat.id) && styles.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              {availableCategories.length === 0 && (
                <Text style={styles.loadingText}>Loading categories...</Text>
              )}
            </View>
            {categories.length === 0 && <Text style={styles.errorText}>Select at least one category</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Experience Level</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.chip, experienceLevel === level && styles.chipActive]}
                  onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'experienceLevel', value: level })}
                >
                  <Text style={[styles.chipText, experienceLevel === level && styles.chipTextActive]}>{EXPERIENCE_LABELS[level]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Languages</Text>
            <Text style={styles.fieldHint}>Select languages the provider should speak</Text>
            <View style={styles.chipRow}>
              {Object.keys(LANGUAGE_NAMES).map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.chip, languages.includes(code) && styles.chipActive]}
                  onPress={() => toggleLanguage(code)}
                >
                  <Text style={[styles.chipText, languages.includes(code) && styles.chipTextActive]}>{LANGUAGE_NAMES[code]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Additional Requirements</Text>
            <TouchableOpacity style={styles.boolRow} onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'certificationsRequired', value: !certificationsRequired })}>
              <View style={styles.boolContent}>
                <Text style={styles.boolTitle}>Certifications Required</Text>
                <Text style={styles.boolSubtitle}>Provider must have relevant certifications</Text>
              </View>
              <View style={[styles.boolCheckbox, certificationsRequired && styles.boolCheckboxChecked]}>
                {certificationsRequired && <Ionicons name="checkmark" size={20} color="#fff" />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.boolRow} onPress={() => dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'vehicleRequired', value: !vehicleRequired })}>
              <View style={styles.boolContent}>
                <Text style={styles.boolTitle}>Vehicle Required</Text>
                <Text style={styles.boolSubtitle}>Provider needs their own vehicle (for errand jobs)</Text>
              </View>
              <View style={[styles.boolCheckbox, vehicleRequired && styles.boolCheckboxChecked]}>
                {vehicleRequired && <Ionicons name="checkmark" size={20} color="#fff" />}
              </View>
            </TouchableOpacity>
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
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
    required: { color: C.error },
    fieldHint: { fontSize: 12, color: C.textHint, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBg },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    loadingText: { fontSize: 13, color: C.textHint, marginTop: 8 },
    errorText: { fontSize: 12, color: C.error, marginTop: 8 },
    boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.inputBorder, marginBottom: 12 },
    boolContent: { flex: 1 },
    boolTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    boolSubtitle: { fontSize: 11, color: C.textHint, marginTop: 2 },
    boolCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
    boolCheckboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });