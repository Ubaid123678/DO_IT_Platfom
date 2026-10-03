import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/authService';
import { verificationService } from '@/src/services/verificationService';
import { walletService } from '@/src/services/walletService';
import { jobService } from '@/src/services/jobService';
import { reviewService } from '@/src/services/reviewService';
import { Colors, type AppColors } from '@/src/theme/colors';

type UserState = {
  name: string;
  email: string;
  memberSince: string;
  avatarUrl?: string;
  profileCompleteness?: number;
  missingFields?: string[];
  avatar_url?: string;
  bio?: string;
  city?: string;
  languages?: { code: string; level: string }[];
  notificationEmail?: boolean;
  notificationPush?: boolean;
  notificationSms?: boolean;
  profileVisibility?: 'public' | 'private';
  createdAt?: string;
};

type ProviderProfileState = {
  verified: boolean;
  rating: number;
  jobsDone: number;
  earned: number;
  categories: Array<{ emoji: string; label: string }>;
  bio: string;
  serviceArea: string;
  portfolio: string[];
  reviewsCount: number;
  ratingsBreakdown: Array<{ stars: 5 | 4 | 3 | 2 | 1; count: number; percent: number }>;
};

type RowTone = 'teal' | 'amber' | 'gray' | 'error';

type MenuRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: RowTone;
  rightText?: string;
  rightPillText?: string;
  showChevron?: boolean;
  showBorder?: boolean;
  rightNode?: React.ReactNode;
  onPress?: () => void;
};

