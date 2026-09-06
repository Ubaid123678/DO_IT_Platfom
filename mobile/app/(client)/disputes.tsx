import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { disputeService, type IDispute, type DisputeStatus, type IDisputeStats } from '@/src/services/disputeService';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: 'Open',
  evidence_submitted: 'Evidence Submitted',
  under_review: 'Under Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<DisputeStatus, string> = {
  open: '#F39C12',
  evidence_submitted: '#3498DB',
  under_review: '#9B59B6',
  resolved: '#27AE60',
  closed: '#95A5A6',
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DisputeListScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [disputes, setDisputes] = useState<IDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed'>('all');
  const [stats, setStats] = useState<IDisputeStats | null>(null);

  const loadDisputes = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setDisputes([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await disputeService.getMyDisputes({
        status: activeTab === 'all' ? undefined : activeTab,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setDisputes(result.disputes);
      } else {
        setDisputes((prev) => [...prev, ...result.disputes]);
      }
      setTotal(result.total);
      setHasMore(result.disputes.length === 20);
      setSkip(currentSkip + result.disputes.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load disputes';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, skip, hasMore]);

  const loadStats = useCallback(async () => {
    try {
      const data = await disputeService.getDisputeStats();
      setStats(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadDisputes(true);
    loadStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDisputes(true);
  }, [loadDisputes]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadDisputes(false);
    }
  }, [loadingMore, hasMore, loadDisputes]);

  const renderDispute = ({ item }: { item: IDispute }) => (
    <TouchableOpacity style={styles.disputeCard} onPress={() => router.push(`/dispute-detail/${item._id}`)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.jobId}</Text>
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={12} color={C.textHint} />
              <Text style={styles.metaText}>Job</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={C.textHint} />
              <Text style={styles.metaText}>{formatDate(item.openedAt)}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.reasonSection}>
        <Text style={styles.reasonLabel}>Reason</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      {item.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}

      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
        <Text style={styles.deadlineText}>Evidence deadline: {formatDate(item.evidenceDeadline)}</Text>
      </View>

      {item.evidence.length > 0 && (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceLabel}>Evidence ({item.evidence.length})</Text>
          <View style={styles.evidenceList}>
            {item.evidence.slice(0, 3).map((ev, idx) => (
              <View key={idx} style={styles.evidenceItem}>
                <Ionicons name={getEvidenceIcon(ev.type)} size={16} color={C.primary} />
                <View style={styles.evidenceInfo}>
                  <Text style={styles.evidenceType}>{getEvidenceLabel(ev.type)}</Text>
                  <Text style={styles.evidenceTime}>{formatDate(ev.submittedAt)}</Text>
                </View>
              </View>
            ))}
            {item.evidence.length > 3 && (
              <Text style={styles.evidenceMore}>+{item.evidence.length - 3} more</Text>
            )}
          </View>
        </View>
      )}

      {item.verdict && (
        <View style={styles.verdictSection}>
          <Text style={styles.verdictLabel}>Verdict</Text>
          <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(item.verdict?.verdict) }]}>
            <Text style={styles.verdictBadgeText}>{getVerdictLabel(item.verdict?.verdict)}</Text>
          </View>
          <Text style={styles.resolutionText}>Resolution: {getResolutionLabel(item.verdict?.resolution)}</Text>
          {item.verdict?.reasoning && (
            <Text style={styles.verdictReasoning}>{item.verdict.reasoning}</Text>
          )}
        </View>
      )}

      {item.resolvedAt && (
        <Text style={styles.resolvedDate}>Resolved: {formatDate(item.resolvedAt)}</Text>
      )}
    </TouchableOpacity>
  );

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'document': return 'document-outline';
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'text': return 'document-text-outline';
      case 'link': return 'link-outline';
      default: return 'document-outline';
    }
  };

  const getEvidenceLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Document';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'text': return 'Text';
      case 'link': return 'Link';
      default: return type;
    }
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'client_wins': return '#27AE60';
      case 'provider_wins': return '#E74C3C';
      case 'split': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const getVerdictLabel = (verdict?: string) => {
    switch (verdict) {
      case 'client_wins': return 'Client Wins';
      case 'provider_wins': return 'Provider Wins';
      case 'split': return 'Split';
      default: return 'Unknown';
    }
  };

  const getResolutionLabel = (resolution?: string) => {
    switch (resolution) {
      case 'escrow_to_client': return 'Escrow to Client';
      case 'escrow_to_provider': return 'Escrow to Provider';
      case 'escrow_split': return 'Split';
      case 'escrow_refunded': return 'Refunded to Client';
      default: return 'Unknown';
    }
  };

  if (loading && disputes.length === 0) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading disputes...</Text>
        </View>
      </SafeAreaViewCompat>
    );
  }

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Disputes</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal contentContainerStyle={styles.statsContainer} showsHorizontalScrollIndicator={false}>
        {([
          { label: 'Open', value: stats?.open || 0, color: STATUS_COLORS.open },
          { label: 'Submitted', value: stats?.evidence_submitted || 0, color: STATUS_COLORS.evidence_submitted },
          { label: 'Under Review', value: stats?.under_review || 0, color: STATUS_COLORS.under_review },
          { label: 'Resolved', value: stats?.resolved || 0, color: STATUS_COLORS.resolved },
          { label: 'Closed', value: stats?.closed || 0, color: STATUS_COLORS.closed },
        ]).map((stat) => (
          <TouchableOpacity
            key={stat.label}
            style={[
              styles.statCard,
              activeTab === stat.label.toLowerCase().replace(' ', '_') && styles.statCardActive,
            ]}
            onPress={() => setActiveTab(stat.label.toLowerCase().replace(' ', '_') as any)}
          >
            <Text style={[styles.statLabel, activeTab === stat.label.toLowerCase().replace(' ', '_') && styles.statLabelActive]}>{stat.label}</Text>
            <Text style={[styles.statValue, activeTab === stat.label.toLowerCase().replace(' ', '_') && styles.statValueActive]}>{stat.value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={disputes}
        renderItem={renderDispute}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No disputes yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'Your disputes will appear here' : `No ${activeTab.replace('_', ' ')} disputes`}
              </Text>
            </View>
          )
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
    statCard: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      minWidth: 70,
      alignItems: 'center',
    },
    statLabel: { fontSize: 11, color: C.textHint, marginTop: 2 },
    statValue: { fontSize: 14, fontWeight: '700' },
    disputeCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, marginHorizontal: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    jobInfo: { flex: 1 },
    jobTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: C.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    reasonSection: { marginBottom: 12 },
    reasonLabel: { fontSize: 11, color: C.textHint, marginBottom: 4 },
    reasonText: { fontSize: 14, color: C.textPrimary },
    descriptionSection: { marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.divider },
    descriptionLabel: { fontSize: 11, color: C.textHint, marginBottom: 4 },
    descriptionText: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
    statusSection: { marginBottom: 12 },
    statusLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    deadlineText: { fontSize: 12, color: C.textHint },
    evidenceSection: { marginTop: 12 },
    evidenceLabel: { fontSize: 12, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
    evidenceList: { gap: 8 },
    evidenceItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    evidenceType: { fontSize: 12, fontWeight: '500', color: C.textPrimary },
    evidenceTime: { fontSize: 11, color: C.textHint },
    evidenceMore: { fontSize: 12, color: C.textHint, marginTop: 4, textAlign: 'right' },
    verdictSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider },
    verdictLabel: { fontSize: 12, color: C.textHint, marginBottom: 8 },
    verdictBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    verdictBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    resolutionText: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
    verdictReasoning: { fontSize: 12, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
    resolvedDate: { fontSize: 11, color: C.textHint, marginTop: 8, textAlign: 'right' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
    loadingMoreText: { fontSize: 13, color: C.textHint },
  });