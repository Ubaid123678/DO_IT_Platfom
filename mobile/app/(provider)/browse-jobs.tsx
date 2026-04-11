import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type FilterType = 'All' | 'Nearby' | 'Digital' | 'Today' | 'High Budget' | 'Top Rated';
type ViewMode = 'list' | 'map';

type JobItem = {
  id: string;
  category: string;
  budget: number;
  type: string;
  title: string;
  location: string;
  distance: string;
  posted: string;
  proposalCount: number;
  clientName: string;
  description: string;
  urgent: boolean;
  isNearby: boolean;
  isDigital: boolean;
  isToday: boolean;
  topRated: boolean;
};

const filterPills: FilterType[] = ['All', 'Nearby', 'Digital', 'Today', 'High Budget', 'Top Rated'];

const mockJobs: JobItem[] = [
  {
    id: 'job-501',
    category: 'Delivery',
    budget: 45,
    type: 'fixed',
    title: 'Need same-day parcel delivery to Gulberg office',
    location: 'DHA Lahore',
    distance: '1.8 km',
    posted: '35m ago',
    proposalCount: 7,
    clientName: 'Ammar S.',
    description: 'Pickup from DHA and deliver sealed package to Gulberg by 3 PM. Must have valid bike documents.',
    urgent: true,
    isNearby: true,
    isDigital: false,
    isToday: true,
    topRated: true,
  },
  {
    id: 'job-502',
    category: 'Design',
    budget: 120,
    type: 'project',
    title: 'Social media design pack for cafe launch campaign',
    location: 'Remote',
    distance: 'Remote',
    posted: '2h ago',
    proposalCount: 16,
    clientName: 'Sara M.',
    description: 'Create 12 post creatives, 4 stories, and a reusable style guide aligned with brand palette.',
    urgent: false,
    isNearby: false,
    isDigital: true,
    isToday: true,
    topRated: true,
  },
  {
    id: 'job-503',
    category: 'Cleaning',
    budget: 35,
    type: 'fixed',
    title: 'Apartment deep cleaning for move-in tomorrow morning',
    location: 'Johar Town',
    distance: '4.2 km',
    posted: 'Yesterday',
    proposalCount: 5,
    clientName: 'Zain A.',
    description: 'Need a full cleaning session for a 2-bed apartment including kitchen and bathrooms.',
    urgent: false,
    isNearby: true,
    isDigital: false,
    isToday: false,
    topRated: false,
  },
  {
    id: 'job-504',
    category: 'Development',
    budget: 300,
    type: 'project',
    title: 'Landing page + payment flow for online course website',
    location: 'Remote',
    distance: 'Remote',
    posted: '3h ago',
    proposalCount: 22,
    clientName: 'Farah T.',
    description: 'Build responsive landing page with checkout integration and simple admin edits support.',
    urgent: true,
    isNearby: false,
    isDigital: true,
    isToday: true,
    topRated: true,
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function ProviderBrowseJobsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (activeFilter === 'All') {
          return true;
        }
        if (activeFilter === 'Nearby') {
          return job.isNearby;
        }
        if (activeFilter === 'Digital') {
          return job.isDigital;
        }
        if (activeFilter === 'Today') {
          return job.isToday;
        }
        if (activeFilter === 'High Budget') {
          return job.budget >= 100;
        }
        if (activeFilter === 'Top Rated') {
          return job.topRated;
        }

        return true;
      })
      .filter((job) => {
        if (!query) {
          return true;
        }

        return `${job.title} ${job.category} ${job.location} ${job.clientName} ${job.description}`
          .toLowerCase()
          .includes(query);
      });
  }, [jobs, search, activeFilter]);

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
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Browse Jobs</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="funnel-outline" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setViewMode((prev) => (prev === 'list' ? 'map' : 'list'))}
          >
            <Ionicons
              name="map-outline"
              size={24}
              color={viewMode === 'map' ? C.primary : C.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={C.textHint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs..."
          placeholderTextColor={C.textHint}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContent}
        style={styles.pillsScroll}
      >
        {filterPills.map((pill) => {
          const active = activeFilter === pill;
          return (
            <TouchableOpacity
              key={pill}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              onPress={() => setActiveFilter(pill)}
            >
              <Text style={active ? styles.pillTextActive : styles.pillTextInactive}>{pill}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {viewMode === 'list' ? (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.jobCard}
              onPress={() =>
                router.push({
                  pathname: '/(provider)/job-detail/[id]',
                  params: { id: item.id },
                })
              }
            >
              {item.urgent ? (
                <View style={styles.urgentBadge}>
                  <Ionicons name="flame" size={12} color="white" />
                  <Text style={styles.urgentText}>Urgent</Text>
                </View>
              ) : null}

              <View style={styles.topRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>

                <View style={styles.priceCol}>
                  <Text style={styles.priceText}>{`$${item.budget}`}</Text>
                  <Text style={styles.typeText}>{`/${item.type}`}</Text>
                </View>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={C.textSecondary} />
                  <Text style={styles.metaText}>{`${item.location} · ${item.distance}`}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={C.textSecondary} />
                  <Text style={styles.metaText}>{item.posted}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color={C.textSecondary} />
                  <Text style={styles.metaText}>{`${item.proposalCount} proposals`}</Text>
                </View>
              </View>

              <View style={styles.clientRow}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>{getInitials(item.clientName)}</Text>
                </View>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() =>
                    router.push({
                      pathname: '/(provider)/job-detail/[id]',
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.secondaryActionText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="briefcase-outline" size={40} color={C.textHint} />
              <Text style={styles.emptyText}>No jobs found</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.mapView}>
          <Text style={styles.mapText}>Map view — react-native-maps integration</Text>
          <Text style={styles.mapHint}>Cluster pins shown</Text>
        </View>
      )}
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
      marginTop: 8,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconButton: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    pillsScroll: {
      marginBottom: 12,
      maxHeight: 36,
    },
    pillsContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    pill: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    pillInactive: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
    },
    pillTextActive: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    pillTextInactive: {
      color: C.textPrimary,
      fontSize: 12,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    separator: {
      height: 12,
    },
    jobCard: {
      position: 'relative',
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderLeftWidth: 3,
      borderLeftColor: C.primary,
      padding: 16,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    categoryPill: {
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    categoryText: {
      fontSize: 11,
      color: C.primary,
      fontWeight: '600',
    },
    priceCol: {
      alignItems: 'flex-end',
    },
    priceText: {
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
      lineHeight: 22,
    },
    typeText: {
      fontSize: 11,
      color: C.textHint,
      marginTop: 1,
    },
    title: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
      lineHeight: 22,
    },
    metaRow: {
      marginTop: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      alignItems: 'center',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    clientRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    clientAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clientAvatarText: {
      fontSize: 10,
      fontWeight: '700',
      color: C.primary,
    },
    clientName: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    verifiedPill: {
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.primary,
    },
    description: {
      marginTop: 8,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 18,
    },
    actionRow: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.divider,
      flexDirection: 'row',
      gap: 10,
    },
    secondaryAction: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
    primaryAction: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    urgentBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: C.error,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      zIndex: 1,
    },
    urgentText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '700',
    },
    mapView: {
      flex: 1,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    mapText: {
      color: C.primary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    mapHint: {
      color: C.primary,
      fontSize: 12,
      marginTop: 4,
      opacity: 0.75,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      color: C.textSecondary,
      fontWeight: '500',
    },
  });
