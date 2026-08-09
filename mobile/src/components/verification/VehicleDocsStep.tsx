import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEvidenceKey, useWizard } from '@/src/context/VerificationWizardContext';
import { Colors, type AppColors } from '@/src/theme/colors';

const DOC_TYPES = ['Driving Licence', 'Vehicle Registration', 'Insurance', 'Other'];

export default function VehicleDocsStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const evidenceKey = currentCat ? getEvidenceKey(state, currentCat) : null;
  const currentDocs = evidenceKey ? (state.vehicleDocs[evidenceKey] || []) : [];

  const [image, setImage] = useState<string | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docName, setDocName] = useState('');

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload vehicle documents.');
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

  const handleAdd = () => {
    if (!image || !evidenceKey) return;
    dispatch({
      type: 'ADD_VEHICLE_DOC',
      skillItemId: evidenceKey,
      uri: image,
      name: docName || docType,
      docType,
    });
    setImage(null);
    setDocName('');
  };

  const handleDelete = (index: number) => {
    if (!evidenceKey) return;
    dispatch({ type: 'DELETE_VEHICLE_DOC', skillItemId: evidenceKey, index });
  };

  const handleDone = () => {
    if (currentCat && currentDocs.length > 0) {
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'vehicle_docs' });
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'GO_BACK' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{currentCat?.name}</Text>
        <Text style={styles.subtitle}>
          One of your selected skills requires a vehicle. Add your driving licence, registration, and insurance.
        </Text>

        <Text style={styles.docTypeLabel}>Document Type</Text>
        <View style={styles.typeRow}>
          {DOC_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, docType === t && styles.typeChipSelected]}
              onPress={() => setDocType(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeChipText, docType === t && styles.typeChipTextSelected]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Document Label (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder={docType}
          placeholderTextColor={C.textHint}
          value={docName}
          onChangeText={setDocName}
        />

        <TouchableOpacity style={styles.imageUpload} onPress={pickImage} activeOpacity={0.7}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={C.textHint} />
              <Text style={styles.uploadText}>Tap to upload {docType}</Text>
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

        <TouchableOpacity
          style={[styles.addBtn, !image && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!image}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addText}> Add Document</Text>
        </TouchableOpacity>

        {currentDocs.length > 0 && (
          <View style={styles.docList}>
            <Text style={styles.docListTitle}>Uploaded documents ({currentDocs.length}):</Text>
            {currentDocs.map((d, i) => (
              <View key={i} style={styles.docRow}>
                <Ionicons name="document-outline" size={18} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName} numberOfLines={1}>{d.name}</Text>
                  <Text style={styles.docType}>{d.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={18} color={C.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneBtn, currentDocs.length === 0 && styles.doneBtnDisabled]}
          onPress={handleDone}
          disabled={currentDocs.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>
            {currentDocs.length === 0 ? 'Add at least one document' : 'Done — Back to Evidence Options'}
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
  docTypeLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  typeChipSelected: { backgroundColor: C.primary, borderColor: C.primary },
  typeChipText: { fontSize: 13, color: C.textSecondary },
  typeChipTextSelected: { color: '#fff', fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary, marginBottom: 12 },
  imageUpload: { width: '100%', height: 180, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: C.cardBorder, overflow: 'hidden', marginBottom: 12 },
  preview: { width: '100%', height: '100%' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 13, color: C.textHint, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.primaryLight },
  retakeText: { fontSize: 13, fontWeight: '500', color: C.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, marginBottom: 16 },
  addBtnDisabled: { backgroundColor: C.divider },
  addText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  docList: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  docListTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  docName: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  docType: { fontSize: 11, color: C.textHint, marginTop: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  doneBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  doneBtnDisabled: { backgroundColor: C.divider },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
