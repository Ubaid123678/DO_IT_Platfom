import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  kycService,
  type KycDocument,
  type KycDocumentType,
  type KycStatus,
  type KycUploadUrlResponse,
} from '@/src/services/kycService';
import { Colors, type AppColors } from '@/src/theme/colors';

type FormState = {
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: string;
  countryCode: string;
  notes: string;
};

const docTypes: Array<{ key: KycDocumentType; label: string }> = [
  { key: 'id_card', label: 'ID Card' },
  { key: 'passport', label: 'Passport' },
  { key: 'driver_license', label: 'Driver License' },
  { key: 'business_license', label: 'Business License' },
  { key: 'proof_of_address', label: 'Proof of Address' },
  { key: 'other', label: 'Other' },
];

const statusMeta: Record<
  KycStatus,
  { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  missing: {
    title: 'KYC not started',
    subtitle: 'Submit your identity documents to unlock provider actions.',
    icon: 'document-text-outline',
  },
  pending: {
    title: 'Under review',
    subtitle: 'Your documents were submitted and are waiting for admin review.',
    icon: 'time-outline',
  },
  approved: {
    title: 'KYC approved',
    subtitle: 'Your provider account is fully activated.',
    icon: 'shield-checkmark-outline',
  },
  rejected: {
    title: 'KYC rejected',
    subtitle: 'Fix the issues and resubmit your documents.',
    icon: 'close-circle-outline',
  },
};

const defaultForm: FormState = {
  documentType: 'id_card',
  fileName: 'provider-id-card.jpg',
  mimeType: 'image/jpeg',
  fileSizeBytes: '512000',
  countryCode: 'PK',
  notes: '',
};

