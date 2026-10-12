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
const LANGUAGE_LEVELS = ['basic', 'intermediate', 'fluent'] as const;

export default function ClientProfileCompletionScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    city: '',
    avatarUrl: null as string | null,
    languages: [] as { code: string; level: (typeof LANGUAGE_LEVELS)[number] }[],
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
        // Server is the single source of truth. No cached copy is read, so a
        // previous account's data can never bleed into a new user's form.
        const res = await authService.getMe();
        const shape = res.data as unknown as { data?: { user?: any }; user?: any };
        const user = shape.data?.user ?? shape.user ?? {};
        const p = user.client_profile ?? {};
        setForm((prev) => ({
          ...prev,
          fullName: user.fullName ?? '',
          bio: p.bio ?? '',
          city: p.city ?? '',
          avatarUrl: user.avatar_url ?? null,
          languages: Array.isArray(p.languages) ? p.languages : [],
          notificationEmail: p.notificationEmail ?? prev.notificationEmail,
          notificationPush: p.notificationPush ?? prev.notificationPush,
          notificationSms: p.notificationSms ?? prev.notificationSms,
          profileVisibility: p.profileVisibility ?? prev.profileVisibility,
        }));
      } catch {
        // Fall back to the name stored on the account so the form isn't blank.
        try {
          const userRaw = await AsyncStorage.getItem('user');
          if (userRaw) {
            const user = JSON.parse(userRaw);
            setForm((prev) => ({ ...prev, fullName: user.fullName ?? '' }));
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Live completion: the same required fields the backend checks.
  const completion = useMemo(() => {
    const checks = [
      form.fullName.trim().length >= 2,
      form.city.trim().length > 0,
      form.bio.trim().length > 0,
      form.languages.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form.fullName, form.city, form.bio, form.languages]);

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
    setError('');
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) throw new Error('Session expired. Please sign in again.');

      const res = await authService.updateMe(accessToken, {
        fullName: form.fullName.trim(),
        clientProfile: {
          fullName: form.fullName.trim(),
          bio: form.bio.trim(),
          city: form.city.trim(),
          languages: form.languages,
          notificationEmail: form.notificationEmail,
          notificationPush: form.notificationPush,
          notificationSms: form.notificationSms,
          profileVisibility: form.profileVisibility,
        },
      });

      // Keep the cached user in sync with what the server just confirmed.
      const shape = res.data as unknown as { data?: { user?: any }; user?: any };
      const savedUser = shape.data?.user ?? shape.user;
      if (savedUser) {
        await AsyncStorage.setItem('user', JSON.stringify(savedUser));
      }
      router.replace('/(client)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = useMemo(() => {    const parts = form.fullName.trim().split(/\s+/);
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
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{completion}% complete</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={C.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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
            <Text style={styles.fieldHint}>Tap a language to add it, then pick your level.</Text>

            {form.languages.map((l, i) => (
              <View key={`${l.code}-${i}`} style={styles.langRow}>
                <Text style={styles.langName}>{LANGUAGE_NAMES[l.code] || l.code}</Text>
                <View style={styles.levelWrap}>
                  {LANGUAGE_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.levelChip, l.level === level && styles.levelChipActive]}
                      onPress={() =>
                        setField(
                          'languages',
                          form.languages.map((x, idx) => (idx === i ? { ...x, level } : x)),
                        )
                      }
                    >
                      <Text style={[styles.levelChipText, l.level === level && styles.levelChipTextActive]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setField('languages', form.languages.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close-circle" size={20} color={C.textHint} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.chipWrap}>
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
          <TouchableOpacity
            style={[styles.saveBtn, !form.fullName.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !form.fullName.trim()}
          >
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
    fieldHint: { fontSize: 11, color: C.textHint, marginBottom: 8 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errorBg, borderRadius: 10, padding: 12, marginTop: 12 },
    errorText: { flex: 1, fontSize: 12, color: C.error },
    langRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.divider },
    langName: { width: 78, fontSize: 13, fontWeight: '600', color: C.textPrimary },
    levelWrap: { flex: 1, flexDirection: 'row', gap: 6 },
    levelChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBg },
    levelChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    levelChipText: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
    levelChipTextActive: { color: '#fff', fontWeight: '600' },
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
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });