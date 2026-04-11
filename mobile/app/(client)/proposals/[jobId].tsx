import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomSheet from '@/src/components/common/BottomSheet';
import StarRating from '@/src/components/common/StarRating';
import { Colors, type AppColors } from '@/src/theme/colors';

type SortBy = 'all' | 'lowest_price' | 'top_rated' | 'fastest';

type Proposal = {
  id: string;
  providerId: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  jobsDone: number;
  bid: number;
  bidType: string;
  preview: string;
  hours: number;
  distance: string;
};

const mockProposals: Proposal[] = [
  {
    id: 'p-1',
    providerId: 'u-201',
    name: 'Ahmed Raza',
    verified: true,
    rating: 4.8,
    reviews: 124,
    jobsDone: 89,
    bid: 28,
    bidType: 'trip',
    preview:
      'I can pick you up 6:20 AM from DHA and ensure you reach airport before 7:15. Clean sedan with luggage space available.',
    hours: 1,
    distance: '3.4 km away',
  },
  {
    id: 'p-2',
    providerId: 'u-202',
    name: 'Usman Khalid',
    verified: true,
    rating: 4.7,
    reviews: 96,
    jobsDone: 63,
    bid: 30,
    bidType: 'trip',
    preview:
      'Professional ride service with punctual arrival. I can also assist with baggage and airport drop-off gate guidance.',
    hours: 1,
    distance: '4.1 km away',
  },
  {
    id: 'p-3',
    providerId: 'u-203',
    name: 'Saad Tariq',
    verified: false,
    rating: 4.5,
    reviews: 45,
    jobsDone: 31,
    bid: 24,
    bidType: 'trip',
    preview:
      'Can provide quick pickup and smooth route planning. Comfortable hatchback and flexible wait time if needed.',
    hours: 2,
    distance: '2.8 km away',
  },
  {
    id: 'p-4',
    providerId: 'u-204',
    name: 'Bilal Ahmad',
    verified: true,
    rating: 4.9,
    reviews: 210,
    jobsDone: 154,
    bid: 33,
    bidType: 'trip',
    preview:
      'Premium sedan, highly punctual and professional. Live tracking and proactive communication throughout the trip.',
    hours: 1,
    distance: '5.2 km away',
  },
  {
    id: 'p-5',
    providerId: 'u-205',
    name: 'Adeel Mehdi',
    verified: false,
    rating: 4.6,
    reviews: 58,
    jobsDone: 39,
    bid: 26,
    bidType: 'trip',
    preview:
      'Available immediately and familiar with morning airport rush routes. I can reach pickup in under 20 minutes.',
    hours: 1,
    distance: '2.2 km away',
  },
];

