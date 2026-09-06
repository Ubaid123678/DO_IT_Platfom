import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Alert } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { proposalService, type Proposal, type ProposalStatus } from '@/src/services/proposalService';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<ProposalStatus, string> = {
  submitted: 'Submitted',
  withdrawn: 'Withdrawn',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  submitted: '#1A9E8F',
  withdrawn: '#95A5A6',
  accepted: '#27AE60',
  rejected: '#E74C3C',
  expired: '#F39C12',
};

const formatCurrency = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function ProposalDetailScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();
  const { proposalId } = useLocalSearchParams<{ proposalId?: string }>();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (proposalId) {
      loadProposal();
    }
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const data = await proposalService.getProposalById(proposalId!);
      setProposal(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load proposal';
      Alert.alert('Error', msg);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;
    Alert.alert(
      'Accept Proposal',
      'Are you sure you want to accept this proposal? This will automatically reject all other proposals for this job.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(true);
            try {
              await proposalService.acceptProposal(proposalId!);
              Alert.alert('Success', 'Proposal accepted! Other proposals have been rejected.');
              router.back();
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Failed to accept proposal';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!proposal) return;
    Alert.alert(
      'Reject Proposal',
      'Are you sure you want to reject this proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            setActionLoading(true);
            try {
              await proposalService.rejectProposal(proposalId!);
              Alert.alert('Success', 'Proposal rejected.');
              router.back();
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Failed to reject proposal';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleWithdraw = async () => {
    if (!proposal) return;
    Alert.alert(
      'Withdraw Proposal',
      'Are you sure you want to withdraw your proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setActionLoading(true);
            try {
              await proposalService.withdrawProposal(proposalId!);
              Alert.alert('Success', 'Proposal withdrawn.');
              router.back();
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Failed to withdraw proposal';
              Alert.alert('Error', msg);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const isProvider = proposal?.providerId;
  const isClient = proposal?.clientId;
  const canAcceptReject = proposal?.status === 'submitted';
  const canWithdraw = proposal?.status === 'submitted';

  if (loading) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading proposal...</Text>
        </View>
      </SafeAreaViewCompat>
    );
  }

  if (!proposal) return null;

  const isOwner = isClient; // In a real app, check against current user
  const isProposer = isProvider;

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proposal Detail</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[proposal.status] }]}>
            <Text style={styles.statusBadgeText}>{STATUS_LABELS[proposal.status]}</Text>
          </View>
          <Text style={styles.statusDate}>Submitted: {formatDate(proposal.submittedAt)}</Text>
        </View>

        {/* Job Info */}
        {(() => {
          const job = proposal.job;
          if (!job) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job</Text>
              <TouchableOpacity style={styles.jobCard} onPress={() => router.push(`/job-detail/${job._id}` as any)}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.jobMeta}>
                  <Text style={styles.jobMetaItem}>
                    <Ionicons name="briefcase-outline" size={14} color={C.textHint} />
                    <Text>{job.type}</Text>
                  </Text>
                  <Text style={styles.jobMetaItem}>
                    <Ionicons name="cash-outline" size={14} color={C.textHint} />
                    <Text>{formatCurrency(job.budget?.amount || 0)}</Text>
                  </Text>
                  <Text style={styles.jobMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color={C.textHint} />
                    <Text>{(job as any).createdAt ? formatDate((job as any).createdAt) : 'N/A'}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Bid Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bid Details</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Bid Type</Text>
              <Text style={styles.detailValue}>{proposal.bidType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Bid Amount</Text>
              <Text style={styles.detailValue}>
                {proposal.bidType === 'hourly'
                  ? `${formatCurrency(proposal.bidAmount)}/hr${proposal.estimatedHours ? ` × ${proposal.estimatedHours}hrs` : ''}`
                  : formatCurrency(proposal.bidAmount)}
              </Text>
            </View>
            {proposal.bidType === 'hourly' && (
              <>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Hourly Rate</Text>
                  <Text style={styles.detailValue}>{formatCurrency(proposal.hourlyRate || 0)}/hr</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Estimated Hours</Text>
                  <Text style={styles.detailValue}>{proposal.estimatedHours} hrs</Text>
                </View>
              </>
            )}
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Total Bid</Text>
              <Text style={[styles.detailValue, styles.detailValueTotal]}>{formatCurrency(proposal.bidTotal || proposal.bidAmount)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Platform Fee (10%)</Text>
              <Text style={styles.detailValue}>-{formatCurrency(Math.round((proposal.bidTotal || proposal.bidAmount) * 0.1))}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>You Receive</Text>
              <Text style={[styles.detailValue, styles.detailValueTotal]}>{formatCurrency(Math.round((proposal.bidTotal || proposal.bidAmount) * 0.9))}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Estimated Timeline</Text>
              <Text style={styles.detailValue}>{proposal.estimatedTimeline}</Text>
            </View>
          </View>
        </View>

        {/* Cover Letter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Letter</Text>
          <Text style={styles.coverLetter}>{proposal.coverLetter}</Text>
        </View>

        {/* Provider Info */}
        {proposal.provider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider</Text>
            <View style={styles.providerCard}>
              <View style={styles.providerAvatar}>
                {proposal.provider.provider_profile?.avatar_url ? (
                  <Text style={styles.providerAvatarText}>{proposal.provider.fullName?.[0] || 'P'}</Text>
                ) : (
                  <Text style={styles.providerAvatarText}>{proposal.provider.fullName?.[0] || 'P'}</Text>
                )}
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{proposal.provider.fullName || 'Provider'}</Text>
                {proposal.provider.provider_profile?.headline && (
                  <Text style={styles.providerHeadline}>{proposal.provider.provider_profile.headline}</Text>
                )}
                {proposal.provider.provider_profile?.city && (
                  <Text style={styles.providerLocation}>{proposal.provider.provider_profile.city}</Text>
                )}
                {proposal.provider.provider_profile?.bio && (
                  <Text style={styles.providerBio}>{proposal.provider.provider_profile.bio}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Client Response */}
        {proposal.clientResponse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Response</Text>
            <View style={styles.responseCard}>
              <Text style={styles.responseLabel}>{proposal.clientResponse.message || 'No message provided'}</Text>
              <Text style={styles.responseDate}>Responded: {formatDate(proposal.respondedAt || '')}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {(isProvider && canWithdraw) && (
          <View style={styles.providerActions}>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
              <Ionicons name="arrow-back-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Withdraw Proposal</Text>
            </TouchableOpacity>
          </View>
        )}

        {(isClient && canAcceptReject) && (
          <View style={styles.clientActions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Accept Proposal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {(actionLoading) && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingOverlayText}>Processing...</Text>
        </View>
      )}
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 16, color: C.textSecondary, marginTop: 12 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
    content: { paddingHorizontal: 20, paddingBottom: 100 },
    statusSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    statusDate: { fontSize: 12, color: C.textHint },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
    jobCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
    jobTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    jobMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSecondary },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    detailCard: { flex: 1, minWidth: '45%', backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
    detailLabel: { fontSize: 11, color: C.textHint, marginBottom: 4 },
    detailValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    detailValueTotal: { fontSize: 16, fontWeight: '700', color: C.primary },
    coverLetter: { fontSize: 14, color: C.textSecondary, lineHeight: 22, backgroundColor: C.inputBg, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder },
    providerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    providerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    providerAvatarText: { fontSize: 20, fontWeight: '600', color: C.primary },
    providerInfo: { flex: 1 },
    providerName: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
    providerHeadline: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    providerLocation: { fontSize: 12, color: C.textHint },
    providerBio: { fontSize: 13, color: C.textSecondary, marginTop: 8, lineHeight: 20 },
    responseCard: { backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.primary },
    responseLabel: { fontSize: 14, color: C.textSecondary, marginBottom: 4 },
    responseDate: { fontSize: 11, color: C.textHint },
    providerActions: { paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider },
    clientActions: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider },
    acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: C.success },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: C.error },
    withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: C.warning },
    actionBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    loadingOverlayText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  });