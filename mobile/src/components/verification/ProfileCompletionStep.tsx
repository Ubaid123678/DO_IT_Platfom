import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { getMediaUrl } from '@/src/services/api';
import { ProviderTrack, verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const TEAM_SIZES = ['solo', 'with_helper', 'with_team'];
const TRANSPORT_MODES = ['on_foot', 'bicycle', 'motorbike', 'car', 'van'];
const ENGLISH_LEVELS = ['basic', 'intermediate', 'fluent'];
const TIMEZONES = ['UTC-8', 'UTC-5', 'UTC-4', 'UTC-3', 'UTC', 'UTC+1', 'UTC+3', 'UTC+5', 'UTC+8', 'UTC+9', 'Other'];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ur: 'Urdu',
  hi: 'Hindi',
  zh: 'Mandarin',
  de: 'German',
  pt: 'Portuguese',
  other: 'Other',
};

const LABELS: Record<string, string> = {
  on_foot: 'On foot',
  bicycle: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
  van: 'Van',
  solo: 'Solo',
  with_helper: 'With a helper',
  with_team: 'With a team',
  basic: 'Basic',
  intermediate: 'Intermediate',
  fluent: 'Fluent',
};

interface WorkHistoryEntry {
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  start_year?: number;
  end_year?: number;
}

interface FormState {
  headline: string;
  bio: string;
  city: string;
  avatarUrl: string | null;
  publicProfile: boolean;
  languages: string[];
  availabilityDays: string[];
  availabilityShifts: string[];
  hoursPerWeek: string;
  yearsExperience: string;
  serviceRadiusKm: string;
  toolsEquipment: string;
  hourlyRate: string;
  canTravel: boolean;
  teamSize: string;
  insuranceCovered: boolean;
  hasTransport: boolean;
  transportMode: string;
  skills: string;
  techStack: string;
  projectRate: string;
  timezone: string;
  englishProficiency: string;
  resumeFileUrl: string | null;
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  baseFee: string;
  perKmFee: string;
  sameDayExpress: boolean;
  deliveryCapabilities: string;
  maxPayloadKg: string;
  goodsInsuranceCovered: boolean;
  serviceAreaText: string;
}

const emptyWorkHistory = (): WorkHistoryEntry => ({ title: '', company: '', start_date: '', end_date: '', description: '' });
const emptyEducation = (): EducationEntry => ({ institution: '', degree: '', field: '', start_year: undefined, end_year: undefined });

const toNumber = (v: string): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && v.trim().length > 0 ? n : undefined;
};

const has = (v: unknown): boolean => {
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') return Object.keys(v as Record<string, unknown>).length > 0;
  return v !== undefined && v !== null && String(v).trim().length > 0;
};

