import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { VerificationRecord, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function RejectionDetailScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!state.rejectionRecordId) return;
      try {
        const data = await verificationService.getVerificationRecordDetail(state.rejectionRecordId);
        setRecord(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [state.rejectionRecordId]);

const handleResubmit = () => {
    if (record?.category_id) {
      dispatch({
        type: 'START_RESUBMIT',
        categoryId: record.category_id,
        categoryName: record.category ?? undefined,
        jobType: (record.category_job_type as 'physical' | 'digital' | undefined) ?? undefined,
      });
    } else {
      dispatch({ type: 'SET_STEP', step: 'certificate-upload' });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', step: 'status-hub' });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rejection Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <View style={styles.rejectedIcon}>
          <Ionicons name="close-circle" size={64} color={C.error} />
        </View>
        <Text style={styles.title}>Verification Not Approved</Text>
        <Text style={styles.subtitle}>Your evidence was reviewed and needs attention before resubmission.</Text>

        {record && (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>
              {state.selectedCategories.find(c => c.category_id === record.category_id)?.name || record.category || 'Unknown'}
            </Text>

<Text style={styles.detailLabel}>Skill</Text>
            <Text style={styles.detailValue}>
              {record.skill_item_id
                ? state.selectedSkillItems.flatMap(s => s.skill_items).find(s => s._id === record.skill_item_id)?.name || 'Unknown'
                : 'Category-level evidence'}
            </Text>

            <Text style={styles.detailLabel}>Evidence Type</Text>
            <Text style={styles.detailValue}>{record.evidence_type === 'digital' ? 'Digital Evidence' : record.evidence_type === 'physical' ? 'Physical Evidence' : record.evidence_type.replace('_', ' ')}</Text>

            <View style={styles.divider} />

            <Text style={styles.reasonLabel}>Reviewer Notes</Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{record.rejection_reason || 'No specific reason provided.'}</Text>
            </View>

            <View style={styles.tipsCard}>
              <Ionicons name="bulb-outline" size={18} color={C.amber} />
              <Text style={styles.tipsText}>
                Make sure your document is clear, not expired, and matches the skill you're verifying.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resubmitBtn} onPress={handleResubmit} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.resubmitText}> Resubmit Evidence</Text>
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
  rejectedIcon: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 20, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  detailCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  detailLabel: { fontSize: 12, fontWeight: '600', color: C.textHint, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 2 },
  detailValue: { fontSize: 14, color: C.textPrimary },
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 12 },
  reasonLabel: { fontSize: 14, fontWeight: '700', color: C.error, marginBottom: 8 },
  reasonBox: { backgroundColor: '#FDECEA', borderRadius: 10, padding: 14 },
  reasonText: { fontSize: 14, color: C.error, lineHeight: 20 },
  tipsCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.amberLight, borderRadius: 12, padding: 14, marginTop: 16 },
  tipsText: { flex: 1, fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: C.background },
  resubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12, gap: 8 },
  resubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

