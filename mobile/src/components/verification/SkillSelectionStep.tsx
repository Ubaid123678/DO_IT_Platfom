import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { SkillItem, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function SkillSelectionStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const [skillItemsMap, setSkillItemsMap] = useState<Record<string, SkillItem[]>>({});
  const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {};
    for (const cat of state.selectedCategories) {
      m[cat.category_id] = [];
    }
    for (const entry of state.selectedSkillItems) {
      m[entry.category_id] = entry.skill_items.map(s => s._id);
    }
    return m;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const map: Record<string, SkillItem[]> = {};
        for (const cat of state.selectedCategories) {
          const items = await verificationService.getSkillItems(cat.category_id);
          map[cat.category_id] = items;
        }
        setSkillItemsMap(map);
      } catch {
        setError('Failed to load skills. Try again.');
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [state.selectedCategories]);

  const toggle = (catId: string, itemId: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [catId]: prev[catId]?.includes(itemId)
        ? prev[catId].filter(x => x !== itemId)
        : [...(prev[catId] || []), itemId],
    }));
  };

  const allHaveSelection = () => {
    return state.selectedCategories.every(cat => (selectedMap[cat.category_id]?.length || 0) > 0);
  };

  const handleNext = () => {
    const items = state.selectedCategories.map(cat => ({
      category_id: cat.category_id,
      skill_items: (selectedMap[cat.category_id] || []).map(id => {
        const found = skillItemsMap[cat.category_id]?.find(s => s.id === id);
        return { _id: id, name: found?.name || '', requires_certificate: found?.requires_certificate };
      }),
    }));
    dispatch({ type: 'SET_SKILL_ITEMS', items });
    dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' });
  };

  const totalSections = Object.keys(skillItemsMap).length;
  const completedSections = Object.values(selectedMap).filter(arr => arr.length > 0).length;
  const progressPct = Math.round((completedSections / (totalSections || 1)) * 100);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.error, fontSize: 14, marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity onPress={() => { setLoading(true); setError(null); }} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'category-selection' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Skills</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <Text style={styles.subtitle}>Choose at least one skill per category</Text>

      <FlatList
        data={state.selectedCategories}
        keyExtractor={item => item.category_id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: cat }) => {
          const items = skillItemsMap[cat.category_id] || [];
          const selected = selectedMap[cat.category_id] || [];

          return (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.categoryHeaderRow}>
                <Ionicons name={cat.job_type === 'physical' ? 'construct-outline' : 'laptop-outline'} size={18} color={C.primary} />
                <Text style={styles.categoryTitle}>{cat.name}</Text>
                <Text style={styles.countText}>{selected.length}/{items.length}</Text>
              </View>
              {items.map(item => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.skillCard, isSelected && styles.skillCardSelected]}
                    onPress={() => toggle(cat.category_id, item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkbox}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.skillName}>{item.name}</Text>
                      {item.requires_certificate && (
                        <Text style={styles.certHint}>Certificate required</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.textHint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !allHaveSelection() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!allHaveSelection()}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextBtnText, !allHaveSelection() && { color: C.textHint }]}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={!allHaveSelection() ? C.textHint : '#fff'} />
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
  progressBar: { height: 4, backgroundColor: C.divider, marginHorizontal: 20, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
  subtitle: { fontSize: 14, color: C.textSecondary, paddingHorizontal: 20, marginBottom: 20 },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  categoryTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, flex: 1 },
  countText: { fontSize: 12, color: C.textHint, fontWeight: '500' },
  skillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  skillCardSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: 'transparent' },
  skillName: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  certHint: { fontSize: 11, color: C.warning, marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  nextBtnDisabled: { backgroundColor: C.divider },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