export default function ClientProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfileState | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState<number | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, walletRes, jobStatsRes, reviewStatsRes, ratingDistRes, myReviewsRes] = await Promise.allSettled([
          authService.getMe(),
          walletService.getWalletStats(),
          jobService.getProviderJobStats(),
          reviewService.getReviewStats('current'),
          reviewService.getRatingDistribution('current'),
          reviewService.getMyReviews({ limit: 5 }),
        ]);

        if (profileRes.status === 'fulfilled') {
          const profile = profileRes.value.data.user;
          const pp = profile.provider_profile ?? {};
          const td = profile.track_data ?? {};
          const track = profile.track;

          // Build user state from backend data
          setUser({
            name: profile.fullName,
            email: profile.email,
            memberSince: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'New',
            avatarUrl: profile.avatar_url,
            bio: pp.bio,
            city: pp.city,
            languages: pp.languages,
            notificationEmail: pp.notificationEmail ?? true,
            notificationPush: pp.notificationPush ?? true,
            notificationSms: pp.notificationSms ?? false,
            profileVisibility: pp.public_profile ? 'public' : 'private',
            createdAt: profile.createdAt,
            profileCompleteness: profile.completeness ?? 0,
            missingFields: profile.missing_fields ?? [],
          });

          // Build provider profile from track data
          const trackData = td[track ?? ''] as any ?? {};
          const categories = trackData.skills 
            ? trackData.skills.map((s: string) => ({ emoji: '💻', label: s }))
            : trackData.tools_equipment
              ? trackData.tools_equipment.map((t: string) => ({ emoji: '🛠️', label: t }))
              : trackData.transport_mode
                ? [{ emoji: '🚚', label: trackData.transport_mode }]
                : [];

          setProviderProfile({
            verified: profile.track !== null,
            rating: trackData.rating ?? 0,
            jobsDone: trackData.jobs_completed ?? trackData.completed_jobs ?? 0,
            earned: trackData.total_earned ?? 0,
            categories: categories.length > 0 ? categories : [{ emoji: '📋', label: 'General' }],
            bio: pp.bio ?? '',
            serviceArea: trackData.service_area ? `${trackData.service_area.city} (${trackData.service_area.radius_km} km)` : pp.city ?? 'Not specified',
            portfolio: trackData.portfolio_images ?? trackData.portfolio ?? [],
            reviewsCount: 0,
            ratingsBreakdown: [],
          });

          setProfileCompleteness(profile.completeness ?? 0);
          setMissingFields(profile.missing_fields ?? []);
        }

        // Wallet stats
        if (walletRes.status === 'fulfilled') {
          const w = walletRes.value;
        }

        // Job stats
        if (jobStatsRes.status === 'fulfilled') {
          const js = jobStatsRes.value;
        }

        // Reviews
        if (reviewStatsRes.status === 'fulfilled') {
          setReviewStats(reviewStatsRes.value.stats);
        }
        if (ratingDistRes.status === 'fulfilled') {
          setRatingDistribution(ratingDistRes.value.distribution);
        }
        if (myReviewsRes.status === 'fulfilled') {
          setReviews(myReviewsRes.value.reviews ?? []);
        }

      } catch (e) {
        console.error('[Profile] Load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!user) return 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user]);

  const iconPalette = (tone: RowTone) => {
    if (tone === 'amber') return { bg: C.amberLight, color: C.amber };
    if (tone === 'gray') return { bg: C.background, color: C.textSecondary };
    if (tone === 'error') return { bg: isDark ? '#2E1010' : '#FDECEA', color: C.error };
    return { bg: C.primaryLight, color: C.primary };
  };

  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) await authService.logout(refreshToken);
    } catch {} finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'role', 'user']);
      router.replace('/(auth)/login');
    }
  };

  const MenuRow = ({
    label, icon, tone = 'teal', rightText, rightPillText, showChevron = true, showBorder = true, rightNode, onPress
  }: MenuRowProps) => {
    const palette = iconPalette(tone);
    return (
      <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[styles.menuRow, !showBorder ? styles.rowNoBorder : null]}>
        <View style={[styles.rowIconBox, { backgroundColor: palette.bg }]}><Ionicons name={icon} size={20} color={palette.color} /></View>
        <Text style={styles.rowLabel}>{label}</Text>
        {rightPillText ? <View style={styles.rightPill}><Text style={styles.rightPillText}>{rightPillText}</Text></View> : null}
        {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        {rightNode ?? null}
        {showChevron ? <Ionicons name="chevron-forward" size={18} color={C.textHint} /> : null}
      </TouchableOpacity>
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={C.primary} /></View>
      </SafeAreaView>
    );
  }

  const rating = reviewStats?.averageRating ?? providerProfile.rating;
  const reviewsCount = reviewStats?.totalReviews ?? reviews.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(onboarding)/client-profile')}>
            <Ionicons name="pencil-outline" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>

        {profileCompleteness != null && profileCompleteness < 100 && (
          <TouchableOpacity style={styles.completenessCard} onPress={() => router.push('/(onboarding)/client-profile')} activeOpacity={0.85}>
            <View style={styles.completenessRing}><Text style={styles.completenessPct}>{profileCompleteness}%</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.completenessTitle}>Profile {profileCompleteness}% complete</Text>
              <Text style={styles.completenessSub}>
                {missingFields.length > 0 ? `Add ${missingFields.slice(0, 2).join(', ')} to get more jobs` : 'Complete your profile to get more jobs'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {user.avatarUrl ? <RNImage source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarInitials}>{initials}</Text>}
            </View>
            <TouchableOpacity style={styles.cameraButton}><Ionicons name="camera" size={14} color="white" /></TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.memberSince}>{`Member since ${user.memberSince}`}</Text>

          <View style={styles.fullDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: C.amber }]}>{rating.toFixed(1)} ★</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{providerProfile.jobsDone}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{`$${providerProfile.earned.toLocaleString()}`}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Service Categories</Text>
            <Ionicons name="pencil-outline" size={18} color={C.primary} />
          </View>
          <View style={styles.chipsWrap}>
            {providerProfile.categories.map((cat) => (
              <View key={cat.label} style={styles.categoryChip}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryText}>{cat.label}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addChip}><Text style={styles.addChipText}>+ Add Category</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Ionicons name="pencil-outline" size={18} color={C.primary} />
          </View>
          <Text style={providerProfile.bio ? styles.bioText : styles.bioPlaceholder}>
            {providerProfile.bio || 'Add a bio...'}
          </Text>
          <View style={styles.innerDivider} />
          <Text style={styles.sectionTitle}>Service Area</Text>
          <View style={styles.mapPreview}><Ionicons name="map" size={34} color={C.primary} /></View>
          <Text style={styles.serviceAreaText}>{providerProfile.serviceArea}</Text>
        </View>

        <View style={styles.availabilityCard}>
          <View style={styles.availabilityTextWrap}>
            <Text style={styles.availabilityTitle}>Availability</Text>
            <Text style={[styles.availabilitySubtitle, { color: isOnline ? C.success : C.textHint }]}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
          </View>
          <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity><Text style={styles.linkText}>Add Work</Text></TouchableOpacity>
          </View>
          <View style={styles.portfolioGrid}>
            {providerProfile.portfolio.length > 0 ? (
              providerProfile.portfolio.map((uri, idx) => (
                <RNImage key={`${uri}-${idx}`} source={{ uri }} style={styles.portfolioImage} />
              ))
            ) : (
              <View style={styles.emptyPortfolio}><Ionicons name="image-outline" size={24} color={C.textHint} /></View>
            )}
            <TouchableOpacity style={styles.addPortfolioCard}><Ionicons name="add" size={20} color={C.primary} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{`Reviews (${reviewsCount})`}</Text>
            <TouchableOpacity><Text style={styles.linkText}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.ratingOverviewRow}>
            <Text style={styles.bigRatingText}>{rating.toFixed(1)}</Text>
            <View>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={14} color={C.amber} />
                ))}
              </View>
              <Text style={styles.reviewCountText}>{`${reviewsCount} reviews`}</Text>
            </View>
          </View>

          {reviewStats?.breakdown && (
            <View style={styles.breakdownWrap}>
              {reviewStats.breakdown.map((item: any) => (
                <View key={item.stars} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{`${item.stars}★`}</Text>
                  <View style={styles.breakdownTrack}>
                    <View style={[styles.breakdownFill, { width: `${item.percent}%` }]} />
                  </View>
                  <Text style={styles.breakdownCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <MenuRow label="Edit Profile" icon="person-circle-outline" tone="teal" rightPillText={profileCompleteness != null ? `${profileCompleteness}%` : undefined} onPress={() => router.push('/(onboarding)/client-profile')} />
          <MenuRow label="Payout Method" icon="card-outline" tone="amber" rightText="Bank" onPress={() => router.push('/(provider)/withdraw')} />
          <MenuRow label="Verification" icon="shield-checkmark-outline" tone="teal" rightPillText={providerProfile.verified ? 'Verified' : 'Pending'} onPress={() => router.push('/(provider)/kyc')} />
          <MenuRow label="Documents" icon="document-text-outline" tone="teal" onPress={() => router.push('/(provider)/kyc')} />
          <MenuRow label="Notifications" icon="notifications-outline" tone="gray" onPress={() => router.push('/(shared)/notifications')} />
          <MenuRow label="Language" icon="globe-outline" tone="gray" rightText="English" showBorder={false} />
        </View>

        <View style={styles.dangerCard}>
          <TouchableOpacity style={styles.dangerRow} onPress={() => void handleLogout()}>
            <View style={[styles.rowIconBox, { backgroundColor: isDark ? '#2E1010' : '#FDECEA' }]}><Ionicons name="log-out-outline" size={20} color={C.error} /></View>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerRow, styles.rowNoBorder]}>
            <View style={styles.deleteSpacer} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
    headerRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
    headerAction: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    completenessCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 16, gap: 12 },
    completenessRing: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    completenessPct: { fontSize: 14, fontWeight: '800', color: C.primary },
    completenessTitle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
    completenessSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
    profileCard: { marginTop: 16, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 20, alignItems: 'center' },
    avatarWrap: { position: 'relative' },
    avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    avatarImage: { width: 88, height: 88, borderRadius: 44 },
    avatarInitials: { fontSize: 30, color: 'white', fontWeight: '700' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, borderWidth: 2, borderColor: C.card, alignItems: 'center', justifyContent: 'center' },
    userName: { marginTop: 10, fontSize: 22, fontWeight: '700', color: C.textPrimary },
    verifiedRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
    verifiedText: { color: C.primary, fontSize: 13, fontWeight: '600' },
    memberSince: { marginTop: 2, fontSize: 12, color: C.textHint },
    fullDivider: { height: 1, backgroundColor: C.divider, width: '100%', marginVertical: 16 },
    statsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: 20 },
    statCol: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700', color: C.primary },
    statLabel: { marginTop: 2, fontSize: 11, color: C.textSecondary },
    verticalDivider: { width: 1, height: 32, backgroundColor: C.divider },
    cardSection: { marginTop: 10, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 16 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPrimary },
    chipsWrap: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoryEmoji: { fontSize: 14 },
    categoryText: { fontSize: 12, color: C.primary, fontWeight: '500' },
    addChip: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    addChipText: { color: C.primary, fontSize: 12, fontWeight: '500' },
    bioText: { marginTop: 8, fontSize: 14, color: C.textSecondary, lineHeight: 22 },
    bioPlaceholder: { marginTop: 8, fontSize: 14, color: C.textHint, lineHeight: 22, fontStyle: 'italic' },
    innerDivider: { marginVertical: 12, height: 1, backgroundColor: C.divider },
    mapPreview: { height: 100, borderRadius: 10, backgroundColor: C.primaryLight, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
    serviceAreaText: { marginTop: 8, fontSize: 13, color: C.textSecondary },
    availabilityCard: { marginTop: 10, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, padding: 14, flexDirection: 'row', alignItems: 'center' },
    availabilityTextWrap: { flex: 1 },
    availabilityTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    availabilitySubtitle: { marginTop: 2, fontSize: 12 },
    linkText: { color: C.primary, fontSize: 13, fontWeight: '600' },
    portfolioGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    portfolioImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: C.divider },
    addPortfolioCard: { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    emptyPortfolio: { width: 80, height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    ratingOverviewRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    bigRatingText: { fontSize: 32, fontWeight: '800', color: C.amber, lineHeight: 36 },
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    reviewCountText: { marginTop: 2, fontSize: 12, color: C.textSecondary },
    breakdownWrap: { marginTop: 10, gap: 8 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    breakdownLabel: { width: 20, fontSize: 12, color: C.textSecondary },
    breakdownTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, overflow: 'hidden' },
    breakdownFill: { height: 4, borderRadius: 2, backgroundColor: C.primary },
    breakdownCount: { width: 24, textAlign: 'right', fontSize: 11, color: C.textHint },
    sectionCard: { marginTop: 10, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
    menuRow: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: C.divider },
    rowNoBorder: { borderBottomWidth: 0 },
    rowIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, marginLeft: 12, fontSize: 14, color: C.textPrimary },
    rightText: { marginRight: 6, fontSize: 13, color: C.textSecondary },
    rightPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.success, marginRight: 6 },
    rightPillText: { fontSize: 10, fontWeight: '500', color: 'white' },
    dangerCard: { marginTop: 8, marginBottom: 32, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
    dangerRow: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: C.divider },
    logoutText: { marginLeft: 12, fontSize: 14, fontWeight: '500', color: C.error },
    deleteSpacer: { width: 36, height: 36 },
    deleteText: { marginLeft: 12, fontSize: 13, color: C.error, opacity: 0.7 },
  });