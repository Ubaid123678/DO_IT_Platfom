import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';
import { authService } from '@/src/services/authService';

const LANGUAGE_CODES = ['en', 'es', 'fr', 'ar', 'ur', 'hi', 'zh', 'de', 'pt'];
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', ar: 'Arabic',
  ur: 'Urdu', hi: 'Hindi', zh: 'Mandarin', de: 'German', pt: 'Portuguese',
};

export default function ClientProfileCompletionScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    city: '',
    avatarUrl: null as string | null,
    languages: [{ code: 'en', level: 'fluent' as const }],
    notificationEmail: true,
    notificationPush: true,
    notificationSms: false,
    profileVisibility: 'public' as 'public' | 'private',
  });

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [userRaw, profileRaw] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('clientProfile'),
        ]);
        if (userRaw) {
          const user = JSON.parse(userRaw);
          setForm((prev) => ({
            ...prev,
            fullName: user.fullName ?? '',
            bio: user.client_profile?.bio ?? user.bio ?? '',
            city: user.client_profile?.city ?? user.city ?? '',
            avatarUrl: user.avatar_url ?? null,
            languages: user.client_profile?.languages ?? prev.languages,
            notificationEmail: user.client_profile?.notificationEmail ?? prev.notificationEmail,
            notificationPush: user.client_profile?.notificationPush ?? prev.notificationPush,
            notificationSms: user.client_profile?.notificationSms ?? prev.notificationSms,
            profileVisibility: user.client_profile?.profileVisibility ?? prev.profileVisibility,
          }));
        }
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          setForm((prev) => ({
            ...prev,
            fullName: profile.fullName ?? prev.fullName,
            bio: profile.bio ?? prev.bio,
            city: profile.city ?? prev.city,
            languages: profile.languages ?? prev.languages,
            notificationEmail: profile.notificationEmail ?? prev.notificationEmail,
            notificationPush: profile.notificationPush ?? prev.notificationPush,
            notificationSms: profile.notificationSms ?? prev.notificationSms,
            profileVisibility: profile.profileVisibility ?? prev.profileVisibility,
            avatarUrl: profile.avatarUrl ?? prev.avatarUrl,
          }));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setUploadingAvatar(true);
      const mime = asset.mimeType ?? 'image/jpeg';
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const updated = await authService.uploadAvatar(`data:${mime};base64,${base64}`);
      setForm((prev) => ({ ...prev, avatarUrl: updated.data.data.avatar_url ?? asset.uri }));
    } catch (e) {
      console.error('Avatar upload error:', e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) return;
    setSaving(true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        await authService.updateMe(accessToken, {
          fullName: form.fullName.trim(),
          clientProfile: {
            bio: form.bio.trim(),
            city: form.city.trim(),
            languages: form.languages,
            notificationEmail: form.notificationEmail,
            notificationPush: form.notificationPush,
            notificationSms: form.notificationSms,
            profileVisibility: form.profileVisibility,
          },
        });
      }

      // Also store locally as backup/sync
      const profileData = {
        fullName: form.fullName.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        languages: form.languages,
        notificationEmail: form.notificationEmail,
        notificationPush: form.notificationPush,
        notificationSms: form.notificationSms,
        profileVisibility: form.profileVisibility,
        avatarUrl: form.avatarUrl,
        completedAt: new Date().toISOString(),
      };
      await AsyncStorage.multiSet([
        ['hasCompletedProfile', 'true'],
        ['clientProfile', JSON.stringify(profileData)],
      ]);
      router.replace('/(client)/home');
    } catch (e) {
      console.error('Save profile error:', e);
      // Fallback: store locally even if API fails
      try {
        const profileData = {
          fullName: form.fullName.trim(),
          bio: form.bio.trim(),
          city: form.city.trim(),
          languages: form.languages,
          notificationEmail: form.notificationEmail,
          notificationPush: form.notificationPush,
          notificationSms: form.notificationSms,
          profileVisibility: form.profileVisibility,
          avatarUrl: form.avatarUrl,
          completedAt: new Date().toISOString(),
        };
        await AsyncStorage.multiSet([
          ['hasCompletedProfile', 'true'],
          ['clientProfile', JSON.stringify(profileData)],
        ]);
        router.replace('/(client)/home');
      } catch {
        console.error('Local storage fallback failed:', e);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasCompletedProfile', 'true');
    router.replace('/(client)/home');
  };

  const initials = useMemo(() => {
    const parts = form.fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [form.fullName]);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.progressLabel}>Step 3 of 3</Text>

          <TouchableOpacity style={styles.avatarRow} onPress={pickAvatar} activeOpacity={0.7}>
            {form.avatarUrl ? (
              <Image source={{ uri: form.avatarUrl }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials || '+'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.avatarTitle}>{form.avatarUrl ? 'Change photo' : 'Add profile photo'}</Text>
              <Text style={styles.avatarHint}>{uploadingAvatar ? 'Uploading...' : 'A clear photo builds trust. Max 10MB.'}</Text>
            </View>
            <Ionicons name="camera" size={22} color={C.primary} />
          </TouchableOpacity>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Full Name <Text style={styles.fieldRequired}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Johnson"
              value={form.fullName}
              onChangeText={(v) => setField('fullName', v)}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell providers about yourself..."
              value={form.bio}
              onChangeText={(v) => setField('bio', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lahore"
              value={form.city}
              onChangeText={(v) => setField('city', v)}
              autoCapitalize="words"
              autoComplete="address-line2"
            />
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Languages</Text>
            <View style={styles.chipWrap}>
              {form.languages.map((l, i) => (
                <View key={`${l.code}-${i}`} style={styles.chip}>
                  <Text style={styles.chipText}>{LANGUAGE_NAMES[l.code] || l.code}</Text>
                  <TouchableOpacity onPress={() => setField('languages', form.languages.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close" size={14} color={C.textHint} />
                  </TouchableOpacity>
                </View>
              ))}
              {LANGUAGE_CODES.filter((code) => !form.languages.some((language) => language.code === code)).map((code) => (
                <TouchableOpacity key={code} onPress={() => setField('languages', [...form.languages, { code, level: 'fluent' }])} style={styles.addChip}>
                  <Ionicons name="add" size={14} color={C.primary} />
                  <Text style={styles.addChipText}>{LANGUAGE_NAMES[code]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.notificationToggle}>
            <View style={styles.toggleWrap}>
              <Text style={styles.toggleLabel}>Email</Text>
              <Text style={styles.toggleDesc}>Job updates, proposals, messages</Text>
            </View>
            <Switch value={form.notificationEmail} onValueChange={(v) => setField('notificationEmail', v)} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
          </View>

          <View style={styles.notificationToggle}>
            <View style={styles.toggleWrap}>
              <Text style={styles.toggleLabel}>Push</Text>
              <Text style={styles.toggleDesc}>Real-time alerts</Text>
            </View>
            <Switch value={form.notificationPush} onValueChange={(v) => setField('notificationPush', v)} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
          </View>

          <View style={styles.notificationToggle}>
            <View style={styles.toggleWrap}>
              <Text style={styles.toggleLabel}>SMS</Text>
              <Text style={styles.toggleDesc}>Important updates only</Text>
            </View>
            <Switch value={form.notificationSms} onValueChange={(v) => setField('notificationSms', v)} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Profile Visibility</Text>
            <View style={styles.chipWrap}>
              {(['public', 'private'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, form.profileVisibility === opt && styles.chipActive]}
                  onPress={() => setField('profileVisibility', opt)}
                >
                  <Text style={[styles.chipText, form.profileVisibility === opt && styles.chipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={saving}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || !form.fullName.trim()}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save & Continue</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    keyboardAvoiding: { flex: 1 },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
    skipText: { fontSize: 14, color: C.primary, fontWeight: '600' },
    progressBar: { height: 4, backgroundColor: C.cardBorder, borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 2 },
    progressLabel: { fontSize: 12, color: C.textHint, textAlign: 'center', marginTop: 4 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, padding: 12, marginBottom: 14 },
    avatarPreview: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarInitials: { fontSize: 20, fontWeight: '700', color: '#fff' },
    avatarTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    avatarHint: { fontSize: 11, color: C.textHint, marginTop: 2 },
    fieldGap: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6 },
    fieldRequired: { color: C.error },
    input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 48, paddingHorizontal: 12, fontSize: 14, color: C.textPrimary },
    textArea: { height: 96, paddingTop: 12 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
    chipText: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    addChip: { backgroundColor: C.primaryLight, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
    addChipText: { fontSize: 12, color: C.primary, fontWeight: '500' },
    sectionHeader: { marginTop: 24, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
    notificationToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.divider },
    toggleWrap: { flex: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    toggleDesc: { fontSize: 11, color: C.textHint, marginTop: 1 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: C.divider },
    saveBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });