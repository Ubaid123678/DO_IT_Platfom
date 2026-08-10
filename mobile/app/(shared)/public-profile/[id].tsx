import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';
import { verificationService } from '@/src/services/verificationService';

type ProfileType = 'provider' | 'client';
type ReviewFilter = 'all' | '5' | '4' | '3-1';

type RatingBar = {
  stars: 5 | 4 | 3 | 2 | 1;
  count: number;
  percent: number;
};

type ProfileState = {
  id: string;
  type: ProfileType;
  verified: boolean;
  name: string;
  tagline: string;
  location: string;
  memberSince: string;
  about: string;
  services: Array<{ emoji: string; label: string }>;
  serviceArea?: string;
  portfolio?: string[];
  stats: Array<{ value: string; label: string; tone?: 'amber' | 'primary' }>;
  reviewsCount: number;
  rating: number;
  ratingBars: RatingBar[];
};

type ReviewItem = {
  id: string;
  name: string;
  initials: string;
  date: string;
  stars: number;
  text: string;
  jobRef: string;
};

const providerProfile: ProfileState = {
  id: 'provider-201',
  type: 'provider',
  verified: true,
  name: 'Ubaid Khan',
  tagline: 'Delivery and On-Demand Services Expert',
  location: 'Lahore, Pakistan',
  memberSince: 'Jan 2024',
  about:
    'I help clients complete urgent and routine tasks reliably. My focus is fast communication, safe handling, and on-time delivery with full transparency.',
  services: [
    { emoji: '🚚', label: 'Delivery' },
    { emoji: '🧹', label: 'Cleaning' },
    { emoji: '🛠️', label: 'Repairs' },
    { emoji: '💻', label: 'Digital Help' },
  ],
  serviceArea: 'Covers DHA, Gulberg, Johar Town, and nearby areas within 12 km.',
  portfolio: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1581092160607-ee22731c8b67?auto=format&fit=crop&w=400&q=60',
  ],
  stats: [
    { value: '4.9', label: 'Rating', tone: 'amber' },
    { value: '47', label: 'Jobs Done', tone: 'primary' },
    { value: '98%', label: 'Success', tone: 'primary' },
    { value: '<1hr', label: 'Response', tone: 'primary' },
  ],
  reviewsCount: 47,
  rating: 4.9,
  ratingBars: [
    { stars: 5, count: 36, percent: 77 },
    { stars: 4, count: 8, percent: 17 },
    { stars: 3, count: 2, percent: 4 },
    { stars: 2, count: 1, percent: 2 },
    { stars: 1, count: 0, percent: 0 },
  ],
};

const clientProfile: ProfileState = {
  id: 'client-301',
  type: 'client',
  verified: true,
  name: 'Sara Malik',
  tagline: 'Hiring for Delivery, Design and Support Tasks',
  location: 'Karachi, Pakistan',
  memberSince: 'Jan 2024',
  about:
    'I frequently post jobs for business support and local logistics. I prefer clear proposals and dependable delivery timelines.',
  services: [
    { emoji: '📦', label: 'Delivery' },
    { emoji: '🎨', label: 'Design' },
    { emoji: '🧰', label: 'Repairs' },
  ],
  stats: [
    { value: '12', label: 'Jobs Posted', tone: 'primary' },
    { value: '4.8★', label: 'Avg Rating', tone: 'amber' },
    { value: '96%', label: 'Completion', tone: 'primary' },
    { value: '<2hr', label: 'Response', tone: 'primary' },
  ],
  reviewsCount: 18,
  rating: 4.8,
  ratingBars: [
    { stars: 5, count: 12, percent: 67 },
    { stars: 4, count: 4, percent: 22 },
    { stars: 3, count: 2, percent: 11 },
    { stars: 2, count: 0, percent: 0 },
    { stars: 1, count: 0, percent: 0 },
  ],
};

const providerReviews: ReviewItem[] = [
  {
    id: 'r-1',
    name: 'Hamza S.',
    initials: 'HS',
    date: 'Apr 10, 2026',
    stars: 5,
    text: 'Excellent communication and delivery. Shared updates at every step and arrived earlier than expected.',
    jobRef: 'Document Delivery #J-201',
  },
  {
    id: 'r-2',
    name: 'Nida K.',
    initials: 'NK',
    date: 'Apr 07, 2026',
    stars: 4,
    text: 'Work quality was very good and the provider remained responsive throughout the task execution.',
    jobRef: 'Catalog Updates #J-187',
  },
  {
    id: 'r-3',
    name: 'Awais T.',
    initials: 'AT',
    date: 'Apr 05, 2026',
    stars: 5,
    text: 'Great experience. Professional behavior and accurate completion with no follow-ups needed.',
    jobRef: 'Urgent Pickup #J-183',
  },
];

