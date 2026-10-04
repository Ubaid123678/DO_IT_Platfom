import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
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

const ENGLISH_LEVELS = ['basic', 'intermediate', 'fluent'] as const;
const ENGLISH_LABELS: Record<string, string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  fluent: 'Fluent / Native',
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

export default function DigitalRequirementsStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goNext, goBack, canGoNext } = useJobCreation();
  const router = useRouter();

  const req = state.formData.requirements;
  const { categories, skillItems, experienceLevel, languages, certificationsRequired, vehicleRequired } = req;

  const [availableCategories, setAvailableCategories] = React.useState<Array<{ id: string; name: string; job_type: string }>>([]);
  const [techStack, setTechStack] = useState<string[]>(req.techStack || []);
  const [techInput, setTechInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState(req.portfolioUrl || '');
  const [githubUsername, setGithubUsername] = useState(req.githubUsername || '');
  const [timezone, setTimezone] = useState(req.timezone || 'UTC');
  const [englishProficiency, setEnglishProficiency] = useState(req.englishProficiency || '');
  const [workHistory, setWorkHistory] = useState<Array<{ title: string; company: string; start_date: string; end_date?: string; description?: string }>>(req.workHistory || []);
  const [education, setEducation] = useState<Array<{ institution: string; degree: string; field?: string; start_year?: number; end_year?: number }>>(req.education || []);
  const [showWorkHistory, setShowWorkHistory] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [workForm, setWorkForm] = useState({ title: '', company: '', start_date: '', end_date: '', description: '' });
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', field: '', start_year: '', end_year: '' });

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

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      const next = [...techStack, techInput.trim()].slice(0, 15);
      setTechStack(next);
      dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'techStack', value: next });
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    const next = techStack.filter((t) => t !== tech);
    setTechStack(next);
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'techStack', value: next });
  };

  const addWorkHistory = () => {
    if (workForm.title && workForm.company && workForm.start_date) {
      const next = [...workHistory, { ...workForm }];
      setWorkHistory(next);
      dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'workHistory', value: next });
      setWorkForm({ title: '', company: '', start_date: '', end_date: '', description: '' });
      setShowWorkHistory(false);
    }
  };

  const removeWorkHistory = (index: number) => {
    const next = workHistory.filter((_, i) => i !== index);
    setWorkHistory(next);
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'workHistory', value: next });
  };

  const addEducation = () => {
    if (eduForm.institution && eduForm.degree) {
      const next = [...education, { ...eduForm, start_year: parseInt(eduForm.start_year) || undefined, end_year: parseInt(eduForm.end_year) || undefined }];
      setEducation(next);
      dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'education', value: next });
      setEduForm({ institution: '', degree: '', field: '', start_year: '', end_year: '' });
      setShowEducation(false);
    }
  };

  const removeEducation = (index: number) => {
    const next = education.filter((_, i) => i !== index);
    setEducation(next);
    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'education', value: next });
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

          {/* Tech Stack */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tech Stack / Technologies</Text>
            <View style={styles.chipRow}>
              {techStack.map((tech) => (
                <View key={tech} style={styles.chipWithRemove}>
                  <Text style={styles.chipText}>{tech}</Text>
                  <TouchableOpacity onPress={() => removeTech(tech)} style={styles.removeBtn}>
                    <Ionicons name="close" size={16} color={C.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.flex1]}
                placeholder="Add technology (e.g. React, Node.js, AWS)"
                value={techInput}
                onChangeText={setTechInput}
                onSubmitEditing={addTech}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addTech}>
                <Ionicons name="add" size={24} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Portfolio URL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Portfolio / Website URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-portfolio.com"
              value={portfolioUrl}
              onChangeText={(v) => {
                setPortfolioUrl(v);
                dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'portfolioUrl', value: v });
              }}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.fieldHint}>Link to portfolio, GitHub, or work samples</Text>
          </View>

          {/* GitHub Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>GitHub Username (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="github-username"
              value={githubUsername}
              onChangeText={(v) => {
                setGithubUsername(v);
                dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'githubUsername', value: v });
              }}
              autoCapitalize="none"
            />
            <Text style={styles.fieldHint}>For code review and verification</Text>
          </View>

          {/* Timezone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Preferred Timezone</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. UTC-5, America/New_York"
              value={timezone}
              onChangeText={(v) => {
                setTimezone(v);
                dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'timezone', value: v });
              }}
            />
            <Text style={styles.fieldHint}>IANA timezone format preferred</Text>
          </View>

          {/* English Proficiency */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>English Proficiency Required</Text>
            <View style={styles.chipRow}>
              {ENGLISH_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.chip, englishProficiency === level && styles.chipActive]}
                  onPress={() => {
                    setEnglishProficiency(level);
                    dispatch({ type: 'UPDATE_NESTED_FORM', section: 'requirements', field: 'englishProficiency', value: level });
                  }}
                >
                  <Text style={[styles.chipText, englishProficiency === level && styles.chipTextActive]}>{ENGLISH_LABELS[level]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Work History */}
          <View style={styles.fieldGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.fieldLabel}>Work History</Text>
              <TouchableOpacity onPress={() => setShowWorkHistory(!showWorkHistory)}>
                <Text style={styles.linkText}>{showWorkHistory ? 'Hide' : 'Add Entry'}</Text>
              </TouchableOpacity>
            </View>
            
            {showWorkHistory && (
              <View style={styles.formSection}>
                <TextInput
                  style={styles.input}
                  placeholder="Job Title"
                  value={workForm.title}
                  onChangeText={(v) => setWorkForm({ ...workForm, title: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Company"
                  value={workForm.company}
                  onChangeText={(v) => setWorkForm({ ...workForm, company: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Start Date (YYYY-MM)"
                  value={workForm.start_date}
                  onChangeText={(v) => setWorkForm({ ...workForm, start_date: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="End Date (YYYY-MM) - leave empty if current"
                  value={workForm.end_date}
                  onChangeText={(v) => setWorkForm({ ...workForm, end_date: v })}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  value={workForm.description}
                  onChangeText={(v) => setWorkForm({ ...workForm, description: v })}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addWorkHistory}>
                  <Text style={styles.addBtnText}>Add Work Experience</Text>
                </TouchableOpacity>
              </View>
            )}

            {workHistory.map((work, i) => (
              <View key={i} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{work.title}</Text>
                  <Text style={styles.historyCompany}>{work.company}</Text>
                  <Text style={styles.historyDate}>
                    {work.start_date} - {work.end_date || 'Present'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeWorkHistory(i)}>
                  <Ionicons name="trash-outline" size={20} color={C.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Education */}
          <View style={styles.fieldGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TouchableOpacity onPress={() => setShowEducation(!showEducation)}>
                <Text style={styles.linkText}>{showEducation ? 'Hide' : 'Add Entry'}</Text>
              </TouchableOpacity>
            </View>
            
            {showEducation && (
              <View style={styles.formSection}>
                <TextInput
                  style={styles.input}
                  placeholder="Institution"
                  value={eduForm.institution}
                  onChangeText={(v) => setEduForm({ ...eduForm, institution: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Degree"
                  value={eduForm.degree}
                  onChangeText={(v) => setEduForm({ ...eduForm, degree: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Field of Study"
                  value={eduForm.field}
                  onChangeText={(v) => setEduForm({ ...eduForm, field: v })}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="Start Year"
                    value={eduForm.start_year}
                    onChangeText={(v) => setEduForm({ ...eduForm, start_year: v })}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="End Year"
                    value={eduForm.end_year}
                    onChangeText={(v) => setEduForm({ ...eduForm, end_year: v })}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={addEducation}>
                  <Text style={styles.addBtnText}>Add Education</Text>
                </TouchableOpacity>
              </View>
            )}

            {education.map((edu, i) => (
              <View key={i} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{edu.degree}</Text>
                  <Text style={styles.historyCompany}>{edu.institution}</Text>
                  <Text style={styles.historyDate}>
                    {edu.field ? `${edu.field} • ` : ''}{edu.start_year} - {edu.end_year || 'Present'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeEducation(i)}>
                  <Ionicons name="trash-outline" size={20} color={C.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Languages */}
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

          {/* Certifications */}
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
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    linkText: { fontSize: 14, color: C.primary, fontWeight: '600' },
    formSection: { backgroundColor: C.inputBg, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.inputBorder },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: C.inputBg, borderRadius: 8, marginBottom: 8 },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    historyCompany: { fontSize: 12, color: C.textSecondary },
    historyDate: { fontSize: 11, color: C.textHint },
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
    addBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
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
    textArea: { height: 100, paddingTop: 12 },
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