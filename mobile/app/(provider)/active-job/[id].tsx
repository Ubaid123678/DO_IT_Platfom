import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import { Colors, type AppColors } from '@/src/theme/colors';

type ActiveJob = {
  id: string;
  title: string;
  clientName: string;
  clientChatId: string;
  budget: number;
  dueIn: string;
  location: string;
  isPhysical: boolean;
};

const jobsById: Record<string, ActiveJob> = {
  'job-201': {
    id: 'job-201',
    title: 'Deliver legal documents to city court before noon',
    clientName: 'Hamza S.',
    clientChatId: 'chat-201',
    budget: 55,
    dueIn: 'Due in 3h 24m',
    location: 'Model Town, Lahore',
    isPhysical: true,
  },
  'job-202': {
    id: 'job-202',
    title: 'Product listing edits for ecommerce store (20 SKUs)',
    clientName: 'Nida K.',
    clientChatId: 'chat-202',
    budget: 95,
    dueIn: 'Due in 7h 10m',
    location: 'Remote',
    isPhysical: false,
  },
};

const formatElapsed = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

export default function ProviderActiveJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [job, setJob] = useState<ActiveJob | null>(null);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const resolvedId = Array.isArray(id) ? id[0] : id;
    const timer = setTimeout(() => {
      setJob(jobsById[resolvedId ?? 'job-201'] ?? jobsById['job-201']);
      setElapsed(2 * 3600 + 14 * 60 + 8);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const ticker = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(ticker);
  }, [loading]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => loop.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  const initials = useMemo(() => {
    if (!job) {
      return 'C';
    }
    const parts = job.clientName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [job]);

  const timelineSteps = [
    { label: 'Job Accepted', sub: 'Accepted 10:12 AM', state: 'done' as const },
    { label: 'Work in Progress', sub: `Elapsed ${formatElapsed(elapsed)}`, state: 'active' as const },
    { label: 'Mark as Complete', sub: 'Waiting for your action', state: 'pending' as const },
    { label: 'Payment Released', sub: 'After client confirmation', state: 'pending' as const },
  ];

  const addProofPhoto = () => {
    const library = [
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=300&q=60',
      'https://images.unsplash.com/photo-1507646227500-4d389b0012be?auto=format&fit=crop&w=300&q=60',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=300&q=60',
    ];
    const next = library[proofPhotos.length % library.length];
    setProofPhotos((prev) => [...prev, next]);
  };

  const onCompletePress = () => {
    setCompleting(true);
    setTimeout(() => {
      setCompleting(false);
    }, 1300);
  };

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Job</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerDot} />
          <Text style={styles.bannerText}>In Progress</Text>
        </View>

        <View style={styles.jobCard}>
          <JobStatusBadge status="in_progress" />
          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.clientName}>{job.clientName}</Text>
            <TouchableOpacity
              style={styles.chatAction}
              onPress={() =>
                router.push({
                  pathname: '/(shared)/chat/[id]',
                  params: { id: job.clientChatId },
                })
              }
            >
              <Ionicons name="chatbubbles" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{`$${job.budget.toFixed(0)}`}</Text>
          </View>

          <View style={styles.deadlineRow}>
            <Ionicons name="time-outline" size={16} color={C.amber} />
            <Text style={styles.deadlineText}>{job.dueIn}</Text>
          </View>

          {job.isPhysical ? (
            <View style={styles.mapStub}>
              <Ionicons name="map" size={36} color={C.primary} />
            </View>
          ) : null}
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Progress</Text>

          <View style={styles.timelineWrap}>
            {timelineSteps.map((step, index) => {
              const isDone = step.state === 'done';
              const isActive = step.state === 'active';
              const isLast = index === timelineSteps.length - 1;

              return (
                <View key={step.label} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.indicatorWrap}>
                      {isActive ? (
                        <Animated.View
                          style={[
                            styles.activePulse,
                            {
                              borderColor: C.primary,
                              transform: [{ scale: pulseScale }],
                              opacity: pulseOpacity,
                            },
                          ]}
                        />
                      ) : null}

                      <View
                        style={[
                          styles.stepCircle,
                          isDone || isActive ? styles.stepCircleFilled : styles.stepCirclePending,
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={14} color="white" />
                        ) : (
                          <Text style={isActive ? styles.stepNumActive : styles.stepNumPending}>{index + 1}</Text>
                        )}
                      </View>
                    </View>

                    {!isLast ? (
                      <View
                        style={[
                          styles.timelineLine,
                          isDone ? styles.timelineLineDone : styles.timelineLinePending,
                        ]}
                      />
                    ) : null}
                  </View>

                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isActive
                          ? styles.timelineLabelActive
                          : isDone
                            ? styles.timelineLabelDone
                            : styles.timelineLabelPending,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.timelineSub}>{step.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.proofCard}>
          <Text style={styles.proofTitle}>Upload Proof (Optional)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proofRow}>
            <TouchableOpacity style={styles.addProofBox} onPress={addProofPhoto}>
              <Ionicons name="camera-outline" size={24} color={C.primary} />
            </TouchableOpacity>

            {proofPhotos.map((photo, idx) => (
              <Image key={`${photo}-${idx}`} source={{ uri: photo }} style={styles.proofImage} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottomWrap} edges={['bottom']}>
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              router.push({
                pathname: '/(shared)/chat/[id]',
                params: { id: job.clientChatId },
              })
            }
          >
            <Text style={styles.messageButtonText}>Message Client</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.completeButton} onPress={onCompletePress} disabled={completing}>
            {completing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.reportText}>Report Issue</Text>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
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
      height: 48,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 168,
    },
    banner: {
      marginTop: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.amber,
      backgroundColor: C.amberLight,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bannerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.amber,
    },
    bannerText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.amber,
    },
    jobCard: {
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 16,
    },
    jobTitle: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      lineHeight: 24,
    },
    clientRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    clientAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clientAvatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    clientName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    chatAction: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceRow: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 16,
    },
    priceText: {
      fontSize: 22,
      fontWeight: '700',
      color: C.primary,
    },
    deadlineRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deadlineText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.amber,
    },
    mapStub: {
      height: 100,
      borderRadius: 10,
      marginTop: 10,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineCard: {
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 16,
    },
    sectionTitle: {
      marginBottom: 16,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    timelineWrap: {
      gap: 12,
    },
    timelineRow: {
      flexDirection: 'row',
      gap: 12,
      minHeight: 68,
    },
    timelineLeft: {
      width: 28,
      alignItems: 'center',
    },
    indicatorWrap: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    activePulse: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    stepCircleFilled: {
      backgroundColor: C.primary,
    },
    stepCirclePending: {
      borderWidth: 2,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
    },
    stepNumActive: {
      fontSize: 13,
      fontWeight: '700',
      color: 'white',
    },
    stepNumPending: {
      fontSize: 13,
      color: C.textHint,
      fontWeight: '600',
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginTop: 6,
      borderRadius: 1,
    },
    timelineLineDone: {
      backgroundColor: C.primary,
    },
    timelineLinePending: {
      backgroundColor: C.cardBorder,
    },
    timelineRight: {
      flex: 1,
      paddingTop: 2,
    },
    timelineLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    timelineLabelDone: {
      color: C.textPrimary,
    },
    timelineLabelActive: {
      color: C.primary,
    },
    timelineLabelPending: {
      color: C.textHint,
    },
    timelineSub: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    proofCard: {
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      padding: 16,
    },
    proofTitle: {
      marginBottom: 10,
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    proofRow: {
      gap: 8,
      paddingRight: 4,
    },
    addProofBox: {
      width: 72,
      height: 72,
      borderRadius: 10,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: C.primary,
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    proofImage: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: C.divider,
    },
    bottomWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: C.navBg,
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    bottomActionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    messageButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageButtonText: {
      color: C.primary,
      fontWeight: '600',
      fontSize: 15,
    },
    completeButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completeButtonText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '700',
    },
    reportText: {
      marginTop: 8,
      marginBottom: 4,
      textAlign: 'center',
      fontSize: 12,
      color: C.error,
    },
  });
