import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import JobCard from '@/src/components/job/JobCard';
import { Colors, type AppColors } from '@/src/theme/colors';
import { authService } from '@/src/services/authService';
import { walletService } from '@/src/services/walletService';
import { jobService } from '@/src/services/jobService';

type UserState = {
  name: string;
  avatarUrl?: string;
  email: string;
  memberSince?: string;
  profileCompleteness?: number;
  missingFields?: string[];
};

type ActiveJob = {
  id: string;
  title: string;
  category: string;
  budget: string;
  status: string;
};

type CategoryChip = {
  emoji: string;
  label: string;
};

const defaultCategories: CategoryChip[] = [
  { emoji: '🚗', label: 'Transport' },
  { emoji: '🧹', label: 'Cleaning' },
  { emoji: '📦', label: 'Delivery' },
  { emoji: '🔧', label: 'Repair' },
  { emoji: '💻', label: 'Digital' },
  { emoji: '✏️', label: 'Design' },
  { emoji: '📸', label: 'Photography' },
  { emoji: '📚', label: 'Teaching' },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState | null>(null);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [categories, setCategories] = useState<CategoryChip[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [userRes, walletRes, jobStatsRes, myJobsRes] = await Promise.allSettled([
          authService.getMe(),
          walletService.getWalletStats(),
          jobService.getProviderJobStats(),
          jobService.getClientJobs({ limit: 5 }),
        ]);

        if (userRes.status === 'fulfilled') {
          const responseData = userRes.value.data as unknown as {
            user?: { fullName?: string; avatar_url?: string; email?: string; createdAt?: string };
            data?: { user?: { fullName?: string; avatar_url?: string; email?: string; createdAt?: string } };
          };
          const cachedUser = await AsyncStorage.getItem('user');
          const userData = responseData.data?.user ?? responseData.user ?? (cachedUser ? JSON.parse(cachedUser) : null);

          if (userData) {
            setUser({
              name: userData.fullName ?? 'User',
              avatarUrl: userData.avatar_url,
              email: userData.email ?? '',
              memberSince: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'New',
              profileCompleteness: 0,
              missingFields: [],
            });
          }
        }

        if (walletRes.status === 'fulfilled') {
          // Wallet data loaded
        }

        if (jobStatsRes.status === 'fulfilled') {
          // Job stats loaded
        }

        if (myJobsRes.status === 'fulfilled') {
          const jobs = myJobsRes.value.jobs || [];
          setActiveJobs(jobs.map((job: any) => ({
            id: job._id,
            title: job.title,
            category: job.requirements?.categories?.[0]?.name || 'General',
            budget: job.budget?.amount ? `$${(job.budget.amount / 100).toFixed(2)}` : '$0.00',
            status: job.status,
          })));
        }
      } catch (e) {
        console.error('[ClientHome] Load error:', e);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user?.name]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.profileTrigger}
            onPress={() => router.push('/(client)/profile')}
            activeOpacity={0.9}
          >
            <View style={styles.avatarCircle}>
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>

            <View style={styles.greetingWrap}>
              <Text style={styles.greetingLabel}>{greeting},</Text>
              <Text style={styles.greetingName}>{user.name}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/(onboarding)/client-profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={20} color={C.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationTrigger}
            onPress={() => router.push('/(shared)/notifications')}
            activeOpacity={0.9}
          >
            <Ionicons name="notifications-outline" size={26} color={C.textPrimary} />
            {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>$240.00</Text>
          <Text style={styles.walletConverted}>≈ PKR 66,840</Text>

          <View style={styles.walletActionsRow}>
            <TouchableOpacity
              style={styles.walletActionPrimary}
              onPress={() => router.push('/(client)/wallet-topup')}
            >
              <Text style={styles.walletActionText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.walletActionSecondary}
              onPress={() => router.push('/(client)/wallet-withdraw')}
            >
              <Text style={styles.walletActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(client)/post-job')}>
              <View style={styles.quickActionIconBox}>
                <Ionicons name="add-circle" size={24} color={C.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Post Job</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(client)/my-jobs')}>
              <View style={styles.quickActionIconBox}>
                <Ionicons name="briefcase" size={24} color={C.primary} />
              </View>
              <Text style={styles.quickActionLabel}>My Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => router.push(activeJobs[0] ? `/(client)/job-proposals/${activeJobs[0].id}` : '/(client)/my-jobs')}
            >
              <View style={styles.quickActionIconBox}>
                <Ionicons name="document-text" size={24} color={C.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Proposals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(client)/messages')}>
              <View style={styles.quickActionIconBox}>
                <Ionicons name="chatbubbles" size={24} color={C.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(client)/wallet')}>
              <View style={styles.quickActionIconBox}>
                <Ionicons name="wallet" size={24} color={C.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(client)/my-jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.length === 0 ? (
            <View style={styles.emptyJobsBox}>
              <Ionicons name="briefcase-outline" size={32} color={C.textHint} />
              <Text style={styles.emptyJobsText}>No active jobs yet</Text>
              <TouchableOpacity onPress={() => router.push('/(client)/post-job')}>
                <Text style={styles.emptyJobsAction}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jobsHorizontalList}
            >
              {activeJobs.map((job) => (
                <JobCard
                  key={job.id}
                  title={job.title}
                  category={job.category}
                  budget={job.budget}
                  status={job.status}
                  style={styles.jobCardItem}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((category) => (
              <TouchableOpacity key={category.label} style={styles.categoryChip}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
      justifyContent: 'space-between',
    },
    profileTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
    },
    greetingWrap: {
      marginLeft: 10,
    },
    greetingLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },
    greetingName: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
      marginTop: 2,
    },
    editProfileBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationTrigger: {
      position: 'relative',
      padding: 6,
    },
    unreadDot: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.amber,
    },
    walletCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    walletLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 4,
    },
    walletAmount: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
    },
    walletConverted: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 2,
    },
    walletActionsRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    walletActionPrimary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionSecondary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    sectionWrap: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 12,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      width: 72,
      alignItems: 'center',
    },
    quickActionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      marginTop: 6,
      fontSize: 10,
      fontWeight: '500',
      color: C.textSecondary,
      textAlign: 'center',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    seeAllText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    emptyJobsBox: {
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyJobsText: {
      marginTop: 8,
      color: C.textSecondary,
      fontSize: 13,
    },
    emptyJobsAction: {
      marginTop: 12,
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    jobsHorizontalList: {
      paddingRight: 10,
      gap: 12,
    },
    jobCardItem: {
      width: 200,
    },
    categoriesList: {
      gap: 8,
      paddingRight: 8,
    },
    categoryChip: {
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryEmoji: {
      fontSize: 14,
    },
    categoryLabel: {
      fontSize: 12,
      color: C.textPrimary,
      fontWeight: '500',
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
      justifyContent: 'space-between',
    },
    profileTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
    },
    greetingWrap: {
      marginLeft: 10,
    },
    greetingLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },
    greetingName: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
      marginTop: 2,
    },
    notificationTrigger: {
      position: 'relative',
      padding: 6,
    },
    unreadDot: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.amber,
    },
    walletCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    walletLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 4,
    },
    walletAmount: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
    },
    walletConverted: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 2,
    },
    walletActionsRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    walletActionPrimary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionSecondary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    sectionWrap: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 12,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      width: 72,
      alignItems: 'center',
    },
    quickActionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      marginTop: 6,
      fontSize: 10,
      fontWeight: '500',
      color: C.textSecondary,
      textAlign: 'center',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    seeAllText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    emptyJobsBox: {
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyJobsText: {
      marginTop: 8,
      color: C.textSecondary,
      fontSize: 13,
    },
    emptyJobsAction: {
      marginTop: 12,
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    jobsHorizontalList: {
      paddingRight: 10,
      gap: 12,
    },
    jobCardItem: {
      width: 200,
    },
    categoriesList: {
      gap: 8,
      paddingRight: 8,
    },
    categoryChip: {
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryEmoji: {
      fontSize: 14,
    },
    categoryLabel: {
      fontSize: 12,
      color: C.textPrimary,
      fontWeight: '500',
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
      justifyContent: 'space-between',
    },
    profileTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarInitials: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
    },
    greetingWrap: {
      marginLeft: 10,
    },
    greetingLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },
    greetingName: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
      marginTop: 2,
    },
    notificationTrigger: {
      position: 'relative',
      padding: 6,
    },
    unreadDot: {
      position: 'absolute',
      top: 3,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.amber,
    },
    walletCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    walletLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 4,
    },
    walletAmount: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
    },
    walletConverted: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 2,
    },
    walletActionsRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    walletActionPrimary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionSecondary: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletActionText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    sectionWrap: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      marginBottom: 12,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      width: 72,
      alignItems: 'center',
    },
    quickActionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      marginTop: 6,
      fontSize: 10,
      fontWeight: '500',
      color: C.textSecondary,
      textAlign: 'center',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    seeAllText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    emptyJobsBox: {
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyJobsText: {
      marginTop: 8,
      color: C.textSecondary,
      fontSize: 13,
    },
    emptyJobsAction: {
      marginTop: 12,
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    jobsHorizontalList: {
      paddingRight: 10,
      gap: 12,
    },
    jobCardItem: {
      width: 200,
    },
    categoriesList: {
      gap: 8,
      paddingRight: 8,
    },
    categoryChip: {
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryEmoji: {
      fontSize: 14,
    },
    categoryLabel: {
      fontSize: 12,
      color: C.textPrimary,
      fontWeight: '500',
    },
  });