const parseSize = (value: string): number => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function ProviderKycScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [status, setStatus] = useState<KycStatus>('missing');
  const [latestDocument, setLatestDocument] = useState<KycDocument | null>(null);
  const [uploadUrl, setUploadUrl] = useState<KycUploadUrlResponse | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const rejectionReason = latestDocument?.rejectionReason ?? '';

  const canSubmit = useMemo(() => {
    return (
      form.fileName.trim().length > 0 &&
      form.mimeType.trim().length > 0 &&
      parseSize(form.fileSizeBytes) > 0 &&
      form.countryCode.trim().length >= 2
    );
  }, [form.countryCode, form.fileName, form.fileSizeBytes, form.mimeType]);

  const refreshStatus = async () => {
    const result = await kycService.getProviderStatus();
    setStatus(result.status);
    setLatestDocument(result.latestDocument);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([refreshStatus(), new Promise((resolve) => setTimeout(resolve, 280))]);
      } catch {
        setError('Unable to load KYC status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleGenerateUploadUrl = async () => {
    try {
      setGenerating(true);
      setError('');
      const result = await kycService.createUploadUrl({
        documentType: form.documentType,
        fileName: form.fileName.trim(),
        mimeType: form.mimeType.trim(),
        fileSizeBytes: parseSize(form.fileSizeBytes),
        countryCode: form.countryCode.trim().toUpperCase(),
      });
      setUploadUrl(result);
    } catch {
      setError('Unable to generate a signed upload URL.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadUrl) {
      setError('Generate an upload URL first.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        documentType: form.documentType,
        fileName: form.fileName.trim(),
        mimeType: form.mimeType.trim(),
        fileSizeBytes: parseSize(form.fileSizeBytes),
        storageKey: uploadUrl.storageKey,
        storageUrl: uploadUrl.uploadUrl,
        storageProvider: uploadUrl.storageProvider,
        countryCode: form.countryCode.trim().toUpperCase(),
        notes: form.notes.trim() || undefined,
      };

      const document = status === 'rejected' ? await kycService.resubmitKyc(payload) : await kycService.submitKyc(payload);
      setStatus(document.status);
      setLatestDocument(document);
      setUploadUrl(null);
    } catch {
      setError('Unable to submit KYC documents.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Ionicons name={statusMeta[status].icon} size={30} color={C.primary} />
          </View>
          <Text style={styles.statusTitle}>{statusMeta[status].title}</Text>
          <Text style={styles.statusSubtitle}>{statusMeta[status].subtitle}</Text>

          {rejectionReason ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeLabel}>Rejection reason</Text>
              <Text style={styles.noticeText}>{rejectionReason}</Text>
            </View>
          ) : null}

          {latestDocument ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Latest submission</Text>
              <Text style={styles.summaryText}>{latestDocument.originalFileName}</Text>
              <Text style={styles.summaryMeta}>{`${latestDocument.documentType} • ${latestDocument.countryCode} • ${latestDocument.storageProvider}`}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.refreshButton} onPress={() => void refreshStatus()}>
            <Text style={styles.refreshButtonText}>Refresh status</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {status !== 'approved' ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Document type</Text>
              <View style={styles.chipWrap}>
                {docTypes.map((item) => {
                  const active = form.documentType === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                      onPress={() => setForm((prev) => ({ ...prev, documentType: item.key }))}
                    >
                      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>File name</Text>
              <TextInput
                style={styles.input}
                value={form.fileName}
                onChangeText={(value) => setForm((prev) => ({ ...prev, fileName: value }))}
                placeholder="provider-id-card.jpg"
                placeholderTextColor={C.textHint}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldBlock, styles.rowField]}>
                <Text style={styles.fieldLabel}>MIME type</Text>
                <TextInput
                  style={styles.input}
                  value={form.mimeType}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, mimeType: value }))}
                  placeholder="image/jpeg"
                  placeholderTextColor={C.textHint}
                />
              </View>

              <View style={[styles.fieldBlock, styles.rowField]}>
                <Text style={styles.fieldLabel}>File size</Text>
                <TextInput
                  style={styles.input}
                  value={form.fileSizeBytes}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, fileSizeBytes: value }))}
                  placeholder="512000"
                  placeholderTextColor={C.textHint}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Country code</Text>
              <TextInput
                style={styles.input}
                value={form.countryCode}
                onChangeText={(value) => setForm((prev) => ({ ...prev, countryCode: value.toUpperCase() }))}
                placeholder="PK"
                placeholderTextColor={C.textHint}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.notes}
                onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                placeholder="Add anything the reviewer should know"
                placeholderTextColor={C.textHint}
                multiline
              />
            </View>

            {uploadUrl ? (
              <View style={styles.uploadCard}>
                <Ionicons name="cloud-upload-outline" size={20} color={C.primary} />
                <View style={styles.uploadCopy}>
                  <Text style={styles.uploadTitle}>Signed upload URL ready</Text>
                  <Text style={styles.uploadSubtitle} numberOfLines={1}>
                    {uploadUrl.uploadUrl}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => void handleGenerateUploadUrl()}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color={C.primary} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Generate upload URL</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, !canSubmit || submitting ? styles.disabledButton : null]}
                onPress={() => void handleSubmit()}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {status === 'rejected' ? 'Resubmit' : 'Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(provider)/home')}>
          <Text style={styles.homeButtonText}>Back to Provider Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      height: 48,
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
      paddingBottom: 30,
    },
    statusCard: {
      marginTop: 18,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 18,
      padding: 18,
      alignItems: 'center',
    },
    statusIconWrap: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    statusSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    noticeCard: {
      marginTop: 14,
      width: '100%',
      borderRadius: 14,
      padding: 14,
      backgroundColor: C.amberLight,
    },
    noticeLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: C.amber,
      marginBottom: 4,
    },
    noticeText: {
      fontSize: 13,
      color: C.textPrimary,
      lineHeight: 18,
    },
    summaryCard: {
      marginTop: 14,
      width: '100%',
      borderRadius: 14,
      padding: 14,
      backgroundColor: C.background,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    summaryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: C.textPrimary,
    },
    summaryText: {
      marginTop: 4,
      fontSize: 12,
      color: C.textSecondary,
    },
    summaryMeta: {
      marginTop: 4,
      fontSize: 11,
      color: C.textHint,
    },
    refreshButton: {
      marginTop: 16,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
      paddingHorizontal: 14,
    },
    refreshButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    formCard: {
      marginTop: 16,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 18,
      padding: 18,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 14,
    },
    fieldBlock: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 8,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    chipIdle: {
      backgroundColor: C.background,
      borderColor: C.cardBorder,
    },
    chipActive: {
      backgroundColor: C.primaryLight,
      borderColor: C.primary,
    },
    chipTextIdle: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textPrimary,
    },
    chipTextActive: {
      fontSize: 12,
      fontWeight: '700',
      color: C.primary,
    },
    input: {
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      color: C.textPrimary,
      backgroundColor: C.background,
    },
    textArea: {
      minHeight: 88,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    rowField: {
      flex: 1,
    },
    uploadCard: {
      marginTop: 4,
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: C.primaryLight,
    },
    uploadCopy: {
      flex: 1,
    },
    uploadTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: C.textPrimary,
    },
    uploadSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
    },
    actionRow: {
      marginTop: 4,
      flexDirection: 'row',
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    primaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: 'white',
    },
    disabledButton: {
      opacity: 0.6,
    },
    errorText: {
      marginTop: 14,
      fontSize: 13,
      color: C.error,
    },
    homeButton: {
      marginTop: 16,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    homeButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
  });
