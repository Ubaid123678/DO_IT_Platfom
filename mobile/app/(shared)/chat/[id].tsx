import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import JobStatusBadge from '@/src/components/job/JobStatusBadge';
import { Colors, type AppColors } from '@/src/theme/colors';

type ChatMessage = {
  id: string;
  kind: 'date' | 'system' | 'incoming' | 'outgoing';
  text: string;
  time?: string;
  read?: boolean;
};

type ContactInfo = {
  name: string;
  jobTitle: string;
  online: boolean;
};

const contactById: Record<string, ContactInfo> = {
  'chat-101': {
    name: 'Ahmed Raza',
    jobTitle: 'Airport Drop · Job #J-1001',
    online: true,
  },
  'chat-201': {
    name: 'Hamza S.',
    jobTitle: 'Document Delivery · Active Job #201',
    online: true,
  },
};

const seedMessages: ChatMessage[] = [
  { id: 'd-1', kind: 'date', text: 'Today' },
  { id: 's-1', kind: 'system', text: 'Job accepted · 2:30 PM' },
  {
    id: 'm-1',
    kind: 'incoming',
    text: 'Hi! I am leaving now and heading towards your pickup point.',
    time: '2:34 PM',
  },
  {
    id: 'm-2',
    kind: 'outgoing',
    text: 'Great. Please call me when you are nearby.',
    time: '2:35 PM',
    read: true,
  },
  {
    id: 'm-3',
    kind: 'incoming',
    text: 'Sure, I will call in around 10 minutes.',
    time: '2:36 PM',
  },
];

const makeTime = () => {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const suffix = now.getHours() >= 12 ? 'PM' : 'AM';
  return `${hours}:${minutes} ${suffix}`;
};

