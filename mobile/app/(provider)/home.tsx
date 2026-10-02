import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import { verificationService } from '@/src/services/verificationService';
import { walletService } from '@/src/services/walletService';
import { jobService } from '@/src/services/jobService';
import { proposalService } from '@/src/services/proposalService';
import { Colors, type AppColors } from '@/src/theme/colors';

type UserState = {
  name: string;
  avatarUrl: string | null;
  email: string;
};

type NearbyJob = {
  id: string;
  title: string;
  budget: number;
  distance?: string;
  category?: string;
  status: string;
};

type EarningsState = {
  totalUsd: number;
  totalPkr: string;
  pendingClearanceUsd: number;
  pendingClearancePkr: string;
};

type StatsState = {
  activeJobs: number;
  proposals: number;
  completed: number;
  rating: number;
};

type CategoryStatus = {
  category_id: string;
  category_name: string;
  status: string;
};

type VerificationBanner = {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  categories: CategoryStatus[];
} | null;

const SOCKET_URL = __DEV__ ? 'http://10.0.2.2:8080' : 'https://api.doitplatform.com';

export default function ProviderHomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState>({ name: '', avatarUrl: null, email: '' });
  const [isOnline, setIsOnline] = useState(true);
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [earnings, setEarnings] = useState<EarningsState>({
    totalUsd: 0,
    totalPkr: '0',
    pendingClearanceUsd: 0,
    pendingClearancePkr: '0',
  });
  const [stats, setStats] = useState<StatsState>({ activeJobs: 0, proposals: 0, completed: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [verifBanner, setVerifBanner] = useState<VerificationBanner>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [bannerShowCount, setBannerShowCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load persisted banner state on mount
  useEffect(() => {
    const loadBannerState = async () => {
      try {
        const [dismissed, count] = await Promise.all([
          AsyncStorage.getItem('@home_verif_banner_dismissed'),
          AsyncStorage.getItem('@home_verif_banner_show_count'),
        ]);
        if (dismissed === 'true') setDismissedBanner(true);
        if (count) setBannerShowCount(parseInt(count, 10));
      } catch {
        // ignore
      }
    };
    void loadBannerState();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const initials = useMemo(() => {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user.name]);

  // Initialize socket for real-time online status
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    newSocket.on('connect', () => {
      console.log('[Home] Socket connected');
    });
    newSocket.on('provider:online-status', (data: { providerId: string; isOnline: boolean }) => {
      if (data.providerId === user.email) {
        setIsOnline(data.isOnline);
      }
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user.email]);

  const loadData = useCallback(async () => {
    try {
      // Load user profile (includes avatar, name)
      const profileRes = await verificationService.getProfile();
      const pp = profileRes.provider_profile ?? {};
      setUser({
        name: ('fullName' in pp && typeof pp.fullName === 'string' ? pp.fullName : pp.headline) ?? 'Provider',
        avatarUrl: pp.avatar_url ?? null,
        email: 'email' in profileRes && typeof profileRes.email === 'string' ? profileRes.email : '',
      });

      // Load verification status for banner
      const status = await verificationService.getVerificationStatus();
      if (!dismissedBanner) {
        if (status.overall_status === 'verified') {
          setVerifBanner({ type: 'success', message: 'All categories verified! You can browse and apply for jobs.', categories: [] });
        } else if (status.overall_status === 'partially_verified') {
          const verifiedCats = (status.categories || []).filter(c => c.status === 'approved' || c.status === 'auto_approved').length;
          const totalCats = (status.categories || []).length;
          setVerifBanner({ type: 'warning', message: `${verifiedCats}/${totalCats} categories verified. Browse jobs in verified categories.`, categories: status.categories || [] });
        } else if (status.overall_status === 'rejected') {
          setVerifBanner({ type: 'error', message: 'Some verifications were rejected. Tap to review and resubmit.', categories: (status.categories || []).filter(c => c.status === 'rejected') });
        } else {
          setVerifBanner({ type: 'info', message: 'Complete skill verification to unlock all features.', categories: [] });
        }
      }

      // Load wallet/earnings
      try {
        const walletRes = await walletService.getWalletStats();
        const balanceUsd = walletRes.balance / 100; // cents to dollars
        const escrowUsd = walletRes.escrowBalance / 100;
        const availableUsd = walletRes.availableBalance / 100;

        // Fetch FX rate for PKR conversion (approximate)
        let usdToPkr = 279;
        try {
          const fxRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const fxData = await fxRes.json();
          usdToPkr = fxData.rates?.PKR ?? 279;
        } catch {
          // use fallback
        }

        const totalPkr = Math.round(balanceUsd * usdToPkr).toLocaleString();
        const pendingPkr = Math.round(escrowUsd * usdToPkr).toLocaleString();
        const pendingClearancePkr = pendingPkr;

        setEarnings({
          totalUsd: balanceUsd,
          totalPkr,
          pendingClearanceUsd: escrowUsd,
          pendingClearancePkr,
        });
      } catch (e: any) {
        // Wallet might not exist yet for new providers
        console.warn('[Home] Wallet stats fetch failed:', e?.response?.status || e?.message);
        setEarnings({ totalUsd: 0, totalPkr: '0', pendingClearanceUsd: 0, pendingClearancePkr: '0' });
      }

      // Load provider job stats
      const jobStats = await jobService.getProviderJobStats();
      // Load proposals count
      let proposalsCount = 0;
      try {
        const proposalsRes = await proposalService.getProviderProposals({ limit: 1 });
        proposalsCount = proposalsRes.total;
      } catch (e: any) {
        // Ignore 404 or other errors - proposals might not exist yet
        console.warn('[Home] Proposals fetch failed:', e?.response?.status || e?.message, e?.response?.data);
      }
      setStats({
        activeJobs: jobStats.in_progress + jobStats.open,
        proposals: proposalsCount,
        completed: jobStats.completed,
        rating: 4.8, // TODO: add rating API
      });

      // Load nearby jobs (browse with location filter)
      const jobsRes = await jobService.browseJobs({ limit: 10, status: 'open' });
      const mappedJobs: NearbyJob[] = (jobsRes.jobs || []).map((job: any) => ({
        id: job._id,
        title: job.title,
        budget: job.budget?.max ?? job.budget?.amount ?? 0,
        distance: job.location?.distance ? `${job.location.distance} km` : undefined,
        category: job.category_name,
        status: job.status,
      }));
      setNearbyJobs(mappedJobs);

    } catch (e: any) {
      console.error('[Home] Load error:', e?.message, 'Status:', e?.response?.status, 'URL:', e?.config?.url, 'Data:', e?.response?.data);
    } finally {
      setLoading(false);
    }
  }, [dismissedBanner]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadData(); }, 350);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDismissBanner = async () => {
    setDismissedBanner(true);
    setVerifBanner(null);
    try {
      await AsyncStorage.setItem('@home_verif_banner_dismissed', 'true');
      const newCount = bannerShowCount + 1;
      setBannerShowCount(newCount);
      await AsyncStorage.setItem('@home_verif_banner_show_count', String(newCount));
    } catch {
      // ignore
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    setIsOnline(value);
    if (socket?.connected) {
      socket.emit('provider:set-online', { isOnline: value });
    }
  };

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {verifBanner && !dismissedBanner && (verifBanner.type !== 'success' || bannerShowCount < 3) && (
          <TouchableOpacity
            style={[
              styles.verifBanner,
              verifBanner.type === 'success' && styles.verifBannerSuccess,
              verifBanner.type === 'warning' && styles.verifBannerWarning,
              verifBanner.type === 'error' && styles.verifBannerError,
              verifBanner.type === 'info' && styles.verifBannerInfo,
            ]}
            onPress={() => {
              if (verifBanner.type !== 'success') {
                router.replace('/(provider-verification)');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.verifBannerIcon}>
              <Ionicons
                name={
                  verifBanner.type === 'success' ? 'checkmark-circle' :
                  verifBanner.type === 'warning' ? 'alert-circle' :
                  verifBanner.type === 'error' ? 'close-circle' : 'information-circle'
                }
                size={22}
                color={
                  verifBanner.type === 'success' ? C.success :
                  verifBanner.type === 'warning' ? C.amber :
                  verifBanner.type === 'error' ? C.error : C.primary
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.verifBannerText}>{verifBanner.message}</Text>
              {verifBanner.type !== 'success' && verifBanner.categories.length > 0 && (
                <View style={styles.verifCatRow}>
                  {verifBanner.categories.slice(0, 3).map(c => (
                    <View key={c.category_id} style={[
                      styles.verifCatBadge,
                      c.status === 'approved' || c.status === 'auto_approved' ? { backgroundColor: '#E8F8F2' } :
                      c.status === 'rejected' ? { backgroundColor: '#FDECEA' } : { backgroundColor: C.primaryLight },
                    ]}>
                      <Text style={[
                        styles.verifCatBadgeText,
                        (c.status === 'approved' || c.status === 'auto_approved') && { color: C.success },
                        c.status === 'rejected' && { color: C.error },
                      ]}>{c.category_name}</Text>
                    </View>
                  ))}
                  {verifBanner.categories.length > 3 && (
                    <Text style={styles.verifMoreText}>+{verifBanner.categories.length - 3} more</Text>
                  )}
                </View>
              )}
            </View>
            {verifBanner.type !== 'success' && (
              <Ionicons name="chevron-forward" size={18} color={C.textHint} />
            )}
            <TouchableOpacity onPress={handleDismissBanner} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={C.textHint} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.profileTrigger} onPress={() => router.push('/(provider)/profile')} activeOpacity={0.9}>
            <View style={styles.avatarCircle}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingLabel}>{greeting},</Text>
              <Text style={styles.greetingName}>{user.name || 'Provider'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationTrigger} onPress={() => router.push('/(shared)/notifications')} activeOpacity={0.9}>
            <Ionicons name="notifications-outline" size={26} color={C.textPrimary} />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>{`$${earnings.totalUsd.toFixed(2)}`}</Text>
          <Text style={styles.earningsPkr}>{`≈ PKR ${earnings.totalPkr}`}</Text>
          <View style={styles.earningsActionsRow}>
            <TouchableOpacity style={styles.earningsActionButton} onPress={() => router.push('/(provider)/earnings')}>
              <Text style={styles.earningsActionText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.earningsActionButton} onPress={() => router.push('/(provider)/earnings')}>
              <Text style={styles.earningsActionText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pendingText}>{`Pending clearance: $${earnings.pendingClearanceUsd.toFixed(2)} (≈ PKR ${earnings.pendingClearancePkr})`}</Text>
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
            {[
              { icon: 'search-outline' as const, label: 'Browse Jobs', route: '/(provider)/browse-jobs' as const },
              { icon: 'document-text-outline' as const, label: 'Proposals', route: '/(provider)/proposals' as const },
              { icon: 'wallet-outline' as const, label: 'Earnings', route: '/(provider)/earnings' as const },
              { icon: 'person-outline' as const, label: 'Profile', route: '/(provider)/profile' as const },
            ].map((action) => (
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
          <Switch value={isOnline} onValueChange={handleAvailabilityToggle} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Jobs Near You</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/browse-jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {nearbyJobs.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyList}>
              {nearbyJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.nearbyCard}
                  onPress={() => router.push({ pathname: '/(provider)/job-detail/[id]', params: { id: job.id } })}
                >
                  <JobStatusBadge status={job.status as any} />
                  <Text style={styles.nearbyTitle} numberOfLines={2}>{job.title}</Text>
                  <Text style={styles.nearbyBudget}>{`$${job.budget.toFixed(0)}`}</Text>
                  <View style={styles.nearbyBottomRow}>
                    <Text style={styles.nearbyDistance}>{job.distance || 'Remote'}</Text>
                    <TouchableOpacity style={styles.applyButton}>
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyJobs}>
              <Ionicons name="briefcase-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyJobsText}>No jobs available near you</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(provider)/browse-jobs')}>
                <Text style={styles.browseBtnText}>Browse All Jobs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Reels section placeholder */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Real-time Reels</Text>
            <TouchableOpacity onPress={() => { /* TODO: reels screen */ }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reelsPlaceholder}>
            <Ionicons name="videocam-outline" size={48} color={C.textHint} />
            <Text style={styles.reelsPlaceholderText}>Reels coming soon</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    verifBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, gap: 10 },
    verifBannerSuccess: { borderColor: C.success, backgroundColor: C.success + '15' },
    verifBannerWarning: { borderColor: C.amber, backgroundColor: C.amber + '15' },
    verifBannerError: { borderColor: C.error, backgroundColor: C.error + '15' },
    verifBannerInfo: { borderColor: C.primary, backgroundColor: C.primary + '15' },
    verifBannerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    verifBannerText: { fontSize: 13, fontWeight: '600', color: C.textPrimary, flex: 1, lineHeight: 18 },
    verifCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    verifCatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    verifCatBadgeText: { fontSize: 11, fontWeight: '600', color: C.textPrimary },
    verifMoreText: { fontSize: 11, color: C.textHint, alignSelf: 'center' },
    dismissBtn: { padding: 4 },
    topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8, justifyContent: 'space-between' },
    profileTrigger: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 44, height: 44, borderRadius: 22 },
    avatarInitials: { fontSize: 16, fontWeight: '700', color: 'white' },
    greetingWrap: { marginLeft: 10 },
    greetingLabel: { fontSize: 12, color: C.textSecondary, fontWeight: '400' },
    greetingName: { fontSize: 18, fontWeight: '700', color: C.textPrimary, lineHeight: 22 },
    notificationTrigger: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.error, position: 'absolute', top: 8, right: 8 },
    earningsCard: { backgroundColor: C.primary, borderRadius: 20, padding: 20, marginBottom: 20 },
    earningsLabel: { fontSize: 12, color: 'white', opacity: 0.7 },
    earningsAmount: { fontSize: 30, fontWeight: '800', color: 'white' },
    earningsPkr: { fontSize: 13, color: 'white', opacity: 0.6, marginTop: 1 },
    earningsActionsRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
    earningsActionButton: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
    earningsActionText: { color: 'white', fontSize: 13, fontWeight: '600' },
    pendingText: { marginTop: 8, fontSize: 11, color: 'white', opacity: 0.5 },
    statsGrid: { marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    statCard: { width: '48%', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, padding: 12 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statValue: { fontSize: 20, fontWeight: '700', color: C.textPrimary, lineHeight: 24 },
    statLabel: { fontSize: 12, color: C.textSecondary },
    sectionWrap: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 10 },
    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    quickActionItem: { alignItems: 'center', width: '23%' },
    quickActionIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 6 },
    quickActionLabel: { fontSize: 11, fontWeight: '500', color: C.textPrimary, textAlign: 'center' },
    availabilityCard: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    availabilityTextWrap: { flex: 1 },
    availabilityTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    availabilitySubtitle: { marginTop: 2, fontSize: 12 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    seeAllText: { fontSize: 13, fontWeight: '600', color: C.primary },
    nearbyList: { gap: 12, paddingRight: 4 },
    nearbyCard: { width: 200, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, borderLeftWidth: 3, borderLeftColor: C.primary, padding: 14 },
    nearbyTitle: { marginTop: 8, fontSize: 14, fontWeight: '600', color: C.textPrimary, lineHeight: 20 },
    nearbyBudget: { marginTop: 6, fontSize: 18, fontWeight: '700', color: C.primary },
    nearbyBottomRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    nearbyDistance: { fontSize: 12, color: C.textSecondary, flex: 1 },
    applyButton: { backgroundColor: C.amber, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
    applyButtonText: { fontSize: 11, fontWeight: '700', color: 'white' },
    emptyJobs: { alignItems: 'center', padding: 30, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
    emptyJobsText: { marginTop: 12, fontSize: 14, color: C.textSecondary, textAlign: 'center' },
    browseBtn: { marginTop: 16, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    browseBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
    reelsPlaceholder: { alignItems: 'center', padding: 30, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
    reelsPlaceholderText: { marginTop: 12, fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  });