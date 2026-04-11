import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import ProposalCard from '@/src/components/job/ProposalCard';
import { Colors, type AppColors } from '@/src/theme/colors';

type JobStatus = 'open' | 'in_progress' | 'completed' | 'disputed';

type Proposal = {
  id: string;
  providerName: string;
  price: number;
  rating: number;
  eta: string;
};

type JobDetail = {
  id: string;
  status: JobStatus;
  category: string;
  title: string;
  location: string;
  postedAgo: string;
  budget: number;
  deadline: string;
  description: string;
  attachments: string[];
  isPhysical: boolean;
  proposals: Proposal[];
  activeProviderCount: number;
};

const mockJobs: Record<string, JobDetail> = {
  'j-1001': {
    id: 'j-1001',
    status: 'open',
    category: 'Transport',
    title: 'Need airport drop tomorrow at 8AM',
    location: 'DHA Phase 6, Lahore',
    postedAgo: '2h ago',
    budget: 30,
    deadline: 'Apr 14, 8:00 AM',
    description:
      'Need a reliable driver with a clean car for airport drop. Pickup from DHA Phase 6 at 6:30 AM sharp with one medium suitcase and one cabin bag. Please confirm vehicle type, punctuality, and recent driving experience in your proposal.',
    attachments: [
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=240&q=60',
      'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=240&q=60',
      'https://images.unsplash.com/photo-1553531384-397c80973a36?auto=format&fit=crop&w=240&q=60',
    ],
    isPhysical: true,
    proposals: [
      { id: 'p-1', providerName: 'Ahmed R.', price: 28, rating: 4.8, eta: 'Arrives in 20m' },
      { id: 'p-2', providerName: 'Usman K.', price: 30, rating: 4.6, eta: 'Arrives in 25m' },
      { id: 'p-3', providerName: 'Adeel M.', price: 26, rating: 4.7, eta: 'Arrives in 18m' },
      { id: 'p-4', providerName: 'Saad A.', price: 29, rating: 4.5, eta: 'Arrives in 22m' },
      { id: 'p-5', providerName: 'Bilal T.', price: 31, rating: 4.9, eta: 'Arrives in 30m' },
    ],
    activeProviderCount: 0,
  },
  'j-1002': {
    id: 'j-1002',
    status: 'in_progress',
    category: 'Cleaning',
    title: 'Deep cleaning for 2-bedroom apartment',
    location: 'Bahria Town, Lahore',
    postedAgo: '1d ago',
    budget: 55,
    deadline: 'Apr 15, 5:00 PM',
    description:
      'Need full deep cleaning including kitchen degreasing, bathrooms, windows, and dust removal. Cleaning supplies can be provided if needed. Looking for a careful provider with verified experience and positive reviews.',
    attachments: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=240&q=60',
    ],
    isPhysical: true,
    proposals: [],
    activeProviderCount: 1,
  },
  'j-1003': {
    id: 'j-1003',
    status: 'completed',
    category: 'Design',
    title: 'Modern logo and social media kit design',
    location: 'Remote',
    postedAgo: '4d ago',
    budget: 120,
    deadline: 'Apr 10, 11:59 PM',
    description:
      'Brand identity package completed including logo, cover assets, and icon set. Final delivery included editable source files and export variants optimized for social platforms.',
    attachments: [],
    isPhysical: false,
    proposals: [],
    activeProviderCount: 0,
  },
  'j-1004': {
    id: 'j-1004',
    status: 'disputed',
    category: 'Delivery',
    title: 'Urgent package delivery to office',
    location: 'Gulberg, Lahore',
    postedAgo: '18h ago',
    budget: 20,
    deadline: 'Apr 13, 2:00 PM',
    description:
      'Delivery delay dispute opened due to missed timeline and damaged external packaging. Job details are preserved here for support review and resolution follow-up.',
    attachments: [],
    isPhysical: true,
    proposals: [],
    activeProviderCount: 0,
  },
};

const statusBanner = (
  status: JobStatus,
  C: AppColors,
  isDark: boolean
): { backgroundColor: string; dotColor: string; label: string } => {
  switch (status) {
    case 'open':
      return {
        backgroundColor: C.primaryLight,
        dotColor: C.primary,
        label: 'Open — Accepting Proposals',
      };
    case 'in_progress':
      return {
        backgroundColor: C.amberLight,
        dotColor: C.amber,
        label: 'In Progress',
      };
    case 'completed':
      return {
        backgroundColor: isDark ? '#0F2E1F' : '#E8F8F2',
        dotColor: C.success,
        label: 'Completed',
      };
    case 'disputed':
      return {
        backgroundColor: isDark ? '#2E1010' : '#FDECEA',
        dotColor: C.error,
        label: 'Under Dispute',
      };
    default:
      return {
        backgroundColor: C.primaryLight,
        dotColor: C.primary,
        label: 'Open — Accepting Proposals',
      };
  }
};

