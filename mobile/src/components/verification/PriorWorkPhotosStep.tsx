import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function PriorWorkPhotosStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];

  const [photos, setPhotos] = useState<{ uri: string; caption: string }[]>([]);
  const [currentCaption, setCurrentCaption] = useState('');

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, { uri: result.assets[0].uri, caption: currentCaption }]);
      setCurrentCaption('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length < 3 || !currentSkillItem || !currentCat) return;
    try {
      await verificationService.submitEvidence({
        category_id: currentCat.category_id,
        skill_item_id: currentSkillItem._id,
        evidence_type: 'prior_work',
        evidence_payload: { photos: photos.map(p => ({ uri: p.uri, caption: p.caption })) },
      });
      Alert.alert('Submitted', 'Your work photos have been submitted for review.', [
        { text: 'OK', onPress: () => dispatch({ type: 'COMPLETE_CATEGORY_EVIDENCE' }) },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit. Try again.');
    }
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prior Work Photos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.title}>Upload 3-10 photos of your previous work</Text>
        <Text style={styles.subtitle}>Add captions to describe each photo</Text>

        <FlatList
          data={photos}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item, index }) => (
            <View style={styles.photoCard}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.caption}>{item.caption || 'No caption'}</Text>
              </View>
              <TouchableOpacity onPress={() => removePhoto(index)}>
                <Ionicons name="trash-outline" size={20} color={C.error} />
              </TouchableOpacity>
            </View>
          )}
        />

        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption for the next photo"
          placeholderTextColor={C.textHint}
          value={currentCaption}
          onChangeText={setCurrentCaption}
        />

        <TouchableOpacity style={styles.addBtn} onPress={addPhoto}>
          <Ionicons name="add-circle-outline" size={20} color={C.primary} />
          <Text style={styles.addText}> Add Photo ({photos.length}/10)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, photos.length < 3 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={photos.length < 3}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>Submit {photos.length} Photos for Review</Text>
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
  subtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 16 },
  photoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 10, marginBottom: 8, gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: C.divider },
  caption: { fontSize: 13, color: C.textSecondary },
  captionInput: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 44, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, marginBottom: 16 },
  addText: { fontSize: 14, fontWeight: '600', color: C.primary },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  submitBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: C.divider },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