export default function SharedChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  const resolvedId = Array.isArray(id) ? id[0] : id;
  const contact = contactById[resolvedId ?? 'chat-201'] ?? {
    name: 'Do It Support',
    jobTitle: 'Support Conversation',
    online: true,
  };

  const initials = useMemo(() => {
    const parts = contact.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [contact.name]);

  useEffect(() => {
    if (!isTyping) {
      dot1.setValue(0.2);
      dot2.setValue(0.2);
      dot3.setValue(0.2);
      return;
    }

    const buildDotLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.2,
            duration: 280,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = buildDotLoop(dot1, 0);
    const anim2 = buildDotLoop(dot2, 120);
    const anim3 = buildDotLoop(dot3, 240);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [isTyping, dot1, dot2, dot3]);

  const latestOutgoingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].kind === 'outgoing') {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  const displayMessages = useMemo(() => {
    const list = [...messages].reverse();
    if (isTyping) {
      list.unshift({ id: 'typing-indicator', kind: 'incoming', text: '__typing__' });
    }
    return list;
  }, [messages, isTyping]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    const outgoingId = `m-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: outgoingId,
        kind: 'outgoing',
        text: trimmed,
        time: makeTime(),
        read: false,
      },
    ]);
    setInput('');
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setIsTyping(true);
    }, 350);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === outgoingId && item.kind === 'outgoing' ? { ...item, read: true } : item
        )
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-reply`,
          kind: 'incoming',
          text: 'Got it. I will update you once I reach the destination.',
          time: makeTime(),
        },
      ]);
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={styles.centerHeader}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>

          <View>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{contact.online ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Ionicons name="call-outline" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="videocam-outline" size={22} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contextBar}>
        <Ionicons name="briefcase-outline" size={14} color={C.primary} />
        <Text style={styles.contextText} numberOfLines={1}>
          {contact.jobTitle}
        </Text>
        <View style={styles.badgeScaleWrap}>
          <JobStatusBadge status="in_progress" />
        </View>
      </View>

      <FlatList
        data={displayMessages}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.kind === 'date') {
            return (
              <View style={styles.dateSeparatorRow}>
                <View style={styles.separatorLine} />
                <Text style={styles.dateSeparatorText}>{item.text}</Text>
                <View style={styles.separatorLine} />
              </View>
            );
          }

          if (item.kind === 'system') {
            return (
              <View style={styles.systemWrap}>
                <Text style={styles.systemText}>{item.text}</Text>
              </View>
            );
          }

          if (item.kind === 'outgoing') {
            const isLastOutgoing = item.id === latestOutgoingId;

            return (
              <View style={styles.outgoingWrap}>
                <View style={styles.outgoingBubble}>
                  <Text style={styles.outgoingMessage}>{item.text}</Text>
                  {item.time ? <Text style={styles.outgoingTime}>{item.time}</Text> : null}
                </View>

                {isLastOutgoing ? (
                  <View style={styles.readReceiptRow}>
                    <Ionicons
                      name="checkmark-done"
                      size={12}
                      color={item.read ? C.primary : C.textHint}
                    />
                  </View>
                ) : null}
              </View>
            );
          }

          if (item.text === '__typing__') {
            return (
              <View style={styles.incomingWrap}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>{initials.slice(0, 1)}</Text>
                </View>

                <View style={styles.typingBubble}>
                  <View style={styles.typingDotsRow}>
                    <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
                  </View>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.incomingWrap}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>{initials.slice(0, 1)}</Text>
              </View>

              <View style={styles.incomingBubble}>
                <Text style={styles.incomingMessage}>{item.text}</Text>
                {item.time ? <Text style={styles.incomingTime}>{item.time}</Text> : null}
              </View>
            </View>
          );
        }}
      />

      <SafeAreaView style={styles.inputBar} edges={['bottom']}>
        <View style={styles.inputRow}>
          <TouchableOpacity>
            <Ionicons name="attach-outline" size={24} color={C.textHint} />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={C.textHint}
              style={styles.input}
              multiline
            />
          </View>

          {input.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
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
    headerRow: {
      height: 56,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerHeader: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
    },
    contactName: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    onlineRow: {
      marginTop: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#27AE60',
    },
    onlineText: {
      fontSize: 11,
      color: C.success,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 4,
    },
    contextBar: {
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contextText: {
      flex: 1,
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
    },
    badgeScaleWrap: {
      transform: [{ scale: 0.84 }],
      marginRight: -4,
    },
    chatList: {
      flex: 1,
    },
    chatListContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    dateSeparatorRow: {
      marginVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    separatorLine: {
      flex: 1,
      height: 0.5,
      backgroundColor: C.divider,
    },
    dateSeparatorText: {
      fontSize: 11,
      color: C.textHint,
    },
    systemWrap: {
      alignSelf: 'center',
      borderRadius: 20,
      backgroundColor: C.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginVertical: 8,
    },
    systemText: {
      fontSize: 11,
      color: C.textSecondary,
    },
    outgoingWrap: {
      alignSelf: 'flex-end',
      marginVertical: 3,
      maxWidth: '75%',
      paddingHorizontal: 4,
    },
    outgoingBubble: {
      backgroundColor: C.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    outgoingMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: 'white',
    },
    outgoingTime: {
      marginTop: 2,
      textAlign: 'right',
      fontSize: 10,
      color: 'white',
      opacity: 0.6,
    },
    readReceiptRow: {
      marginTop: 2,
      alignItems: 'flex-end',
      paddingRight: 4,
    },
    incomingWrap: {
      alignSelf: 'flex-start',
      marginVertical: 3,
      maxWidth: '75%',
      paddingHorizontal: 4,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-end',
    },
    smallAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    smallAvatarText: {
      fontSize: 10,
      color: C.primary,
      fontWeight: '700',
    },
    incomingBubble: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderBottomLeftRadius: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexShrink: 1,
    },
    incomingMessage: {
      fontSize: 14,
      color: C.textPrimary,
      lineHeight: 20,
    },
    incomingTime: {
      marginTop: 2,
      fontSize: 10,
      color: C.textHint,
      textAlign: 'right',
    },
    typingBubble: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderBottomLeftRadius: 4,
      paddingVertical: 12,
      paddingHorizontal: 12,
      minWidth: 56,
    },
    typingDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.textHint,
    },
    inputBar: {
      backgroundColor: C.navBg,
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 44,
      justifyContent: 'center',
    },
    input: {
      fontSize: 14,
      color: C.textPrimary,
      maxHeight: 100,
      paddingVertical: 0,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
  });
