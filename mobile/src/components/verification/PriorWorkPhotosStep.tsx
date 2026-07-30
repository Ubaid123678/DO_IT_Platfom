import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function PriorWorkPhotosStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const currentItems = state.selectedSkillItems.find(s => s.category_id === currentCat?.category_id);
  const currentSkillItem = currentItems?.skill_items[0];

  const existingPhotos = currentSkillItem ? (state.priorWorkPhotos[currentSkillItem._id] || []) : [];
  const [currentCaption, setCurrentCaption] = useState('');

  const addPhoto = async () => {
    if (existingPhotos.length >= 10) {
      Alert.alert('Limit reached', 'Maximum 10 photos allowed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      if (currentSkillItem) {
        dispatch({ type: 'ADD_PHOTO', skillItemId: currentSkillItem._id, uri: result.assets[0].uri, caption: currentCaption });
      }
      setCurrentCaption('');
    }
  };

  const removePhoto = (index: number) => {
    if (currentSkillItem) {
      dispatch({ type: 'DELETE_PHOTO', skillItemId: currentSkillItem._id, index });
    }
  };

  const handleDone = () => {
    if (currentCat && existingPhotos.length >= 3) {
      dispatch({ type: 'MARK_EVIDENCE_COMPLETE', categoryId: currentCat.category_id, evidenceKey: 'prior_work' });
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
          data={existingPhotos}
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
          <Text style={styles.addText}> Add Photo ({existingPhotos.length}/10)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, existingPhotos.length < 3 && styles.submitBtnDisabled]}
          onPress={handleDone}
          disabled={existingPhotos.length < 3}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>
            {existingPhotos.length < 3
              ? `Add ${3 - existingPhotos.length} more photo(s)`
              : 'Done — Back to Evidence Options'}
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
