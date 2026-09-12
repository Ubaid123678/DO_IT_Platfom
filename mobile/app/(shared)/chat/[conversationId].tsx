import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, Image } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { messagingService, type IMessage, type IConversation } from '@/src/services/messagingService';
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

export default function ChatScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const flatListRef = useRef<FlatList<IMessage>>(null);
  const keyboardShown = useRef(false);

  const loadMessages = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setMessages([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await messagingService.getMessages({
        conversationId: conversationId!,
        limit: 50,
        skip: currentSkip,
      });
      if (reset) {
        setMessages(result.messages);
      } else {
        setMessages((prev) => [...result.messages, ...prev]);
      }
      setTotal(result.total);
      setHasMore(result.messages.length === 50);
      setSkip(currentSkip + result.messages.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load messages';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId, skip, hasMore]);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      const conv = await messagingService.getConversationById(conversationId!);
      setConversation(conv);
    } catch {
      // Ignore
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages(true);
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    // Join conversation room
    socketService.getIO().emit('join_conversation_room', conversationId);
    return () => {
      socketService.getIO().emit('leave_conversation_room', conversationId);
    };
  }, [conversationId]);

  useEffect(() => {
    // Listen for new messages
    const io = socketService.getIO();
    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    io.on('new_message', handleNewMessage);
    
    const handleMessageRead = (data: any) => {
      setMessages(prev => prev.map(m => 
        data.messageIds.includes(m._id) ? { ...m, status: 'read', readAt: new Date().toISOString() } : m
      ));
    };
    io.on('message_read', handleMessageRead);

    const handleMessageDeleted = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    };
    io.on('message_deleted', handleMessageDeleted);

    return () => {
      io.off('new_message', handleNewMessage);
      io.off('message_read', handleMessageRead);
      io.off('message_deleted', handleMessageDeleted);
    };
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await messagingService.sendMessage({
        conversationId: conversationId!,
        senderId: '', // Will be filled by backend from auth
        type: 'text',
        content: text,
      });
      setText('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send message';
      Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  }, [conversationId, text, sending]);

  const handleMarkAsRead = useCallback(async () => {
    try {
      await messagingService.markAsRead(conversationId!);
    } catch {
      // Ignore
    }
  }, [conversationId]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadMessages(false);
    }
  }, [loadingMore, hasMore, loadMessages]);

  const onRefresh = useCallback(() => {
    loadMessages(true);
  }, [loadMessages]);

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isOwn = item.senderId === ''; // Will be determined by actual user ID
    return (
      <TouchableOpacity style={styles.messageContainer} activeOpacity={0.8}>
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}>
          {item.type === 'image' && item.metadata?.fileName && (
            <Image
              source={{ uri: item.content }}
              style={styles.imageMessage}
              resizeMode="cover"
            />
          )}
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatDate(item.sentAt)}
          </Text>
          {item.status === 'read' && (
            <Ionicons name="checkmark-done-circle" size={14} color="#27AE60" style={styles.readIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  if (loading && messages.length === 0) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaViewCompat>
    );
  }

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            {conversation?.avatar ? (
              <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{conversation?.title || 'Chat'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.headerTitle}>{conversation?.title || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push(`/conversation-detail/${conversationId}`)}>
          <Ionicons name="information-circle-outline" size={24} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        inverted
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Start the conversation!</Text>
            </View>
          )
        }
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => Alert.alert('Attachments coming soon')}>
            <Ionicons name="attach-outline" size={24} color={C.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={C.textHint}
            multiline
            maxLength={5000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarText: { fontSize: 16, fontWeight: '700', color: C.primary },
    headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
    headerSubtitle: { fontSize: 12, color: C.textHint },
    listContent: { paddingBottom: 20, paddingTop: 10 },
    messageContainer: { marginHorizontal: 12, marginBottom: 8 },
    messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
    ownMessage: { backgroundColor: '#27AE60', borderBottomRightRadius: 4, alignSelf: 'flex-end' },
    otherMessage: { backgroundColor: '#F1F3F4', borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
    ownMessageText: { color: '#fff', fontSize: 15, lineHeight: 22 },
    otherMessageText: { color: '#202124', fontSize: 15, lineHeight: 22 },
    messageTime: { fontSize: 10, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
    ownMessageTime: { color: 'rgba(255,255,255,0.7)' },
    readIcon: { marginLeft: 4, marginTop: -2 },
    imageMessage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: '#fff' },
    attachBtn: { padding: 8 },
    textInput: { flex: 1, fontSize: 16, color: '#202124', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F1F3F4', borderRadius: 24, marginRight: 8 },
    sendBtn: { padding: 10, backgroundColor: '#27AE60', borderRadius: 24 },
    keyboardAvoiding: { flex: 1 },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 16, color: '#888', marginTop: 12 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#202124', marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 },
  });