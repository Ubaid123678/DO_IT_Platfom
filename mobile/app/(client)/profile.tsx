import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/authService';
import { jobService } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

type ClientProfile = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  city: string;
  languages: { code: string; level: string }[];
  profileVisibility: 'public' | 'private';
  createdAt?: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic', ur: 'Urdu',
  hi: 'Hindi', zh: 'Mandarin', de: 'German', pt: 'Portuguese',
};

export default function ClientProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [jobsPosted, setJobsPosted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userResult, jobsResult, storedProfile] = await Promise.all([
          authService.getMe(),
          jobService.getClientJobs({ limit: 1 }),
          AsyncStorage.getItem('clientProfile'),
        ]);
        const responseData = userResult.data as unknown as { data?: { user?: any }; user?: any };
        const user = responseData.data?.user ?? responseData.user ?? {};
        const clientProfile = user.client_profile ?? {};
        const saved = storedProfile ? JSON.parse(storedProfile) : {};
        setProfile({
          fullName: user.fullName ?? saved.fullName ?? 'Client',
          email: user.email ?? '',
          avatarUrl: user.avatar_url ?? saved.avatarUrl ?? null,
          bio: clientProfile.bio ?? saved.bio ?? '',
          city: clientProfile.city ?? saved.city ?? '',
          languages: clientProfile.languages ?? saved.languages ?? [],
          profileVisibility: clientProfile.profileVisibility ?? saved.profileVisibility ?? 'public',
          createdAt: user.createdAt,
        });
        setJobsPosted(jobsResult.total ?? jobsResult.jobs?.length ?? 0);
      } catch (error) {
        console.error('[ClientProfile] Load error:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const initials = useMemo(() => {
    const name = profile?.fullName?.trim() || 'Client';
    const parts = name.split(/\s+/);
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  }, [profile?.fullName]);

  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Continue clearing local auth state.
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'role', 'user', 'hasCompletedProfile']);
      router.replace('/(auth)/login');
    }
  };

  if (loading || !profile) {
    return <SafeAreaView style={styles.container}><View style={styles.loader}><ActivityIndicator size="large" color={C.primary} /></View></SafeAreaView>;
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'New';
  const languages = profile.languages.length > 0
    ? profile.languages.map((language) => LANGUAGE_NAMES[language.code] ?? language.code).join(', ')
    : 'Add languages';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(onboarding)/client-profile')} accessibilityLabel="Edit profile">
            <Ionicons name="pencil-outline" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}
          </View>
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{jobsPosted}</Text><Text style={styles.statLabel}>Jobs Posted</Text></View>
            <View style={styles.divider} />
            <View style={styles.stat}><Text style={styles.statValue}>{profile.city || 'None'}</Text><Text style={styles.statLabel}>Location</Text></View>
            <View style={styles.divider} />
            <View style={styles.stat}><Text style={styles.statValue}>{profile.profileVisibility === 'public' ? 'Public' : 'Private'}</Text><Text style={styles.statLabel}>Visibility</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={profile.bio ? styles.body : styles.placeholder}>{profile.bio || 'Tell providers a little about yourself.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <InfoRow icon="location-outline" label="City" value={profile.city || 'Not set'} C={C} styles={styles} />
          <InfoRow icon="language-outline" label="Languages" value={languages} C={C} styles={styles} />
          <InfoRow icon="eye-outline" label="Profile visibility" value={profile.profileVisibility === 'public' ? 'Public' : 'Private'} C={C} styles={styles} last />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ActionRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/(shared)/notifications')} C={C} styles={styles} />
          <ActionRow icon="settings-outline" label="Settings" onPress={() => router.push('/(shared)/settings')} C={C} styles={styles} last />
        </View>

        <TouchableOpacity style={styles.logout} onPress={() => void handleLogout()}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, C, styles, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; C: AppColors; styles: ReturnType<typeof makeStyles>; last?: boolean }) {
  return <View style={[styles.row, last && styles.lastRow]}><Ionicons name={icon} size={20} color={C.primary} /><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

function ActionRow({ icon, label, onPress, C, styles, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; C: AppColors; styles: ReturnType<typeof makeStyles>; last?: boolean }) {
  return <TouchableOpacity style={[styles.row, last && styles.lastRow]} onPress={onPress}><Ionicons name={icon} size={20} color={C.primary} /><Text style={styles.rowLabel}>{label}</Text><Ionicons name="chevron-forward" size={18} color={C.textHint} /></TouchableOpacity>;
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '700', color: C.textPrimary },
  profileCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 20, alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { marginTop: 12, fontSize: 22, fontWeight: '700', color: C.textPrimary },
  email: { marginTop: 4, fontSize: 13, color: C.textSecondary },
  memberSince: { marginTop: 4, fontSize: 12, color: C.textHint },
  statRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.divider },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: C.primary },
  statLabel: { marginTop: 4, fontSize: 11, color: C.textSecondary },
  divider: { width: 1, height: 30, backgroundColor: C.divider },
  section: { marginTop: 12, padding: 16, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder },
  sectionTitle: { marginBottom: 10, fontSize: 15, fontWeight: '700', color: C.textPrimary },
  body: { fontSize: 14, lineHeight: 21, color: C.textSecondary },
  placeholder: { fontSize: 14, lineHeight: 21, color: C.textHint, fontStyle: 'italic' },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.divider },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 14, color: C.textPrimary },
  rowValue: { maxWidth: '50%', fontSize: 13, color: C.textSecondary, textAlign: 'right' },
  logout: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: C.error },
  logoutText: { fontSize: 14, fontWeight: '600', color: C.error },
});
