import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { Colors, type AppColors } from '@/src/theme/colors';

const physicalEvidenceTypes = [
  { key: 'certificate', label: 'Certificate / License', icon: 'document-text-outline', desc: 'Upload a photo of your certificate or license' },
  { key: 'prior_work', label: 'Prior Work Photos', icon: 'images-outline', desc: 'Upload 3-10 photos of your previous work' },
  { key: 'in_person_test', label: 'Schedule In-Person Test', icon: 'calendar-outline', desc: 'Book a time for a practical skills test' },
];

const digitalEvidenceTypes = [
  { key: 'certificate', label: 'Certificate', icon: 'document-text-outline', desc: 'Upload a certificate with optional verification URL' },
  { key: 'portfolio', label: 'Portfolio Link', icon: 'link-outline', desc: 'Share a link to your portfolio or work samples' },
  { key: 'oauth', label: 'Platform Integration', icon: 'logo-github', desc: 'Connect your GitHub or professional account' },
  { key: 'skill_test', label: 'In-App Skill Test', icon: 'pencil-outline', desc: 'Take a timed skill assessment' },
];

export default function EvidenceTypeChoiceStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  if (!currentCat) {
    dispatch({ type: 'SET_STEP', step: 'resume-bio' });
    return null;
  }

  const catItems = state.selectedSkillItems.find(s => s.category_id === currentCat.category_id);
  const evidenceTypes = currentCat.job_type === 'physical' ? physicalEvidenceTypes : digitalEvidenceTypes;

  const handleSelect = (typeKey: string) => {
    const currentSkillItem = catItems?.skill_items[0];
    if (!currentSkillItem) return;

    dispatch({ type: 'SET_EVIDENCE_TYPE', skillItemId: currentSkillItem._id, evidenceType: typeKey });

    const stepMap: Record<string, string> = {
      certificate: 'certificate-upload',
      prior_work: 'prior-work-photos',
      portfolio: 'portfolio-link',
      oauth: 'oauth-integration',
      skill_test: 'skill-test',
      in_person_test: 'certificate-upload',
    };
    dispatch({ type: 'SET_STEP', step: stepMap[typeKey] as any || 'certificate-upload' });
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'skill-selection' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Evidence</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={{ width: '30%', height: '100%', backgroundColor: C.primary, borderRadius: 2 }} />
      </View>

      <Text style={styles.categoryLabel}>
        {currentCat.job_type === 'physical' ? 'ðŸ”§' : 'ðŸ’»'} {currentCat.name}
      </Text>
      <Text style={styles.subtitle}>Choose how to verify your skills for this category</Text>

      {catItems?.skill_items.map(item => (
        <Text key={item._id} style={styles.skillItemHint}>Verifying: {item.name}</Text>
      ))}

      <FlatList
        data={evidenceTypes}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.evidenceCard}
            onPress={() => handleSelect(item.key)}
            activeOpacity={0.7}
          >
            <View style={styles.evidenceIcon}>
              <Ionicons name={item.icon as any} size={24} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.evidenceLabel}>{item.label}</Text>
              <Text style={styles.evidenceDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textHint} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  progressBar: { height: 4, backgroundColor: C.divider, marginHorizontal: 20, borderRadius: 2, marginBottom: 16 },
  categoryLabel: { fontSize: 20, fontWeight: '700', color: C.textPrimary, paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textSecondary, paddingHorizontal: 20, marginBottom: 8 },
  skillItemHint: { fontSize: 12, color: C.textHint, paddingHorizontal: 20, marginBottom: 4 },
  evidenceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  evidenceIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  evidenceLabel: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  evidenceDesc: { fontSize: 12, color: C.textSecondary },
});

