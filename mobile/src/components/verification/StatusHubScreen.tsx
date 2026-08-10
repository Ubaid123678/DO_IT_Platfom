import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { VerificationRecord, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

interface RecordItemProps {
  item: VerificationRecord;
  catName: string;
  skillName: string;
  cfg: { label: string; color: string; icon: string; bg: string };
  onResubmit: () => void;
  C: AppColors;
}

const RecordItem = memo(function RecordItem({ item, catName, skillName, cfg, onResubmit, C }: RecordItemProps) {
  const styles = makeStyles(C);
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.catName}>{catName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      {item.skill_item_id ? (
        <Text style={styles.skillName}>Skill: {skillName}</Text>
      ) : null}
      <Text style={styles.evidenceType}>Type: {evidenceTypeLabel(item.evidence_type)}</Text>
      {item.status === 'rejected' && item.rejection_reason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Reason:</Text>
          <Text style={styles.rejectionReason}>{item.rejection_reason}</Text>
        </View>
      )}
      {item.status === 'rejected' && (
        <TouchableOpacity style={styles.resubmitBtn} onPress={onResubmit}>
          <Text style={styles.resubmitText}>Resubmit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const statusConfig: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  draft: { label: 'Draft', color: '#AAAAAA', icon: 'ellipse-outline', bg: '#E8EDED' },
  pending_review: { label: 'Pending Review', color: '#F5A623', icon: 'time-outline', bg: '#FEF3DC' },
  scheduled: { label: 'Test Scheduled', color: '#1A9E8F', icon: 'calendar-outline', bg: '#E0F4F2' },
  auto_approved: { label: 'Auto-Approved', color: '#27AE60', icon: 'checkmark-circle', bg: '#E8F8F2' },
  approved: { label: 'Approved', color: '#27AE60', icon: 'checkmark-circle', bg: '#E8F8F2' },
  rejected: { label: 'Rejected', color: '#E74C3C', icon: 'close-circle', bg: '#FDECEA' },
  expired: { label: 'Expired', color: '#AAAAAA', icon: 'timer-outline', bg: '#E8EDED' },
};

const evidenceTypeLabel = (t: string): string =>
  t === 'digital' ? 'Digital Evidence' : t === 'physical' ? 'Physical Evidence' : t === 'errand' ? 'Errand Trust Bundle' : t.replace('_', ' ');

export default function StatusHubScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { state, dispatch } = useWizard();

  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await verificationService.getVerificationRecords();
      setRecords(data);
    } catch {
      setError('Failed to load status. Pull to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    verificationService.getProfile()
      .then((p) => {
        setCompleteness(p.completeness ?? 0);
        setMissingFields(p.missing_fields ?? []);
      })
      .catch(() => {});
  }, []);

  const rejectedRecords = records.filter(r => r.status === 'rejected');

  const allApproved = records.length > 0 && records.every(r => r.status === 'auto_approved' || r.status === 'approved');
  const someApproved = records.some(r => r.status === 'auto_approved' || r.status === 'approved');

  const handleGoToDashboard = () => {
    router.replace('/(provider)/home');
  };

const handleResubmit = useCallback((record: VerificationRecord) => {
    dispatch({ type: 'SET_REJECTION_RECORD', id: record.id });
  }, [dispatch]);

  // Precompute category and skill name maps for O(1) lookup in renderItem
  const catNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of state.selectedCategories) {
      map[cat.category_id] = cat.name;
    }
    return map;
  }, [state.selectedCategories]);

  const skillNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of state.selectedSkillItems) {
      for (const skill of entry.skill_items) {
        map[skill._id] = skill.name;
      }
    }
    return map;
  }, [state.selectedSkillItems]);

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <TouchableOpacity onPress={handleGoToDashboard}>
          <Text style={styles.skipText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        {allApproved ? (
          <>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F8F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={40} color={C.success} />
            </View>
            <Text style={styles.summaryTitle}>All Verified!</Text>
            <Text style={styles.summarySub}>You can now browse and apply for jobs in all your selected categories.</Text>
          </>
        ) : someApproved ? (
          <>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="ellipse-outline" size={40} color={C.amber} />
            </View>
            <Text style={styles.summaryTitle}>Partially Verified</Text>
            <Text style={styles.summarySub}>Some categories are still pending review. You can use verified categories now.</Text>
          </>
        ) : (
          <>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="time-outline" size={40} color={C.primary} />
            </View>
            <Text style={styles.summaryTitle}>Under Review</Text>
            <Text style={styles.summarySub}>Your evidence is being reviewed. This usually takes 24-48 hours.</Text>
          </>
        )}
      </View>

      {completeness != null && completeness < 100 && (
        <View style={styles.completenessCard}>
          <View style={styles.completenessRing}>
            <Text style={styles.completenessPct}>{completeness}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completenessTitle}>Profile {completeness}% complete</Text>
            <Text style={styles.completenessSub}>
              {missingFields.length > 0 ? `Add ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}` : 'Add more details to stand out to clients.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.completenessBtn} onPress={() => dispatch({ type: 'SET_STEP', step: 'resume-bio' })}>
            <Text style={styles.completenessBtnText}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: C.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity onPress={fetchStatus} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
<FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="document-outline" size={48} color={C.textHint} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 12 }}>No submissions yet</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>Submit evidence for your selected skills</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = statusConfig[item.status] || statusConfig.pending_review;
            const catName = catNameMap[item.category_id] || item.category || 'Unknown';
            const skillName = item.skill_item_id ? skillNameMap[item.skill_item_id] || 'Unknown' : evidenceTypeLabel(item.evidence_type);

            return (
              <RecordItem
                item={item}
                catName={catName}
                skillName={skillName}
                cfg={cfg}
                onResubmit={() => handleResubmit(item)}
                C={C}
              />
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.dashboardBtn} onPress={handleGoToDashboard} activeOpacity={0.8}>
          <Text style={styles.dashboardBtnText}>
            {allApproved ? 'Go to Dashboard' : 'Continue to Dashboard'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  skipText: { fontSize: 14, fontWeight: '600', color: C.primary },
  summaryCard: { alignItems: 'center', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  completenessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder, gap: 12 },
  completenessRing: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  completenessPct: { fontSize: 14, fontWeight: '800', color: C.primary },
  completenessTitle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  completenessSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  completenessBtn: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  completenessBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  summarySub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
  recordCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  skillName: { fontSize: 13, color: C.textSecondary, marginBottom: 2 },
  evidenceType: { fontSize: 12, color: C.textHint, textTransform: 'capitalize' },
  rejectionBox: { backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginTop: 10 },
  rejectionLabel: { fontSize: 11, fontWeight: '600', color: C.error, marginBottom: 2 },
  rejectionReason: { fontSize: 13, color: C.error },
  resubmitBtn: { marginTop: 10, backgroundColor: C.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  resubmitText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  dashboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  dashboardBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

