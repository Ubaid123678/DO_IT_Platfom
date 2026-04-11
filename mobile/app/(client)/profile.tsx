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

import { Colors, type AppColors } from '@/src/theme/colors';

type UserProfile = {
  name: string;
  email: string;
  memberSince: string;
  jobsPosted: number;
  avgRating: number;
  spent: number;
  identityVerified: boolean;
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

const defaultUser: UserProfile = {
  name: 'Ubaid Khan',
  email: 'ubaid@example.com',
  memberSince: 'Jan 2024',
  jobsPosted: 12,
  avgRating: 4.7,
  spent: 540,
  identityVerified: true,
};

export default function ClientProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(defaultUser);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const initials = useMemo(() => {
    if (!user) {
      return 'U';
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

  if (loading || !user) {
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/(shared)/settings')}
          >
            <Ionicons name="pencil-outline" size={22} color={C.primary} />
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
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.memberSince}>{`Member since ${user.memberSince}`}</Text>

          <View style={styles.fullDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{user.jobsPosted}</Text>
              <Text style={styles.statLabel}>Jobs Posted</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: C.amber }]}>{`${user.avgRating} ★`}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statValue}>{`$${user.spent}`}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionsWrap}>
          <View style={styles.sectionCard}>
            <MenuRow
              label="Edit Profile"
              icon="person-outline"
              tone="teal"
              onPress={() => router.push('/(shared)/settings')}
            />
            <MenuRow
              label="Verify Identity"
              icon="shield-checkmark-outline"
              tone="teal"
              rightPillText={user.identityVerified ? 'Verified' : 'Pending'}
              onPress={() => router.push('/(provider)/kyc')}
            />
            <MenuRow
              label="Payment Methods"
              icon="card-outline"
              tone="amber"
              onPress={() => router.push('/(client)/wallet')}
            />
            <MenuRow
              label="Address Book"
              icon="location-outline"
              tone="teal"
              showBorder={false}
            />
          </View>

          <View style={styles.sectionCard}>
            <MenuRow
              label="Language"
              icon="globe-outline"
              tone="gray"
              rightText="English"
            />
            <MenuRow
              label="Currency"
              icon="cash-outline"
              tone="gray"
              rightText="USD"
            />
            <MenuRow
              label="Notifications"
              icon="notifications-outline"
              tone="gray"
              onPress={() => router.push('/(shared)/notifications')}
            />
            <MenuRow
              label="Theme"
              icon="moon-outline"
              tone="gray"
              showBorder={false}
              rightNode={
                <View style={styles.switchWrap}>
                  <Switch
                    value={isDark}
                    onValueChange={() => router.push('/(shared)/settings')}
                    thumbColor="white"
                    trackColor={{ false: C.inputBorder, true: C.primary }}
                  />
                </View>
              }
            />
          </View>

          <View style={styles.sectionCard}>
            <MenuRow
              label="Help & Support"
              icon="headset-outline"
              tone="teal"
              onPress={() => router.push('/(help)')}
            />
            <MenuRow
              label="Rate the App"
              icon="star-outline"
              tone="amber"
            />
            <MenuRow
              label="Invite Friends"
              icon="share-outline"
              tone="teal"
              showBorder={false}
            />
          </View>

          <View style={styles.sectionCard}>
            <MenuRow
              label="Terms of Service"
              icon="document-text-outline"
              tone="gray"
            />
            <MenuRow
              label="Privacy Policy"
              icon="lock-closed-outline"
              tone="gray"
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
    headerAction: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
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
      marginBottom: 12,
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
      fontWeight: '700',
      color: 'white',
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
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    userEmail: {
      marginTop: 2,
      fontSize: 13,
      color: C.textSecondary,
    },
    memberSince: {
      marginTop: 2,
      fontSize: 12,
      color: C.textHint,
    },
    fullDivider: {
      width: '100%',
      height: 1,
      backgroundColor: C.divider,
      marginVertical: 16,
    },
    statsRow: {
      width: '100%',
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
    sectionsWrap: {
      marginTop: 12,
      gap: 8,
    },
    sectionCard: {
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
      fontSize: 13,
      color: C.textSecondary,
      marginRight: 6,
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
    switchWrap: {
      marginRight: 6,
      transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
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
