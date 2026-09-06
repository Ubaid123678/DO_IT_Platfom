import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { proposalService, type Proposal, type ProposalStatus, type ProposalListResponse } from '@/src/services/proposalService';
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

export default function MyProposalsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProposalStatus | 'all'>('all');

  const loadProposals = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setProposals([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await proposalService.getProviderProposals({
        status: activeTab === 'all' ? undefined : activeTab,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setProposals(result.proposals);
      } else {
        setProposals((prev) => [...prev, ...result.proposals]);
      }
      setTotal(result.total);
      setHasMore(result.proposals.length === 20);
      setSkip(currentSkip + result.proposals.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load proposals';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, skip, hasMore]);

  useEffect(() => {
    loadProposals(true);
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProposals(true);
  }, [loadProposals]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadProposals(false);
    }
  }, [loadingMore, hasMore, loadProposals]);

  const renderProposal = ({ item }: { item: Proposal }) => (
    <TouchableOpacity style={styles.proposalCard} onPress={() => router.push(`/proposal-detail/${item._id}` as any)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.job?.title || 'Job'}</Text>
          <View style={styles.jobMeta}>
            {item.job?.type && (
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={12} color={C.textHint} />
                <Text style={styles.metaText}>{item.job.type}</Text>
              </View>
            )}
            {item.job?.location?.city && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color={C.textHint} />
                <Text style={styles.metaText}>{item.job.location.city}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.bidSection}>
        <Text style={styles.bidLabel}>Your Bid</Text>
        <Text style={styles.bidAmount}>
          {item.bidType === 'hourly'
            ? `$${(item.bidAmount / 100).toFixed(2)}/hr${item.estimatedHours ? ` × ${item.estimatedHours}hrs` : ''} = ${formatCurrency(item.bidTotal || item.bidAmount)}`
            : formatCurrency(item.bidAmount)}
        </Text>
      </View>

      <Text style={styles.timelineLabel}>Timeline: {item.estimatedTimeline}</Text>

      <View style={styles.coverLetterPreview}>
        <Text style={styles.coverLetterText}>{item.coverLetter.substring(0, 100)}...</Text>
      </View>

      {item.status === 'submitted' && (
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdraw(item._id)}>
          <Ionicons name="arrow-back-circle-outline" size={16} color="#fff" />
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const handleWithdraw = async (proposalId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Withdraw Proposal',
        'Are you sure you want to withdraw this proposal?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Withdraw', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      await proposalService.withdrawProposal(proposalId);
      Alert.alert('Success', 'Proposal withdrawn.');
      loadProposals(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to withdraw proposal';
      Alert.alert('Error', msg);
    }
  };

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
        <Text style={styles.headerTitle}>My Proposals</Text>
      </View>

      {/* Stats Tabs */}
      <ScrollView horizontal contentContainerStyle={styles.statsContainer} showsHorizontalScrollIndicator={false}>
        {(['all', 'submitted', 'accepted', 'rejected', 'withdrawn'] as const).map((status) => {
          const count = status === 'all' ? total : 0; // We don't have stats per status yet
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
                {activeTab === 'all' ? 'Your submitted proposals will appear here' : `No ${getTabLabel(activeTab).toLowerCase()} proposals`}
              </Text>
            </View>
          ) : null
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}
    </SafeAreaViewCompat>
  );
}

const onRefresh = () => {};
const onEndReached = () => {};

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
    statsContainer: { paddingHorizontal: 20, gap: 8, marginVertical: 8 },
    statTab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      minWidth: 80,
      alignItems: 'center',
    },
    statTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    statTabLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    statTabLabelActive: { color: '#fff' },
    statTabCount: { fontSize: 11, color: C.textHint, marginTop: 2 },
    statTabCountActive: { color: 'rgba(255,255,255,0.8)' },
    proposalCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, marginHorizontal: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    jobInfo: { flex: 1 },
    jobTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: C.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    bidSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bidLabel: { fontSize: 12, color: C.textHint },
    bidAmount: { fontSize: 16, fontWeight: '700', color: C.primary },
    timelineLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 8 },
    coverLetterPreview: { backgroundColor: C.inputBg, borderRadius: 8, padding: 12, marginBottom: 12 },
    coverLetterText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
    withdrawBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: C.warning,
    },
    withdrawBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
    loadingMoreText: { fontSize: 13, color: C.textHint },
  });