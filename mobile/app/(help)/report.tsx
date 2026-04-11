import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet from '@/src/components/common/BottomSheet';
import { Colors, type AppColors } from '@/src/theme/colors';

type ReportType = 'user' | 'job' | 'message' | 'fraud' | 'other' | null;

const typeOptions: Array<{
  key: Exclude<ReportType, null>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
}> = [
  {
    key: 'user',
    icon: 'person',
    label: 'A User',
    subtitle: 'Suspicious or harmful behavior',
  },
  {
    key: 'job',
    icon: 'briefcase',
    label: 'A Job Posting',
    subtitle: 'Fake or scam posting',
  },
  {
    key: 'message',
    icon: 'chatbubble',
    label: 'A Message',
    subtitle: 'Harassment or inappropriate content',
  },
  {
    key: 'fraud',
    icon: 'alert-circle',
    label: 'Fraud / Scam',
    subtitle: 'Suspected fraudulent activity',
  },
  {
    key: 'other',
    icon: 'ellipsis-horizontal',
    label: 'Something Else',
    subtitle: 'Tell us what happened',
  },
];

const reasonByType: Record<Exclude<ReportType, null>, string[]> = {
  user: ['Harassment', 'Abusive language', 'Threats', 'Fake identity', 'Spam'],
  job: ['Fake posting', 'Misleading details', 'Illegal request', 'Duplicate spam', 'Payment trick'],
  message: ['Offensive content', 'Scam attempt', 'Sharing unsafe links', 'Repeated spam', 'Other'],
  fraud: ['Stolen account behavior', 'Suspicious payment request', 'Impersonation', 'Advance-fee scam'],
  other: ['General concern', 'Policy violation', 'Safety issue', 'Other'],
};

const recentJobs = [
  { id: 'J-1002', title: 'Deep cleaning for apartment' },
  { id: 'J-1014', title: 'Urgent parcel delivery' },
  { id: 'J-1103', title: 'Logo and branding design' },
] as const;