export default function ProfileCompletionStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const { state, dispatch } = useWizard();
  const router = useRouter();

  const track: ProviderTrack | null = state.isPhysicalCategory
    ? 'physical'
    : state.isDigitalCategory
      ? 'digital'
      : state.isErrandCategory
        ? 'errand'
        : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<ProviderTrack | null>(null);

  const effectiveTrack: ProviderTrack | null = track ?? resolvedTrack;

  const [form, setForm] = useState<FormState>({
    headline: '',
    bio: '',
    city: '',
    avatarUrl: null,
    publicProfile: true,
    languages: [],
    availabilityDays: [],
    availabilityShifts: [],
    hoursPerWeek: '',
    yearsExperience: '',
    serviceRadiusKm: '',
    toolsEquipment: '',
    hourlyRate: '',
    canTravel: true,
    teamSize: '',
    insuranceCovered: false,
    hasTransport: true,
    transportMode: '',
    skills: '',
    techStack: '',
    projectRate: '',
    timezone: '',
    englishProficiency: '',
    resumeFileUrl: null,
    workHistory: [emptyWorkHistory()],
    education: [emptyEducation()],
    baseFee: '',
    perKmFee: '',
    sameDayExpress: false,
    deliveryCapabilities: '',
    maxPayloadKg: '',
    goodsInsuranceCovered: false,
    serviceAreaText: '',
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await verificationService.getProfile();
        const pp = profile.provider_profile ?? {};
        const td = profile.track_data ?? {};
        const physical = td.physical ?? {};
        const digital = td.digital ?? {};
        const errand = td.errand ?? {};
        if (profile.track) setResolvedTrack(profile.track);
        const languageCodes = Array.isArray(pp.languages)
          ? (pp.languages as { code?: string }[]).map((l) => l.code ?? '').filter(Boolean)
          : [];
        const av = pp.availability as { days?: string[]; shifts?: string[]; hours_per_week?: number } | undefined;
        const fallbackAv =
          (td.errand as { working_hours?: { days?: string[]; shifts?: string[]; hours_per_week?: number } } | undefined)?.working_hours ??
          (td.physical as { on_site_availability?: { days?: string[]; shifts?: string[]; hours_per_week?: number } } | undefined)?.on_site_availability;
        const effectiveAv = av?.days?.length ? av : fallbackAv;
        setForm({
          headline: pp.headline ?? '',
          bio: pp.bio ?? '',
          city: pp.city ?? '',
          avatarUrl: pp.avatar_url ?? null,
          publicProfile: pp.public_profile ?? true,
          languages: languageCodes,
          availabilityDays: effectiveAv?.days ?? [],
          availabilityShifts: effectiveAv?.shifts ?? [],
          hoursPerWeek: effectiveAv?.hours_per_week != null ? String(effectiveAv.hours_per_week) : '',
          yearsExperience: physical.years_experience != null ? String(physical.years_experience) : '',
          serviceRadiusKm: physical.service_radius_km != null ? String(physical.service_radius_km) : '',
          toolsEquipment: Array.isArray(physical.tools_equipment) ? (physical.tools_equipment as string[]).join(', ') : '',
          hourlyRate: physical.hourly_rate != null ? String(physical.hourly_rate) : '',
          canTravel: physical.can_travel ?? true,
          teamSize: (physical.team_size as string) ?? '',
          insuranceCovered: (physical.insurance as { covered?: boolean })?.covered ?? false,
          hasTransport: (physical.has_transport as { yes?: boolean })?.yes ?? true,
          transportMode: (physical.has_transport as { mode?: string })?.mode ?? '',
          skills: Array.isArray(digital.skills) ? (digital.skills as string[]).join(', ') : '',
          techStack: Array.isArray(digital.tech_stack) ? (digital.tech_stack as string[]).join(', ') : '',
          projectRate: digital.project_rate != null ? String(digital.project_rate) : '',
          timezone: digital.timezone ?? '',
          englishProficiency: digital.english_proficiency ?? '',
          resumeFileUrl: digital.resume_file_url ?? null,
          workHistory: Array.isArray(digital.work_history) && (digital.work_history as WorkHistoryEntry[]).length > 0
            ? (digital.work_history as WorkHistoryEntry[])
            : [emptyWorkHistory()],
          education: Array.isArray(digital.education) && (digital.education as EducationEntry[]).length > 0
            ? (digital.education as EducationEntry[]).map((e) => ({ ...e, start_year: e.start_year, end_year: e.end_year }))
            : [emptyEducation()],
          baseFee: errand.base_fee != null ? String(errand.base_fee) : '',
          perKmFee: errand.per_km_fee != null ? String(errand.per_km_fee) : '',
          sameDayExpress: errand.same_day_express ?? false,
          deliveryCapabilities: Array.isArray(errand.delivery_capabilities) ? (errand.delivery_capabilities as string[]).join(', ') : '',
          maxPayloadKg: errand.max_payload_kg != null ? String(errand.max_payload_kg) : '',
          goodsInsuranceCovered: (errand.goods_insurance as { covered?: boolean })?.covered ?? false,
          serviceAreaText: errand.service_area ? `${(errand.service_area as { city: string }).city} (${(errand.service_area as { radius_km: number }).radius_km} km)` : '',
        });
        setCompleteness(profile.completeness ?? 0);
        setMissingFields(profile.missing_fields ?? []);
      } catch {
        // Prefill failures fall back to empty form; saving will still work.
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
      const updated = await verificationService.uploadAvatar(asset.uri, mime);
      setForm((prev) => ({ ...prev, avatarUrl: updated.provider_profile.avatar_url ?? asset.uri }));
      setCompleteness(updated.completeness ?? 0);
      setMissingFields(updated.missing_fields ?? []);
    } catch {
      Alert.alert('Error', 'Failed to upload profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploadingResume(true);
      const res = await verificationService.uploadResume(result.assets[0].uri);
      setForm((prev) => ({ ...prev, resumeFileUrl: res.resume_file_url }));
    } catch {
      Alert.alert('Error', 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const buildPayload = () => {
    const providerProfile: Record<string, unknown> = {
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      city: form.city.trim(),
      public_profile: form.publicProfile,
    };
    if (form.avatarUrl) providerProfile.avatar_url = form.avatarUrl;
    if (form.languages.length > 0) {
      providerProfile.languages = form.languages.map((code) => ({ code, level: 'fluent' }));
    }
    if (form.availabilityDays.length > 0) {
      providerProfile.availability = {
        days: form.availabilityDays,
        shifts: form.availabilityShifts,
        hours_per_week: toNumber(form.hoursPerWeek),
      };
    }

    const availabilityBlock = form.availabilityDays.length > 0
      ? { days: form.availabilityDays, shifts: form.availabilityShifts, hours_per_week: toNumber(form.hoursPerWeek) }
      : undefined;

    const trackData: Record<string, Record<string, unknown>> = {};
    if (effectiveTrack === 'physical') {
      const tools = form.toolsEquipment.split(',').map((t) => t.trim()).filter(Boolean);
      trackData.physical = {
        years_experience: toNumber(form.yearsExperience),
        service_radius_km: toNumber(form.serviceRadiusKm),
        tools_equipment: tools,
        hourly_rate: toNumber(form.hourlyRate),
        on_site_availability: availabilityBlock,
        can_travel: form.canTravel,
        team_size: form.teamSize || undefined,
        insurance: form.insuranceCovered ? { covered: true } : undefined,
        has_transport: { yes: form.hasTransport, mode: form.hasTransport ? form.transportMode || undefined : undefined },
      };
    } else if (effectiveTrack === 'digital') {
      const workHistory = form.workHistory
        .filter((w) => w.title.trim() || w.company.trim())
        .map((w) => ({ title: w.title.trim(), company: w.company.trim(), start_date: w.start_date.trim(), end_date: w.end_date?.trim() || undefined, description: w.description?.trim() || undefined }));
      const education = form.education
        .filter((e) => e.institution.trim() || e.degree.trim())
        .map((e) => ({ institution: e.institution.trim(), degree: e.degree.trim(), field: e.field?.trim() || undefined, start_year: toNumber(String(e.start_year ?? '')), end_year: toNumber(String(e.end_year ?? '')) }));
      trackData.digital = {
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        tech_stack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        hourly_rate: toNumber(form.hourlyRate),
        project_rate: toNumber(form.projectRate),
        timezone: form.timezone || undefined,
        english_proficiency: form.englishProficiency || undefined,
        work_history: workHistory.length > 0 ? workHistory : undefined,
        education: education.length > 0 ? education : undefined,
        resume_file_url: form.resumeFileUrl ?? undefined,
      };
    } else if (effectiveTrack === 'errand') {
      const caps = form.deliveryCapabilities.split(',').map((c) => c.trim()).filter(Boolean);
      trackData.errand = {
        transport_mode: form.transportMode || undefined,
        base_fee: toNumber(form.baseFee),
        per_km_fee: toNumber(form.perKmFee),
        working_hours: availabilityBlock,
        same_day_express: form.sameDayExpress,
        delivery_capabilities: caps,
        max_payload_kg: toNumber(form.maxPayloadKg),
        goods_insurance: form.goodsInsuranceCovered ? { covered: true } : undefined,
      };
    }

    return { provider_profile: providerProfile, track_data: trackData };
  };

  const computeLiveCompleteness = (): number => {
    const required: boolean[] = [
      has(form.avatarUrl),
      has(form.headline),
      has(form.bio),
      form.languages.length > 0,
      has(form.city),
      form.availabilityDays.length > 0,
    ];
    let requiredDone = required.filter(Boolean).length;
    const requiredTotal = required.length;
    let optionalDone = 0;
    let optionalTotal = 1;
    if (effectiveTrack === 'physical') {
      const req = [has(form.yearsExperience), has(form.serviceRadiusKm), has(form.toolsEquipment), has(form.hourlyRate), form.availabilityDays.length > 0];
      requiredDone += req.filter(Boolean).length;
      optionalTotal = 3;
      optionalDone = [has(form.teamSize), form.insuranceCovered, form.hasTransport].filter(Boolean).length;
      const per = (requiredDone / (requiredTotal + req.length)) * 60 + (optionalDone / optionalTotal) * 40;
      return Math.round(Math.min(100, Math.max(0, per)));
    }
    if (track === 'digital') {
      const req = [has(form.skills), has(form.techStack), has(form.hourlyRate), has(form.timezone), has(form.englishProficiency), form.workHistory.some((w) => w.title.trim() && w.company.trim())];
      requiredDone += req.filter(Boolean).length;
      optionalTotal = 3;
      optionalDone = [has(form.projectRate), form.education.some((e) => e.institution.trim() && e.degree.trim()), has(form.resumeFileUrl)].filter(Boolean).length;
      const per = (requiredDone / (requiredTotal + req.length)) * 60 + (optionalDone / optionalTotal) * 40;
      return Math.round(Math.min(100, Math.max(0, per)));
    }
    if (track === 'errand') {
      const req = [has(form.serviceAreaText), has(form.transportMode), has(form.baseFee), has(form.perKmFee), form.availabilityDays.length > 0];
      requiredDone += req.filter(Boolean).length;
      optionalTotal = 3;
      optionalDone = [has(form.maxPayloadKg), form.sameDayExpress, form.goodsInsuranceCovered].filter(Boolean).length;
      const per = (requiredDone / (requiredTotal + req.length)) * 60 + (optionalDone / optionalTotal) * 40;
      return Math.round(Math.min(100, Math.max(0, per)));
    }
    return Math.round((requiredDone / requiredTotal) * 100);
  };

  const liveCompleteness = computeLiveCompleteness();

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const profile = await verificationService.updateProfile(payload);
      setCompleteness(profile.completeness ?? liveCompleteness);
      setMissingFields(profile.missing_fields ?? []);
      await verificationService.markVerificationComplete().catch(() => {});
      dispatch({ type: 'SET_RESUME_BIO_COMPLETE' });
      router.replace('/(provider)/home');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save profile.';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await verificationService.markVerificationComplete().catch(() => {});
    router.replace('/(provider)/home');
  };

  const toggleChip = (key: 'languages' | 'availabilityDays' | 'availabilityShifts', value: string): void => {
    setForm((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistoryEntry, value: string): void => {
    setForm((prev) => {
      const next = prev.workHistory.map((w, i) => (i === index ? { ...w, [field]: value } : w));
      return { ...prev, workHistory: next };
    });
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string): void => {
    setForm((prev) => {
      const next = prev.education.map((e, i) => (i === index ? { ...e, [field]: value } : e));
      return { ...prev, education: next };
    });
  };

  const renderChips = (options: string[], selected: string[], onToggle: (v: string) => void): React.ReactNode => (
    <View style={styles.chipWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity key={opt} onPress={() => onToggle(opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{LABELS[opt] ?? opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSectionHeader = (icon: keyof typeof Ionicons.glyphMap, title: string, hint?: string): React.ReactNode => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={C.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
    </View>
  );

  const renderField = (label: string, value: string, onChange: (v: string) => void, opts: { placeholder?: string; multiline?: boolean; number?: boolean; required?: boolean; maxLength?: number } = {}): React.ReactNode => (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
        {opts.required ? <Text style={styles.fieldRequired}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, opts.multiline && styles.textArea]}
        placeholder={opts.placeholder}
        placeholderTextColor={C.textHint}
        value={value}
        onChangeText={onChange}
        multiline={opts.multiline}
        numberOfLines={opts.multiline ? 4 : 1}
        textAlignVertical={opts.multiline ? 'top' : 'center'}
        keyboardType={opts.number ? 'decimal-pad' : 'default'}
        maxLength={opts.maxLength}
      />
    </View>
  );

  const renderBool = (label: string, hint: string | undefined, value: boolean, onChange: (v: boolean) => void): React.ReactNode => (
    <View style={styles.boolRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.boolLabel}>{label}</Text>
        {hint ? <Text style={styles.boolHint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const trackLabel = effectiveTrack === 'physical' ? 'Physical Services' : effectiveTrack === 'digital' ? 'Digital Services' : effectiveTrack === 'errand' ? 'Errands & Delivery' : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your {trackLabel} profile</Text>
        <Text style={styles.subtitle}>Optional — you can do this anytime. A complete profile gets more client responses.</Text>

        <View style={styles.completenessCard}>
          <View style={styles.completenessTextWrap}>
            <Text style={styles.completenessTitle}>Profile strength</Text>
            <Text style={styles.completenessSub}>
              {liveCompleteness >= 100 ? 'Looks great! You are ready to apply.' : `Add ${missingFields.length > 0 ? missingFields.join(', ') : 'more details'} to boost your profile.`}
            </Text>
          </View>
          <View style={styles.completenessRing}>
            <Text style={styles.completenessPct}>{liveCompleteness}%</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('person-circle-outline', 'Basic info', 'Shown to clients on your public profile')}

          <TouchableOpacity style={styles.avatarRow} onPress={pickAvatar} activeOpacity={0.7}>
            {form.avatarUrl ? (
              <Image source={{ uri: getMediaUrl(form.avatarUrl) }} style={styles.avatarPreview} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={22} color={C.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.avatarTitle}>{form.avatarUrl ? 'Change profile photo' : 'Add a profile photo'}</Text>
              <Text style={styles.avatarHint}>{uploadingAvatar ? 'Uploading...' : 'A clear photo builds trust. Max 10MB.'}</Text>
            </View>
            <Ionicons name="cloud-upload-outline" size={20} color={C.primary} />
          </TouchableOpacity>

          <View style={styles.fieldGap}>
            {renderField('Headline', form.headline, (v) => setField('headline', v), { placeholder: 'e.g. Certified Electrician with 10 years experience', required: true, maxLength: 80 })}
          </View>
          <View style={styles.fieldGap}>
            {renderField('Bio', form.bio, (v) => setField('bio', v), { placeholder: 'Tell clients about your experience and expertise...', multiline: true, required: true, maxLength: 500 })}
          </View>
          <View style={styles.fieldGap}>
            {renderField('City', form.city, (v) => setField('city', v), { placeholder: 'e.g. Lahore', required: true })}
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Languages <Text style={styles.fieldRequired}>*</Text></Text>
            {renderChips(Object.keys(LANGUAGE_NAMES), form.languages, (v) => toggleChip('languages', v))}
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Availability days <Text style={styles.fieldRequired}>*</Text></Text>
            {renderChips(ALL_DAYS, form.availabilityDays, (v) => toggleChip('availabilityDays', v))}
          </View>
          <View style={styles.fieldGap}>
            <Text style={styles.fieldLabel}>Shifts</Text>
            {renderChips(ALL_SHIFTS, form.availabilityShifts, (v) => toggleChip('availabilityShifts', v))}
          </View>
          <View style={styles.fieldGap}>
            {renderField('Hours per week', form.hoursPerWeek, (v) => setField('hoursPerWeek', v), { placeholder: 'e.g. 40', number: true })}
          </View>

          <View style={styles.boolRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.boolLabel}>Visible to clients</Text>
              <Text style={styles.boolHint}>Keep your profile public so clients can find you.</Text>
            </View>
            <Switch value={form.publicProfile} onValueChange={(v) => setField('publicProfile', v)} trackColor={{ false: C.cardBorder, true: C.primary }} thumbColor="white" />
          </View>
        </View>

        {effectiveTrack === 'physical' && (
          <View style={styles.sectionCard}>
            {renderSectionHeader('construct-outline', 'Physical services details', 'For on-site trades — tools, travel and rates')}

            <View style={styles.fieldGap}>
              {renderField('Years of experience', form.yearsExperience, (v) => setField('yearsExperience', v), { placeholder: 'e.g. 5', number: true, required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Service radius (km)', form.serviceRadiusKm, (v) => setField('serviceRadiusKm', v), { placeholder: 'e.g. 15', number: true, required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Tools & equipment', form.toolsEquipment, (v) => setField('toolsEquipment', v), { placeholder: 'e.g. Power drill, ladder, paint kit', required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Hourly rate ($)', form.hourlyRate, (v) => setField('hourlyRate', v), { placeholder: 'e.g. 25', number: true, required: true })}
            </View>

            <View style={styles.fieldGap}>
              <Text style={styles.fieldLabel}>Team size</Text>
              {renderChips(TEAM_SIZES, form.teamSize ? [form.teamSize] : [], (v) => setField('teamSize', v))}
            </View>

            {renderBool('Can travel to client', 'Willing to visit client locations within your radius', form.canTravel, (v) => setField('canTravel', v))}
            {renderBool('Have insurance', 'Public liability or work coverage', form.insuranceCovered, (v) => setField('insuranceCovered', v))}
            {renderBool('Have transport', 'You can carry equipment yourself', form.hasTransport, (v) => setField('hasTransport', v))}
            {form.hasTransport && (
              <View style={styles.fieldGap}>
                <Text style={styles.fieldLabel}>Transport mode</Text>
                {renderChips(['bicycle', 'motorbike', 'car'], form.transportMode ? [form.transportMode] : [], (v) => setField('transportMode', v))}
              </View>
            )}
          </View>
        )}

        {effectiveTrack === 'digital' && (
          <View style={styles.sectionCard}>
            {renderSectionHeader('code-slash-outline', 'Digital services details', 'Skills, rates and professional background')}

            <View style={styles.fieldGap}>
              {renderField('Skills', form.skills, (v) => setField('skills', v), { placeholder: 'e.g. React, Node.js, UI design', required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Tech stack', form.techStack, (v) => setField('techStack', v), { placeholder: 'e.g. TypeScript, Expo, PostgreSQL', required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Hourly rate ($)', form.hourlyRate, (v) => setField('hourlyRate', v), { placeholder: 'e.g. 30', number: true, required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Project rate ($, optional)', form.projectRate, (v) => setField('projectRate', v), { placeholder: 'e.g. 500', number: true })}
            </View>

            <View style={styles.fieldGap}>
              <Text style={styles.fieldLabel}>Timezone <Text style={styles.fieldRequired}>*</Text></Text>
              {renderChips(TIMEZONES, form.timezone ? [form.timezone] : [], (v) => setField('timezone', v))}
            </View>
            <View style={styles.fieldGap}>
              <Text style={styles.fieldLabel}>English proficiency <Text style={styles.fieldRequired}>*</Text></Text>
              {renderChips(ENGLISH_LEVELS, form.englishProficiency ? [form.englishProficiency] : [], (v) => setField('englishProficiency', v))}
            </View>

            <View style={styles.resumeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Resume (PDF/DOC)</Text>
                <Text style={styles.uploadHint}>Max 5MB — helps clients verify your background.</Text>
              </View>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickResume} disabled={uploadingResume}>
                {uploadingResume ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : form.resumeFileUrl ? (
                  <Text style={styles.uploadDone}>Uploaded</Text>
                ) : (
                  <Ionicons name="cloud-upload-outline" size={20} color={C.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>Work history <Text style={styles.fieldRequired}>*</Text> (at least one)</Text>
              <TouchableOpacity onPress={() => setField('workHistory', [...form.workHistory, emptyWorkHistory()])}>
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
              </TouchableOpacity>
            </View>
            {form.workHistory.map((w, i) => (
              <View key={i} style={styles.entryCard}>
                <TextInput style={styles.input} placeholder="Job title" placeholderTextColor={C.textHint} value={w.title} onChangeText={(v) => updateWorkHistory(i, 'title', v)} />
                <View style={styles.fieldGap}>
                  <TextInput style={styles.input} placeholder="Company" placeholderTextColor={C.textHint} value={w.company} onChangeText={(v) => updateWorkHistory(i, 'company', v)} />
                </View>
                <View style={styles.entryRow}>
                  <TextInput style={[styles.input, styles.entryInput]} placeholder="Start (e.g. 2021-03)" placeholderTextColor={C.textHint} value={w.start_date} onChangeText={(v) => updateWorkHistory(i, 'start_date', v)} />
                  <TextInput style={[styles.input, styles.entryInput]} placeholder="End (e.g. 2023-08)" placeholderTextColor={C.textHint} value={w.end_date ?? ''} onChangeText={(v) => updateWorkHistory(i, 'end_date', v)} />
                </View>
                <View style={styles.fieldGap}>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Short description (optional)" placeholderTextColor={C.textHint} value={w.description ?? ''} onChangeText={(v) => updateWorkHistory(i, 'description', v)} multiline textAlignVertical="top" />
                </View>
                {form.workHistory.length > 1 && (
                  <TouchableOpacity onPress={() => setField('workHistory', form.workHistory.filter((_, idx) => idx !== i))}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>Education</Text>
              <TouchableOpacity onPress={() => setField('education', [...form.education, emptyEducation()])}>
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
              </TouchableOpacity>
            </View>
            {form.education.map((e, i) => (
              <View key={i} style={styles.entryCard}>
                <TextInput style={styles.input} placeholder="Institution" placeholderTextColor={C.textHint} value={e.institution} onChangeText={(v) => updateEducation(i, 'institution', v)} />
                <View style={styles.fieldGap}>
                  <TextInput style={styles.input} placeholder="Degree" placeholderTextColor={C.textHint} value={e.degree} onChangeText={(v) => updateEducation(i, 'degree', v)} />
                </View>
                <View style={styles.entryRow}>
                  <TextInput style={[styles.input, styles.entryInput]} placeholder="Start year" placeholderTextColor={C.textHint} value={e.start_year ? String(e.start_year) : ''} onChangeText={(v) => updateEducation(i, 'start_year', v)} keyboardType="number-pad" />
                  <TextInput style={[styles.input, styles.entryInput]} placeholder="End year" placeholderTextColor={C.textHint} value={e.end_year ? String(e.end_year) : ''} onChangeText={(v) => updateEducation(i, 'end_year', v)} keyboardType="number-pad" />
                </View>
                {form.education.length > 1 && (
                  <TouchableOpacity onPress={() => setField('education', form.education.filter((_, idx) => idx !== i))}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {effectiveTrack === 'errand' && (
          <View style={styles.sectionCard}>
            {renderSectionHeader('bicycle-outline', 'Errands & delivery details', 'Fees, working hours and delivery options')}

            {has(form.serviceAreaText) && (
              <View style={styles.verifiedArea}>
                <Ionicons name="shield-checkmark" size={18} color={C.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifiedAreaTitle}>Service area (verified)</Text>
                  <Text style={styles.verifiedAreaText}>{form.serviceAreaText}</Text>
                </View>
              </View>
            )}

            <View style={styles.fieldGap}>
              <Text style={styles.fieldLabel}>Transport mode <Text style={styles.fieldRequired}>*</Text></Text>
              {renderChips(TRANSPORT_MODES, form.transportMode ? [form.transportMode] : [], (v) => setField('transportMode', v))}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Base fee ($)', form.baseFee, (v) => setField('baseFee', v), { placeholder: 'e.g. 2', number: true, required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Per-km fee ($)', form.perKmFee, (v) => setField('perKmFee', v), { placeholder: 'e.g. 0.5', number: true, required: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Max payload (kg)', form.maxPayloadKg, (v) => setField('maxPayloadKg', v), { placeholder: 'e.g. 20', number: true })}
            </View>
            <View style={styles.fieldGap}>
              {renderField('Delivery capabilities', form.deliveryCapabilities, (v) => setField('deliveryCapabilities', v), { placeholder: 'e.g. Documents, Groceries, Parcels' })}
            </View>

            {renderBool('Same-day express', 'Offer express delivery within working hours', form.sameDayExpress, (v) => setField('sameDayExpress', v))}
            {renderBool('Goods insurance', 'Coverage for items being delivered', form.goodsInsuranceCovered, (v) => setField('goodsInsuranceCovered', v))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={saving}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save & Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
    title: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 4, marginTop: 8 },
    subtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
    completenessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 20 },
    completenessTextWrap: { flex: 1 },
    completenessTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
    completenessSub: { fontSize: 12, color: C.textSecondary, lineHeight: 17 },
    completenessRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    completenessPct: { fontSize: 16, fontWeight: '800', color: C.primary },
    sectionCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    sectionHint: { fontSize: 11, color: C.textHint, marginTop: 1 },
    fieldGap: { marginBottom: 12 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6 },
    fieldRequired: { color: C.error },
    input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, height: 48, paddingHorizontal: 12, fontSize: 14, color: C.textPrimary },
    textArea: { height: 96, paddingTop: 12 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.inputBg },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    boolRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    boolLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    boolHint: { fontSize: 11, color: C.textHint, marginTop: 1 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, padding: 12, marginBottom: 14 },
    avatarPreview: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    avatarHint: { fontSize: 11, color: C.textHint, marginTop: 2 },
    resumeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, padding: 12, marginTop: 14 },
    uploadTitle: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
    uploadHint: { fontSize: 11, color: C.textHint, marginTop: 2 },
    uploadBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, minWidth: 64 },
    uploadDone: { fontSize: 12, fontWeight: '600', color: C.success },
    subSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
    subSectionTitle: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
    entryCard: { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.inputBorder, padding: 12, marginBottom: 10 },
    entryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    entryInput: { flex: 1 },
    removeText: { fontSize: 12, color: C.error, marginTop: 8, fontWeight: '600' },
    verifiedArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight, borderRadius: 12, padding: 12, marginBottom: 12, gap: 10 },
    verifiedAreaTitle: { fontSize: 13, fontWeight: '700', color: C.primary },
    verifiedAreaText: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: C.background },
    skipBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: C.divider },
    skipText: { fontSize: 14, fontWeight: '600', color: C.textHint },
    saveBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, height: 52, borderRadius: 12 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });

