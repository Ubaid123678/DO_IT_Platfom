import { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Alert } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import ConfirmSheet from '@/src/components/common/ConfirmSheet';
import { proposalService, type Proposal, type ProposalStatus, type ProposalListResponse } from '@/src/services/proposalService';
import { useCurrency } from '@/src/context/CurrencyContext';
import { getApiErrorMessage } from '@/src/services/api';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<ProposalStatus, string> = {
  submitted: 'New',
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

export default function JobProposalsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { fmt } = useCurrency();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProposalStatus | 'all'>('all');
  const [stats, setStats] = useState<any>({
    submitted: { count: 0 },
    withdrawn: { count: 0 },
    accepted: { count: 0 },
    rejected: { count: 0 },
    expired: { count: 0 },
  });

  // Pagination + active tab in refs so loadProposals has a stable identity
  // (otherwise the focus effect re-fires every time skip advances → reload loop).
  const inFlightRef = useRef(false);
  const skipRef = useRef(0);
  const hasMoreRef = useRef(true);
  const activeTabRef = useRef<ProposalStatus | 'all'>('all');
  const loadProposals = useCallback(async (reset = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (reset) {
      skipRef.current = 0;
      hasMoreRef.current = true;
    }
    if (!hasMoreRef.current && !reset) {
      inFlightRef.current = false;
      return;
    }

    try {
      const currentSkip = reset ? 0 : skipRef.current;
      const result = await proposalService.getProposalsForJob(jobId!, {
        status: activeTabRef.current === 'all' ? undefined : activeTabRef.current,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setProposals(result.proposals);
      } else {
        setProposals((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...result.proposals.filter((p) => !seen.has(p._id))];
        });
      }
      setTotal(result.total);
      const more = result.proposals.length === 20;
      hasMoreRef.current = more;
      setHasMore(more);
      skipRef.current = currentSkip + result.proposals.length;
      setSkip(skipRef.current);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load proposals';
      setError(msg);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [jobId]);

  const loadStats = useCallback(async () => {
    try {
      const data = await proposalService.getJobProposalStats(jobId!);
      setStats(data);
    } catch {
      // Ignore
    }
  }, [jobId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    loadProposals(true);
  }, [activeTab, loadProposals]);

  // Refetch on focus so a new proposal shows without an app restart.
  useFocusEffect(
    useCallback(() => {
      loadProposals(true);
      loadStats();
    }, [loadProposals, loadStats]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProposals(true);
    loadStats();
  }, [loadProposals, loadStats]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadProposals(false);
    }
  }, [loadingMore, hasMore, loadProposals]);

  const renderProposal = ({ item }: { item: Proposal }) => (
    <TouchableOpacity style={styles.proposalCard} onPress={() => router.push(`/(shared)/proposal-detail/${item._id}` as any)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <Text style={styles.providerAvatarText}>{item.provider?.fullName?.[0] || 'P'}</Text>
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{item.provider?.fullName || 'Provider'}</Text>
            {item.provider?.provider_profile?.headline && (
              <Text style={styles.providerHeadline}>{item.provider.provider_profile.headline}</Text>
            )}
            {item.provider?.provider_profile?.city && (
              <Text style={styles.providerLocation}>{item.provider.provider_profile.city}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.bidSection}>
        <Text style={styles.bidLabel}>Bid</Text>
        <Text style={styles.bidAmount}>
          {item.bidType === 'hourly'
            ? `${fmt(item.hourlyRate ?? item.bidAmount)}/hr${item.estimatedHours ? ` × ${item.estimatedHours}hrs` : ''} = ${fmt(item.bidAmount)}`
            : fmt(item.bidAmount)}
        </Text>
      </View>

      <Text style={styles.timelineLabel}>Timeline: {item.estimatedTimeline}</Text>

      <View style={styles.coverLetterPreview}>
        <Text style={styles.coverLetterText}>{item.coverLetter.substring(0, 120)}...</Text>
      </View>

      {item.status === 'submitted' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
            <Ionicons name="close-circle-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const [confirmAction, setConfirmAction] = useState<{ action: 'accept' | 'reject'; proposalId: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const runAction = async (action: 'accept' | 'reject', proposalId: string) => {
    setActionLoading(true);
    try {
      if (action === 'accept') await proposalService.acceptProposal(proposalId);
      else await proposalService.rejectProposal(proposalId);
      setConfirmAction(null);
      Alert.alert('Success', action === 'accept' ? 'Proposal accepted. Other proposals were rejected.' : 'Proposal rejected.');
      loadProposals(true);
    } catch (e) {
      Alert.alert('Error', getApiErrorMessage(e, `Failed to ${action} proposal`));
    } finally {
      setActionLoading(false);
    }
  };
  const handleAccept = (proposalId: string) => setConfirmAction({ action: 'accept', proposalId });
  const handleReject = (proposalId: string) => setConfirmAction({ action: 'reject', proposalId });

  const getTabLabel = (status: ProposalStatus | 'all') => {
    if (status === 'all') return 'All';
    return STATUS_LABELS[status];
  };

  if (loading && proposals.length === 0) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading proposals...</Text>
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
        <Text style={styles.headerTitle}>Proposals</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats Tabs */}
      <ScrollView horizontal style={styles.statsScroll} contentContainerStyle={styles.statsContainer} showsHorizontalScrollIndicator={false}>
        {(['all', 'submitted', 'accepted', 'rejected', 'withdrawn'] as const).map((status) => {
          const count = status === 'all' ? total : stats[status]?.count || 0;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.statTab,
                activeTab === status && styles.statTabActive,
              ]}
              onPress={() => setActiveTab(status)}
            >
              <Text style={[styles.statTabLabel, activeTab === status && styles.statTabLabelActive]}>{status === 'all' ? 'All' : STATUS_LABELS[status]}</Text>
              <Text style={[styles.statTabCount, activeTab === status && styles.statTabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={proposals}
        renderItem={renderProposal}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No proposals yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'Proposals will appear here when providers apply' : `No ${getTabLabel(activeTab).toLowerCase()} proposals`}
              </Text>
            </View>
          ) : undefined
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}

      {confirmAction && (
        <ConfirmSheet
          visible
          title={confirmAction.action === 'accept' ? 'Accept Proposal' : 'Reject Proposal'}
          message={
            confirmAction.action === 'accept'
              ? 'Accept this proposal? All other proposals for this job will be rejected.'
              : 'Are you sure you want to reject this proposal?'
          }
          confirmLabel={confirmAction.action === 'accept' ? 'Accept' : 'Reject'}
          destructive={confirmAction.action === 'reject'}
          busy={actionLoading}
          onConfirm={() => void runAction(confirmAction.action, confirmAction.proposalId)}
          onCancel={() => setConfirmAction(null)}
        />
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
    statsContainer: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
    statsScroll: { flexGrow: 0, paddingVertical: 12 },
    statTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      minWidth: 72,
      alignItems: 'center',
    },
    statTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    statTabLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    statTabLabelActive: { color: '#fff' },
    statTabCount: { fontSize: 11, color: C.textHint, marginTop: 2 },
    statTabCountActive: { color: 'rgba(255,255,255,0.8)' },
    proposalCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    providerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    providerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    providerAvatarText: { fontSize: 16, fontWeight: '600', color: C.primary },
    providerDetails: { flex: 1 },
    providerName: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    providerHeadline: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    providerLocation: { fontSize: 11, color: C.textHint },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    bidSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bidLabel: { fontSize: 12, color: C.textHint },
    bidAmount: { fontSize: 16, fontWeight: '700', color: C.primary },
    timelineLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 8 },
    coverLetterPreview: { backgroundColor: C.inputBg, borderRadius: 8, padding: 12, marginBottom: 12 },
    coverLetterText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.success },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.error },
    actionBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 96, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
    loadingMoreText: { fontSize: 13, color: C.textHint },
  });