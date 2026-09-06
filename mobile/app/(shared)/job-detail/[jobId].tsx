import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { jobService, type Job, type JobStatus } from '@/src/services/jobService';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  resolved: 'Resolved',
};

const JOB_TYPE_LABELS: Record<Job['type'], string> = {
  physical: 'Physical Service',
  digital: 'Digital Service',
  errand: 'Errand & Delivery',
};

const formatBudget = (budget: Job['budget']): string => {
  const amount = budget.amount / 100;
  if (budget.type === 'hourly') {
    return `$${amount.toFixed(2)} total (${budget.hourlyRate}/hr × ${budget.estimatedHours}hrs est.)`;
  }
  return `$${amount.toFixed(2)} fixed price`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusColor = (status: JobStatus, C: AppColors): string => {
  switch (status) {
    case 'open':
      return C.success;
    case 'in_progress':
      return C.primary;
    case 'completed':
      return C.success;
    case 'cancelled':
      return C.error;
    case 'disputed':
      return C.warning;
    case 'resolved':
      return C.textSecondary;
    default:
      return C.textSecondary;
  }
};

const getAvailableTransitions = (status: JobStatus, isOwner: boolean, isAssignedProvider: boolean): JobStatus[] => {
  const transitions: Record<JobStatus, { client: JobStatus[]; provider: JobStatus[] }> = {
    open: { client: ['cancelled'], provider: [] },
    in_progress: { client: ['completed', 'cancelled', 'disputed'], provider: ['completed', 'cancelled', 'disputed'] },
    completed: { client: ['disputed'], provider: ['disputed'] },
    cancelled: { client: [], provider: [] },
    disputed: { client: [], provider: [] },
    resolved: { client: [], provider: [] },
  };

  if (isOwner) return transitions[status]?.client || [];
  if (isAssignedProvider) return transitions[status]?.provider || [];
  return [];
};

export default function JobDetailScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await jobService.getJobById(jobId);
        setJob(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load job';
        Alert.alert('Error', msg);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId, router]);

  const handleStatusTransition = async (newStatus: JobStatus) => {
    setSaving(true);
    try {
      const updated = await jobService.transitionStatus(jobId, newStatus);
      setJob(updated);
      setShowActions(false);
      Alert.alert('Success', `Job status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update status';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const showActionSheet = () => {
    if (!job) return;
    const transitions = getAvailableTransitions(job.status, job.isOwner || false, job.isAssignedProvider || false);
    if (transitions.length === 0) {
      Alert.alert('No actions available', 'No status transitions available for your role');
      return;
    }
    setShowActions(true);
  };

  if (loading) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaViewCompat>
    );
  }

  if (!job) return null;

  const availableTransitions = getAvailableTransitions(job.status, job.isOwner || false, job.isAssignedProvider || false);

  return (
    <SafeAreaViewCompat style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status, C) }]}>
              <Text style={styles.statusBadgeText}>{STATUS_LABELS[job.status]}</Text>
            </View>
          </View>
          {availableTransitions.length > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={showActionSheet} disabled={saving}>
              <Ionicons name={saving ? 'refresh' : 'settings-outline'} size={24} color={C.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Job type badge */}
        <View style={styles.typeBadgeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: job.type === 'physical' ? C.primary : job.type === 'digital' ? '#6C5CE7' : '#E17055' }]}>
            <Text style={styles.typeBadgeText}>{JOB_TYPE_LABELS[job.type]}</Text>
          </View>
          {job.metadata.isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{job.title}</Text>

        {/* Budget & Meta */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Ionicons name="cash-outline" size={20} color={C.primary} />
            <Text style={styles.metaLabel}>Budget</Text>
            <Text style={styles.metaValue}>{formatBudget(job.budget)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Ionicons name="calendar-outline" size={20} color={C.primary} />
            <Text style={styles.metaLabel}>Posted</Text>
            <Text style={styles.metaValue}>{formatDate(job.createdAt)}</Text>
          </View>
          {job.location.city && (
            <View style={styles.metaCard}>
              <Ionicons name="location-outline" size={20} color={C.primary} />
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{job.location.city}{job.location.country ? `, ${job.location.country}` : ''}</Text>
            </View>
          )}
          {job.schedule.startsAt && (
            <View style={styles.metaCard}>
              <Ionicons name="time-outline" size={20} color={C.primary} />
              <Text style={styles.metaLabel}>Starts</Text>
              <Text style={styles.metaValue}>{formatDate(job.schedule.startsAt)}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsGrid}>
            {(job.requirements.categories || []).map((catId, i) => (
              <View key={i} style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Category</Text>
                <Text style={styles.requirementValue}>{catId}</Text>
              </View>
            ))}
            {job.requirements.experienceLevel && (
              <View style={styles.requirementItem}>
                <Text style={styles.requirementLabel}>Experience</Text>
                <Text style={styles.requirementValue}>
                  {job.requirements.experienceLevel.charAt(0).toUpperCase() + job.requirements.experienceLevel.slice(1)}
                </Text>
              </View>
            )}
            {job.requirements.vehicleRequired && (
              <View style={styles.requirementItem}>
                <Ionicons name="car-outline" size={16} color={C.primary} />
                <Text style={styles.requirementValue}>Vehicle required</Text>
              </View>
            )}
          </View>
        </View>

        {/* Schedule */}
        {job.schedule.startsAt || job.schedule.endsAt || !job.schedule.isFlexible && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.scheduleInfo}>
              {job.schedule.isFlexible ? (
                <Text style={styles.scheduleText}>Flexible schedule</Text>
              ) : (
                <>
                  {job.schedule.startsAt && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="play-outline" size={16} color={C.textSecondary} />
                      <Text style={styles.scheduleText}>Starts: {formatDate(job.schedule.startsAt)}</Text>
                    </View>
                  )}
                  {job.schedule.endsAt && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="stop-outline" size={16} color={C.textSecondary} />
                      <Text style={styles.scheduleText}>Ends: {formatDate(job.schedule.endsAt)}</Text>
                    </View>
                  )}
                  {job.schedule.preferredDays?.length && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="calendar-outline" size={16} color={C.textSecondary} />
                      <Text style={styles.scheduleText}>Preferred days: {job.schedule.preferredDays.join(', ')}</Text>
                    </View>
                  )}
                  {job.schedule.preferredShifts?.length && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="sunny-outline" size={16} color={C.textSecondary} />
                      <Text style={styles.scheduleText}>Preferred shifts: {job.schedule.preferredShifts.join(', ')}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Provider info if assigned */}
        {job.provider.providerId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Provider</Text>
            <View style={styles.providerCard}>
              <View style={styles.providerAvatar}>
                {job.provider.providerAvatar ? (
                  <Image source={{ uri: job.provider.providerAvatar }} style={styles.providerAvatarImage} />
                ) : (
                  <Text style={styles.providerAvatarText}>{job.provider.providerName?.[0] || 'P'}</Text>
                )}
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{job.provider.providerName || 'Provider'}</Text>
                {job.provider.startedAt && (
                  <Text style={styles.providerStarted}>Started: {formatDate(job.provider.startedAt)}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted by</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientAvatar}>
              {job.client.clientAvatar ? (
                <Image source={{ uri: job.client.clientAvatar }} style={styles.clientAvatarImage} />
              ) : (
                <Text style={styles.clientAvatarText}>{job.client.clientName?.[0] || 'C'}</Text>
              )}
            </View>
            <Text style={styles.clientName}>{job.client.clientName || 'Client'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{job.metadata.views}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{job.metadata.applicationsCount}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      {availableTransitions.length > 0 && (
        <SafeAreaView style={styles.bottomActions}>
          <View style={styles.actionsContainer}>
            {availableTransitions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.actionButton, status === 'cancelled' && styles.actionButtonDestructive]}
                onPress={() => handleStatusTransition(status)}
                disabled={saving}
              >
                <Text style={[styles.actionButtonText, status === 'cancelled' && styles.actionButtonTextDestructive]}>
                  {saving ? 'Updating...' : `Mark as ${STATUS_LABELS[status]}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      )}

      {/* Action Sheet Modal */}
      {showActions && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowActions(false)}>
          <View style={styles.modalContent} onTouchStart={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Actions</Text>
              <TouchableOpacity onPress={() => setShowActions(false)}>
                <Ionicons name="close" size={24} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            {availableTransitions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.modalAction, status === 'cancelled' && styles.modalActionDestructive]}
                onPress={() => { setShowActions(false); handleStatusTransition(status); }}
              >
                <Text style={[styles.modalActionText, status === 'cancelled' && styles.modalActionTextDestructive]}>
                  Mark as {STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingBottom: 100 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    actionBtn: { padding: 8 },
    typeBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginTop: 8 },
    typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    typeBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: C.error },
    urgentBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
    metaCard: { flex: 1, minWidth: '45%', backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder },
    metaLabel: { fontSize: 11, color: C.textHint, marginTop: 4, marginBottom: 2 },
    metaValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
    description: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
    requirementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.inputBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    requirementLabel: { fontSize: 11, color: C.textHint },
    requirementValue: { fontSize: 13, fontWeight: '500', color: C.textPrimary },
    scheduleInfo: { gap: 8 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scheduleText: { fontSize: 13, color: C.textSecondary },
    providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder },
    providerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    providerAvatarImage: { width: 48, height: 48, borderRadius: 24 },
    providerAvatarText: { fontSize: 16, fontWeight: '600', color: C.primary },
    providerInfo: { flex: 1 },
    providerName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    providerStarted: { fontSize: 12, color: C.textHint, marginTop: 2 },
    clientCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    clientAvatarImage: { width: 40, height: 40, borderRadius: 20 },
    clientAvatarText: { fontSize: 14, fontWeight: '600', color: C.primary },
    clientName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 24 },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder },
    statValue: { fontSize: 20, fontWeight: '700', color: C.primary },
    statLabel: { fontSize: 11, color: C.textHint, marginTop: 2 },
    bottomActions: { padding: 20, paddingBottom: 32, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.divider },
    actionsContainer: { gap: 12 },
    actionButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
    actionButtonDestructive: { backgroundColor: C.error },
    actionButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    actionButtonTextDestructive: { color: '#fff' },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.divider },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
    modalAction: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.divider },
    modalActionDestructive: { backgroundColor: '#FFF5F5' },
    modalActionText: { fontSize: 16, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
    modalActionTextDestructive: { color: C.error },
  });