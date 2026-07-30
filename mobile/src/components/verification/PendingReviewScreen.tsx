import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function PendingReviewScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const status = await verificationService.getVerificationStatus();
      if (status.overall_status === 'verified' || status.overall_status === 'partially_verified') {
        dispatch({ type: 'SET_STEP', step: 'review-approved' });
      }
    } catch {
      // ignore, user can retry
    } finally {
      setChecking(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => void checkStatus(), 2000);
    return () => clearTimeout(timer);
  }, [checkStatus]);

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="hourglass-outline" size={48} color={C.primary} />
        </View>

        <Text style={styles.title}>Verification Submitted</Text>
        <Text style={styles.subtitle}>
          Your evidence has been submitted for review. An admin will review your categories and skills.
        </Text>

        <View style={styles.categoriesCard}>
          <Text style={styles.categoriesTitle}>Categories submitted:</Text>
          {state.selectedCategories.map((cat, i) => (
            <View key={i} style={styles.categoryRow}>
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
              <Text style={styles.categoryName}>{cat.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Under Review</Text>
        </View>

        <Text style={styles.hint}>
          This usually takes 24-48 hours. You'll be notified once the review is complete.
        </Text>

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
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  categoryName: { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.amberLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '600', color: C.amber },
  hint: { fontSize: 12, color: C.textHint, textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.primary },
  refreshBtnDisabled: { opacity: 0.5 },
  refreshText: { fontSize: 14, fontWeight: '600', color: C.primary },
});
