import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type ProposalStatus = 'Pending' | 'Accepted' | 'Rejected';
type ProposalTab = 'All' | ProposalStatus;

type ProposalItem = {
  id: string;
  jobId: string;
  activeJobId?: string;
  title: string;
  budget: number;
  bid: number;
  status: ProposalStatus;
  submittedAt: string;
  cover: string;
};

const tabs: ProposalTab[] = ['All', 'Pending', 'Accepted', 'Rejected'];

const mockProposals: ProposalItem[] = [
  {
    id: 'pr-1001',
    jobId: 'job-501',
    title: 'Need same-day parcel delivery to Gulberg office',
    budget: 45,
    bid: 42,
    status: 'Pending',
    submittedAt: 'Apr 11, 11:20 AM',
    cover: 'I can complete this delivery within 60-75 minutes and share live updates.',
  },
  {
    id: 'pr-1002',
    jobId: 'job-201',
    activeJobId: 'job-201',
    title: 'Deliver legal documents to city court before noon',
    budget: 55,
    bid: 55,
    status: 'Accepted',
    submittedAt: 'Apr 10, 9:32 AM',
    cover: 'Experienced in legal document handling with same-day completion guarantee.',
  },
  {
    id: 'pr-1003',
    jobId: 'job-503',
    title: 'Apartment deep cleaning for move-in tomorrow morning',
    budget: 35,
    bid: 38,
    status: 'Rejected',
    submittedAt: 'Apr 09, 6:10 PM',
    cover: 'I can bring all cleaning supplies and complete kitchen + bathrooms thoroughly.',
  },
  {
    id: 'pr-1004',
    jobId: 'job-504',
    title: 'Landing page + payment flow for online course website',
    budget: 300,
    bid: 280,
    status: 'Pending',
    submittedAt: 'Apr 09, 2:48 PM',
    cover: 'I can deliver a responsive landing page with clean checkout flow in 4 days.',
  },
];

export default function ProviderProposalsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [activeTab, setActiveTab] = useState<ProposalTab>('All');
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProposals(mockProposals);
      setLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, []);

  const filteredProposals = useMemo(() => {
    if (activeTab === 'All') {
      return proposals;
    }

    return proposals.filter((proposal) => proposal.status === activeTab);
  }, [activeTab, proposals]);

  const statusPalette = (status: ProposalStatus) => {
    if (status === 'Accepted') {
      return { bg: isDark ? '#0F2E1F' : '#E8F8F2', color: C.success };
    }
    if (status === 'Rejected') {
      return { bg: isDark ? '#2E1010' : '#FDECEA', color: C.error };
    }
    return { bg: C.amberLight, color: C.amber };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Proposals</Text>
        <TouchableOpacity onPress={() => router.push('/(provider)/browse-jobs')}>
          <Ionicons name="search-outline" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active ? styles.tabItemActive : null]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={active ? styles.tabTextActive : styles.tabTextInactive}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProposals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const palette = statusPalette(item.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/(provider)/job-detail/[id]',
                    params: { id: item.jobId },
                  })
                }
              >
                <View style={styles.topRow}>
                  <Text style={styles.idText}>{item.id.toUpperCase()}</Text>
                  <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.statusText, { color: palette.color }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{`Client budget: $${item.budget}`}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{`Your bid: $${item.bid}`}</Text>
                </View>

                <Text style={styles.coverText} numberOfLines={2}>
                  {item.cover}
                </Text>

                <View style={styles.bottomRow}>
                  <Text style={styles.timeText}>{`Submitted ${item.submittedAt}`}</Text>

                  {item.status === 'Accepted' ? (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() =>
                        router.push({
                          pathname: '/(provider)/active-job/[id]',
                          params: { id: item.activeJobId ?? 'job-201' },
                        })
                      }
                    >
                      <Text style={styles.actionBtnPrimaryText}>Open Job</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtnGhost}
                      onPress={() =>
                        router.push({
                          pathname: '/(provider)/job-detail/[id]',
                          params: { id: item.jobId },
                        })
                      }
                    >
                      <Text style={styles.actionBtnGhostText}>View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={44} color={C.textHint} />
              <Text style={styles.emptyTitle}>No proposals found</Text>
              <Text style={styles.emptySub}>Apply to jobs and your proposals will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    headerRow: {
      height: 52,
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
    tabsScroll: {
      marginTop: 6,
      maxHeight: 42,
    },
    tabsContent: {
      paddingHorizontal: 20,
      gap: 8,
      alignItems: 'center',
    },
    tabItem: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    tabItemActive: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    tabTextActive: {
      fontSize: 13,
      color: 'white',
      fontWeight: '600',
    },
    tabTextInactive: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 26,
      flexGrow: 1,
    },
    separator: {
      height: 12,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 16,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    idText: {
      fontSize: 11,
      fontWeight: '600',
      color: C.textHint,
    },
    statusPill: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    title: {
      marginTop: 8,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    metaRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      color: C.textSecondary,
    },
    metaDot: {
      fontSize: 12,
      color: C.textHint,
    },
    coverText: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 20,
      color: C.textSecondary,
    },
    bottomRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeText: {
      fontSize: 11,
      color: C.textHint,
      flex: 1,
      marginRight: 10,
    },
    actionBtnPrimary: {
      height: 34,
      borderRadius: 8,
      backgroundColor: C.primary,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnPrimaryText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    actionBtnGhost: {
      height: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.primary,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnGhostText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.primary,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 22,
    },
    emptyTitle: {
      marginTop: 10,
      fontSize: 17,
      fontWeight: '700',
      color: C.textPrimary,
    },
    emptySub: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
  });