const clientReviews: ReviewItem[] = [
  {
    id: 'cr-1',
    name: 'Usman R.',
    initials: 'UR',
    date: 'Apr 09, 2026',
    stars: 5,
    text: 'Clear job scope and instant payment release. One of the easiest clients to work with.',
    jobRef: 'Cafe Campaign Assets #C-99',
  },
  {
    id: 'cr-2',
    name: 'Fariha A.',
    initials: 'FA',
    date: 'Apr 03, 2026',
    stars: 4,
    text: 'Good communication and concise feedback. Project was wrapped up smoothly.',
    jobRef: 'Package Delivery #C-86',
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function PublicProfileViewerScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams();

  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  const resolvedType: ProfileType =
    (Array.isArray(type) ? type[0] : type) === 'client' ? 'client' : 'provider';
  const resolvedId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (resolvedType === 'provider') {
        setProfile({ ...providerProfile, id: resolvedId ?? providerProfile.id });
        setReviews(providerReviews);
      } else {
        setProfile({ ...clientProfile, id: resolvedId ?? clientProfile.id });
        setReviews(clientReviews);
      }
      setLoading(false);
    }, 320);

    if (resolvedType === 'provider' && resolvedId) {
      verificationService.getPublicProfile(resolvedId)
        .then((data) => {
          if (cancelled) return;
          clearTimeout(timer);
          const trackEmoji: Record<string, string> = { physical: '🛠️', digital: '💻', errand: '🚚' };
          setProfile({
            id: resolvedId,
            type: 'provider',
            verified: data.overall_status === 'verified',
            name: data.full_name ?? 'Provider',
            tagline: data.headline ?? 'Verified provider',
            location: data.city ?? 'Location not set',
            memberSince: 'Verified member',
            about: data.bio ?? 'This provider has not added a bio yet.',
            services: data.categories.map((c) => ({ emoji: trackEmoji[c.job_type] ?? '✓', label: c.name })),
            serviceArea: undefined,
            portfolio: undefined,
            stats: [
              { value: data.overall_status.replace('_', ' '), label: 'Status', tone: 'primary' as const },
              { value: data.track ?? '-', label: 'Track', tone: 'primary' as const },
            ],
            reviewsCount: 0,
            rating: 0,
            ratingBars: [],
          });
          setReviews([]);
          setLoading(false);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolvedId, resolvedType]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') {
      return reviews;
    }
    if (reviewFilter === '5') {
      return reviews.filter((item) => item.stars === 5);
    }
    if (reviewFilter === '4') {
      return reviews.filter((item) => item.stars === 4);
    }
    return reviews.filter((item) => item.stars <= 3);
  }, [reviewFilter, reviews]);

  if (loading || !profile) {
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
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.headerIconButton}>
          <Ionicons name="share-outline" size={20} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroAvatarWrap}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{getInitials(profile.name)}</Text>
            </View>

            {profile.verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            ) : null}
          </View>

          <Text style={styles.heroName}>{profile.name}</Text>
          <Text style={styles.heroTagline}>{profile.tagline}</Text>

          <View style={styles.heroLocationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroLocationText}>{profile.location}</Text>
          </View>

          <Text style={styles.heroMember}>{`Member since ${profile.memberSince}`}</Text>
        </View>

        <View style={styles.statsStrip}>
          {profile.stats.map((item, idx) => (
            <React.Fragment key={item.label}>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statValue,
                    item.tone === 'amber' ? styles.statValueAmber : styles.statValuePrimary,
                  ]}
                >
                  {item.value}
                </Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>

              {idx < profile.stats.length - 1 ? <View style={styles.statDivider} /> : null}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.actionsRow}>
          {profile.type === 'provider' ? (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/(shared)/chat/[id]',
                    params: { id: profile.id },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(client)/post-job')}>
                <Text style={styles.primaryButtonText}>Hire This Provider</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonSingle]}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/chat/[id]',
                  params: { id: profile.id },
                })
              }
            >
              <Text style={styles.primaryButtonText}>Message Client</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{profile.about}</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>
            {profile.type === 'provider' ? 'Services Offered' : 'Looking For'}
          </Text>

          <View style={styles.servicesWrap}>
            {profile.services.map((service) => (
              <View key={service.label} style={styles.serviceChip}>
                <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                <Text style={styles.serviceText}>{service.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {profile.type === 'provider' ? (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Service Area</Text>
            <View style={styles.mapPreview}>
              <Ionicons name="map" size={34} color={C.primary} />
            </View>
            <Text style={styles.serviceAreaText}>{profile.serviceArea}</Text>
          </View>
        ) : null}

        {profile.type === 'provider' ? (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.portfolioGrid}>
              {(profile.portfolio ?? []).map((uri, idx) => (
                <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.portfolioImage} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.cardSection}>
          <View style={styles.reviewsHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{profile.reviewsCount}</Text>
            </View>
          </View>

          <View style={styles.ratingTopRow}>
            <Text style={styles.bigRating}>{profile.rating.toFixed(1)}</Text>
            <View style={styles.starsRight}>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name="star" size={14} color={C.amber} />
                ))}
              </View>
              <Text style={styles.reviewCountText}>{`${profile.reviewsCount} reviews`}</Text>
            </View>
          </View>

          <View style={styles.ratingBarsWrap}>
            {profile.ratingBars.map((bar) => (
              <View key={bar.stars} style={styles.ratingBarRow}>
                <Text style={styles.ratingBarLabel}>{`${bar.stars}★`}</Text>
                <View style={styles.ratingTrack}>
                  <View style={[styles.ratingFill, { width: `${bar.percent}%` }]} />
                </View>
                <Text style={styles.ratingCount}>{bar.count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reviewFiltersRow}>
            {[
              { key: 'all', label: 'All' },
              { key: '5', label: '5★' },
              { key: '4', label: '4★' },
              { key: '3-1', label: '3★ and below' },
            ].map((pill) => {
              const active = reviewFilter === (pill.key as ReviewFilter);
              return (
                <TouchableOpacity
                  key={pill.key}
                  style={[styles.filterPill, active ? styles.filterPillActive : null]}
                  onPress={() => setReviewFilter(pill.key as ReviewFilter)}
                >
                  <Text style={active ? styles.filterPillTextActive : styles.filterPillTextInactive}>
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={filteredReviews}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.reviewDivider} />}
            renderItem={({ item }) => (
              <View style={styles.reviewRow}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{item.initials}</Text>
                </View>

                <View style={styles.reviewContent}>
                  <View style={styles.reviewTopMeta}>
                    <Text style={styles.reviewName}>{item.name}</Text>
                    <Text style={styles.reviewDate}>{item.date}</Text>
                  </View>

                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < item.stars ? 'star' : 'star-outline'}
                        size={12}
                        color={C.amber}
                      />
                    ))}
                  </View>

                  <Text style={styles.reviewText} numberOfLines={3}>
                    {item.text}
                  </Text>
                  <Text style={styles.reviewRef}>{item.jobRef}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.menuCard}>
          {[
            { label: 'Payout Method', icon: 'card-outline', tone: 'amber' as const },
            { label: 'Verification', icon: 'shield-checkmark-outline', tone: 'teal' as const },
            { label: 'Documents', icon: 'document-text-outline', tone: 'teal' as const },
            { label: 'Support', icon: 'help-circle-outline', tone: 'gray' as const },
          ].map((row, index, arr) => {
            const palette =
              row.tone === 'amber'
                ? { bg: C.amberLight, color: C.amber }
                : row.tone === 'gray'
                  ? { bg: C.background, color: C.textSecondary }
                  : { bg: C.primaryLight, color: C.primary };

            return (
              <View key={row.label} style={[styles.menuRow, index === arr.length - 1 ? styles.menuRowLast : null]}>
                <View style={[styles.menuIconBox, { backgroundColor: palette.bg }]}>
                  <Ionicons name={row.icon as keyof typeof Ionicons.glyphMap} size={20} color={palette.color} />
                </View>
                <Text style={styles.menuLabel}>{row.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.textHint} />
              </View>
            );
          })}
        </View>

        <View style={styles.dangerCard}>
          <View style={styles.dangerRow}>
            <View style={[styles.menuIconBox, { backgroundColor: C.error + '22' }]}>
              <Ionicons name="log-out-outline" size={20} color={C.error} />
            </View>
            <Text style={styles.dangerText}>Log Out</Text>
          </View>
          <View style={[styles.dangerRow, styles.menuRowLast]}>
            <View style={styles.deleteSpacer} />
            <Text style={styles.dangerDeleteText}>Delete Account</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportRow}
          onPress={() => router.push(`/(help)/report?userId=${profile.id}`)}
        >
          <Ionicons name="flag-outline" size={14} color={C.textHint} />
          <Text style={styles.reportText}>Report this profile</Text>
        </TouchableOpacity>
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
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      height: 52,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    headerIconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    headerTitle: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      pointerEvents: 'none',
    },
    scrollContent: {
      paddingBottom: 24,
    },
    hero: {
      backgroundColor: C.primary,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    heroAvatarWrap: {
      position: 'relative',
      alignSelf: 'center',
    },
    heroAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'white',
      borderWidth: 3,
      borderColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatarText: {
      fontSize: 28,
      color: C.primary,
      fontWeight: '700',
    },
    verifiedBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.primary,
      borderWidth: 2,
      borderColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroName: {
      marginTop: 10,
      fontSize: 22,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
    heroTagline: {
      marginTop: 2,
      fontSize: 14,
      color: 'white',
      opacity: 0.8,
      textAlign: 'center',
    },
    heroLocationRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroLocationText: {
      fontSize: 13,
      color: 'white',
      opacity: 0.7,
    },
    heroMember: {
      marginTop: 2,
      fontSize: 12,
      color: 'white',
      opacity: 0.5,
    },
    statsStrip: {
      marginHorizontal: 16,
      marginTop: -20,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    statValueAmber: {
      color: C.amber,
    },
    statValuePrimary: {
      color: C.primary,
    },
    statLabel: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: C.divider,
    },
    actionsRow: {
      flexDirection: 'row',
      marginHorizontal: 20,
      gap: 12,
      marginTop: 16,
    },
    secondaryButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: C.primary,
      fontWeight: '600',
      fontSize: 15,
    },
    primaryButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    primaryButtonSingle: {
      flex: 0,
      width: '100%',
    },
    primaryButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 14,
      textAlign: 'center',
    },
    cardSection: {
      marginTop: 16,
      marginHorizontal: 20,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    aboutText: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 22,
    },
    servicesWrap: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    serviceChip: {
      backgroundColor: C.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    serviceEmoji: {
      fontSize: 14,
    },
    serviceText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    mapPreview: {
      marginTop: 8,
      height: 100,
      borderRadius: 10,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceAreaText: {
      marginTop: 8,
      fontSize: 13,
      color: C.textSecondary,
    },
    portfolioGrid: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    portfolioImage: {
      width: '31.5%',
      aspectRatio: 1,
      borderRadius: 10,
      backgroundColor: C.divider,
    },
    reviewsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    countPill: {
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    countPillText: {
      fontSize: 11,
      color: C.primary,
      fontWeight: '600',
    },
    ratingTopRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bigRating: {
      fontSize: 36,
      fontWeight: '800',
      color: C.amber,
      lineHeight: 40,
    },
    starsRight: {
      flex: 1,
    },
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    reviewCountText: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    ratingBarsWrap: {
      marginTop: 10,
      gap: 8,
    },
    ratingBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ratingBarLabel: {
      width: 20,
      fontSize: 12,
      color: C.textSecondary,
    },
    ratingTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.cardBorder,
      overflow: 'hidden',
    },
    ratingFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: C.primary,
    },
    ratingCount: {
      width: 24,
      textAlign: 'right',
      fontSize: 11,
      color: C.textHint,
    },
    reviewFiltersRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    filterPill: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    filterPillActive: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    filterPillTextActive: {
      color: C.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    filterPillTextInactive: {
      color: C.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    reviewDivider: {
      height: 1,
      backgroundColor: C.divider,
      marginVertical: 12,
    },
    reviewRow: {
      flexDirection: 'row',
      gap: 10,
      paddingTop: 12,
    },
    reviewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewAvatarText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '700',
    },
    reviewContent: {
      flex: 1,
    },
    reviewTopMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    reviewName: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
    reviewDate: {
      fontSize: 11,
      color: C.textHint,
    },
    reviewStarsRow: {
      marginTop: 4,
      flexDirection: 'row',
      gap: 2,
    },
    reviewText: {
      marginTop: 6,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 19,
    },
    reviewRef: {
      marginTop: 4,
      fontSize: 12,
      color: C.primary,
      fontStyle: 'italic',
    },
    menuCard: {
      marginTop: 12,
      marginHorizontal: 20,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      overflow: 'hidden',
    },
    menuRow: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
    },
    menuRowLast: {
      borderBottomWidth: 0,
    },
    menuIconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      flex: 1,
      marginLeft: 12,
      fontSize: 14,
      color: C.textPrimary,
    },
    dangerCard: {
      marginTop: 8,
      marginHorizontal: 20,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      overflow: 'hidden',
    },
    dangerRow: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
    },
    dangerText: {
      marginLeft: 12,
      fontSize: 14,
      color: C.error,
      fontWeight: '500',
    },
    deleteSpacer: {
      width: 36,
      height: 36,
    },
    dangerDeleteText: {
      marginLeft: 12,
      fontSize: 13,
      color: C.error,
      opacity: 0.7,
    },
    reportRow: {
      marginTop: 16,
      marginBottom: 24,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reportText: {
      fontSize: 12,
      color: C.textHint,
    },
  });
