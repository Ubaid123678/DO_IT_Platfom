import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { notificationService } from '@/src/services/notificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

const TYPE_LABELS: Record<string, string> = {
  message: 'Messages',
  job_created: 'Job Created',
  job_updated: 'Job Updated',
  job_assigned: 'Job Assigned',
  job_completed: 'Job Completed',
  job_cancelled: 'Job Cancelled',
  proposal_received: 'Proposal Received',
  proposal_accepted: 'Proposal Accepted',
  proposal_rejected: 'Proposal Rejected',
  proposal_withdrawn: 'Proposal Withdrawn',
  dispute_created: 'Dispute Created',
  dispute_evidence_added: 'Dispute Evidence Added',
  dispute_resolved: 'Dispute Resolved',
  review_received: 'Review Received',
  review_flagged: 'Review Flagged',
  review_moderated: 'Review Moderated',
  payout_requested: 'Payout Requested',
  payout_completed: 'Payout Completed',
  payout_failed: 'Payout Failed',
  wallet_topup: 'Wallet Top-up',
  wallet_low_balance: 'Low Balance Alert',
  wallet_escrow_locked: 'Escrow Locked',
  wallet_escrow_released: 'Escrow Released',
  wallet_escrow_refunded: 'Escrow Refunded',
  verification_submitted: 'Verification Submitted',
  verification_approved: 'Verification Approved',
  verification_rejected: 'Verification Rejected',
  kyc_submitted: 'KYC Submitted',
  kyc_approved: 'KYC Approved',
  kyc_rejected: 'KYC Rejected',
  system_announcement: 'System Announcements',
  promotion: 'Promotions',
  security_alert: 'Security Alerts',
};

export default function PushNotificationSettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [prefs, setPrefs] = useState<any>({
    enabled: true,
    types: {
      message: true,
      job_created: true,
      job_updated: true,
      job_assigned: true,
      job_completed: true,
      job_cancelled: true,
      proposal_received: true,
      proposal_accepted: true,
      proposal_rejected: true,
      proposal_withdrawn: true,
      dispute_created: true,
      dispute_evidence_added: true,
      dispute_resolved: true,
      review_received: true,
      review_flagged: true,
      review_moderated: true,
      payout_requested: true,
      payout_completed: true,
      payout_failed: true,
      wallet_topup: true,
      wallet_low_balance: true,
      wallet_escrow_locked: true,
      wallet_escrow_released: true,
      wallet_escrow_refunded: true,
      verification_submitted: true,
      verification_approved: true,
      verification_rejected: true,
      kyc_submitted: true,
      kyc_approved: true,
      kyc_rejected: true,
      system_announcement: true,
      promotion: true,
      security_alert: true,
    },
quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
  });

  const [loading, setLoading] = useState(true);

  const loadPrefs = async () => {
    try {
      // In a real app, fetch from API
      // For now, use defaults
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  const handleSave = async () => {
    try {
      await notificationService.updatePushPreferences(prefs);
      Alert.alert('Success', 'Notification preferences saved');
    } catch (e) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const toggleType = (type: string) => {
    setPrefs(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type],
      },
    }));
  };

  const toggleMaster = () => {
    const newEnabled = !prefs.enabled;
    const newTypes = { ...prefs.types };
    Object.keys(newTypes).forEach(key => {
      newTypes[key] = newEnabled;
    });
    setPrefs(prev => ({
      ...prev,
      enabled: newEnabled,
      types: newTypes,
    }));
  };

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    setPrefs(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  const toggleQuietHours = () => {
    setPrefs(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled,
      },
    }));
  };

  const handleSave = async () => {
    await notificationService.updatePushPreferences(prefs);
    Alert.alert('Success', 'Notification preferences saved');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.masterToggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Push Notifications</Text>
              <Text style={styles.toggleSubtitle}>Enable or disable all push notifications</Text>
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={toggleMaster}
              trackColor={{ false: C.cardBorder, true: C.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionSubtitle}>Suppress notifications during specified hours</Text>
          <TouchableOpacity style={styles.boolRow} onPress={toggleQuietHours}>
            <View style={styles.boolContent}>
              <Text style={styles.boolTitle}>Enable Quiet Hours</Text>
              <Text style={styles.boolSubtitle}>Suppress notifications during set hours</Text>
            </View>
            <View style={[styles.boolCheckbox, prefs.quietHours.enabled && styles.boolCheckboxChecked]}>
              {prefs.quietHours.enabled && <Ionicons name="checkmark" size={20} color="#fff" />}
            </View>
          </TouchableOpacity>

          {prefs.quietHours.enabled && (
            <View style={styles.timeInputs}>
              <TouchableOpacity style={styles.timeInput} onPress={() => {
                Alert.alert('Time Picker', 'Time picker would be shown here');
              }}>
                <Text style={styles.timeLabel}>Start</Text>
                <Text style={styles.timeValue}>{prefs.quietHours.start}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeInput} onPress={() => {
                Alert.alert('Time Picker', 'Time picker would be shown here');
              }}>
                <Text style={styles.timeLabel}>End</Text>
                <Text style={styles.timeValue}>{prefs.quietHours.end}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {Object.entries(TYPE_CATEGORIES).map(({ title, types }) => (
          <View key={title} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            <View style={styles.chipRow}>
              {types.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, prefs.types[type] && styles.chipActive]}
                  onPress={() => toggleType(type)}
                >
                  <Text style={[styles.chipText, prefs.types[type] && styles.chipTextActive]}>{TYPE_LABELS[type] || type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, color: C.textHint, marginBottom: 12 },
    masterToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder },
    toggleInfo: { flex: 1 },
    toggleTitle: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    toggleSubtitle: { fontSize: 12, color: C.textHint, marginTop: 2 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, color: C.textHint, marginBottom: 12 },
    boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12 },
    boolContent: { flex: 1 },
    boolTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    boolSubtitle: { fontSize: 11, color: C.textHint, marginTop: 2 },
    boolCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center' },
    boolCheckboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
    timeInputs: { flexDirection: 'row', gap: 8 },
    timeInput: { flex: 1, backgroundColor: C.inputBg, borderRadius: 10, padding: 12 },
    timeLabel: { fontSize: 11, color: C.textHint, marginBottom: 2 },
    timeValue: { fontSize: 16, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
    categorySection: { marginBottom: 20 },
    categoryTitle: { fontSize: 13, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBg },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });