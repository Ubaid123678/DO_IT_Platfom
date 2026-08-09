import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { VerificationRecord, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

interface CategoryStatus {
  category_id: string;
  category_name: string;
  job_type?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  pending: { label: 'Under Review', color: '#F5A623', icon: 'time-outline', bg: '#FEF3DC' },
  verified: { label: 'Approved', color: '#27AE60', icon: 'checkmark-circle', bg: '#E8F8F2' },
  rejected: { label: 'Rejected', color: '#E74C3C', icon: 'close-circle', bg: '#FDECEA' },
};

export default function PendingReviewScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { dispatch } = useWizard();
  const [checking, setChecking] = useState(false);
  const [categories, setCategories] = useState<CategoryStatus[]>([]);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const status = await verificationService.getVerificationStatus();
      if (status.overall_status === 'verified') {
        dispatch({ type: 'SET_STEP', step: 'review-approved' });
        return;
      }
      const catStatuses: CategoryStatus[] = (status.categories ?? []).map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        job_type: c.job_type ?? null,
        status: c.status === 'verified' ? 'verified' : c.status === 'rejected' ? 'rejected' : 'pending',
        rejection_reason: c.rejection_reason ?? null,
      }));
      setCategories(catStatuses);
    } catch {
      // ignore, user can retry
    } finally {
      setChecking(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleResubmit = (cat: CategoryStatus) => {
    dispatch({
      type: 'START_RESUBMIT',
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      jobType: (cat.job_type as 'physical' | 'digital' | 'errand' | undefined) ?? undefined,
    });
  };

  const styles = makeStyles(C);

  const hasRejected = categories.some(c => c.status === 'rejected');
  const allVerified = categories.length > 0 && categories.every(c => c.status === 'verified');
  const someVerified = categories.some(c => c.status === 'verified');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={allVerified ? 'checkmark-circle' : hasRejected ? 'close-circle' : 'hourglass-outline'}
            size={48}
            color={allVerified ? C.success : hasRejected ? C.error : C.primary}
          />
        </View>

        <Text style={styles.title}>
          {allVerified
            ? 'All Verified!'
            : someVerified
            ? 'Partially Verified'
            : 'Verification Submitted'}
        </Text>
        <Text style={styles.subtitle}>
          {allVerified
            ? 'All your categories are approved. You can now browse jobs.'
            : someVerified
            ? 'Some categories are still pending review.'
            : 'Your evidence has been submitted for review. An admin will review your categories.'}
        </Text>

        <View style={styles.categoriesCard}>
          <Text style={styles.categoriesTitle}>Categories:</Text>
          {categories.length > 0 ? categories.map((cat, i) => {
            const cfg = statusConfig[cat.status];
            return (
              <View key={i} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{cat.category_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                {cat.status === 'rejected' && cat.rejection_reason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Reason:</Text>
                    <Text style={styles.rejectionReason}>{cat.rejection_reason}</Text>
                  </View>
                )}
                {cat.status === 'rejected' && (
                  <TouchableOpacity style={styles.resubmitBtn} onPress={() => handleResubmit(cat)} activeOpacity={0.8}>
                    <Text style={styles.resubmitText}>Resubmit</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }) : (
            <Text style={styles.categoryName}>Loading...</Text>
          )}
        </View>

        {!allVerified && (
          <Text style={styles.hint}>
            This usually takes 24-48 hours. You'll be notified once the review is complete.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.refreshBtn, checking && styles.refreshBtnDisabled]}
          onPress={checkStatus}
          disabled={checking}
          activeOpacity={0.8}
        >
          {checking ? (
            <ActivityIndicator color={C.primary} size="small" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={C.primary} />
              <Text style={styles.refreshText}> Refresh Status</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  categoriesCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  categoriesTitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 12 },
  categoryCard: { backgroundColor: C.background, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.divider },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  rejectionBox: { backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginTop: 8 },
  rejectionLabel: { fontSize: 11, fontWeight: '600', color: C.error, marginBottom: 2 },
  rejectionReason: { fontSize: 13, color: C.error },
  resubmitBtn: { marginTop: 10, backgroundColor: C.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  resubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  hint: { fontSize: 12, color: C.textHint, textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.primary },
  refreshBtnDisabled: { opacity: 0.5 },
  refreshText: { fontSize: 14, fontWeight: '600', color: C.primary },
});