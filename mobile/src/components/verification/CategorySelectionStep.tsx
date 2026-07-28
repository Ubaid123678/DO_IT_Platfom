import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { SkillCategory, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function CategorySelectionStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { dispatch } = useWizard();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await verificationService.getCategories();
        setCategories(data.filter(c => c.active));
      } catch {
        setError('Failed to load categories. Pull to retry.');
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handleNext = () => {
    const selected = categories.filter(c => selectedIds.includes(c.id));
    dispatch({ type: 'SET_CATEGORIES', categories: selected.map(c => ({ category_id: c.id, name: c.name, job_type: c.job_type })) });
    dispatch({ type: 'SET_STEP', step: 'skill-selection' });
  };

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
        <Text style={{ color: C.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity onPress={() => { setLoading(true); setError(null); }} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);
  const physicalCats = categories.filter(c => c.job_type === 'physical');
  const digitalCats = categories.filter(c => c.job_type === 'digital');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.subtitle}>
        Select the service categories you want to offer ({selectedIds.length}/3)
      </Text>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {physicalCats.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Physical Services</Text>
                {physicalCats.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, selectedIds.includes(cat.id) && styles.categoryCardSelected]}
                    onPress={() => toggle(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons name="construct-outline" size={28} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Physical</Text>
                      </View>
                    </View>
                    {selectedIds.includes(cat.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={C.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {digitalCats.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: physicalCats.length > 0 ? 24 : 0 }]}>Digital Services</Text>
                {digitalCats.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, selectedIds.includes(cat.id) && styles.categoryCardSelected]}
                    onPress={() => toggle(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons name="laptop-outline" size={28} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <View style={[styles.badge, styles.badgeDigital]}>
                        <Text style={[styles.badgeText, { color: C.primary }]}>Digital</Text>
                      </View>
                    </View>
                    {selectedIds.includes(cat.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={C.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, selectedIds.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selectedIds.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextBtnText, selectedIds.length === 0 && { color: C.textHint }]}>
            Next ({selectedIds.length} selected)
          </Text>
          <Ionicons name="arrow-forward" size={20} color={selectedIds.length === 0 ? C.textHint : '#fff'} />
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
  progressFill: { width: '8%', height: '100%', backgroundColor: C.primary, borderRadius: 2 },
  subtitle: { fontSize: 14, color: C.textSecondary, paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: C.textHint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: C.cardBorder },
  categoryCardSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  categoryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  categoryName: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeDigital: { backgroundColor: C.primaryLight },
  badgeText: { fontSize: 10, fontWeight: '500', color: C.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  nextBtnDisabled: { backgroundColor: C.divider },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

