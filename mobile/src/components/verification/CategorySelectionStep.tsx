import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { SkillCategory, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';
import { jobTypeIcon } from './EvidenceTypeChoiceStep';

type TrackType = 'physical' | 'digital' | 'errand';

const jobTypeLabel = (t: string): string =>
  t === 'physical' ? 'Physical' : t === 'errand' ? 'Errand' : 'Digital';

export default function CategorySelectionStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  // Resubmit mode: category is pre-selected and locked
  const isResubmitMode = state.resubmitMode;
  const resubmitCategoryId = state.resubmitCategoryId;

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (isResubmitMode && resubmitCategoryId) return [resubmitCategoryId];
    return state.selectedCategories.map(c => c.category_id);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the resubmit target across every source that could know it: the
  // freshly fetched active list, the wizard's selected categories, or the info
  // carried into START_RESUBMIT by the caller (works even when the category was
  // deactivated and no longer appears in the active list).
  const resubmitTarget: { category_id: string; name: string; job_type: TrackType } | null = (() => {
    if (!resubmitCategoryId) return null;
    const fromList = categories.find(c => c.id === resubmitCategoryId);
    if (fromList) return { category_id: fromList.id, name: fromList.name, job_type: fromList.job_type };
    const fromState = state.selectedCategories.find(c => c.category_id === resubmitCategoryId);
    if (fromState) return fromState;
    if (state.resubmitCategoryInfo) {
      return { category_id: resubmitCategoryId, name: state.resubmitCategoryInfo.name, job_type: state.resubmitCategoryInfo.job_type };
    }
    return null;
  })();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await verificationService.getCategories();
        setCategories(data.filter(c => c.active));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Failed to load categories: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const toggle = (id: string) => {
    if (isResubmitMode) {
      // Resubmit is scoped to one category: only the resubmit target can be
      // unselected/re-selected; every other category stays locked.
      if (id !== resubmitCategoryId) return;
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
      return;
    }
    setSelectedIds(prev => {
      const target = categories.find(c => c.id === id);
      if (!target) return prev;
      const hasOppositeTrack = prev.some(pid => {
        const c = categories.find(x => x.id === pid);
        return c && c.job_type !== target.job_type;
      });
      if (hasOppositeTrack) return prev;
      return prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev;
    });
  };

  const handleNext = () => {
    if (isResubmitMode && resubmitTarget) {
      // Only submit the resubmit category
      dispatch({ type: 'SET_CATEGORIES', categories: [{ category_id: resubmitTarget.category_id, name: resubmitTarget.name, job_type: resubmitTarget.job_type }] });
      dispatch({ type: 'SET_STEP', step: 'skill-selection' });
    } else if (isResubmitMode) {
      // No resubmit target resolved; do nothing rather than clobber the selection.
      return;
    } else {
      const selected = categories.filter(c => selectedIds.includes(c.id));
      dispatch({ type: 'SET_CATEGORIES', categories: selected.map(c => ({ category_id: c.id, name: c.name, job_type: c.job_type })) });
      dispatch({ type: 'SET_STEP', step: 'skill-selection' });
    }
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

  // Normalize the resubmit target into a renderable category card so it always
  // shows as the selected + locked card even if it's missing from the active list.
  const resubmitCatForRender: SkillCategory | null = resubmitTarget
    ? { id: resubmitTarget.category_id, name: resubmitTarget.name, job_type: resubmitTarget.job_type, active: true }
    : null;

  const buildTrackList = (list: SkillCategory[], jobType: TrackType): SkillCategory[] => {
    if (!resubmitCatForRender || resubmitCatForRender.job_type !== jobType) return list;
    if (list.some(c => c.id === resubmitCatForRender.id)) return list;
    return [resubmitCatForRender, ...list];
  };

  const physicalCats = buildTrackList(categories.filter(c => c.job_type === 'physical'), 'physical');
  const digitalCats = buildTrackList(categories.filter(c => c.job_type === 'digital'), 'digital');
  const errandCats = buildTrackList(categories.filter(c => c.job_type === 'errand'), 'errand');

  const selectedTrack: TrackType | null = isResubmitMode
    ? resubmitTarget?.job_type ?? null
    : categories.find(c => selectedIds.includes(c.id))?.job_type ?? null;

  const physicalLocked = selectedTrack !== null && selectedTrack !== 'physical';
  const digitalLocked = selectedTrack !== null && selectedTrack !== 'digital';
  const errandLocked = selectedTrack !== null && selectedTrack !== 'errand';

  const trackHintText = (() => {
    if (isResubmitMode) return 'Only your rejected category can be resubmitted.';
    if (selectedTrack === 'physical') return 'You can only offer physical services. To switch, remove your current selection first.';
    if (selectedTrack === 'digital') return 'You can only offer digital services. To switch, remove your current selection first.';
    if (selectedTrack === 'errand') return 'You can only offer errand & delivery services. To switch, remove your current selection first.';
    return '';
  })();

  const renderCategoryCard = (cat: SkillCategory, locked: boolean) => {
    const isResubmitTarget = isResubmitMode && resubmitCategoryId === cat.id;
    // In resubmit mode every category except the resubmit target is locked; the
    // target itself can be unselected/re-selected.
    const isDisabled = isResubmitMode ? !isResubmitTarget : locked;
    const isSelected = selectedIds.includes(cat.id);
    return (
      <TouchableOpacity
        key={cat.id}
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          isDisabled && styles.categoryCardDisabled,
        ]}
        onPress={() => toggle(cat.id)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={[styles.categoryIcon, isDisabled && styles.categoryIconDisabled]}>
          <Ionicons name={jobTypeIcon(cat.job_type)} size={28} color={isDisabled ? C.textHint : C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.categoryName, isDisabled && { color: C.textHint }]}>{cat.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{jobTypeLabel(cat.job_type)}</Text>
          </View>
        </View>
        {isResubmitTarget ? (
          <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={C.primary} />
        ) : isDisabled ? (
          <Ionicons name="lock-closed-outline" size={20} color={C.textHint} />
        ) : isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color={C.primary} />
        ) : null}
      </TouchableOpacity>
    );
  };

