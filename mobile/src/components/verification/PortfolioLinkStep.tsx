import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEvidenceKey, useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function PortfolioLinkStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const evidenceKey = currentCat ? getEvidenceKey(state, currentCat) : null;

  const [url, setUrl] = useState(
    evidenceKey ? (state.portfolios[evidenceKey]?.url || '') : ''
  );
  const [description, setDescription] = useState(
    evidenceKey ? (state.portfolios[evidenceKey]?.description || '') : ''
  );
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed || !evidenceKey || !currentCat) return;
    setValidating(true);
    setValidationError(null);
    try {
      const result = await verificationService.verifyPortfolioUrl(trimmed);
      if (!result.valid) {
        setValidationError('This link is not reachable or returned no content. Check the URL and try again.');
        return;
      }
      // Save locally, mark the evidence tick, and return to the evidence screen.
      dispatch({ type: 'SET_PORTFOLIO', skillItemId: evidenceKey, url: trimmed, description: description.trim() });
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'portfolio' });
    } catch {
      setValidationError('Could not verify this link right now. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio Link</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.title}>Share your portfolio or work samples</Text>
        <Text style={styles.subtitle}>We'll check that the link is live before saving it.</Text>

        <Text style={styles.fieldLabel}>Portfolio URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://myportfolio.com"
          placeholderTextColor={C.textHint}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          editable={!validating}
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
          editable={!validating}
        />

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={C.primary} />
          <Text style={styles.infoText}>
            We verify the link is live and contains content. A valid link is saved and marked as done.
          </Text>
        </View>

        {validating && (
          <View style={styles.validatingRow}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.validatingText}>Checking link...</Text>
          </View>
        )}

        {validationError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={C.error} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!url.trim() || validating) && styles.submitBtnDisabled]}
          onPress={() => void handleSave()}
          disabled={!url.trim() || validating}
          activeOpacity={0.8}
        >
          {validating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.submitText}> Check & Save Portfolio Link</Text>
            </>
          )}
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
  validatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  validatingText: { fontSize: 13, color: C.textSecondary },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.errorBg, borderRadius: 12, padding: 12, marginTop: 12 },
  errorText: { flex: 1, fontSize: 12, color: C.error, lineHeight: 18 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: C.divider },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
