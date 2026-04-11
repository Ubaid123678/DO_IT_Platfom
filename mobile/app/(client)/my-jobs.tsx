import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StarRating from '@/src/components/common/StarRating';
import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import { Colors, type AppColors } from '@/src/theme/colors';

type JobStatus = 'open' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
type TabKey = 'all' | JobStatus;

type JobItem = {
  id: string;
  title: string;
  category: string;
  status: JobStatus;
  location: string;
  deadline: string;
  budget: number;
  proposalsCount: number;
  providerName?: string;
  providerRating?: number;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const mockJobs: JobItem[] = [
  {
    id: 'j-1001',
    title: 'Need airport drop tomorrow at 8AM',
    category: 'Transport',
    status: 'open',
    location: 'DHA Phase 6, Lahore',
    deadline: 'Apr 14, 8:00 AM',
    budget: 30,
    proposalsCount: 4,
  },
  {
    id: 'j-1002',
    title: 'Deep cleaning for 2-bedroom apartment',
    category: 'Cleaning',
    status: 'in_progress',
    location: 'Bahria Town, Lahore',
    deadline: 'Apr 15, 5:00 PM',
    budget: 55,
    proposalsCount: 7,
    providerName: 'Ahsan R.',
    providerRating: 4,
  },
  {
    id: 'j-1003',
    title: 'Modern logo and social media kit design',
    category: 'Design',
    status: 'completed',
    location: 'Remote',
    deadline: 'Apr 10, 11:59 PM',
    budget: 120,
    proposalsCount: 11,
    providerName: 'Sara K.',
    providerRating: 5,
  },
  {
    id: 'j-1004',
    title: 'Urgent package delivery to office',
    category: 'Delivery',
    status: 'disputed',
    location: 'Gulberg, Lahore',
    deadline: 'Apr 13, 2:00 PM',
    budget: 20,
    proposalsCount: 3,
  },
  {
    id: 'j-1005',
    title: 'Assemble home office desk and chair',
    category: 'Repair',
    status: 'cancelled',
    location: 'Model Town, Lahore',
    deadline: 'Apr 12, 6:00 PM',
    budget: 25,
    proposalsCount: 2,
  },
];

const categoryIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Transport: 'car-outline',
  Cleaning: 'sparkles-outline',
  Delivery: 'cube-outline',
  Repair: 'build-outline',
  Design: 'color-palette-outline',
  Digital: 'laptop-outline',
  Writing: 'create-outline',
  Teaching: 'book-outline',
};

export default function MyJobsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') {
      return jobs;
    }

    return jobs.filter((job) => job.status === activeTab);
  }, [activeTab, jobs]);

  const emptySubtitle =
    activeTab === 'all' || activeTab === 'open'
      ? 'Start by posting a new job to receive proposals.'
      : `No jobs found in ${tabs.find((tab) => tab.key === activeTab)?.label ?? 'this'} tab.`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const categoryIcon = categoryIconMap[item.category] ?? 'briefcase-outline';
            const showProviderRow = item.status === 'in_progress' || item.status === 'completed';

            return (
              <TouchableOpacity
                style={styles.jobCard}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/job-detail/[id]',
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.categoryRow}>
                    <Ionicons name={categoryIcon} size={18} color={C.primary} />
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <JobStatusBadge status={item.status} />
                </View>

                <Text style={styles.jobTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={C.textHint} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={C.textHint} />
                    <Text style={styles.metaText}>{item.deadline}</Text>
                  </View>
                </View>

                <Text style={styles.budgetText}>{`$${item.budget.toFixed(2)}`}</Text>

                {showProviderRow ? (
                  <View style={styles.providerRow}>
                    <View style={styles.providerAvatar}>
                      <Text style={styles.providerAvatarText}>
                        {item.providerName?.slice(0, 1).toUpperCase() ?? 'P'}
                      </Text>
                    </View>
                    <Text style={styles.providerName}>{item.providerName ?? 'Assigned Provider'}</Text>
                    <StarRating rating={item.providerRating ?? 0} size={12} />
                  </View>
                ) : null}

                <View style={styles.cardBottomRow}>
                  {item.status === 'open' ? (
                    <View style={styles.proposalsBadge}>
                      <Text style={styles.proposalsText}>{`${item.proposalsCount} Proposals`}</Text>
                    </View>
                  ) : item.status === 'in_progress' ? (
                    <Text style={styles.inProgressText}>In Progress</Text>
                  ) : (
                    <View />
                  )}

                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={36} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
              {activeTab === 'all' || activeTab === 'open' ? (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => router.push('/(client)/post-job')}
                >
                  <Text style={styles.emptyActionText}>Post a Job</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(client)/post-job')}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    tabsScroll: {
      backgroundColor: C.card,
      borderBottomWidth: 0.5,
      borderBottomColor: C.navBorder,
    },
    tabsContent: {
      paddingHorizontal: 8,
    },
    tabItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0,
      borderBottomColor: C.primary,
    },
    tabItemActive: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 13,
    },
    tabTextActive: {
      fontWeight: '600',
      color: C.primary,
    },
    tabTextInactive: {
      fontWeight: '400',
      color: C.textSecondary,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 100,
    },
    separator: {
      height: 12,
    },
    jobCard: {
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
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    categoryText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    jobTitle: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    metaRow: {
      marginTop: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    budgetText: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    providerRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    providerAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    providerAvatarText: {
      color: C.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    providerName: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
      marginRight: 4,
    },
    cardBottomRow: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.divider,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    proposalsBadge: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: C.primaryLight,
    },
    proposalsText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    inProgressText: {
      fontSize: 12,
      color: C.amber,
      fontWeight: '500',
    },
    viewButton: {
      height: 36,
      borderRadius: 8,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    viewButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyWrap: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '600',
      color: C.textPrimary,
    },
    emptySubtitle: {
      marginTop: 6,
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyActionButton: {
      marginTop: 20,
      height: 44,
      borderRadius: 12,
      backgroundColor: C.primary,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyActionText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
