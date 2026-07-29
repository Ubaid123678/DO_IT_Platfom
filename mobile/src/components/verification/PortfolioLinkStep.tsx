import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function PortfolioLinkStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim() || !currentSkillItem || !currentCat) return;
    setSubmitting(true);
    try {
      await verificationService.submitEvidence({
        category_id: currentCat.category_id,
        skill_item_id: currentSkillItem._id,
        evidence_type: 'portfolio',
        evidence_payload: { url: url.trim(), description: description.trim() },
      });
      Alert.alert('Submitted', 'Your portfolio link has been submitted for review.', [
        { text: 'OK', onPress: () => dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'portfolio' }) },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio Link</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.title}>Share your portfolio or work samples</Text>
        <Text style={styles.subtitle}>Provide a link to your online portfolio, GitHub, Behance, or any work showcase</Text>

        <Text style={styles.fieldLabel}>Portfolio URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://myportfolio.com"
          placeholderTextColor={C.textHint}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Briefly describe what you're showcasing..."
          placeholderTextColor={C.textHint}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={C.primary} />
          <Text style={styles.infoText}>Links are manually reviewed. For faster verification, include a credential URL if available.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!url.trim() || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!url.trim() || submitting}
          activeOpacity={0.8}
        >
          <Ionicons name="link-outline" size={20} color="#fff" />
          <Text style={styles.submitText}> {submitting ? 'Submitting...' : 'Submit for Review'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  title: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary },
  textArea: { height: 100, paddingTop: 14 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: C.divider },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

