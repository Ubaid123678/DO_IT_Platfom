import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Alert } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useJobCreation } from '@/src/context/JobCreationContext';
import { jobService } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

const JOB_TYPE_LABELS: Record<string, string> = {
  physical: 'Physical Service',
  digital: 'Digital Service',
  errand: 'Errand & Delivery',
};

const BUDGET_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Hourly Rate',
};

const formatBudget = (budget: any) => {
  const amount = parseFloat(budget.amount) / 100;
  if (budget.type === 'hourly') {
    return `$${amount.toFixed(2)}/hr × ${budget.estimatedHours}hrs = $${(amount * parseFloat(budget.estimatedHours)).toFixed(2)}`;
  }
  return `$${amount.toFixed(2)} fixed`;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ur: 'Urdu',
  hi: 'Hindi',
  zh: 'Mandarin',
  de: 'German',
  pt: 'Portuguese',
  other: 'Other',
};

export default function JobReviewStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch, goBack, goNext } = useJobCreation();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  const formData = state.formData;
  const jobType = state.jobType;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await jobService.createJob({
        title: formData.title,
        description: formData.description,
        type: jobType!,
        location: {
          type: 'Point' as const,
          coordinates: formData.location.coordinates || [0, 0] as [number, number],
          address: formData.location.address,
          city: formData.location.city,
          country: formData.location.country,
          formattedAddress: formData.location.formattedAddress,
        },
        budget: {
          type: formData.budget.type,
          amount: Math.round(parseFloat(formData.budget.amount) * 100),
          currency: formData.budget.currency,
          hourlyRate: formData.budget.hourlyRate ? parseFloat(formData.budget.hourlyRate) : undefined,
          estimatedHours: formData.budget.estimatedHours ? parseFloat(formData.budget.estimatedHours) : undefined,
        },
        schedule: {
          startsAt: formData.schedule.startsAt || undefined,
          endsAt: formData.schedule.endsAt || undefined,
          timezone: formData.schedule.timezone,
          isFlexible: formData.schedule.isFlexible,
          preferredDays: formData.schedule.preferredDays,
          preferredShifts: formData.schedule.preferredShifts,
        },
        requirements: {
          categories: formData.requirements.categories,
          skillItems: formData.requirements.skillItems,
          experienceLevel: formData.requirements.experienceLevel || undefined,
          languages: formData.requirements.languages,
          certificationsRequired: formData.requirements.certificationsRequired,
          vehicleRequired: formData.requirements.vehicleRequired,
        },
      });

      dispatch({ type: 'SET_STEP', step: 'complete' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create job';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '87.5%' }]} />
        </View>

        <Text style={styles.title}>Review & Post</Text>
        <Text style={styles.subtitle}>Double-check everything before posting</Text>

        {/* Job Type */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="briefcase-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Job Type</Text>
              <Text style={styles.reviewValue}>{JOB_TYPE_LABELS[jobType || '']}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="document-text-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Title</Text>
              <Text style={styles.reviewValue}>{formData.title}</Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={[styles.reviewValue, styles.reviewValueMultiline]}>{formData.description}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="location-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Location</Text>
              <Text style={styles.reviewValue}>
                {formData.location.city}{formData.location.country ? `, ${formData.location.country}` : ''}
              </Text>
            </View>
          </View>
          {formData.location.address && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Address</Text>
              <Text style={styles.reviewValue}>{formData.location.address}</Text>
            </View>
          )}
        </View>

        {/* Budget */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="cash-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Budget</Text>
              <Text style={styles.reviewValue}>
                {BUDGET_TYPE_LABELS[formData.budget.type]}: {formatBudget(formData.budget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="calendar-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Schedule</Text>
              <Text style={styles.reviewValue}>
                {formData.schedule.isFlexible ? 'Flexible' : 'Fixed dates'}
                {formData.schedule.startsAt && ` • Starts ${new Date(formData.schedule.startsAt).toLocaleDateString()}`}
              </Text>
            </View>
          </View>
          {formData.schedule.preferredDays.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Preferred Days</Text>
              <Text style={styles.reviewValue}>{formData.schedule.preferredDays.join(', ')}</Text>
            </View>
          )}
          {formData.schedule.preferredShifts.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Preferred Shifts</Text>
              <Text style={styles.reviewValue}>{formData.schedule.preferredShifts.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Requirements */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewRow}>
            <Ionicons name="star-outline" size={20} color={C.primary} />
            <View>
              <Text style={styles.reviewLabel}>Categories</Text>
              <Text style={styles.reviewValue}>{formData.requirements.categories.length} selected</Text>
            </View>
          </View>
          {formData.requirements.experienceLevel && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Experience Level</Text>
              <Text style={styles.reviewValue}>
                {formData.requirements.experienceLevel.charAt(0).toUpperCase() + formData.requirements.experienceLevel.slice(1)}
              </Text>
            </View>
          )}
          {formData.requirements.languages.length > 0 && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Languages</Text>
              <Text style={styles.reviewValue}>
                {formData.requirements.languages.map((l) => LANGUAGE_NAMES[l] || l).join(', ')}
              </Text>
            </View>
          )}
          {formData.requirements.certificationsRequired && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Certifications Required</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
          {formData.requirements.vehicleRequired && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Vehicle Required</Text>
              <Text style={styles.reviewValue}>Yes</Text>
            </View>
          )}
        </View>

        {/* Fee Summary */}
        <View style={styles.feeSummary}>
          <Text style={styles.feeTitle}>Cost Summary</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Job Budget</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform Fee (10%)</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) * 0.1 / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.feeRow, styles.feeTotal]}>
            <Text style={styles.feeLabel}>Total You Pay</Text>
            <Text style={styles.feeValue}>${(parseFloat(formData.budget.amount) * 1.1 / 100).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.terms}>
          <Text style={styles.termsText}>
            By posting this job, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Payment Policy</Text>. Funds will be held in escrow until work is completed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} disabled={submitting}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.postBtn, submitting && styles.postBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.postBtnText}>{submitting ? 'Posting...' : 'Post Job'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    progressBar: { height: 4, backgroundColor: C.divider, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
    reviewSection: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
    reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    reviewLabel: { fontSize: 12, color: C.textHint, marginBottom: 2 },
    reviewValue: { fontSize: 14, color: C.textPrimary, flex: 1 },
    reviewValueMultiline: { flex: 1 },
    feeSummary: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.primary },
    feeTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 12 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    feeTotal: { borderTopWidth: 1, borderTopColor: C.primary, marginTop: 4, paddingTop: 10 },
    feeLabel: { fontSize: 14, color: C.textSecondary },
    feeValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    terms: { paddingTop: 16 },
    termsText: { fontSize: 12, color: C.textHint, lineHeight: 18 },
    termsLink: { color: C.primary, fontWeight: '600' },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    backBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, alignItems: 'center' },
    backBtnText: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    postBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    postBtnDisabled: { opacity: 0.5 },
    postBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });