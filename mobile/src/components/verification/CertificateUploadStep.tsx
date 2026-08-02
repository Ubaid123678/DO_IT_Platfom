import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEvidenceKey, useWizard } from '@/src/context/VerificationWizardContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function CertificateUploadStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const evidenceKey = currentCat ? getEvidenceKey(state, currentCat) : null;

  const [image, setImage] = useState<string | null>(null);
  const [issuingBody, setIssuingBody] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
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

  const currentCerts = evidenceKey ? (state.uploadedCertificates[evidenceKey] || []) : [];

  const handleAdd = () => {
    if (!image || !evidenceKey) return;
    const name = `${issuingBody || 'Certificate'}${credentialId ? ` - ${credentialId}` : ''}`;
    dispatch({ type: 'ADD_CERTIFICATE', skillItemId: evidenceKey, uri: image, name });
    setUploaded(true);
  };

  const handleDelete = (index: number) => {
    if (!evidenceKey) return;
    dispatch({ type: 'DELETE_CERTIFICATE', skillItemId: evidenceKey, index });
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
          <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary, marginBottom: 8 }}>Certificate Added!</Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            Your certificate has been saved. Add more or continue when ready.
          </Text>
          {currentCerts.length > 0 && (
            <View style={styles.certList}>
              <Text style={styles.certListTitle}>Uploaded certificates ({currentCerts.length}):</Text>
              {currentCerts.map((c, i) => (
                <View key={i} style={styles.certRow}>
                  <Text style={styles.certListItem} numberOfLines={1}>{i + 1}. {c.name}</Text>
                  <TouchableOpacity onPress={() => handleDelete(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={18} color={C.error} />
                  </TouchableOpacity>
                </View>
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
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Certificate</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.sectionTitle}>{currentCat?.name}</Text>
        <Text style={styles.subtitle}>
          Upload a photo or scan of your certificate/license
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

        {currentCat?.job_type === 'digital' && (
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
            {currentCerts.length} certificate(s) already saved
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, (!image) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!image}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addText}> Add Certificate</Text>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  addBtnDisabled: { backgroundColor: C.divider },
  addText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  certList: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 16, width: '100%' },
  certListTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  certRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  certListItem: { fontSize: 12, color: C.textSecondary, flex: 1, marginRight: 8 },
  addAnotherBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, marginBottom: 12, width: '100%' },
  addAnotherText: { fontSize: 14, fontWeight: '600', color: C.primary },
  doneBtn: { paddingVertical: 12, alignItems: 'center' },
  doneBtnText: { fontSize: 14, fontWeight: '500', color: C.textHint },
});
