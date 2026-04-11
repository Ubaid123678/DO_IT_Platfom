import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type TicketStatus = 'Open' | 'In Review' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'Urgent';

type TicketMessage = {
  id: string;
  kind: 'date' | 'user' | 'support' | 'system' | 'resolution';
  text: string;
  time?: string;
  files?: string[];
};

type TicketThread = {
  status: TicketStatus;
  category: string;
  priority: TicketPriority;
  openedAgo: string;
  messages: TicketMessage[];
};

const threadById: Record<string, TicketThread> = {
  '00234': {
    status: 'In Review',
    category: 'Payment Problem',
    priority: 'Medium',
    openedAgo: 'Opened 3 days ago',
    messages: [
      { id: 'd1', kind: 'date', text: 'Apr 08, 2026' },
      {
        id: 'u1',
        kind: 'user',
        time: '10:14 AM',
        text: 'I was charged twice when I topped up my wallet. Please help me with refund status.',
        files: ['bank-statement.png'],
      },
      {
        id: 's1',
        kind: 'support',
        time: '10:22 AM',
        text: 'Thanks for reporting this. I am Sarah from support and I have shared it with our billing team for verification.',
      },
      {
        id: 'sys-1',
        kind: 'system',
        text: 'Status changed to: In Review · 2 days ago',
      },
      {
        id: 's2',
        kind: 'support',
        time: '11:05 AM',
        text: 'We have matched your transaction logs. You should receive confirmation shortly once reconciliation is complete.',
      },
    ],
  },
  '00235': {
    status: 'Resolved',
    category: 'App Bug',
    priority: 'Low',
    openedAgo: 'Opened 1 day ago',
    messages: [
      { id: 'd2', kind: 'date', text: 'Apr 10, 2026' },
      {
        id: 'u2',
        kind: 'user',
        time: '8:42 PM',
        text: 'The proposals page keeps freezing for me after the latest update.',
      },
      {
        id: 's3',
        kind: 'support',
        time: '8:50 PM',
        text: 'Thanks for the report. We released a fix today. Please update and let us know if this resolves it.',
      },
      { id: 'res-1', kind: 'resolution', text: 'Ticket Resolved' },
    ],
  },
};

