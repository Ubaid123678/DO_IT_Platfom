import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Colors, type AppColors } from '@/src/theme/colors';

type SupportMessage = {
  id: string;
  from: 'agent' | 'user';
  text: string;
  time: string;
};

type ChatTopic = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const topics: ChatTopic[] = [
  { key: 'Job Issue', label: 'Job Issue', icon: 'briefcase' },
  { key: 'Payment', label: 'Payment', icon: 'cash' },
  { key: 'Account', label: 'Account', icon: 'person' },
  { key: 'KYC', label: 'KYC', icon: 'shield-checkmark' },
  { key: 'Technical', label: 'Technical', icon: 'bug' },
  { key: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const makeTime = () => {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const suffix = now.getHours() >= 12 ? 'PM' : 'AM';
  return `${hours}:${minutes} ${suffix}`;
};

export default function LiveChatSupportScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [chatStarted, setChatStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rating, setRating] = useState(0);
  const [chatEnded, setChatEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [draftRating, setDraftRating] = useState(0);

  const typingDot1 = useRef(new Animated.Value(0.25)).current;
  const typingDot2 = useRef(new Animated.Value(0.25)).current;
  const typingDot3 = useRef(new Animated.Value(0.25)).current;

  const scrollData = useMemo(() => {
    if (!isTyping) {
      return messages;
    }

    return [
      ...messages,
      {
        id: 'typing',
        from: 'agent' as const,
        text: '__typing__',
        time: makeTime(),
      },
    ];
  }, [isTyping, messages]);

  useEffect(() => {
    if (!isTyping) {
      typingDot1.setValue(0.25);
      typingDot2.setValue(0.25);
      typingDot3.setValue(0.25);
      return;
    }

    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.25, duration: 260, useNativeDriver: true }),
        ])
      );

    const a1 = pulse(typingDot1, 0);
    const a2 = pulse(typingDot2, 120);
    const a3 = pulse(typingDot3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isTyping, typingDot1, typingDot2, typingDot3]);

  const startChat = () => {
    if (!selectedTopic) {
      return;
    }

    setMessages([
      {
        id: '1',
        from: 'agent',
        text: 'Hi! I am Sarah from Do It Support. How can I help you today?',
        time: makeTime(),
      },
    ]);
    setChatStarted(true);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading || chatEnded) {
      return;
    }

    const id = `${Date.now()}-user`;
    setMessages((prev) => [...prev, { id, from: 'user', text, time: makeTime() }]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsTyping(true);
    }, 250);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-agent`,
          from: 'agent',
          text: 'Thanks for sharing. I am checking this for you right now and will assist step by step.',
          time: makeTime(),
        },
      ]);
    }, 1450);
  };

  const confirmEndChat = () => {
    Alert.alert('End chat?', 'You can rate your support experience before leaving.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Chat',
        style: 'destructive',
        onPress: () => {
          setChatEnded(true);
          setIsTyping(false);
        },
      },
    ]);
  };

  const submitFeedback = () => {
    const finalRating = draftRating || 5;
    setRating(finalRating);
    setChatEnded(false);
    router.back();
  };

  if (!chatStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Chat</Text>
          <View style={styles.headerIconButton} />
        </View>

        <View style={styles.preChatBody}>
          <View style={styles.agentCard}>
            <View style={styles.agentIconWrap}>
              <Ionicons name="headset" size={36} color={C.primary} />
            </View>
            <Text style={styles.agentName}>Do It Support</Text>
            <View style={styles.agentOnlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online now</Text>
            </View>
            <Text style={styles.agentSubText}>Average response: &lt; 2 min</Text>
          </View>

          <Text style={styles.topicsTitle}>What do you need help with?</Text>

          <View style={styles.topicGrid}>
            {topics.map((topic) => {
              const selected = selectedTopic === topic.key;
              return (
                <TouchableOpacity
                  key={topic.key}
                  style={[styles.topicCard, selected ? styles.topicCardSelected : null]}
                  onPress={() => setSelectedTopic(topic.key)}
                >
                  <Ionicons name={topic.icon} size={24} color={C.primary} style={styles.topicIcon} />
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.startButton, !selectedTopic ? styles.startButtonDisabled : null]}
            onPress={startChat}
            disabled={!selectedTopic}
          >
            <Text style={styles.startButtonText}>{selectedTopic ? 'Start Chat' : 'Select a topic'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.activeHeaderRow}>
        <View style={styles.activeHeaderCenter}>
          <View style={styles.activeAvatar}>
            <Ionicons name="headset" size={16} color={C.primary} />
          </View>

          <View>
            <Text style={styles.activeName}>Sarah - Support</Text>
            <View style={styles.activeOnlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.activeOnlineText}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.headerIconButton} onPress={confirmEndChat}>
          <Ionicons name="close" size={22} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.topicBar}>
        <Text style={styles.topicBarText}>{`Topic: ${selectedTopic ?? 'Support'}`}</Text>
      </View>

      <FlatList
        data={scrollData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.text === '__typing__') {
            return (
              <View style={styles.agentMessageRow}>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDotsRow}>
                    <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
                  </View>
                </View>
              </View>
            );
          }

          if (item.from === 'agent') {
            return (
              <View style={styles.agentMessageRow}>
                <View style={styles.agentBubble}>
                  <Text style={styles.agentMessageText}>{item.text}</Text>
                  <Text style={styles.agentTimeText}>{item.time}</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.userMessageRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userMessageText}>{item.text}</Text>
                <Text style={styles.userTimeText}>{item.time}</Text>
              </View>
            </View>
          );
        }}
      />

      <SafeAreaView style={styles.inputBar} edges={['bottom']}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={C.textHint}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, input.trim().length === 0 ? styles.sendButtonDisabled : null]}
            onPress={sendMessage}
            disabled={input.trim().length === 0 || loading || chatEnded}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {chatEnded && rating === 0 ? (
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was your experience?</Text>

            <View style={styles.starRow}>
              {Array.from({ length: 5 }).map((_, index) => {
                const filled = index < draftRating;
                return (
                  <TouchableOpacity key={`rate-${index}`} onPress={() => setDraftRating(index + 1)}>
                    <Ionicons name={filled ? 'star' : 'star-outline'} size={32} color={C.amber} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.feedbackInput}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us more (optional)"
              placeholderTextColor={C.textHint}
              multiline
            />

            <TouchableOpacity style={styles.feedbackButton} onPress={submitFeedback}>
              <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
    preChatBody: {
      flex: 1,
      paddingHorizontal: 20,
    },
    agentCard: {
      marginTop: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 24,
      alignItems: 'center',
    },
    agentIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    agentName: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '700',
      color: C.textPrimary,
    },
    agentOnlineRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#27AE60',
    },
    onlineText: {
      fontSize: 13,
      color: '#27AE60',
    },
    agentSubText: {
      marginTop: 4,
      fontSize: 12,
      color: C.textHint,
    },
    topicsTitle: {
      marginTop: 24,
      marginBottom: 12,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    topicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
    },
    topicCard: {
      width: '48.5%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
      alignItems: 'center',
    },
    topicCardSelected: {
      borderColor: C.primary,
      backgroundColor: C.primaryLight,
    },
    topicIcon: {
      marginBottom: 6,
    },
    topicLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textPrimary,
      textAlign: 'center',
    },
    startButton: {
      marginTop: 20,
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButtonDisabled: {
      backgroundColor: C.textHint,
    },
    startButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
    activeHeaderRow: {
      height: 56,
      marginTop: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeHeaderCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginLeft: 30,
    },
    activeAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeName: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    activeOnlineRow: {
      marginTop: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activeOnlineText: {
      fontSize: 11,
      color: '#27AE60',
    },
    topicBar: {
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    topicBarText: {
      fontSize: 12,
      color: C.primary,
      fontWeight: '600',
    },
    chatContent: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
    },
    agentMessageRow: {
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    userMessageRow: {
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    agentBubble: {
      maxWidth: '78%',
      borderRadius: 16,
      borderBottomLeftRadius: 6,
      backgroundColor: isDark ? '#152E2C' : C.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    userBubble: {
      maxWidth: '78%',
      borderRadius: 16,
      borderBottomRightRadius: 6,
      backgroundColor: C.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    agentMessageText: {
      fontSize: 14,
      color: C.textPrimary,
      lineHeight: 20,
    },
    userMessageText: {
      fontSize: 14,
      color: 'white',
      lineHeight: 20,
    },
    agentTimeText: {
      marginTop: 4,
      alignSelf: 'flex-end',
      fontSize: 11,
      color: C.textHint,
    },
    userTimeText: {
      marginTop: 4,
      alignSelf: 'flex-end',
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
    },
    typingBubble: {
      borderRadius: 14,
      backgroundColor: isDark ? '#152E2C' : C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    typingDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typingDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: C.primary,
    },
    inputBar: {
      borderTopWidth: 1,
      borderTopColor: C.navBorder,
      backgroundColor: C.navBg,
      paddingTop: 8,
      paddingHorizontal: 12,
    },
    inputRow: {
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
    ratingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingCard: {
      marginHorizontal: 32,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 24,
      width: '84%',
    },
    ratingTitle: {
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: C.textPrimary,
      marginBottom: 14,
    },
    starRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    feedbackInput: {
      height: 80,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: C.textPrimary,
      textAlignVertical: 'top',
    },
    feedbackButton: {
      marginTop: 12,
      width: '100%',
      height: 48,
      borderRadius: 10,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
  });
