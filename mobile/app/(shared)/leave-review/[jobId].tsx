import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

import { jobService } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

const quickTags = [
  'On time',
  'Professional',
  'Great quality',
  'Good communication',
  'Would hire again',
  'Fast',
] as const;

const ratingLabels: Record<number, string> = {
  0: '',
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent!',
};

export default function LeaveReviewScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resolvedJobId = useMemo(
    () => (Array.isArray(jobId) ? (jobId[0] ?? 'job-demo') : (jobId ?? 'job-demo')),
    [jobId]
  );

  const provider = useMemo(
    () => ({
      name: 'Ali Raza',
      initials: 'AR',
      jobTitle: 'Deep Cleaning Service',
      amount: 50,
    }),
    []
  );

  const toggleTag = (value: string) => {
    setTags((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (loading || submitted) {
      return;
    }

    try {
      setLoading(true);
      await jobService.submitReview({
        jobId: resolvedJobId,
        rating,
        tags,
        comment: comment.trim(),
      });
      setSubmitted(true);
      router.back();
    } catch {
      setLoading(false);
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.providerCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{provider.initials}</Text>
          </View>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.jobMetaText} numberOfLines={1}>{`Completed: ${provider.jobTitle}`}</Text>
          <Text style={styles.amountText}>{`Amount: $${provider.amount.toFixed(2)}`}</Text>
        </View>

        <View style={styles.ratingWrap}>
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <TouchableOpacity key={`star-${i}`} onPress={() => setRating(i + 1)}>
                <Ionicons
                  name={i < rating ? 'star' : 'star-outline'}
                  size={40}
                  color={i < rating ? C.amber : C.textHint}
                />
              </TouchableOpacity>
            ))}
          </View>
          {ratingLabels[rating] ? <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text> : null}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>What went well?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScrollContent}
          >
            {quickTags.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, selected ? styles.tagChipSelected : styles.tagChipUnselected]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={selected ? styles.tagChipTextSelected : styles.tagChipTextUnselected}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.commentLabel}>Add a written review (optional)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Describe your experience..."
            placeholderTextColor={C.textHint}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.counterText}>{`${comment.length}/300`}</Text>
        </View>

        <Text style={styles.publicNote}>This review will be visible on the provider's profile.</Text>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading || submitted}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 20,
      position: 'relative',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    skipButton: {
      position: 'absolute',
      right: 20,
      top: 15,
      padding: 4,
    },
    skipText: {
      fontSize: 13,
      color: C.textHint,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    providerCard: {
      marginTop: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 20,
      alignItems: 'center',
    },
    avatarWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: C.primary,
    },
    providerName: {
      marginTop: 10,
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    jobMetaText: {
      marginTop: 4,
      fontSize: 13,
      color: C.primary,
      maxWidth: '95%',
      textAlign: 'center',
    },
    amountText: {
      marginTop: 2,
      fontSize: 13,
      color: C.textSecondary,
    },
    ratingWrap: {
      marginTop: 24,
      alignItems: 'center',
    },
    starRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    ratingLabel: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '600',
      color: C.primary,
    },
    sectionWrap: {
      marginTop: 20,
    },
    sectionTitle: {
      marginBottom: 10,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    tagsScrollContent: {
      gap: 8,
      paddingRight: 10,
    },
    tagChip: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    tagChipSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    tagChipUnselected: {
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
    },
    tagChipTextSelected: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    tagChipTextUnselected: {
      fontSize: 12,
      color: C.textSecondary,
    },
    commentLabel: {
      marginBottom: 6,
      fontSize: 13,
      fontWeight: '500',
      color: C.textSecondary,
    },
    commentInput: {
      height: 100,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: C.textPrimary,
      fontSize: 14,
    },
    counterText: {
      marginTop: 4,
      textAlign: 'right',
      fontSize: 11,
      color: C.textHint,
    },
    publicNote: {
      marginTop: 10,
      textAlign: 'center',
      fontSize: 11,
      color: C.textHint,
    },
    submitButton: {
      marginTop: 24,
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
  });