export default function ClientJobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const key = Array.isArray(id) ? id[0] : id;
    const timer = setTimeout(() => {
      setJob(mockJobs[key ?? 'j-1001'] ?? mockJobs['j-1001']);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [id]);

  const banner = useMemo(() => {
    if (!job) {
      return statusBanner('open', C, isDark);
    }
    return statusBanner(job.status, C, isDark);
  }, [C, isDark, job]);

  const canExpand = (job?.description.length ?? 0) > 180;
  const descriptionText = expanded || !canExpand ? job?.description ?? '' : `${job?.description.slice(0, 180)}...`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.emptyText}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={20} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          job.status === 'in_progress' ? styles.contentWithBottomBar : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBanner, { backgroundColor: banner.backgroundColor }]}> 
          <View style={[styles.bannerDot, { backgroundColor: banner.dotColor }]} />
          <Text style={[styles.statusBannerText, { color: banner.dotColor }]}>{banner.label}</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.cardTopRow}>
            <JobStatusBadge status={job.status} />
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{job.category}</Text>
            </View>
          </View>

          <Text style={styles.title}>{job.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={C.textSecondary} />
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={C.textSecondary} />
              <Text style={styles.metaText}>{`Posted ${job.postedAgo}`}</Text>
            </View>
          </View>

          <Text style={styles.budget}>{`$${job.budget.toFixed(0)}`}</Text>

          <View style={styles.deadlineRow}>
            <Ionicons name="calendar-outline" size={14} color={C.textSecondary} />
            <Text style={styles.deadlineText}>{job.deadline}</Text>
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{descriptionText}</Text>
          {canExpand ? (
            <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
              <Text style={styles.readMoreText}>{expanded ? 'Read less' : 'Read more'}</Text>
            </TouchableOpacity>
          ) : null}

          {job.attachments.length > 0 ? (
            <View style={styles.attachmentsWrap}>
              <Text style={styles.sectionLabel}>Attachments</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentsList}>
                {job.attachments.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.attachmentImage} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {job.isPhysical ? (
            <View style={styles.mapWrap}>
              <Text style={styles.sectionLabel}>Location</Text>
              <View style={styles.mapCard}>
                <Ionicons name="map" size={48} color={C.primary} />
                <Text style={styles.mapHint}>~18 providers in search area</Text>
              </View>
            </View>
          ) : null}

          {job.status === 'open' ? (
            <View style={styles.proposalsWrap}>
              <View style={styles.proposalsHeader}>
                <Text style={styles.proposalsTitle}>{`Proposals (${job.proposals.length})`}</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(client)/proposals/[jobId]',
                      params: { jobId: job.id },
                    })
                  }
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {job.proposals.slice(0, 2).map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  compact
                  providerName={proposal.providerName}
                  price={proposal.price}
                  eta={proposal.eta}
                  rating={proposal.rating}
                  style={styles.proposalCardItem}
                />
              ))}
            </View>
          ) : null}

          {job.status === 'open' ? (
            <View style={styles.cancelWrap}>
              <TouchableOpacity onPress={() => setShowCancelConfirm(true)}>
                <Text style={styles.cancelText}>Cancel Job</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {job.status === 'in_progress' ? (
        <SafeAreaView style={styles.fixedBottom} edges={['bottom']}>
          <Text style={styles.providerHint}>{`${job.activeProviderCount} Active Provider`}</Text>
          <TouchableOpacity style={styles.messageButton} onPress={() => router.push('/(client)/messages')}>
            <Text style={styles.messageButtonText}>Message Provider</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : null}

      <Modal visible={showCancelConfirm} transparent animationType="fade" onRequestClose={() => setShowCancelConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel this job?</Text>
            <Text style={styles.modalMessage}>This will stop receiving new proposals.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.modalSecondaryText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={() => {
                  setShowCancelConfirm(false);
                }}
              >
                <Text style={styles.modalDangerText}>Cancel Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    emptyText: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    header: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      position: 'relative',
    },
    iconButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    headerTitle: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      pointerEvents: 'none',
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    contentWithBottomBar: {
      paddingBottom: 96,
    },
    statusBanner: {
      marginTop: 16,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bannerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusBannerText: {
      fontSize: 13,
      fontWeight: '600',
    },
    jobCard: {
      marginTop: 12,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    categoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: C.primaryLight,
    },
    categoryPillText: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '600',
    },
    title: {
      marginTop: 8,
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      lineHeight: 28,
    },
    metaRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      color: C.textSecondary,
      fontWeight: '400',
    },
    budget: {
      marginTop: 10,
      fontSize: 24,
      fontWeight: '700',
      color: C.primary,
    },
    deadlineRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deadlineText: {
      fontSize: 13,
      color: C.textSecondary,
      fontWeight: '400',
    },
    sectionLabel: {
      marginTop: 14,
      marginBottom: 6,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: C.textSecondary,
    },
    readMoreText: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '500',
      color: C.primary,
    },
    attachmentsWrap: {
      marginTop: 16,
    },
    attachmentsList: {
      gap: 8,
      paddingRight: 8,
    },
    attachmentImage: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: C.divider,
    },
    mapWrap: {
      marginTop: 16,
    },
    mapCard: {
      height: 140,
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapHint: {
      marginTop: 6,
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    proposalsWrap: {
      marginTop: 20,
    },
    proposalsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    proposalsTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    viewAllText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    proposalCardItem: {
      marginBottom: 10,
    },
    cancelWrap: {
      marginTop: 24,
      marginBottom: 32,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '500',
      color: C.error,
    },
    fixedBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      backgroundColor: C.navBg,
    },
    providerHint: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
      fontWeight: '400',
    },
    messageButton: {
      height: 44,
      borderRadius: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primary,
    },
    messageButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: C.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      borderRadius: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.textPrimary,
    },
    modalMessage: {
      marginTop: 6,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 19,
    },
    modalActions: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    modalSecondary: {
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.divider,
    },
    modalSecondaryText: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textPrimary,
    },
    modalDanger: {
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.error,
    },
    modalDangerText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
  });
