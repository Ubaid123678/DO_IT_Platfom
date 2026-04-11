import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

const disputeReasons = [
  {
    title: 'Work not completed',
    subtitle: 'Provider left before finishing agreed tasks',
  },
  {
    title: 'Poor quality',
    subtitle: 'Work delivered does not match expected standard',
  },
  {
    title: 'Provider no-show',
    subtitle: 'Provider did not arrive or stopped responding',
  },
  {
    title: 'Wrong service',
    subtitle: 'Delivered service differs from job request',
  },
  {
    title: 'Safety concern',
    subtitle: 'Incident involving unsafe or inappropriate behavior',
  },
  {
    title: 'Other',
    subtitle: 'Any issue not covered in options above',
  },
] as const;

const sampleEvidence = [
  'https://images.unsplash.com/photo-1581090122155-5d2d7cfd5096?auto=format&fit=crop&w=300&q=60',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=300&q=60',
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=300&q=60',
];

export default function RaiseDisputeScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedJobId = Array.isArray(jobId) ? (jobId[0] ?? 'job-demo') : (jobId ?? 'job-demo');

  const summary = useMemo(
    () => ({
      jobTitle: 'Apartment Deep Cleaning',
      providerName: 'Ali Raza',
      amount: 85,
    }),
    []
  );

  const canSubmit = Boolean(agreed && reason);

  const handleAddEvidence = () => {
    if (evidence.length >= sampleEvidence.length) {
      return;
    }
    setEvidence((prev) => [...prev, sampleEvidence[prev.length]]);
  };

  const handleSubmit = () => {
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);

    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raise Dispute</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={22} color={C.error} />
            <Text style={styles.warningText}>
              Submitting a dispute freezes payment. Admin will review within 48 hours.
            </Text>
          </View>

          <View style={styles.jobSummaryCard}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>AR</Text>
            </View>

            <View style={styles.jobSummaryTextWrap}>
              <Text style={styles.jobTitle}>{summary.jobTitle}</Text>
              <Text style={styles.providerName}>{summary.providerName}</Text>
            </View>

            <Text style={styles.amountText}>{`$${summary.amount}`}</Text>
          </View>

          <Text style={styles.reasonLabel}>Reason for Dispute</Text>
          {disputeReasons.map((item) => {
            const selected = reason === item.title;

            return (
              <TouchableOpacity
                key={item.title}
                style={[styles.reasonCard, selected ? styles.reasonCardSelected : null]}
                onPress={() => setReason(item.title)}
              >
                <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.reasonTextWrap}>
                  <Text style={styles.reasonTitle}>{item.title}</Text>
                  <Text style={styles.reasonSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.inputLabel}>Describe the Issue</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Explain what happened and when..."
            placeholderTextColor={C.textHint}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.uploadLabel}>Add Evidence (Optional)</Text>
          <TouchableOpacity style={styles.uploadZone} onPress={handleAddEvidence}>
            <Ionicons name="camera-outline" size={24} color={C.primary} />
            <Text style={styles.uploadZoneText}>Upload screenshot or photo</Text>
          </TouchableOpacity>

          {evidence.length ? (
            <View style={styles.evidenceRow}>
              {evidence.map((uri, idx) => (
                <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.evidenceImage} />
              ))}
            </View>
          ) : null}

          <View style={styles.agreementRow}>
            <TouchableOpacity style={styles.agreementCheckWrap} onPress={() => setAgreed((prev) => !prev)}>
              <View style={[styles.agreementCheckBox, agreed ? styles.agreementCheckBoxOn : null]}>
                {agreed ? <Ionicons name="checkmark" size={12} color="white" /> : null}
              </View>
            </TouchableOpacity>

            <Text style={styles.agreementText}>
              I confirm this dispute is genuine. False disputes may result in account penalties.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Dispute</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {submitted ? (
        <View style={styles.successOverlay}>
          <View style={styles.hourglassCircle}>
            <Ionicons name="hourglass" size={40} color="white" />
          </View>

          <Text style={styles.successTitle}>Dispute Submitted</Text>
          <Text style={styles.successSubtitle}>Payment frozen. Admin will review within 48h.</Text>

          <TouchableOpacity
            style={styles.backToJobButton}
            onPress={() =>
              router.push({
                pathname: '/(client)/job-detail/[id]',
                params: { id: resolvedJobId },
              })
            }
          >
            <Text style={styles.backToJobButtonText}>Back to Job</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    keyboard: {
      flex: 1,
    },
    headerRow: {
      height: 48,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    backButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    warningCard: {
      marginTop: 16,
      borderRadius: 10,
      padding: 14,
      borderLeftWidth: 4,
      borderLeftColor: C.error,
      backgroundColor: isDark ? '#2E1010' : '#FDECEA',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: C.error,
    },
    jobSummaryCard: {
      marginTop: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    jobSummaryTextWrap: {
      flex: 1,
    },
    jobTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    providerName: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    amountText: {
      fontSize: 16,
      fontWeight: '700',
      color: C.primary,
    },
    reasonLabel: {
      marginTop: 20,
      marginBottom: 10,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    reasonCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    reasonCardSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
    },
    radioOuterSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'white',
    },
    reasonTextWrap: {
      marginLeft: 12,
      flex: 1,
    },
    reasonTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: C.textPrimary,
    },
    reasonSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    inputLabel: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    input: {
      height: 120,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: C.textPrimary,
      fontSize: 14,
    },
    uploadLabel: {
      marginTop: 14,
      marginBottom: 8,
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    uploadZone: {
      height: 88,
      borderRadius: 10,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: C.primary,
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    uploadZoneText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    evidenceRow: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    evidenceImage: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: C.divider,
    },
    agreementRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    agreementCheckWrap: {
      marginTop: 1,
    },
    agreementCheckBox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
    },
    agreementCheckBoxOn: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    agreementText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: C.textSecondary,
    },
    submitButton: {
      marginTop: 20,
      marginBottom: 32,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: C.textHint,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    hourglassCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.amber,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      marginTop: 18,
      fontSize: 24,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    successSubtitle: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 22,
    },
    backToJobButton: {
      marginTop: 20,
      minWidth: 180,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    backToJobButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
    },
  });
