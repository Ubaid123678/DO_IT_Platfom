import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';
import { getCategoryFieldConfig, CategoryFieldConfig } from '@/src/utils/categoryFields';

const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0-2 years)',
  intermediate: 'Intermediate (2-5 years)',
  expert: 'Expert (5+ years)',
};

const TEAM_SIZES = ['solo', 'with_helper', 'with_team'] as const;
const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: 'Solo',
  with_helper: 'With Helper',
  with_team: 'With Team',
};

const TRANSPORT_MODES = ['bicycle', 'motorbike', 'car'] as const;
const TRANSPORT_MODE_LABELS: Record<string, string> = {
  bicycle: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
};

export default function PhysicalRequirementsStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const req = state.formData.requirements;
  const { categories, skillItems, experienceLevel, languages, certificationsRequired, vehicleRequired } = req;

  const [availableCategories, setAvailableCategories] = React.useState<Array<{ id: string; name: string; job_type: string }>>([]);
  const [yearsExperience, setYearsExperience] = useState(req.yearsExperience?.toString() || '');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(req.serviceRadiusKm?.toString() || '');
  const [toolsEquipment, setToolsEquipment] = useState<string[]>(req.toolsEquipment || []);
  const [toolInput, setToolInput] = useState('');
  const [teamSize, setTeamSize] = useState(req.teamSize || '');
  const [insurance, setInsurance] = useState(req.insurance || false);
  const [hasTransport, setHasTransport] = useState(req.hasTransport || { yes: false, mode: undefined });
  const [transportMode, setTransportMode] = useState(req.hasTransport?.mode || '');

  const loadCategories = async () => {
    try {
      const cats = await verificationService.getCategories();
      const filtered = cats.filter((c) => c.job_type === state.jobType);
      setAvailableCategories(filtered);
    } catch {
      // Ignore
    }
  };

  React.useEffect(() => {
    loadCategories();
  }, [state.jobType]);

  // Determine which fields to show based on selected categories
  const fieldConfig = useMemo(() => {
    if (categories.length === 0) return {} as CategoryFieldConfig;
    
    // Merge configs from all selected categories
    const merged: CategoryFieldConfig = {};
    for (const catId of categories) {
      const cat = availableCategories.find(c => c.id === catId);
      if (cat) {
        const config = getCategoryFieldConfig(cat.name);
        for (const [key, value] of Object.entries(config)) {
          if (value === true) {
            (merged as any)[key] = true;
          }
        }
      }
    }
    return merged;
  }, [categories, availableCategories]);

  const toggleCategory = (catId: string) => {
    const next = categories.includes(catId)
      ? categories.filter((c) => c !== catId)
      : [...categories, catId].slice(0, 3);
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'categories', value: next });
  };

  const toggleLanguage = (lang: string) => {
    const next = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang];
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'languages', value: next });
  };

  const addTool = () => {
    if (toolInput.trim() && !toolsEquipment.includes(toolInput.trim())) {
      const next = [...toolsEquipment, toolInput.trim()].slice(0, 10);
      setToolsEquipment(next);
      dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'toolsEquipment', value: next });
      setToolInput('');
    }
  };

  const removeTool = (tool: string) => {
    const next = toolsEquipment.filter((t) => t !== tool);
    setToolsEquipment(next);
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'toolsEquipment', value: next });
  };

  const handleTransportChange = (mode: 'bicycle' | 'motorbike' | 'car') => {
    setTransportMode(mode);
    setHasTransport({ yes: true, mode });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'hasTransport', value: { yes: true, mode } });
  };

  const handleTransportNo = () => {
    setTransportMode('');
    setHasTransport({ yes: false });
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'hasTransport', value: { yes: false } });
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

          {/* Categories */}
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
              {availableCategories.length === 0 && <Text style={styles.loadingText}>Loading categories...</Text>}
            </View>
            {categories.length === 0 && <Text style={styles.errorText}>Select at least one category</Text>}
          </View>

          {/* Experience Level */}
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

          {/* Dynamic Fields - Only show if ANY selected category needs them */}
          {fieldConfig.yearsExperience && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Years of Experience Required</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                value={yearsExperience}
                onChangeText={(v) => {
                  setYearsExperience(v);
                  const num = parseInt(v) || 0;
                  dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'yearsExperience', value: num > 0 ? num : undefined });
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.fieldHint}>Minimum years of professional experience</Text>
            </View>
          )}

          {fieldConfig.serviceRadiusKm && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Service Radius (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25"
                value={serviceRadiusKm}
                onChangeText={(v) => {
                  setServiceRadiusKm(v);
                  const num = parseInt(v) || 0;
                  dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'serviceRadiusKm', value: num > 0 ? num : undefined });
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.fieldHint}>How far you're willing to travel</Text>
            </View>
          )}

          {fieldConfig.toolsEquipment && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Required Tools / Equipment</Text>
              <View style={styles.chipRow}>
                {toolsEquipment.map((tool) => (
                  <View key={tool} style={styles.chipWithRemove}>
                    <Text style={styles.chipText}>{tool}</Text>
                    <TouchableOpacity onPress={() => removeTool(tool)} style={styles.removeBtn}>
                      <Ionicons name="close" size={16} color={C.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  placeholder="Add tool/equipment"
                  value={toolInput}
                  onChangeText={setToolInput}
                  onSubmitEditing={addTool}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addTool}>
                  <Ionicons name="add" size={24} color={C.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHint}>e.g. Scaffolding, Power Drill, Pressure Washer</Text>
            </View>
          )}

          {fieldConfig.teamSize && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Team Size</Text>
              <View style={styles.chipRow}>
                {TEAM_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.chip, teamSize === size && styles.chipActive]}
                    onPress={() => {
                      setTeamSize(size);
                      dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'teamSize', value: size });
                    }}
                  >
                    <Text style={[styles.chipText, teamSize === size && styles.chipTextActive]}>{TEAM_SIZE_LABELS[size]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {fieldConfig.insurance && (
            <View style={styles.fieldGroup}>
              <TouchableOpacity style={styles.boolRow} onPress={() => {
                const next = !insurance;
                setInsurance(next);
                dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'insurance', value: next });
              }}>
                <View style={styles.boolContent}>
                  <Text style={styles.boolTitle}>Insurance Required</Text>
                  <Text style={styles.boolSubtitle}>Provider must have liability insurance</Text>
                </View>
                <View style={[styles.boolCheckbox, insurance && styles.boolCheckboxChecked]}>
                  {insurance && <Ionicons name="checkmark" size={20} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {fieldConfig.hasTransport && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Vehicle / Transport</Text>
              <TouchableOpacity style={styles.boolRow} onPress={handleTransportNo}>
                <View style={styles.boolContent}>
                  <Text style={styles.boolTitle}>No Vehicle Required</Text>
                  <Text style={styles.boolSubtitle}>Job can be done without provider's vehicle</Text>
                </View>
                <View style={[styles.boolCheckbox, !hasTransport.yes && styles.boolCheckboxChecked]}>
                  {!hasTransport.yes && <Ionicons name="checkmark" size={20} color="#fff" />}
                </View>
              </TouchableOpacity>
              
              {TRANSPORT_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={styles.transportOption}
                  onPress={() => handleTransportChange(mode)}
                >
                  <View style={[styles.transportIcon, hasTransport.mode === mode && styles.transportIconActive]}>
                    <Ionicons name={(mode === 'bicycle' ? 'bicycle' : mode === 'motorbike' ? 'flash' : 'car') as any} size={24} color={hasTransport.mode === mode ? '#fff' : C.primary} />
                  </View>
                  <Text style={[styles.transportLabel, hasTransport.mode === mode && styles.transportLabelActive]}>{TRANSPORT_MODE_LABELS[mode]}</Text>
                  <View style={[styles.transportRadio, hasTransport.mode === mode && styles.transportRadioActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Certifications & Vehicle (common) */}
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
                <Text style={styles.boolSubtitle}>Provider needs their own vehicle</Text>
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
    chipWithRemove: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    removeBtn: { padding: 2 },
    inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    flex1: { flex: 1 },
    addBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 13, color: C.textHint, marginTop: 8 },
    errorText: { fontSize: 12, color: C.error, marginTop: 8 },
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
    boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.inputBorder, marginBottom: 12 },
    boolContent: { flex: 1 },
    boolTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    boolSubtitle: { fontSize: 11, color: C.textHint, marginTop: 2 },
    boolCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
    boolCheckboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
    transportOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.inputBorder, marginBottom: 12 },
    transportIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    transportIconActive: { backgroundColor: C.primary },
    transportLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, flex: 1 },
    transportLabelActive: { color: '#fff' },
    transportRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
    transportRadioActive: { borderColor: C.primary, backgroundColor: C.primary },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    nextBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });