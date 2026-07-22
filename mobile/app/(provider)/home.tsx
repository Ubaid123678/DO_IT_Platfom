import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import { kycService } from '@/src/services/kycService';
import { Colors, type AppColors } from '@/src/theme/colors';

type UserState = {
  name: string;
};

type KycStatus = 'approved' | 'pending' | 'not_started' | 'missing' | 'rejected';

type NearbyJob = {
  id: string;
  title: string;
  budget: number;
  distance: string;
};

type EarningsState = {
  total: number;
  pkr: string;
  pendingClearance: number;
};

type StatsState = {
  activeJobs: number;
  proposals: number;
  completed: number;
  rating: number;
};

const defaultNearbyJobs: NearbyJob[] = [
  {
    id: 'pj-1',
    title: 'Need same-day grocery pickup and delivery',
    budget: 32,
    distance: '1.8 km',
  },
  {
    id: 'pj-2',
    title: 'Home AC filter cleaning and tune-up',
    budget: 55,
    distance: '3.2 km',
  },
  {
    id: 'pj-3',
    title: 'Urgent office document drop service',
    budget: 22,
    distance: '2.5 km',
  },
];

const quickActions = [
  {
    icon: 'search-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Browse Jobs',
    route: '/(provider)/browse-jobs' as const,
  },
  {
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Proposals',
    route: '/(provider)/proposals' as const,
  },
  {
    icon: 'wallet-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Earnings',
    route: '/(provider)/earnings' as const,
  },
  {
    icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Profile',
    route: '/(provider)/profile' as const,
  },
];

export default function ProviderHomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState>({ name: 'Ubaid' });
  const [kycStatus, setKycStatus] = useState<KycStatus>('pending');
  const [isOnline, setIsOnline] = useState(true);
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [earnings, setEarnings] = useState<EarningsState>({
    total: 3450,
    pkr: '962,325',
    pendingClearance: 120,
  });
  const [stats, setStats] = useState<StatsState>({
    activeJobs: 5,
    proposals: 14,
    completed: 38,
    rating: 4.8,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      setUser({ name: 'Ubaid' });
      setNearbyJobs(defaultNearbyJobs);
      setEarnings({
        total: 3450,
        pkr: '962,325',
        pendingClearance: 120,
      });
      setStats({
        activeJobs: 5,
        proposals: 14,
        completed: 38,
        rating: 4.8,
      });
      try {
        const status = await kycService.getProviderStatus();
        setKycStatus(status.status);
      } catch {
        setKycStatus('pending');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void bootstrap();
    }, 350);

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
          <ActivityIndicator size="large" color={C.primary} />
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
            onPress={() => router.push('/(provider)/profile')}
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
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>

        {kycStatus !== 'approved' ? (
          <View style={styles.kycBanner}>
            <Ionicons name="warning" size={22} color={C.amber} />

            <View style={styles.kycTextWrap}>
              <Text style={styles.kycTitle}>Complete KYC Verification</Text>
              <Text style={styles.kycSubtitle}>Verify your identity to unlock all features</Text>
            </View>

            <TouchableOpacity style={styles.verifyButton} onPress={() => router.push('/(provider)/kyc')}>
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>{`$${earnings.total.toFixed(2)}`}</Text>
          <Text style={styles.earningsPkr}>{`≈ PKR ${earnings.pkr}`}</Text>

          <View style={styles.earningsActionsRow}>
            <TouchableOpacity style={styles.earningsActionButton} onPress={() => router.push('/(provider)/earnings')}>
              <Text style={styles.earningsActionText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.earningsActionButton} onPress={() => router.push('/(provider)/earnings')}>
              <Text style={styles.earningsActionText}>View Details</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pendingText}>{`Pending clearance: $${earnings.pendingClearance.toFixed(2)}`}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="briefcase-outline" size={20} color={C.primary} />
              <View>
                <Text style={styles.statValue}>{stats.activeJobs}</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="document-text-outline" size={20} color={C.primary} />
              <View>
                <Text style={styles.statValue}>{stats.proposals}</Text>
                <Text style={styles.statLabel}>Proposals</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={C.success} />
              <View>
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="star-outline" size={20} color={C.amber} />
              <View>
                <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.label} style={styles.quickActionItem} onPress={() => router.push(action.route)}>
                <View style={styles.quickActionIconBox}>
                  <Ionicons name={action.icon} size={24} color={C.primary} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <View style={styles.availabilityTextWrap}>
            <Text style={styles.availabilityTitle}>Availability</Text>
            <Text style={[styles.availabilitySubtitle, { color: isOnline ? C.success : C.textHint }]}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
          </View>

          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: C.cardBorder, true: C.primary }}
            thumbColor="white"
          />
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Jobs Near You</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/browse-jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyList}>
            {nearbyJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.nearbyCard}
                onPress={() =>
                  router.push({
                    pathname: '/(provider)/job-detail/[id]',
                    params: { id: job.id },
                  })
                }
              >
                <JobStatusBadge status="open" />
                <Text style={styles.nearbyTitle} numberOfLines={2}>
                  {job.title}
                </Text>
                <Text style={styles.nearbyBudget}>{`$${job.budget.toFixed(0)}`}</Text>

                <View style={styles.nearbyBottomRow}>
                  <Text style={styles.nearbyDistance}>{job.distance}</Text>
                  <TouchableOpacity style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
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
      marginBottom: 16,
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
      fontWeight: '400',
    },
    greetingName: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      lineHeight: 22,
    },
    notificationTrigger: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.error,
      position: 'absolute',
      top: 8,
      right: 8,
    },
    kycBanner: {
      marginBottom: 16,
      backgroundColor: C.amberLight,
      borderWidth: 1,
      borderColor: C.amber,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    kycTextWrap: {
      flex: 1,
    },
    kycTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    kycSubtitle: {
      fontSize: 12,
      color: C.textSecondary,
      marginTop: 1,
    },
    verifyButton: {
      backgroundColor: C.amber,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifyButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
    },
    earningsCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    earningsLabel: {
      fontSize: 12,
      color: 'white',
      opacity: 0.7,
    },
    earningsAmount: {
      fontSize: 30,
      fontWeight: '800',
      color: 'white',
    },
    earningsPkr: {
      fontSize: 13,
      color: 'white',
      opacity: 0.6,
      marginTop: 1,
    },
    earningsActionsRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 10,
    },
    earningsActionButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    earningsActionText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    pendingText: {
      marginTop: 8,
      fontSize: 11,
      color: 'white',
      opacity: 0.5,
    },
    statsGrid: {
      marginBottom: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    statCard: {
      width: '48%',
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      lineHeight: 24,
    },
    statLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },
    sectionWrap: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 10,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      alignItems: 'center',
      width: '23%',
    },
    quickActionIconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      marginBottom: 6,
    },
    quickActionLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: C.textPrimary,
      textAlign: 'center',
    },
    availabilityCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    availabilityTextWrap: {
      flex: 1,
    },
    availabilityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    availabilitySubtitle: {
      marginTop: 2,
      fontSize: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    nearbyList: {
      gap: 12,
      paddingRight: 4,
    },
    nearbyCard: {
      width: 200,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderLeftWidth: 3,
      borderLeftColor: C.primary,
      padding: 14,
    },
    nearbyTitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
      lineHeight: 20,
    },
    nearbyBudget: {
      marginTop: 6,
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    nearbyBottomRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    nearbyDistance: {
      fontSize: 12,
      color: C.textSecondary,
      flex: 1,
    },
    applyButton: {
      backgroundColor: C.amber,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: 'white',
    },
  });