const sortOptions: Array<{ key: SortBy; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'lowest_price', label: 'Lowest Price' },
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'fastest', label: 'Fastest' },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export default function ClientProposalsScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  const scheme = useColorScheme();
  const C = scheme === 'dark' ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setProposals(mockProposals);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [jobId]);

  const sortedProposals = useMemo(() => {
    const list = [...proposals];
    switch (sortBy) {
      case 'lowest_price':
        return list.sort((a, b) => a.bid - b.bid);
      case 'top_rated':
        return list.sort((a, b) => b.rating - a.rating);
      case 'fastest':
        return list.sort((a, b) => a.hours - b.hours);
      default:
        return list;
    }
  }, [proposals, sortBy]);

  const headerTitle = `Proposals (${proposals.length})`;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowSortSheet(true)}>
          <Ionicons name="funnel-outline" size={20} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortPillsContent}
        style={styles.sortPillsScroll}
      >
        {sortOptions.map((option) => {
          const active = sortBy === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSortBy(option.key)}
              style={[styles.sortPill, active ? styles.sortPillActive : styles.sortPillInactive]}
            >
              <Text style={active ? styles.sortPillTextActive : styles.sortPillTextInactive}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={sortedProposals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const expanded = !!expandedIds[item.id];
          const showReadMore = item.preview.length > 88;

          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  {item.verified ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                  ) : null}
                </View>

                <View style={styles.identityCol}>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <StarRating rating={item.rating} size={12} />
                  </View>
                  <Text style={styles.statsText}>{`${item.reviews} reviews · ${item.jobsDone} jobs`}</Text>
                </View>

                <View style={styles.bidCol}>
                  <Text style={styles.bidText}>{`$${item.bid}`}</Text>
                  <Text style={styles.bidTypeText}>{`/${item.bidType}`}</Text>
                </View>
              </View>

              <Text style={styles.previewText} numberOfLines={expanded ? undefined : 2}>
                {item.preview}
              </Text>
              {showReadMore ? (
                <TouchableOpacity onPress={() => toggleExpanded(item.id)}>
                  <Text style={styles.readMoreText}>{expanded ? 'Read less' : 'Read more'}</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={C.textHint} />
                  <Text style={styles.metaText}>{`Est. ${item.hours}h`}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={C.textHint} />
                  <Text style={styles.metaText}>{item.distance}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() =>
                    router.push({
                      pathname: '/(shared)/public-profile/[id]',
                      params: { id: item.providerId },
                    })
                  }
                >
                  <Text style={styles.profileButtonText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => {
                    setSelectedProvider(item);
                    setShowConfirmModal(true);
                  }}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <BottomSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} title="Sort Proposals">
        {sortOptions.map((option) => {
          const active = sortBy === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.sheetOption, active ? styles.sheetOptionActive : null]}
              onPress={() => {
                setSortBy(option.key);
                setShowSortSheet(false);
              }}
            >
              <Text style={[styles.sheetOptionText, active ? styles.sheetOptionTextActive : null]}>
                {option.label}
              </Text>
              {active ? <Ionicons name="checkmark" size={16} color={C.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{`Hire ${selectedProvider?.name ?? ''}?`}</Text>

            {selectedProvider ? (
              <View style={styles.modalProviderRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{getInitials(selectedProvider.name)}</Text>
                </View>
                <Text style={styles.modalProviderName}>{selectedProvider.name}</Text>
              </View>
            ) : null}

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={C.amber} />
              <Text style={styles.warningText}>This will decline all other proposals</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowConfirmModal(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm Hire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    header: {
      height: 50,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
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
    sortPillsScroll: {
      marginVertical: 12,
      maxHeight: 38,
    },
    sortPillsContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    sortPill: {
      height: 32,
      borderRadius: 20,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    sortPillActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    sortPillInactive: {
      backgroundColor: C.card,
      borderColor: C.cardBorder,
    },
    sortPillTextActive: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    sortPillTextInactive: {
      color: C.textSecondary,
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
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatarWrap: {
      width: 52,
      height: 52,
      position: 'relative',
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    verifiedBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primary,
      borderWidth: 2,
      borderColor: C.card,
    },
    identityCol: {
      flex: 1,
      marginLeft: 12,
    },
    nameText: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      lineHeight: 20,
    },
    ratingRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsText: {
      marginTop: 4,
      fontSize: 12,
      color: C.textSecondary,
    },
    bidCol: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    bidText: {
      fontSize: 20,
      fontWeight: '700',
      color: C.primary,
    },
    bidTypeText: {
      fontSize: 11,
      color: C.textHint,
      marginTop: 2,
    },
    previewText: {
      marginTop: 10,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 18,
    },
    readMoreText: {
      marginTop: 4,
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    metaRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
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
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    profileButton: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileButtonText: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
    acceptButton: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    acceptButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    sheetOption: {
      minHeight: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.background,
    },
    sheetOptionActive: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    sheetOptionText: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textPrimary,
    },
    sheetOptionTextActive: {
      color: C.primary,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    modalCard: {
      width: '100%',
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
      lineHeight: 24,
    },
    modalProviderRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    modalAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    modalAvatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    modalProviderName: {
      fontSize: 14,
      color: C.textPrimary,
      fontWeight: '500',
    },
    warningBox: {
      marginTop: 14,
      borderRadius: 8,
      backgroundColor: C.amberLight,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      color: C.amber,
      fontWeight: '500',
      lineHeight: 17,
    },
    modalActions: {
      marginTop: 20,
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    confirmButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });
