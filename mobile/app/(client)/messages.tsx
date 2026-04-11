import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type Conversation = {
  id: string;
  name: string;
  jobTitle: string;
  lastMessage: string;
  time: string;
  unread: number;
  isSupport?: boolean;
};

const mockConversations: Conversation[] = [
  {
    id: 'chat-101',
    name: 'Ahmed Raza',
    jobTitle: 'Airport Drop',
    lastMessage: 'I can reach your location in 20 mins.',
    time: '10:41 AM',
    unread: 2,
  },
  {
    id: 'chat-102',
    name: 'Sara Khan',
    jobTitle: 'Logo Design',
    lastMessage: 'Shared the second concept. Please review.',
    time: '9:12 AM',
    unread: 0,
  },
  {
    id: 'chat-103',
    name: 'Bilal Tariq',
    jobTitle: 'Deep Cleaning',
    lastMessage: 'I have completed the kitchen section.',
    time: 'Yesterday',
    unread: 1,
  },
  {
    id: 'support',
    name: 'Do It Support',
    jobTitle: '',
    lastMessage: 'How can we help you today?',
    time: '',
    unread: 0,
    isSupport: true,
  },
];

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function ClientMessagesScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.name} ${conversation.jobTitle} ${conversation.lastMessage}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, search]);

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
        <Text style={styles.headerTitle}>Messages</Text>
        <Ionicons name="search-outline" size={24} color={C.textPrimary} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.textHint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={C.textHint}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.sectionLabel}>ACTIVE JOB CONVERSATIONS</Text>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: '/(shared)/chat/[id]',
                params: { id: item.id },
              })
            }
          >
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, item.isSupport ? styles.supportAvatar : null]}>
                {item.isSupport ? (
                  <Ionicons name="headset" size={22} color="white" />
                ) : (
                  <Text style={styles.avatarText}>{initialsFromName(item.name)}</Text>
                )}
              </View>

              {item.unread > 0 ? (
                <View style={styles.unreadCountBadge}>
                  <Text style={styles.unreadCountText}>{item.unread > 9 ? '9+' : item.unread}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.centerCol}>
              <View style={styles.titleRow}>
                <Text style={styles.nameText}>{item.name}</Text>
                {item.jobTitle ? <Text style={styles.jobContextText}>{item.jobTitle}</Text> : null}
              </View>
              <Text style={styles.previewText} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>

            <View style={styles.rightCol}>
              {item.time ? <Text style={styles.timeText}>{item.time}</Text> : null}
              {item.unread > 0 ? <View style={styles.unreadDot} /> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={48} color={C.textHint} />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
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
    searchWrap: {
      marginHorizontal: 20,
      marginVertical: 12,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    sectionLabel: {
      paddingHorizontal: 20,
      marginBottom: 4,
      fontSize: 12,
      fontWeight: '600',
      color: C.textHint,
      textTransform: 'uppercase',
    },
    listContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    row: {
      height: 72,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
      backgroundColor: 'transparent',
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportAvatar: {
      backgroundColor: C.primary,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: C.primary,
    },
    unreadCountBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: C.amber,
      borderWidth: 2,
      borderColor: isDark ? '#0D1F1E' : C.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadCountText: {
      fontSize: 10,
      fontWeight: '700',
      color: 'white',
    },
    centerCol: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nameText: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      flexShrink: 1,
    },
    jobContextText: {
      fontSize: 11,
      color: C.primary,
      flexShrink: 1,
    },
    previewText: {
      marginTop: 2,
      fontSize: 13,
      color: C.textSecondary,
    },
    rightCol: {
      alignItems: 'flex-end',
    },
    timeText: {
      fontSize: 11,
      color: C.textHint,
    },
    unreadDot: {
      marginTop: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.primary,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
      gap: 10,
    },
    emptyText: {
      fontSize: 14,
      color: C.textSecondary,
      fontWeight: '500',
    },
  });
