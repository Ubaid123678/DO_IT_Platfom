import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
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

import JobCard from '@/src/components/job/JobCard';
import { Colors, type AppColors } from '@/src/theme/colors';

type UserState = {
  name: string;
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

const defaultJobs: ActiveJob[] = [
  {
    id: 'job-1',
    title: 'Need AC servicing at home',
    category: 'Repair',
    budget: '$45.00',
    status: 'In Progress',
  },
  {
    id: 'job-2',
    title: 'Logo and social banner design',
    category: 'Design',
    budget: '$80.00',
    status: 'Open',
  },
  {
    id: 'job-3',
    title: 'Airport pickup service tomorrow',
    category: 'Transport',
    budget: '$30.00',
    status: 'Open',
  },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState>({ name: 'Ubaid' });
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [categories, setCategories] = useState<CategoryChip[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser({ name: 'Ubaid' });
      setUnreadCount(2);
      setActiveJobs(defaultJobs);
      setCategories(defaultCategories);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const initials = useMemo(() => {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user.name]);

  if (loading) {
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
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <View style={styles.greetingWrap}>
              <Text style={styles.greetingLabel}>Good Morning,</Text>
              <Text style={styles.greetingName}>{user.name}</Text>
            </View>
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
