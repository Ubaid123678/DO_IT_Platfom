import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategoryCompletedKeys, getEvidenceKey, useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

const physicalEvidenceTypes = [
  { key: 'certificate', label: 'Certificate / License', icon: 'document-text-outline', desc: 'Upload a photo of your certificate or license', requires_cert: true },
  { key: 'prior_work', label: 'Prior Work Photos', icon: 'images-outline', desc: 'Upload 3-10 photos of your previous work', requires_cert: false },
];

const digitalEvidenceTypes = [
  { key: 'certificate', label: 'Certificate', icon: 'document-text-outline', desc: 'Upload a certificate with optional verification URL', requires_cert: true },
  { key: 'portfolio', label: 'Portfolio Link', icon: 'link-outline', desc: 'Share a link to your portfolio or work samples', requires_cert: false },
  { key: 'oauth', label: 'Platform Integration', icon: 'logo-github', desc: 'Connect your GitHub or professional account', requires_cert: false },
];

export default function EvidenceTypeChoiceStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();
  const [submitting, setSubmitting] = useState(false);

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  if (!currentCat) {
    dispatch({ type: 'SET_STEP', step: 'pending-review' });
    return null;
  }

  const catItems = state.selectedSkillItems.find(s => s.category_id === currentCat.category_id);
  const anySkillRequiresCert = catItems?.skill_items.some(s => s.requires_certificate) ?? false;

  const allTypes = currentCat.job_type === 'physical' ? physicalEvidenceTypes : digitalEvidenceTypes;
  const evidenceTypes = allTypes.filter(t => !t.requires_cert || anySkillRequiresCert);

  const completedKeys = getCategoryCompletedKeys(state, currentCat);
  const allDoneForThisCategory = completedKeys.length >= evidenceTypes.length;

  const totalCategories = state.selectedCategories.length;
  const isLastCategory = state.currentCategoryIndex >= totalCategories - 1;
  const progressPct = Math.round(((state.currentCategoryIndex + 1) / (totalCategories || 1)) * 100);

  const handleSelect = (typeKey: string) => {
    const evidenceKey = getEvidenceKey(state, currentCat);

    dispatch({ type: 'SET_EVIDENCE_TYPE', skillItemId: evidenceKey, evidenceType: typeKey });

    const stepMap: Record<string, string> = {
      certificate: 'certificate-upload',
      prior_work: 'prior-work-photos',
      portfolio: 'portfolio-link',
      oauth: 'oauth-integration',
    };
    dispatch({ type: 'SET_STEP', step: stepMap[typeKey] as any || 'certificate-upload' });
  };

  const buildEvidenceBatch = () => {
    const batch: {
      category_id: string;
      skill_item_id: string;
      evidence_type: string;
      evidence_payload: Record<string, unknown>;
    }[] = [];

    for (const cat of state.selectedCategories) {
      const items = state.selectedSkillItems.find(s => s.category_id === cat.category_id);
      const skillItems = items?.skill_items || [];
      const completedEvidenceKeys = getCategoryCompletedKeys(state, cat);

      const buildPayload = (evidenceKey: string, storageKey: string): Record<string, unknown> => {
        if (evidenceKey === 'certificate') return { certificates: state.uploadedCertificates[storageKey] || [] };
        if (evidenceKey === 'prior_work') return { photos: state.priorWorkPhotos[storageKey] || [] };
        if (evidenceKey === 'portfolio') return state.portfolios[storageKey] || { url: '', description: '' };
        if (evidenceKey === 'oauth') {
          const connected = state.oauthConnected[storageKey] || false;
          return { connected, username: connected ? (state.githubUsernames[storageKey] || '') : '' };
        }
        return {};
      };

      // Evidence is collected per category (one portfolio + one GitHub + optional
      // certificate) and applied to every skill in the category — same as physical.
      for (const evidenceKey of completedEvidenceKeys) {
        const evidence_payload = buildPayload(evidenceKey, cat.category_id);
        for (const skillItem of skillItems) {
          batch.push({
            category_id: cat.category_id,
            skill_item_id: skillItem._id,
            evidence_type: evidenceKey,
            evidence_payload,
          });
        }
      }
    }

    return batch;
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      // Persist the selected categories/skills so the backend can recompute the
      // provider's overall verification status from the submitted records.
      const categoryIds = state.selectedCategories.map(c => c.category_id);
      const skillItemIds = state.selectedSkillItems.flatMap(s => s.skill_items.map(i => i._id));
      await verificationService.selectCategories(categoryIds, skillItemIds);

      const batch = buildEvidenceBatch();
      await verificationService.submitAllEvidence(batch);
      dispatch({ type: 'SET_STEP', step: 'pending-review' });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err.message || 'Failed to submit evidence';
      Alert.alert('Submission failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (isLastCategory) {
      void handleSubmitForReview();
    } else {
      dispatch({ type: 'COMPLETE_CATEGORY' });
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Evidence</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {totalCategories > 1 && (
        <Text style={styles.categoryStepIndicator}>
          Category {state.currentCategoryIndex + 1} of {totalCategories}
        </Text>
      )}

      <View style={styles.categoryLabelRow}>
        <Ionicons name={currentCat.job_type === 'physical' ? 'construct-outline' : 'laptop-outline'} size={22} color={C.primary} />
        <Text style={styles.categoryLabel}>{currentCat.name}</Text>
      </View>
      <Text style={styles.subtitle}>Choose how to verify your skills for this category</Text>

      {catItems?.skill_items.map(item => (
        <Text key={item._id} style={styles.skillItemHint}>Verifying: {item.name}</Text>
      ))}

      <Text style={styles.completedCount}>
        {completedKeys.length} of {evidenceTypes.length} evidence types submitted
      </Text>

      <FlatList
        data={evidenceTypes}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isCompleted = completedKeys.includes(item.key);
          return (
            <TouchableOpacity
              style={[styles.evidenceCard, isCompleted && styles.evidenceCardCompleted]}
              onPress={() => handleSelect(item.key)}
              activeOpacity={0.7}
            >
              <View style={styles.evidenceIcon}>
                <Ionicons name={item.icon as any} size={24} color={isCompleted ? C.success : C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceLabel}>{item.label}</Text>
                <Text style={styles.evidenceDesc}>{isCompleted ? 'Submitted' : item.desc}</Text>
              </View>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color={C.success} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={C.textHint} />
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            (!allDoneForThisCategory || submitting) && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!allDoneForThisCategory || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>
                {!isLastCategory
                  ? 'Next Category'
                  : 'Submit for Review'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  progressBar: { height: 4, backgroundColor: C.divider, marginHorizontal: 20, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
  categoryStepIndicator: { fontSize: 12, color: C.textHint, fontWeight: '600', paddingHorizontal: 20, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  categoryLabel: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, paddingHorizontal: 20, marginBottom: 4 },
  skillItemHint: { fontSize: 12, color: C.textHint, paddingHorizontal: 20, marginBottom: 2 },
  completedCount: { fontSize: 12, color: C.textHint, paddingHorizontal: 20, marginBottom: 12, fontWeight: '500' },
  evidenceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  evidenceCardCompleted: { borderColor: C.success, backgroundColor: C.primaryLight },
  evidenceIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  evidenceLabel: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  evidenceDesc: { fontSize: 12, color: C.textSecondary },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  continueBtnDisabled: { backgroundColor: C.divider },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