const makeTime = () => {
  const now = new Date();
  const hrs = now.getHours() % 12 || 12;
  const mins = now.getMinutes().toString().padStart(2, '0');
  const suffix = now.getHours() >= 12 ? 'PM' : 'AM';
  return `${hrs}:${mins} ${suffix}`;
};

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const resolvedId = Array.isArray(id) ? (id[0] ?? '00234') : (id ?? '00234');
  const source = threadById[resolvedId] ?? threadById['00234'];

  const [messages, setMessages] = useState<TicketMessage[]>(source.messages);
  const [input, setInput] = useState('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(source.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextSource = threadById[resolvedId] ?? threadById['00234'];
    setMessages(nextSource.messages);
    setTicketStatus(nextSource.status);
    setInput('');
    setLoading(false);
  }, [resolvedId]);

  const statusPill = useMemo(() => {
    if (ticketStatus === 'Open') {
      return { bg: C.primaryLight, color: C.primary };
    }
    if (ticketStatus === 'In Review') {
      return { bg: C.amberLight, color: C.amber };
    }
    if (ticketStatus === 'Resolved') {
      return { bg: isDark ? '#0F2E1F' : '#E8F8F2', color: C.success };
    }
    return { bg: C.background, color: C.textHint };
  }, [ticketStatus, C, isDark]);

  const canReply = ticketStatus !== 'Closed' && ticketStatus !== 'Resolved';

  const sendReply = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !canReply) {
      return;
    }

    const userMsg: TicketMessage = {
      id: `u-${Date.now()}`,
      kind: 'user',
      text: trimmed,
      time: makeTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          kind: 'support',
          text: 'Thanks for the update. I have added this to your ticket and will follow up shortly.',
          time: makeTime(),
        },
      ]);
    }, 900);
  };

  const reopenTicket = () => {
    setTicketStatus('In Review');
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-reopen-${Date.now()}`,
        kind: 'system',
        text: 'Status changed to: In Review · just now',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{`#TK-${resolvedId}`}</Text>

        <View style={[styles.headerStatusPill, { backgroundColor: statusPill.bg }]}>
          <Text style={[styles.headerStatusText, { color: statusPill.color }]}>{ticketStatus}</Text>
        </View>
      </View>

      <View style={styles.infoBar}>
        <View style={styles.infoCategoryPill}>
          <Text style={styles.infoCategoryText}>{source.category}</Text>
        </View>

        <View style={styles.infoPriorityPill}>
          <Text style={styles.infoPriorityText}>{source.priority}</Text>
        </View>

        <Text style={styles.infoTimeText}>{source.openedAgo}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: canReply ? 90 : 128 }]}
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

          if (item.kind === 'resolution') {
            return (
              <View style={styles.resolutionWrap}>
                <Ionicons name="checkmark-circle" size={20} color={C.success} />
                <Text style={styles.resolutionText}>Ticket Resolved</Text>
              </View>
            );
          }

          if (item.kind === 'user') {
            return (
              <View style={styles.userContainer}>
                <View style={styles.msgMetaRow}>
                  <Text style={styles.msgMetaText}>You</Text>
                  <Text style={styles.msgMetaText}>{item.time}</Text>
                </View>

                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{item.text}</Text>

                  {item.files?.length ? (
                    <View style={styles.filesWrap}>
                      {item.files.map((file) => (
                        <View key={file} style={styles.fileChip}>
                          <Ionicons name="attach" size={14} color={C.primary} />
                          <Text style={styles.fileChipText}>{file}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }

          return (
            <View style={styles.supportContainer}>
              <View style={styles.supportMetaRow}>
                <View style={styles.supportAvatar}>
                  <Text style={styles.supportAvatarText}>S</Text>
                </View>

                <View style={styles.supportMetaTexts}>
                  <Text style={styles.msgMetaText}>Sarah - Support Agent</Text>
                  <Text style={styles.msgMetaText}>{item.time}</Text>
                </View>
              </View>

              <View style={styles.supportBubble}>
                <Text style={styles.supportText}>{item.text}</Text>

                {item.files?.length ? (
                  <View style={styles.filesWrap}>
                    {item.files.map((file) => (
                      <View key={file} style={styles.fileChip}>
                        <Ionicons name="attach" size={14} color={C.primary} />
                        <Text style={styles.fileChipText}>{file}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {canReply ? (
        <SafeAreaView style={styles.replyBar} edges={['bottom']}>
          <View style={styles.replyRow}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Write a reply..."
                placeholderTextColor={C.textHint}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, input.trim().length === 0 ? styles.sendButtonDisabled : null]}
              onPress={sendReply}
              disabled={input.trim().length === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.closedBar} edges={['bottom']}>
          <Text style={styles.closedText}>{ticketStatus === 'Closed' ? 'This ticket is closed.' : 'This ticket is resolved.'}</Text>

          <View style={styles.closedActionsRow}>
            <TouchableOpacity style={styles.newTicketBtn} onPress={() => router.push('/(help)/new-ticket')}>
              <Text style={styles.newTicketBtnText}>Open New Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reopenBtn} onPress={reopenTicket}>
              <Text style={styles.reopenBtnText}>Reopen Ticket</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    headerIconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
    },
    headerStatusPill: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    headerStatusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    infoBar: {
      backgroundColor: isDark ? '#152E2C' : C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoCategoryPill: {
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    infoCategoryText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.primary,
    },
    infoPriorityPill: {
      borderRadius: 20,
      backgroundColor: C.amberLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    infoPriorityText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.amber,
    },
    infoTimeText: {
      fontSize: 11,
      color: C.textHint,
      marginLeft: 'auto',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
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
    userContainer: {
      alignItems: 'flex-end',
      marginVertical: 6,
    },
    supportContainer: {
      alignItems: 'flex-start',
      marginVertical: 6,
    },
    msgMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    msgMetaText: {
      fontSize: 11,
      color: C.textHint,
    },
    userBubble: {
      maxWidth: '80%',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      backgroundColor: C.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userText: {
      fontSize: 14,
      color: 'white',
      lineHeight: 20,
    },
    supportMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    supportAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportAvatarText: {
      fontSize: 12,
      fontWeight: '700',
      color: 'white',
    },
    supportMetaTexts: {
      gap: 1,
    },
    supportBubble: {
      maxWidth: '80%',
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderLeftWidth: 3,
      borderLeftColor: C.primary,
      backgroundColor: isDark ? '#152E2C' : C.card,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    supportText: {
      fontSize: 14,
      color: C.textPrimary,
      lineHeight: 20,
    },
    filesWrap: {
      marginTop: 8,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    fileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: C.primaryLight,
    },
    fileChipText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '500',
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
    resolutionWrap: {
      marginVertical: 8,
      borderRadius: 10,
      padding: 12,
      backgroundColor: isDark ? '#0F2E1F' : '#E8F8F2',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resolutionText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.success,
    },
    replyBar: {
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      backgroundColor: C.navBg,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    replyRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingBottom: 6,
    },
    inputWrap: {
      flex: 1,
      minHeight: 42,
      maxHeight: 110,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      justifyContent: 'center',
    },
    input: {
      fontSize: 14,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: C.textHint,
    },
    closedBar: {
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    closedText: {
      textAlign: 'center',
      marginBottom: 8,
      fontSize: 13,
      color: C.textSecondary,
    },
    closedActionsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingBottom: 8,
    },
    newTicketBtn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newTicketBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    reopenBtn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
    },
    reopenBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
    },
  });
