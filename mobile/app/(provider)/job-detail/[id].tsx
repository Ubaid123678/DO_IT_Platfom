import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type JobDetail = {
  id: string;
  category: string;
  title: string;
  budget: number;
  budgetType: string;
  location: string;
  posted: string;
  proposals: number;
  clientName: string;
  clientRating: number;
  verified: boolean;
  description: string;
  requirements: string[];
  urgent: boolean;
};

const jobsById: Record<string, JobDetail> = {
  'job-501': {
    id: 'job-501',
    category: 'Delivery',
    title: 'Need same-day parcel delivery to Gulberg office',
    budget: 45,
    budgetType: 'fixed',
    location: 'DHA Lahore',
    posted: '35m ago',
    proposals: 7,
    clientName: 'Ammar S.',
    clientRating: 4.9,
    verified: true,
    description:
      'Pickup a sealed parcel from DHA and deliver it to Gulberg before 3 PM. Customer expects live updates and careful handling.',
    requirements: [
      'Valid bike and CNIC documents',
      'Can complete within 90 minutes',
      'Experience with same-day deliveries',
    ],
    urgent: true,
  },
  'job-504': {
    id: 'job-504',
    category: 'Development',
    title: 'Landing page + payment flow for online course website',
    budget: 300,
    budgetType: 'project',
    location: 'Remote',
    posted: '3h ago',
    proposals: 22,
    clientName: 'Farah T.',
    clientRating: 4.7,
    verified: true,
    description:
      'Build a responsive landing page with clear CTA flow and integrate a secure checkout with post-purchase confirmation.',
    requirements: [
      'React/Next.js experience',
      'Payment gateway integration knowledge',
      'Delivery in 4-5 days',
    ],
    urgent: false,
  },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function ProviderJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const resolvedId = Array.isArray(id) ? (id[0] ?? 'job-501') : (id ?? 'job-501');
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJob(jobsById[resolvedId] ?? jobsById['job-501']);
      setLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [resolvedId]);

  const initials = useMemo(() => (job ? getInitials(job.clientName) : 'CL'), [job]);

  if (loading || !job) {
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
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Job Details</Text>

        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="bookmark-outline" size={20} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          {job.urgent ? (
            <View style={styles.urgentBadge}>
              <Ionicons name="flame" size={12} color="white" />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          ) : null}

          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{job.category}</Text>
          </View>

          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={C.textHint} />
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={C.textHint} />
              <Text style={styles.metaText}>{job.posted}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={C.textHint} />
              <Text style={styles.metaText}>{`${job.proposals} proposals`}</Text>
            </View>
          </View>

          <Text style={styles.priceText}>{`$${job.budget} / ${job.budgetType}`}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionBody}>{job.description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req) => (
            <View key={req} style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={16} color={C.primary} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.clientCard}>
          <Text style={styles.sectionTitle}>Client</Text>

          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>{initials}</Text>
            </View>

            <View style={styles.clientInfoWrap}>
              <Text style={styles.clientName}>{job.clientName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={C.amber} />
                <Text style={styles.clientMeta}>{`${job.clientRating.toFixed(1)} rating`}</Text>
                {job.verified ? (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/chat/[id]',
                  params: { id: `chat-${job.id}` },
                })
              }
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.applyBtn, applied ? styles.applyBtnApplied : null]}
          onPress={() => {
            setApplied(true);
            router.push('/(provider)/proposals');
          }}
        >
          <Text style={styles.applyBtnText}>{applied ? 'Proposal Submitted' : 'Apply for This Job'}</Text>
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
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      height: 52,
      marginTop: 8,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
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
      paddingBottom: 28,
    },
    topCard: {
      marginTop: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 16,
    },
    urgentBadge: {
      alignSelf: 'flex-start',
      borderRadius: 20,
      backgroundColor: C.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
    },
    urgentText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '700',
    },
    categoryPill: {
      alignSelf: 'flex-start',
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.primary,
    },
    jobTitle: {
      marginTop: 10,
      fontSize: 19,
      lineHeight: 28,
      fontWeight: '700',
      color: C.textPrimary,
    },
    metaRow: {
      marginTop: 10,
      gap: 6,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    priceText: {
      marginTop: 12,
      fontSize: 20,
      fontWeight: '800',
      color: C.primary,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 8,
    },
    sectionBody: {
      fontSize: 14,
      lineHeight: 22,
      color: C.textSecondary,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    requirementText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
    },
    clientCard: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
    },
    clientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    clientAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clientAvatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: C.primary,
    },
    clientInfoWrap: {
      flex: 1,
    },
    clientName: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    ratingRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    clientMeta: {
      fontSize: 12,
      color: C.textSecondary,
    },
    verifiedPill: {
      marginLeft: 4,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: C.primaryLight,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.primary,
    },
    chatBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.background,
    },
    applyBtn: {
      marginTop: 18,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    applyBtnApplied: {
      backgroundColor: C.success,
    },
    applyBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
    },
  });
