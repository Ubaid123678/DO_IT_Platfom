import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEvidenceKey, useWizard } from '@/src/context/VerificationWizardContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function ServiceAreaReferencesStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const evidenceKey = currentCat ? getEvidenceKey(state, currentCat) : null;
  const savedArea = evidenceKey ? (state.serviceAreas[evidenceKey] || { city: '', radius_km: '', experience_years: '' }) : { city: '', radius_km: '', experience_years: '' };
  const savedRefs = evidenceKey ? (state.references[evidenceKey] || []) : [];

  const [city, setCity] = useState(savedArea.city || '');
  const [radius, setRadius] = useState(savedArea.radius_km || '');
  const [experience, setExperience] = useState(savedArea.experience_years || '');
  const [refName, setRefName] = useState('');
  const [refContact, setRefContact] = useState('');

  const handleAddReference = () => {
    if (!evidenceKey || !refName.trim()) return;
    dispatch({ type: 'ADD_REFERENCE', skillItemId: evidenceKey, name: refName.trim(), contact: refContact.trim() });
    setRefName('');
    setRefContact('');
  };

  const handleDeleteReference = (index: number) => {
    if (!evidenceKey) return;
    dispatch({ type: 'DELETE_REFERENCE', skillItemId: evidenceKey, index });
  };

  const handleSave = () => {
    if (!evidenceKey) return;
    dispatch({ type: 'SET_SERVICE_AREA', skillItemId: evidenceKey, city: city.trim(), radius_km: radius.trim(), experience_years: experience.trim() });
  };

  const handleDone = () => {
    if (!currentCat || !city.trim()) return;
    handleSave();
    dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'service_area' });
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Area & References</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{currentCat?.name}</Text>
        <Text style={styles.subtitle}>
          Tell clients where you can run errands and add references that vouch for your reliability.
        </Text>

        <Text style={styles.fieldLabel}>Service Area / City *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. vehari, punjab, pakistan"
          placeholderTextColor={C.textHint}
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.fieldLabel}>Service Radius (km, optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 15"
          placeholderTextColor={C.textHint}
          value={radius}
          onChangeText={setRadius}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Years of Errand Experience (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2"
          placeholderTextColor={C.textHint}
          value={experience}
          onChangeText={setExperience}
          keyboardType="numeric"
        />

        <View style={styles.referencesHeader}>
          <Text style={styles.referencesTitle}>References (optional, max 2)</Text>
        </View>

        {savedRefs.map((r, i) => (
          <View key={i} style={styles.refCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.refName}>{r.name}</Text>
              {r.contact ? <Text style={styles.refContact}>{r.contact}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleDeleteReference(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={18} color={C.error} />
            </TouchableOpacity>
          </View>
        ))}

        {savedRefs.length < 2 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Reference name"
              placeholderTextColor={C.textHint}
              value={refName}
              onChangeText={setRefName}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact (phone or email)"
              placeholderTextColor={C.textHint}
              value={refContact}
              onChangeText={setRefContact}
            />
            <TouchableOpacity
              style={[styles.addRefBtn, !refName.trim() && styles.addRefBtnDisabled]}
              onPress={handleAddReference}
              disabled={!refName.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={18} color={!refName.trim() ? C.textHint : C.primary} />
              <Text style={[styles.addRefText, !refName.trim() && { color: C.textHint }]}> Add Reference</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.hint}>
          References are optional but help admins verify your reliability faster.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneBtn, !city.trim() && styles.doneBtnDisabled]}
          onPress={handleDone}
          disabled={!city.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>
            {!city.trim() ? 'Enter your service area first' : 'Done — Back to Evidence Options'}
          </Text>
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
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 16, lineHeight: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary, marginBottom: 12 },
  referencesHeader: { marginTop: 16, marginBottom: 12 },
  referencesTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  refCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  refName: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  refContact: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  addRefBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, marginBottom: 12 },
  addRefBtnDisabled: { borderColor: C.divider },
  addRefText: { fontSize: 14, fontWeight: '600', color: C.primary },
  hint: { fontSize: 11, color: C.textHint, marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  doneBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  doneBtnDisabled: { backgroundColor: C.divider },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
