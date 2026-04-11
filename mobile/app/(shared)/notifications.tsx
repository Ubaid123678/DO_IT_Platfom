import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { Colors, type AppColors } from '@/src/theme/colors';

type NotificationType =
  | 'new_proposal'
  | 'job_accepted'
  | 'payment'
  | 'message'
  | 'dispute'
  | 'kyc';
type FilterTab = 'all' | 'jobs' | 'payments' | 'system';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  dateLabel: string;
  unread: boolean;
};

type ListRow =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'notification'; id: string; item: NotificationItem };

const tabs: Array<{ key: FilterTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'payments', label: 'Payments' },
  { key: 'system', label: 'System' },
];

const mockNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'new_proposal',
    title: 'New proposal received',
    body: 'Ahmed Raza sent a proposal for your Airport Drop job.',
    time: '10:42 AM',
    dateLabel: 'Today',
    unread: true,
  },
  {
    id: 'n-2',
    type: 'message',
    title: 'New message from Hamza S.',
    body: 'I am close to pickup location, should arrive in 10 mins.',
    time: '9:58 AM',
    dateLabel: 'Today',
    unread: true,
  },
  {
    id: 'n-3',
    type: 'payment',
    title: 'Payment received',
    body: 'You received $50.00 for delivery completion.',
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    unread: false,
  },
  {
    id: 'n-4',
    type: 'job_accepted',
    title: 'Job accepted',
    body: 'Your offer was accepted for Home AC Service task.',
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    unread: false,
  },
  {
    id: 'n-5',
    type: 'kyc',
    title: 'KYC update required',
    body: 'Please re-upload your ID back side for better visibility.',
    time: 'Apr 08',
    dateLabel: 'Apr 08',
    unread: true,
  },
  {
    id: 'n-6',
    type: 'dispute',
    title: 'Dispute opened',
    body: 'Client raised a dispute for Delivery Job #J-182.',
    time: 'Apr 07',
    dateLabel: 'Apr 07',
    unread: false,
  },
];

const tabMatch = (item: NotificationItem, tab: FilterTab) => {
  if (tab === 'all') {
    return true;
  }

  if (tab === 'payments') {
    return item.type === 'payment';
  }

  if (tab === 'jobs') {
    return item.type === 'new_proposal' || item.type === 'job_accepted' || item.type === 'message';
  }

  return item.type === 'dispute' || item.type === 'kyc';
};

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const visibleRows = useMemo(() => {
    const filtered = notifications.filter((item) => tabMatch(item, filterTab));
    const grouped = new Map<string, NotificationItem[]>();

    filtered.forEach((item) => {
      const existing = grouped.get(item.dateLabel) ?? [];
      existing.push(item);
      grouped.set(item.dateLabel, existing);
    });

    const order = ['Today', 'Yesterday'];
    const labels = Array.from(grouped.keys()).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      return a > b ? -1 : 1;
    });

    const rows: ListRow[] = [];
    labels.forEach((label) => {
      rows.push({ kind: 'date', id: `date-${label}`, label });
      (grouped.get(label) ?? []).forEach((item) => {
        rows.push({ kind: 'notification', id: item.id, item });
      });
    });

    return rows;
  }, [notifications, filterTab]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const iconForType = (type: NotificationType) => {
    if (type === 'new_proposal') {
      return {
        bg: C.primaryLight,
        color: C.primary,
        name: 'person' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (type === 'job_accepted') {
      return {
        bg: C.amberLight,
        color: C.amber,
        name: 'briefcase' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (type === 'payment') {
      return {
        bg: isDark ? '#0F2E1F' : '#E8F8F2',
        color: C.success,
        name: 'cash' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (type === 'message') {
      return {
        bg: C.primaryLight,
        color: C.primary,
        name: 'chatbubble' as keyof typeof Ionicons.glyphMap,
      };
    }
    if (type === 'dispute') {
      return {
        bg: isDark ? '#2E1010' : '#FDECEA',
        color: C.error,
        name: 'warning' as keyof typeof Ionicons.glyphMap,
      };
    }

    return {
      bg: C.amberLight,
      color: C.amber,
      name: 'shield' as keyof typeof Ionicons.glyphMap,
    };
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
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const active = filterTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={() => setFilterTab(tab.key)}>
                <Text style={active ? styles.tabTextActive : styles.tabTextInactive}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={visibleRows}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.kind === 'date') {
              return <Text style={styles.dateLabel}>{item.label}</Text>;
            }

            const n = item.item;
            const iconSpec = iconForType(n.type);

            return (
              <Swipeable
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => (
                  <TouchableOpacity
                    style={styles.leftAction}
                    onPress={() => markRead(n.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.leftActionText}>Read</Text>
                  </TouchableOpacity>
                )}
                renderRightActions={() => (
                  <TouchableOpacity
                    style={styles.rightAction}
                    onPress={() => deleteNotification(n.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rightActionText}>Delete</Text>
                  </TouchableOpacity>
                )}
              >
                <View style={[styles.notificationRow, n.unread ? styles.unreadRow : styles.readRow]}>
                  <View style={[styles.iconWrap, { backgroundColor: iconSpec.bg }]}> 
                    <Ionicons name={iconSpec.name} size={22} color={iconSpec.color} />
                  </View>

                  <View style={styles.centerCol}>
                    <Text style={[styles.titleText, { fontWeight: n.unread ? '600' : '400' }]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={styles.bodyText} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <Text style={styles.timeText}>{n.time}</Text>
                  </View>

                  {n.unread ? <View style={styles.unreadDot} /> : null}
                </View>
              </Swipeable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const makeStyles = (C: AppColors, isDark: boolean) =>
  StyleSheet.create({
    gestureRoot: {
      flex: 1,
    },
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
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    markAllText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    tabsRow: {
      flexDirection: 'row',
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.navBorder,
      paddingHorizontal: 20,
    },
    tabButton: {
      marginRight: 20,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabTextActive: {
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
      borderBottomWidth: 2,
      borderBottomColor: C.primary,
      paddingBottom: 2,
    },
    tabTextInactive: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      paddingBottom: 2,
    },
    listContent: {
      paddingBottom: 24,
      flexGrow: 1,
    },
    dateLabel: {
      paddingHorizontal: 20,
      marginVertical: 8,
      fontSize: 12,
      fontWeight: '600',
      color: C.textHint,
      textTransform: 'uppercase',
    },
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    unreadRow: {
      backgroundColor: isDark ? '#0F2E2B' : '#F0FBF9',
    },
    readRow: {
      backgroundColor: 'transparent',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    centerCol: {
      flex: 1,
      marginHorizontal: 12,
    },
    titleText: {
      fontSize: 14,
      color: C.textPrimary,
    },
    bodyText: {
      marginTop: 2,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 18,
    },
    timeText: {
      marginTop: 4,
      fontSize: 11,
      color: C.textHint,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.primary,
      marginTop: 4,
    },
    leftAction: {
      width: 84,
      marginVertical: 1,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftActionText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
    },
    rightAction: {
      width: 84,
      marginVertical: 1,
      backgroundColor: C.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightActionText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
    },
    emptyText: {
      marginTop: 10,
      fontSize: 14,
      color: C.textSecondary,
      fontWeight: '500',
    },
  });
