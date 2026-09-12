import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, Image } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { messagingService, type IConversation } from '@/src/services/messagingService';
import { socketService } from '@/src/services/socketService';
import { Colors, type AppColors } from '@/src/theme/colors';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default function InboxScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'group' | 'job' | 'support'>('all');

  const loadConversations = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setConversations([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await messagingService.getUserConversations({
        type: activeTab === 'all' ? undefined : activeTab as any,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setConversations(result.conversations);
      } else {
        setConversations((prev) => [...prev, ...result.conversations]);
      }
      setTotal(result.total);
      setHasMore(result.conversations.length === 20);
      setSkip(currentSkip + result.conversations.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load conversations';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, skip, hasMore]);

  useEffect(() => {
    loadConversations(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations(true);
  }, [loadConversations]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadConversations(false);
    }
  }, [loadingMore, hasMore, loadConversations]);

  useEffect(() => {
    // Listen for new conversations
    const io = socketService.getIO();
    const handleNewConversation = (conv: any) => {
      setConversations(prev => [conv, ...prev]);
    };
    io.on('new_conversation', handleNewConversation);
    return () => io.off('new_conversation', handleNewConversation);
  }, []);

  const renderConversation = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={styles.conversationCard} onPress={() => router.push(`/chat/${item._id}`)} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.title?.[0] || 'C'}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.conversationTitle} numberOfLines={1}>{item.title || 'Chat'}</Text>
          {item.lastMessagePreview && (
            <Text style={styles.lastMessagePreview} numberOfLines={1}>{item.lastMessagePreview}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.statusColumn}>
          {item.lastMessageAt && (
            <Text style={styles.lastMessageTime}>{formatDate(item.lastMessageAt)}</Text>
          )}
          {item.unreadCounts && item.unreadCounts > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCounts > 99 ? '99+' : item.unreadCounts}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/chat/new')}>
          <Ionicons name="add-circle-outline" size={28} color="#27AE60" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal contentContainerStyle={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {(['all', 'direct', 'group', 'job', 'support'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              activeTab === type && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[
              styles.filterTabLabel,
              activeTab === type && styles.filterTabLabelActive,
            ]}>
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a new conversation by tapping the + button
              </Text>
            </View>
          )
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterTabActive: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  filterTabLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabLabelActive: { color: '#fff' },
  conversationCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    marginHorizontal: 16, 
    borderWidth: 1, 
    borderColor: '#F1F3F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#27AE60' },
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 4 },
  lastMessagePreview: { fontSize: 13, color: '#6B7280', flex: 1 },
  cardRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  statusColumn: { alignItems: 'flex-end', gap: 4 },
  lastMessageTime: { fontSize: 11, color: '#9CA3AF' },
  unreadBadge: { 
    minWidth: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: '#27AE60', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 6 
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  loadMoreWrapper: { padding: 20, alignItems: 'center' },
  loadingMoreText: { fontSize: 13, color: '#9CA3AF' },
});