import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import BottomSheet from '@/src/components/common/BottomSheet';
import { Colors, type AppColors } from '@/src/theme/colors';

type PriorityLevel = 'low' | 'medium' | 'urgent';

const categories = [
  'Account Issue',
  'Payment Problem',
  'Job Issue',
  'Provider Issue',
  'KYC',
  'App Bug',
  'Other',
] as const;

const recentJobs = [
  { id: 'J-1001', title: 'Airport drop tomorrow morning' },
  { id: 'J-1042', title: 'Apartment deep cleaning service' },
  { id: 'J-1108', title: 'Logo design and social media kit' },
] as const;

export default function NewTicketScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [category, setCategory] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [subject, setSubject] = useState('');
  const [relatedJob, setRelatedJob] = useState<string>('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showJobSheet, setShowJobSheet] = useState(false);

  const canSubmit = category.length > 0 && subject.trim().length > 0 && description.trim().length > 0;
  const ticketId = '00235';

  const addAttachment = () => {
    const nextSeed = `${Date.now()}-${attachments.length}`;
    setAttachments((prev) => [...prev, `https://picsum.photos/seed/${nextSeed}/180/180`]);
  };

  const onSubmit = () => {
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 950);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Ticket</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity style={styles.selectorRow} onPress={() => setShowCategorySheet(true)}>
              <Text style={category ? styles.selectorValue : styles.selectorPlaceholder}>
                {category || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={C.textHint} />
            </TouchableOpacity>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {[
                { key: 'low', label: 'Low' },
                { key: 'medium', label: 'Medium' },
                { key: 'urgent', label: 'Urgent' },
              ].map((item) => {
                const selected = priority === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.priorityChip, selected ? styles.priorityChipActive : styles.priorityChipIdle]}
                    onPress={() => setPriority(item.key as PriorityLevel)}
                  >
                    <Text
                      style={selected ? styles.priorityChipTextActive : styles.priorityChipTextIdle}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={(value) => setSubject(value.slice(0, 100))}
              placeholder="Write ticket subject"
              placeholderTextColor={C.textHint}
            />
            <Text style={styles.counterText}>{`${subject.length}/100`}</Text>

            <Text style={styles.label}>Related Job (optional)</Text>
            <TouchableOpacity style={styles.selectorRow} onPress={() => setShowJobSheet(true)}>
              <Text style={relatedJob ? styles.selectorValue : styles.selectorPlaceholder}>
                {relatedJob || 'Select job or choose not related'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={C.textHint} />
            </TouchableOpacity>

            <Text style={styles.label}>Describe your issue</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={(value) => setDescription(value.slice(0, 1000))}
              placeholder="Tell us exactly what happened so we can help quickly..."
              placeholderTextColor={C.textHint}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counterText}>{`${description.length}/1000`}</Text>

            <Text style={styles.label}>Attachments (Optional)</Text>
            <TouchableOpacity style={styles.uploadZone} onPress={addAttachment}>
              <Ionicons name="cloud-upload-outline" size={22} color={C.primary} />
              <Text style={styles.uploadText}>Add screenshot or image</Text>
            </TouchableOpacity>

            {attachments.length ? (
              <View style={styles.thumbRow}>
                {attachments.map((uri, index) => (
                  <Image key={`${uri}-${index}`} source={{ uri }} style={styles.thumb} />
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit ? styles.submitButtonDisabled : null]}
              onPress={onSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="Select Category"
      >
        {categories.map((item) => {
          const active = category === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.sheetOption, active ? styles.sheetOptionActive : null]}
              onPress={() => {
                setCategory(item);
                setShowCategorySheet(false);
              }}
            >
              <Text style={active ? styles.sheetOptionTextActive : styles.sheetOptionText}>{item}</Text>
              {active ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet visible={showJobSheet} onClose={() => setShowJobSheet(false)} title="Related Job">
        <TouchableOpacity
          style={[styles.sheetOption, !relatedJob ? styles.sheetOptionActive : null]}
          onPress={() => {
            setRelatedJob('');
            setShowJobSheet(false);
          }}
        >
          <Text style={!relatedJob ? styles.sheetOptionTextActive : styles.sheetOptionText}>
            Not related to a job
          </Text>
          {!relatedJob ? <Ionicons name="checkmark" size={18} color={C.primary} /> : null}
        </TouchableOpacity>

        {recentJobs.map((job) => {
          const active = relatedJob === `${job.id} - ${job.title}`;
          return (
            <TouchableOpacity
              key={job.id}
              style={[styles.sheetOption, active ? styles.sheetOptionActive : null]}
              onPress={() => {
                setRelatedJob(`${job.id} - ${job.title}`);
                setShowJobSheet(false);
              }}
            >
              <View style={styles.jobOptionTextWrap}>
                <Text style={active ? styles.sheetOptionTextActive : styles.sheetOptionText}>{job.id}</Text>
                <Text style={styles.jobOptionSubText} numberOfLines={1}>
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
          <Ionicons name="checkmark-circle" size={64} color={C.primary} />
          <Text style={styles.successTitle}>Ticket Submitted!</Text>
          <Text style={styles.successText}>{`#TK-${ticketId} has been created`}</Text>
          <Text style={styles.successText}>We'll reply within 24 hours</Text>

          <TouchableOpacity
            style={styles.viewTicketButton}
            onPress={() =>
              router.push({
                pathname: '/(help)/ticket-detail/[id]',
                params: { id: ticketId },
              })
            }
          >
            <Text style={styles.viewTicketButtonText}>View Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backHelpButton} onPress={() => router.push('/(help)')}>
            <Text style={styles.backHelpButtonText}>Back to Help</Text>
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
    keyboardWrap: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    formCard: {
      marginTop: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 20,
    },
    label: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    selectorRow: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
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
    priorityRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    priorityChip: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priorityChipActive: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    priorityChipIdle: {
      borderColor: C.cardBorder,
      backgroundColor: C.card,
    },
    priorityChipTextActive: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    priorityChipTextIdle: {
      fontSize: 13,
      color: C.textSecondary,
    },
    input: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      fontSize: 14,
      color: C.textPrimary,
    },
    textArea: {
      height: 160,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: C.textPrimary,
    },
    counterText: {
      marginTop: 4,
      marginBottom: 14,
      textAlign: 'right',
      fontSize: 11,
      color: C.textHint,
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
    submitButtonDisabled: {
      backgroundColor: C.textHint,
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
    sheetOptionText: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    sheetOptionTextActive: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
    jobOptionTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    jobOptionSubText: {
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
    successTitle: {
      marginTop: 14,
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    successText: {
      marginTop: 6,
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
    },
    viewTicketButton: {
      marginTop: 20,
      width: '100%',
      height: 50,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewTicketButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
    backHelpButton: {
      marginTop: 10,
      width: '100%',
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backHelpButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
  });
