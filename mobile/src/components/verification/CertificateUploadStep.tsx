import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function CertificateUploadStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];
  const track = currentCat?.job_type;

  const [image, setImage] = useState<string | null>(null);
  const [issuingBody, setIssuingBody] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload certificates.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your camera to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const currentCerts = currentSkillItem ? (state.uploadedCertificates[currentSkillItem._id] || []) : [];

  const handleSubmit = async () => {
    if (!image || !currentSkillItem || !currentCat) return;
    setSubmitting(true);
    try {
      const evidencePayload: Record<string, unknown> = {
        file_uri: image,
        issuing_body: issuingBody,
        credential_id: credentialId,
      };
      if (track === 'digital') {
        evidencePayload.credential_url = credentialUrl;
      }
      await verificationService.submitEvidence({
        category_id: currentCat.category_id,
        skill_item_id: currentSkillItem._id,
        evidence_type: 'certificate',
        evidence_payload: evidencePayload,
      });
      dispatch({ type: 'ADD_CERTIFICATE', skillItemId: currentSkillItem._id, uri: image, name: `${issuingBody} - ${credentialId}` });
      setUploaded(true);
    } catch {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    if (currentCat) {
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'certificate' });
    }
  };

  const handleAddAnother = () => {
    setImage(null);
    setIssuingBody('');
    setCredentialId('');
    setCredentialUrl('');
    setUploaded(false);
  };

  const styles = makeStyles(C);

  if (uploaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={48} color={C.success} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 8 }}>Certificate Submitted!</Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            Your certificate has been submitted for review.
          </Text>
          {currentCerts.length > 0 && (
            <View style={styles.certList}>
              <Text style={styles.certListTitle}>Uploaded certificates ({currentCerts.length}):</Text>
              {currentCerts.map((c, i) => (
                <Text key={i} style={styles.certListItem}>{i + 1}. {c.name}</Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.addAnotherBtn} onPress={handleAddAnother} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={C.primary} />
            <Text style={styles.addAnotherText}> Upload Another Certificate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Done — Back to Evidence Options</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Certificate</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.sectionTitle}>{currentCat?.name}</Text>
        <Text style={styles.subtitle}>
          Upload a photo or scan of your {track === 'physical' ? 'license/certificate' : 'certificate'}
        </Text>

        <TouchableOpacity style={styles.imageUpload} onPress={pickImage} activeOpacity={0.7}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={C.textHint} />
              <Text style={styles.uploadText}>Tap to upload from gallery</Text>
            </View>
          )}
        </TouchableOpacity>

        {image && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={16} color={C.primary} />
              <Text style={styles.retakeText}> Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeBtn} onPress={pickImage}>
              <Ionicons name="images" size={16} color={C.primary} />
              <Text style={styles.retakeText}> Browse</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.fieldLabel}>Issuing Body / Institution</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. City & Guilds"
          placeholderTextColor={C.textHint}
          value={issuingBody}
          onChangeText={setIssuingBody}
        />

        <Text style={styles.fieldLabel}>Credential / License ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. LIC-2024-78901"
          placeholderTextColor={C.textHint}
          value={credentialId}
          onChangeText={setCredentialId}
        />

        {track === 'digital' && (
          <>
            <Text style={styles.fieldLabel}>Verification URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://credential.net/verify/..."
              placeholderTextColor={C.textHint}
              value={credentialUrl}
              onChangeText={setCredentialUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.hint}>If you have a verifiable credential URL, auto-verification will attempt it.</Text>
          </>
        )}
      </View>

      {currentCerts.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: C.success, fontWeight: '500' }}>
            {currentCerts.length} certificate(s) already uploaded
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!image || !issuingBody || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!image || !issuingBody || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <Text style={styles.submitText}>Submitting...</Text>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.submitText}> Submit for Review</Text>
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
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 20 },
  imageUpload: { width: '100%', height: 200, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: C.cardBorder, overflow: 'hidden', marginBottom: 12 },
  preview: { width: '100%', height: '100%' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 13, color: C.textHint, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.primaryLight },
  retakeText: { fontSize: 13, fontWeight: '500', color: C.primary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary },
  hint: { fontSize: 11, color: C.textHint, marginTop: 4 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: C.divider },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  certList: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 16, width: '100%' },
  certListTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  certListItem: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  addAnotherBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, marginBottom: 12, width: '100%' },
  addAnotherText: { fontSize: 14, fontWeight: '600', color: C.primary },
  doneBtn: { paddingVertical: 12, alignItems: 'center' },
  doneBtnText: { fontSize: 14, fontWeight: '500', color: C.textHint },
});