export default function ReportIssueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string | string[]; jobId?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const incomingUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const incomingJobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;

  const [reportType, setReportType] = useState<ReportType>(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [showReasonSheet, setShowReasonSheet] = useState(false);
  const [showJobSheet, setShowJobSheet] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (incomingUserId) {
      setReportType('user');
      setUserSearch(`User #${incomingUserId}`);
    }

    if (incomingJobId) {
      setReportType('job');
      setSelectedJob(`Job #${incomingJobId}`);
    }
  }, [incomingJobId, incomingUserId]);

  const reasons = useMemo(() => (reportType ? reasonByType[reportType] : []), [reportType]);

  const onSelectType = (type: Exclude<ReportType, null>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setReportType(type);
    setReason('');
  };

  const addEvidence = () => {
    const nextSeed = `${Date.now()}-${evidence.length}`;
    setEvidence((prev) => [...prev, `https://picsum.photos/seed/report-${nextSeed}/160/160`]);
  };

  const submit = () => {
    if (!reportType || !reason || !details.trim() || loading) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={22} color={C.amber} />
            <Text style={styles.infoText}>Your report is confidential and helps keep Do It safe.</Text>
          </View>

          <Text style={styles.sectionTitle}>What are you reporting?</Text>

          {typeOptions.map((item) => {
            const selected = reportType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.typeCard, selected ? styles.typeCardSelected : null]}
                onPress={() => onSelectType(item.key)}
              >
                <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <Ionicons name={item.icon} size={24} color={C.primary} />

                <View style={styles.typeTextWrap}>
                  <Text style={styles.typeTitle}>{item.label}</Text>
                  <Text style={styles.typeSub}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {reportType ? (
            <View style={styles.detailsWrap}>
              {reportType === 'user' ? (
                <>
                  <Text style={styles.label}>Who are you reporting?</Text>
                  <TextInput
                    style={styles.input}
                    value={userSearch}
                    onChangeText={setUserSearch}
                    placeholder="Search by name or user ID"
                    placeholderTextColor={C.textHint}
                  />
                </>
              ) : null}

              {reportType === 'job' ? (
                <>
                  <Text style={styles.label}>Select Job</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setShowJobSheet(true)}>
                    <Text style={selectedJob ? styles.selectorValue : styles.selectorPlaceholder}>
                      {selectedJob || 'Choose job from history'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={C.textHint} />
                  </TouchableOpacity>
                </>
              ) : null}

              <Text style={styles.label}>Reason</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowReasonSheet(true)}>
                <Text style={reason ? styles.selectorValue : styles.selectorPlaceholder}>
                  {reason || 'Select reason'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.textHint} />
              </TouchableOpacity>

              <Text style={styles.label}>Additional Details</Text>
              <TextInput
                style={styles.textArea}
                value={details}
                onChangeText={setDetails}
                placeholder="Explain what happened with context and timing..."
                placeholderTextColor={C.textHint}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Add Evidence</Text>
              <TouchableOpacity style={styles.uploadZone} onPress={addEvidence}>
                <Ionicons name="camera-outline" size={22} color={C.primary} />
                <Text style={styles.uploadText}>Upload screenshot or image</Text>
              </TouchableOpacity>

              {evidence.length ? (
                <View style={styles.thumbRow}>
                  {evidence.map((uri, idx) => (
                    <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.thumb} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={showReasonSheet} onClose={() => setShowReasonSheet(false)} title="Select Reason">
        {reasons.map((option) => {
          const active = reason === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.sheetOption, active ? styles.sheetOptionActive : null]}
              onPress={() => {
                setReason(option);
                setShowReasonSheet(false);
              }}
            >
              <Text style={active ? styles.sheetTextActive : styles.sheetText}>{option}</Text>
              {active ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet visible={showJobSheet} onClose={() => setShowJobSheet(false)} title="Select Job">
        {recentJobs.map((job) => {
          const value = `${job.id} - ${job.title}`;
          const active = selectedJob === value;
          return (
            <TouchableOpacity
              key={job.id}
              style={[styles.sheetOption, active ? styles.sheetOptionActive : null]}
              onPress={() => {
                setSelectedJob(value);
                setShowJobSheet(false);
              }}
            >
              <View style={styles.jobTextWrap}>
                <Text style={active ? styles.sheetTextActive : styles.sheetText}>{job.id}</Text>
                <Text style={styles.jobSubText} numberOfLines={1}>
                  {job.title}
                </Text>
              </View>
              {active ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {submitted ? (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="flag" size={36} color={C.primary} />
          </View>

          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successSub}>We review all reports within 24-48 hours.</Text>

          <TouchableOpacity style={styles.successButton} onPress={() => router.push('/(help)/safety')}>
            <Text style={styles.successButtonText}>Return to Safety Center</Text>
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
    keyboardWrap: {
      flex: 1,
    },
    headerRow: {
      height: 48,
      marginTop: 8,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    infoBanner: {
      marginTop: 16,
      borderRadius: 10,
      borderLeftWidth: 3,
      borderLeftColor: C.amber,
      backgroundColor: isDark ? '#2A1F00' : C.amberLight,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
    sectionTitle: {
      marginTop: 20,
      marginBottom: 12,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    typeCard: {
      width: '100%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      marginBottom: 8,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    typeCardSelected: {
      borderColor: C.primary,
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
    typeTextWrap: {
      flex: 1,
    },
    typeTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: C.textPrimary,
    },
    typeSub: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    detailsWrap: {
      marginTop: 16,
    },
    label: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    input: {
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      fontSize: 14,
      color: C.textPrimary,
      marginBottom: 12,
    },
    selector: {
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    selectorPlaceholder: {
      flex: 1,
      fontSize: 14,
      color: C.textHint,
    },
    selectorValue: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
      fontWeight: '500',
      marginRight: 8,
    },
    textArea: {
      height: 100,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: C.textPrimary,
      marginBottom: 12,
    },
    uploadZone: {
      height: 72,
      borderRadius: 10,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: C.primary,
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    uploadText: {
      fontSize: 13,
      color: C.textSecondary,
    },
    thumbRow: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: 8,
      backgroundColor: C.divider,
    },
    submitButton: {
      marginTop: 20,
      marginBottom: 32,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    sheetOption: {
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.background,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetOptionActive: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    sheetText: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textPrimary,
    },
    sheetTextActive: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    jobTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    jobSubText: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      marginTop: 14,
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    successSub: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    successButton: {
      marginTop: 18,
      width: '100%',
      height: 50,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
  });