return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>{isResubmitMode ? 'Resubmit Category' : 'Choose Categories'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isResubmitMode ? (
        <Text style={styles.subtitle}>
          You are resubmitting: {resubmitTarget?.name ?? 'selected category'}
        </Text>
      ) : (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(selectedIds.length / 3) * 100}%` }]} />
          </View>

          <Text style={styles.subtitle}>
            Select the service categories you want to offer ({selectedIds.length}/3)
          </Text>
        </>
      )}

      {(physicalLocked || digitalLocked || errandLocked) && (
        <View style={styles.trackHint}>
          <Ionicons name="lock-closed-outline" size={14} color={C.amber} />
          <Text style={styles.trackHintText}>{trackHintText}</Text>
        </View>
      )}

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {physicalCats.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Physical Services</Text>
                {physicalCats.map(cat => renderCategoryCard(cat, physicalLocked))}
              </>
            )}

            {digitalCats.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: physicalCats.length > 0 ? 24 : 0 }]}>Digital Services</Text>
                {digitalCats.map(cat => renderCategoryCard(cat, digitalLocked))}
              </>
            )}

            {errandCats.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: physicalCats.length > 0 || digitalCats.length > 0 ? 24 : 0 }]}>Errands & Delivery</Text>
                {errandCats.map(cat => renderCategoryCard(cat, errandLocked))}
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
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
  subtitle: { fontSize: 14, color: C.textSecondary, paddingHorizontal: 20, marginBottom: 20 },
  trackHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.amberLight, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 16 },
  trackHintText: { flex: 1, fontSize: 12, color: C.amber, lineHeight: 17 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: C.textHint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: C.cardBorder },
  categoryCardSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  categoryCardDisabled: { opacity: 0.45, backgroundColor: C.divider, borderColor: C.divider },
  categoryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  categoryIconDisabled: { backgroundColor: C.divider },
  categoryName: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeDigital: { backgroundColor: C.primaryLight },
  badgeText: { fontSize: 10, fontWeight: '500', color: C.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: C.background },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  nextBtnDisabled: { backgroundColor: C.divider },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

