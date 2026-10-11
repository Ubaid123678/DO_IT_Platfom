import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, Alert, Switch } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { proposalService, type BidType } from '@/src/services/proposalService';
import { Colors, type AppColors } from '@/src/theme/colors';

export default function SubmitProposalScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bidType, setBidType] = useState<BidType>('fixed');
  const [bidAmount, setBidAmount] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [estimatedTimeline, setEstimatedTimeline] = useState('');

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      const data = await proposalService.getProposalsForJob(jobId!, { limit: 1 });
      // We just need the job details, but this endpoint returns proposals
      // For now, we'll fetch the job separately or use a different approach
      // For simplicity, we'll assume the job data is passed via params or we fetch it
      // In a real app, we'd have a getJobById in proposalService or use jobService
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    if (bidType === 'hourly' && hourlyRate && estimatedHours) {
      return parseFloat(hourlyRate) * parseFloat(estimatedHours);
    }
    return parseFloat(bidAmount) || 0;
  };

  const total = calculateTotal();
  const platformFee = total * 0.1;
  const youReceive = total - platformFee;

  const handleSubmit = async () => {
    if (!bidAmount && bidType === 'fixed') {
      Alert.alert('Error', 'Please enter a bid amount');
      return;
    }
    if (bidType === 'hourly' && (!hourlyRate || !estimatedHours)) {
      Alert.alert('Error', 'Please enter hourly rate and estimated hours');
      return;
    }
    if (!coverLetter.trim()) {
      Alert.alert('Error', 'Please write a cover letter');
      return;
    }
    if (!estimatedTimeline.trim()) {
      Alert.alert('Error', 'Please enter estimated timeline');
      return;
    }

    setSubmitting(true);
    try {
      await proposalService.createProposal({
        jobId: jobId!,
        bidAmount: Math.round(total * 100), // Convert to cents
        bidType,
        hourlyRate: bidType === 'hourly' ? parseFloat(hourlyRate) : undefined,
        estimatedHours: bidType === 'hourly' ? parseFloat(estimatedHours) : undefined,
        coverLetter,
        estimatedTimeline,
      });
      Alert.alert('Success', 'Proposal submitted successfully!');
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit proposal';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaViewCompat>
    );
  }

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Proposal</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Job Info Card */}
          <View style={styles.jobInfoCard}>
            <Text style={styles.jobTitle}>Job Opportunity</Text>
            <Text style={styles.jobMeta}>Tap to view full job details</Text>
          </View>

          {/* Bid Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bid Type</Text>
            <View style={styles.bidTypeSelector}>
              <TouchableOpacity
                style={[styles.bidTypeBtn, bidType === 'fixed' && styles.bidTypeBtnActive]}
                onPress={() => setBidType('fixed')}
              >
                <Ionicons name="cash-outline" size={20} color={bidType === 'fixed' ? '#fff' : C.primary} />
                <Text style={[styles.bidTypeLabel, bidType === 'fixed' && styles.bidTypeLabelActive]}>Fixed Price</Text>
                <Text style={[styles.bidTypeDesc, bidType === 'fixed' && styles.bidTypeDescActive]}>One total amount</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bidTypeBtn, bidType === 'hourly' && styles.bidTypeBtnActive]}
                onPress={() => setBidType('hourly')}
              >
                <Ionicons name="time-outline" size={20} color={bidType === 'hourly' ? '#fff' : C.primary} />
                <Text style={[styles.bidTypeLabel, bidType === 'hourly' && styles.bidTypeLabelActive]}>Hourly Rate</Text>
                <Text style={[styles.bidTypeDesc, bidType === 'hourly' && styles.bidTypeDescActive]}>Pay per hour worked</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {bidType === 'fixed' ? 'Total Bid Amount' : 'Hourly Rate'} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.currencyInputField}
                placeholder={bidType === 'fixed' ? 'e.g. 500' : 'e.g. 50'}
                value={bidType === 'fixed' ? bidAmount : hourlyRate}
                onChangeText={(v) => bidType === 'fixed' ? setBidAmount(v) : setHourlyRate(v)}
                keyboardType="decimal-pad"
              />
            </View>
            {bidType === 'hourly' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Estimated Hours <Text style={styles.required}>*</Text></Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>hrs</Text>
                  <TextInput
                    style={styles.currencyInputField}
                    placeholder="e.g. 10"
                    value={estimatedHours}
                    onChangeText={setEstimatedHours}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            <View style={styles.totalBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Bid Total</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(Math.round(total * 100))}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Platform Fee (10%)</Text>
                <Text style={styles.breakdownValue}>-{formatCurrency(Math.round(platformFee * 100))}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownLabel}>You Receive</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(Math.round(youReceive * 100))}</Text>
              </View>
            </View>
          </View>

          {/* Cover Letter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Letter <Text style={styles.required}>*</Text></Text>
            <Text style={styles.fieldHint}>Explain why you're the best fit for this job. Mention relevant experience, approach, and availability.</Text>
            <TextInput
              style={[styles.textArea, styles.textAreaLarge]}
              placeholder="Dear Client, I'm interested in your project..."
              value={coverLetter}
              onChangeText={setCoverLetter}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{coverLetter.length}/2000 characters (min 20)</Text>
          </View>

          {/* Estimated Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated Timeline <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2 weeks, 5 business days, 1 month"
              value={estimatedTimeline}
              onChangeText={setEstimatedTimeline}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={C.textHint} />
            <Text style={styles.noteText}>
              By submitting this proposal, you agree to our Terms of Service. 
              If accepted, funds will be held in escrow until work is completed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={submitting}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Proposal'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 16, color: C.textSecondary, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    keyboardAvoiding: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    jobInfoCard: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.primary },
    jobTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 4 },
    jobMeta: { fontSize: 13, color: C.textSecondary },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
    required: { color: C.error },
    bidTypeSelector: { flexDirection: 'row', gap: 12 },
    bidTypeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 12,
    },
    bidTypeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    bidTypeLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    bidTypeLabelActive: { color: '#fff' },
    bidTypeDesc: { fontSize: 11, color: C.textHint },
    bidTypeDescActive: { color: 'rgba(255,255,255,0.8)' },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    fieldHint: { fontSize: 12, color: C.textHint, marginBottom: 12 },
    currencyInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10 },
    currencySymbol: { fontSize: 18, fontWeight: '600', color: C.textPrimary, paddingHorizontal: 16 },
    currencyInputField: { flex: 1, height: 52, paddingHorizontal: 16, fontSize: 18, fontWeight: '600', color: C.textPrimary },
    totalBreakdown: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.primary },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    breakdownTotal: { borderTopWidth: 1, borderTopColor: C.primary, marginTop: 4, paddingTop: 10 },
    breakdownLabel: { fontSize: 14, color: C.textSecondary },
    breakdownValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    textArea: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 16, fontSize: 15, color: C.textPrimary, minHeight: 140 },
    textAreaLarge: { minHeight: 180 },
    charCount: { fontSize: 11, color: C.textHint, textAlign: 'right', marginTop: 6 },
    input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 52, paddingHorizontal: 16, fontSize: 16, color: C.textPrimary },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: C.primaryLight, borderRadius: 10, marginTop: 16 },
    noteText: { fontSize: 12, color: C.textSecondary, flex: 1, lineHeight: 18 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    submitBtn: { flex: 2, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });