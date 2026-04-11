import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type UserState = {
  name: string;
  memberSince: string;
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

const defaultUser: UserState = {
  name: 'Ubaid Khan',
  memberSince: 'Jan 2024',
};

const defaultProviderProfile: ProviderProfileState = {
  verified: true,
  rating: 4.9,
  jobsDone: 47,
  earned: 3450,
  categories: [
    { emoji: '🚚', label: 'Delivery' },
    { emoji: '🧹', label: 'Cleaning' },
    { emoji: '🛠️', label: 'Repairs' },
    { emoji: '💻', label: 'Digital Help' },
  ],
  bio: 'Reliable and detail-focused provider with 3+ years of experience. I prioritize clear communication, punctual delivery, and high-quality results for every client.',
  serviceArea: 'Covers DHA, Gulberg, Johar Town, and nearby areas within 12 km.',
  portfolio: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=60',
  ],
  reviewsCount: 47,
  ratingsBreakdown: [
    { stars: 5, count: 36, percent: 77 },
    { stars: 4, count: 8, percent: 17 },
    { stars: 3, count: 2, percent: 4 },
    { stars: 2, count: 1, percent: 2 },
    { stars: 1, count: 0, percent: 0 },
  ],
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserState | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfileState | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(defaultUser);
      setProviderProfile(defaultProviderProfile);
      setIsOnline(true);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const initials = useMemo(() => {
    if (!user) {
      return 'P';
    }

    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user]);

  const iconPalette = (tone: RowTone) => {
    if (tone === 'amber') {
      return { bg: C.amberLight, color: C.amber };
    }

    if (tone === 'gray') {
      return { bg: C.background, color: C.textSecondary };
    }

    if (tone === 'error') {
      return { bg: isDark ? '#2E1010' : '#FDECEA', color: C.error };
    }

    return { bg: C.primaryLight, color: C.primary };
  };

  const MenuRow = ({
    label,
    icon,
    tone = 'teal',
    rightText,
    rightPillText,
    showChevron = true,
    showBorder = true,
    rightNode,
    onPress,
  }: MenuRowProps) => {
    const palette = iconPalette(tone);

    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress}
        style={[styles.menuRow, !showBorder ? styles.rowNoBorder : null]}
      >
        <View style={[styles.rowIconBox, { backgroundColor: palette.bg }]}>
          <Ionicons name={icon} size={20} color={palette.color} />
        </View>

        <Text style={styles.rowLabel}>{label}</Text>

        {rightPillText ? (
          <View style={styles.rightPill}>
            <Text style={styles.rightPillText}>{rightPillText}</Text>
          </View>
        ) : null}

        {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        {rightNode ?? null}

        {showChevron ? <Ionicons name="chevron-forward" size={18} color={C.textHint} /> : null}
      </TouchableOpacity>
    );
  };

  if (loading || !user || !providerProfile) {
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(shared)/settings')}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>

          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={16} color={C.primary} />
            <Text style={styles.verifiedText}>Verified Provider</Text>
          </View>

          <Text style={styles.memberSince}>{`Member since ${user.memberSince}`}</Text>

          <View style={styles.fullDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: C.amber }]}>{`${providerProfile.rating} ★`}</Text>
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

            <TouchableOpacity style={styles.addChip}>
              <Text style={styles.addChipText}>+ Add Category</Text>
            </TouchableOpacity>
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
          <View style={styles.mapPreview}>
            <Ionicons name="map" size={34} color={C.primary} />
          </View>
          <Text style={styles.serviceAreaText}>{providerProfile.serviceArea}</Text>
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

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Add Work</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.portfolioGrid}>
            {providerProfile.portfolio.map((uri, idx) => (
              <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.portfolioImage} />
            ))}
            <TouchableOpacity style={styles.addPortfolioCard}>
              <Ionicons name="add" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{`Reviews (${providerProfile.reviewsCount})`}</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ratingOverviewRow}>
            <Text style={styles.bigRatingText}>{providerProfile.rating.toFixed(1)}</Text>
            <View>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name="star" size={14} color={C.amber} />
                ))}
              </View>
              <Text style={styles.reviewCountText}>{`${providerProfile.reviewsCount} reviews`}</Text>
            </View>
          </View>

          <View style={styles.breakdownWrap}>
            {providerProfile.ratingsBreakdown.map((item) => (
              <View key={item.stars} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{`${item.stars}★`}</Text>
                <View style={styles.breakdownTrack}>
                  <View style={[styles.breakdownFill, { width: `${item.percent}%` }]} />
                </View>
                <Text style={styles.breakdownCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <MenuRow
            label="Payout Method"
            icon="card-outline"
            tone="amber"
            rightText="Bank"
            onPress={() => router.push('/(provider)/earnings')}
          />
          <MenuRow
            label="Verification"
            icon="shield-checkmark-outline"
            tone="teal"
            rightPillText={providerProfile.verified ? 'Verified' : 'Pending'}
            onPress={() => router.push('/(provider)/kyc')}
          />
          <MenuRow
            label="Documents"
            icon="document-text-outline"
            tone="teal"
            onPress={() => router.push('/(provider)/kyc')}
          />
          <MenuRow
            label="Notifications"
            icon="notifications-outline"
            tone="gray"
            onPress={() => router.push('/(shared)/notifications')}
          />
          <MenuRow
            label="Language"
            icon="globe-outline"
            tone="gray"
            rightText="English"
            showBorder={false}
          />
        </View>

        <View style={styles.dangerCard}>
          <TouchableOpacity style={styles.dangerRow}>
            <View style={[styles.rowIconBox, { backgroundColor: isDark ? '#2E1010' : '#FDECEA' }]}>
              <Ionicons name="log-out-outline" size={20} color={C.error} />
            </View>
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
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    headerRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    editText: {
      fontSize: 15,
      color: C.primary,
      fontWeight: '600',
    },
    profileCard: {
      marginTop: 16,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      alignItems: 'center',
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 30,
      color: 'white',
      fontWeight: '700',
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.primary,
      borderWidth: 2,
      borderColor: C.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userName: {
      marginTop: 10,
      fontSize: 22,
      fontWeight: '700',
      color: C.textPrimary,
    },
    verifiedRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    verifiedText: {
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    memberSince: {
      marginTop: 2,
      fontSize: 12,
      color: C.textHint,
    },
    fullDivider: {
      height: 1,
      backgroundColor: C.divider,
      width: '100%',
      marginVertical: 16,
    },
    statsRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: 20,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    statLabel: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
    },
    verticalDivider: {
      width: 1,
      height: 32,
      backgroundColor: C.divider,
    },
    cardSection: {
      marginTop: 10,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    chipsWrap: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      backgroundColor: C.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryEmoji: {
      fontSize: 14,
    },
    categoryText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    addChip: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: C.primary,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    addChipText: {
      color: C.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    bioText: {
      marginTop: 8,
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 22,
    },
    bioPlaceholder: {
      marginTop: 8,
      fontSize: 14,
      color: C.textHint,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    innerDivider: {
      marginVertical: 12,
      height: 1,
      backgroundColor: C.divider,
    },
    mapPreview: {
      height: 100,
      borderRadius: 10,
      backgroundColor: C.primaryLight,
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceAreaText: {
      marginTop: 8,
      fontSize: 13,
      color: C.textSecondary,
    },
    availabilityCard: {
      marginTop: 10,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
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
    linkText: {
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    portfolioGrid: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    portfolioImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: C.divider,
    },
    addPortfolioCard: {
      width: 80,
      height: 80,
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingOverviewRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bigRatingText: {
      fontSize: 32,
      fontWeight: '800',
      color: C.amber,
      lineHeight: 36,
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
    breakdownWrap: {
      marginTop: 10,
      gap: 8,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    breakdownLabel: {
      width: 20,
      fontSize: 12,
      color: C.textSecondary,
    },
    breakdownTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.cardBorder,
      overflow: 'hidden',
    },
    breakdownFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: C.primary,
    },
    breakdownCount: {
      width: 24,
      textAlign: 'right',
      fontSize: 11,
      color: C.textHint,
    },
    sectionCard: {
      marginTop: 10,
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
    rowNoBorder: {
      borderBottomWidth: 0,
    },
    rowIconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      marginLeft: 12,
      fontSize: 14,
      color: C.textPrimary,
    },
    rightText: {
      marginRight: 6,
      fontSize: 13,
      color: C.textSecondary,
    },
    rightPill: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: C.success,
      marginRight: 6,
    },
    rightPillText: {
      fontSize: 10,
      fontWeight: '500',
      color: 'white',
    },
    dangerCard: {
      marginTop: 8,
      marginBottom: 32,
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
    logoutText: {
      marginLeft: 12,
      fontSize: 14,
      fontWeight: '500',
      color: C.error,
    },
    deleteSpacer: {
      width: 36,
      height: 36,
    },
    deleteText: {
      marginLeft: 12,
      fontSize: 13,
      color: C.error,
      opacity: 0.7,
    },
  });
