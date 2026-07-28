import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function ResumeBioStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [languages, setLanguages] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        setUploadedFile(result.assets[0].name);
        setUploading(false);
        Alert.alert('Uploaded', 'Resume received. Parsing will auto-fill the fields below once processed.');
      }
    } catch {
      setUploading(false);
      Alert.alert('Error', 'Failed to upload resume.');
    }
  };

  const handleSave = () => {
    dispatch({ type: 'SET_RESUME_BIO_COMPLETE' });
    dispatch({ type: 'COMPLETE_WIZARD' });
  };

  const handleSkip = () => {
    dispatch({ type: 'COMPLETE_WIZARD' });
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Resume</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Complete your provider profile</Text>
        <Text style={styles.subtitle}>Optional â€” you can do this anytime. It helps clients trust your expertise.</Text>

        <TouchableOpacity style={styles.uploadCard} onPress={pickResume} activeOpacity={0.7}>
          <Ionicons name="document-text-outline" size={32} color={C.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>{uploadedFile || 'Upload Resume (PDF/DOC)'}</Text>
            <Text style={styles.uploadHint}>Max 5MB. We'll auto-fill your profile.</Text>
          </View>
          {uploading ? (
            <Text style={{ fontSize: 12, color: C.textHint }}>Uploading...</Text>
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color={C.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>Or fill manually</Text>
          <View style={styles.orLine} />
        </View>

        <Text style={styles.fieldLabel}>Professional Headline</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Certified Electrician with 10 years experience"
          placeholderTextColor={C.textHint}
          value={headline}
          onChangeText={setHeadline}
        />

        <Text style={styles.fieldLabel}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell clients about your experience and expertise..."
          placeholderTextColor={C.textHint}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>

        <Text style={styles.fieldLabel}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          placeholderTextColor={C.textHint}
          value={yearsExp}
          onChangeText={setYearsExp}
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>Languages (comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. English, Spanish, French"
          placeholderTextColor={C.textHint}
          value={languages}
          onChangeText={setLanguages}
        />

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={C.primary} />
          <Text style={styles.infoText}>Your profile is visible to clients when you apply for jobs. A complete profile gets better responses.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save & Continue</Text>
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
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 4, marginTop: 8 },
  subtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, gap: 14, marginBottom: 20 },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  uploadHint: { fontSize: 11, color: C.textHint, marginTop: 2 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: C.divider },
  orText: { fontSize: 12, color: C.textHint, marginHorizontal: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary },
  textArea: { height: 100, paddingTop: 14 },
  charCount: { fontSize: 11, color: C.textHint, textAlign: 'right', marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: C.divider },
  skipText: { fontSize: 14, fontWeight: '600', color: C.textHint },
  saveBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

