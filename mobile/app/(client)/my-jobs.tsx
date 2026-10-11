import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { jobService, type Job, type JobStatus } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  resolved: 'Resolved',
};

const JOB_TYPE_LABELS: Record<Job['type'], string> = {
  physical: 'Physical',
  digital: 'Digital',
  errand: 'Errand',
};

const formatBudget = (budget: Job['budget']): string => {
  const amount = budget.amount / 100;
  if (budget.type === 'hourly') {
    return `$${amount.toFixed(2)}/${budget.hourlyRate}/hr`;
  }
  return `$${amount.toFixed(2)} fixed`;
};

const getStatusColor = (status: JobStatus, C: AppColors): string => {
  switch (status) {
    case 'open':
      return C.success;
    case 'in_progress':
      return C.primary;
    case 'completed':
      return C.success;
    case 'cancelled':
      return C.error;
    case 'disputed':
      return C.warning;
    case 'resolved':
      return C.textSecondary;
    default:
      return C.textSecondary;
  }
};

export default function MyJobsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
  const [stats, setStats] = useState<Record<JobStatus, number>>({
    open: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    disputed: 0,
    resolved: 0,
  });

  const loadJobs = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setJobs([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await jobService.getClientJobs({
        status: activeTab === 'all' ? undefined : activeTab,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setJobs(result.jobs);
      } else {
        setJobs((prev) => [...prev, ...result.jobs]);
      }
      setTotal(result.total);
      setHasMore(result.jobs.length === 20);
      setSkip(currentSkip + result.jobs.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load jobs';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, skip, hasMore]);

  const loadStats = useCallback(async () => {
    try {
      const data = await jobService.getJobStats();
      setStats(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadJobs(true);
    loadStats();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs(true);
    loadStats();
  }, [loadJobs, loadStats]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadJobs(false);
    }
  }, [loadingMore, hasMore, loadJobs]);

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.jobCard} onPress={() => router.push(`/job-detail/${item._id}`)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadgeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: item.type === 'physical' ? C.primary : item.type === 'digital' ? '#6C5CE7' : '#E17055' }]}>
            <Text style={styles.typeBadgeText}>{JOB_TYPE_LABELS[item.type]}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, C) }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>

      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={16} color={C.textSecondary} />
          <Text style={styles.metaText}>{formatBudget(item.budget)}</Text>
        </View>
        {item.location.city && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={C.textSecondary} />
            <Text style={styles.metaText}>{item.location.city}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color={C.textSecondary} />
          <Text style={styles.metaText}>{item.metadata.applicationsCount} applicants</Text>
        </View>
      </View>

      {item.provider.providerId && (
        <View style={styles.providerInfo}>
          <Text style={styles.providerLabel}>Assigned Provider</Text>
          <View style={styles.providerRow}>
            <View style={styles.providerAvatar}>
              {item.provider.providerAvatar ? (
                <Text style={styles.providerAvatarText}>{item.provider.providerName?.[0] || 'P'}</Text>
              ) : (
                <Text style={styles.providerAvatarText}>{item.provider.providerName?.[0] || 'P'}</Text>
              )}
            </View>
            <Text style={styles.providerName}>{item.provider.providerName || 'Provider'}</Text>
          </View>
        </View>
      )}

      {item.status === 'open' && item.metadata.applicationsCount > 0 && (
        <TouchableOpacity style={styles.viewApplicantsBtn} onPress={() => router.push(`/job-detail/${item._id}`)}>
          <Ionicons name="people-outline" size={16} color={C.primary} />
          <Text style={styles.viewApplicantsText}>View Details ({item.metadata.applicationsCount} applicants)</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const getTabLabel = (status: JobStatus | 'all') => {
    if (status === 'all') return 'All';
    return STATUS_LABELS[status];
  };

  const tabs: (JobStatus | 'all')[] = ['all', 'open', 'in_progress', 'completed', 'cancelled'];

  if (loading && jobs.length === 0) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaViewCompat>
    );
  }

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/post-job')}>
          <Ionicons name="add-circle-outline" size={28} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <ScrollView horizontal contentContainerStyle={styles.statsContainer} showsHorizontalScrollIndicator={false}>
        {(['all', 'open', 'in_progress', 'completed', 'cancelled'] as const).map((status) => {
          const count = status === 'all' ? total : stats[status] || 0;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.statTab,
                activeTab === status && styles.statTabActive,
              ]}
              onPress={() => setActiveTab(status)}
            >
              <Text style={[styles.statTabLabel, activeTab === status && styles.statTabLabelActive]}>{getTabLabel(status)}</Text>
              <Text style={[styles.statTabCount, activeTab === status && styles.statTabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
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
              <Ionicons name="briefcase-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'Create your first job to get started' : `No ${getTabLabel(activeTab).toLowerCase()} jobs`}
              </Text>
              {activeTab === 'all' && (
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/post-job')}>
                  <Text style={styles.emptyActionText}>Post a Job</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      )}
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    jobCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, marginHorizontal: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    typeBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    jobTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
    providerInfo: { paddingTop: 8, borderTopWidth: 1, borderTopColor: C.divider, marginTop: 8 },
    providerLabel: { fontSize: 11, color: C.textHint, marginBottom: 6 },
    providerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    providerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    providerAvatarText: { fontSize: 12, fontWeight: '600', color: C.primary },
    providerName: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
    viewApplicantsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary },
    viewApplicantsText: { fontSize: 12, fontWeight: '600', color: C.primary },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    emptyActionBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.primary, borderRadius: 12 },
    emptyActionText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
  });