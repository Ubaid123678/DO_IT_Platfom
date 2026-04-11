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

type TicketStatus = 'Open' | 'In Review' | 'Resolved' | 'Closed';
type TicketTab = 'All' | TicketStatus;

type TicketItem = {
  id: string;
  subject: string;
  category: string;
  date: string;
  preview: string;
  status: TicketStatus;
  unread: boolean;
};

const tabs: TicketTab[] = ['All', 'Open', 'In Review', 'Resolved', 'Closed'];

const mockTickets: TicketItem[] = [
  {
    id: '1024',
    subject: 'Provider did not arrive on scheduled time',
    category: 'Jobs',
    date: 'Apr 11, 10:42 AM',
    preview: 'We requested additional details and screenshots to investigate this job issue quickly.',
    status: 'Open',
    unread: true,
  },
  {
    id: '1021',
    subject: 'Wallet top up charged twice',
    category: 'Payments',
    date: 'Apr 10, 8:20 PM',
    preview: 'Our billing team is checking transaction references and bank confirmation logs.',
    status: 'In Review',
    unread: false,
  },
  {
    id: '1009',
    subject: 'Unable to complete KYC selfie verification',
    category: 'KYC',
    date: 'Apr 09, 2:14 PM',
    preview: 'Issue was fixed after app update. Your verification status is now approved.',
    status: 'Resolved',
    unread: false,
  },
  {
    id: '0998',
    subject: 'Report for abusive chat message',
    category: 'Safety',
    date: 'Apr 07, 11:09 AM',
    preview: 'The account was reviewed and moderation action has already been taken.',
    status: 'Closed',
    unread: false,
  },
  {
    id: '0995',
    subject: 'App freezes when opening proposals',
    category: 'Technical',
    date: 'Apr 06, 7:32 PM',
    preview: 'Thanks for the logs. Engineering has marked this as high priority for a patch release.',
    status: 'In Review',
    unread: true,
  },
];

export default function SupportTicketsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activeTab, setActiveTab] = useState<TicketTab>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const filteredTickets = useMemo(() => {
    if (activeTab === 'All') {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.status === activeTab);
  }, [activeTab, tickets]);

  const statusPillStyle = (status: TicketStatus) => {
    if (status === 'Open') {
      return { backgroundColor: C.primaryLight, color: C.primary };
    }

    if (status === 'In Review') {
      return { backgroundColor: C.amberLight, color: C.amber };
    }

    if (status === 'Resolved') {
      return { backgroundColor: isDark ? '#0F2E1F' : '#E8F8F2', color: C.success };
    }

    return { backgroundColor: C.background, color: C.textHint };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Tickets</Text>

        <TouchableOpacity onPress={() => router.push('/(help)/new-ticket')}>
          <Text style={styles.newAction}>+ New</Text>
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
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>{tab}</Text>
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
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const pill = statusPillStyle(item.status);

            return (
              <TouchableOpacity
                style={styles.ticketCard}
                onPress={() =>
                  router.push({
                    pathname: '/(help)/ticket-detail/[id]',
                    params: { id: item.id },
                  })
                }
              >
                {item.unread ? <View style={styles.unreadDot} /> : null}

                <View style={styles.cardTopRow}>
                  <Text style={styles.ticketIdText}>{`#TK-${item.id}`}</Text>

                  <View style={[styles.statusPill, { backgroundColor: pill.backgroundColor }]}>
                    <Text style={[styles.statusPillText, { color: pill.color }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.subjectText} numberOfLines={1}>
                  {item.subject}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.previewText} numberOfLines={2}>{`Last reply: ${item.preview}`}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="ticket-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptySubtitle}>Create a new support ticket and our team will assist you.</Text>
              <TouchableOpacity style={styles.emptyActionButton} onPress={() => router.push('/(help)/new-ticket')}>
                <Text style={styles.emptyActionText}>New Ticket</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(help)/new-ticket')}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
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
      height: 48,
      marginTop: 8,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIconButton: {
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
    newAction: {
      fontSize: 14,
      fontWeight: '600',
      color: C.primary,
    },
    tabsScroll: {
      marginTop: 8,
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
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: isDark ? '#152E2C' : C.card,
    },
    tabItemActive: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500',
    },
    tabTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    tabTextInactive: {
      color: C.textPrimary,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 100,
      flexGrow: 1,
    },
    separator: {
      height: 12,
    },
    ticketCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 16,
      position: 'relative',
    },
    unreadDot: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.amber,
      zIndex: 2,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 12,
    },
    ticketIdText: {
      fontSize: 11,
      fontWeight: '600',
      color: C.textHint,
    },
    statusPill: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '600',
    },
    subjectText: {
      marginTop: 6,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    metaRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryPill: {
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: C.primaryLight,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.primary,
    },
    dateText: {
      fontSize: 12,
      color: C.textHint,
    },
    previewText: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 20,
      color: C.textSecondary,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    emptySubtitle: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 20,
      color: C.textSecondary,
    },
    emptyActionButton: {
      marginTop: 14,
      height: 46,
      borderRadius: 10,
      paddingHorizontal: 18,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
  });
