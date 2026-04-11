import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

const quickActions = [
  {
    label: 'Browse FAQs',
    subtitle: 'Find instant answers',
    icon: 'help-circle-outline' as const,
    route: '/(help)/faq' as const,
  },
  {
    label: 'Live Chat',
    subtitle: 'Chat with support',
    icon: 'chatbubbles-outline' as const,
    route: '/(help)/live-chat' as const,
    online: true,
  },
  {
    label: 'Submit Ticket',
    subtitle: 'Get help via email',
    icon: 'ticket-outline' as const,
    route: '/(help)/new-ticket' as const,
  },
  {
    label: 'Report Issue',
    subtitle: 'Report a user or job',
    icon: 'flag-outline' as const,
    route: '/(help)/report' as const,
    isError: true,
  },
];

const topics = [
  'How do I post a job?',
  'How does payment work?',
  'How do I verify my identity?',
  'What happens if there is a dispute?',
  'How do I withdraw my earnings?',
] as const;

export default function HelpSupportHomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [searchQuery, setSearchQuery] = useState('');

  const onChangeSearch = (value: string) => {
    setSearchQuery(value);
    router.push({
      pathname: '/(help)/faq',
      params: { searchQuery: value },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Ionicons name="headset" size={52} color="white" style={styles.heroIcon} />
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>We typically reply within a few minutes</Text>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={onChangeSearch}
            />
          </View>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickCard}
              onPress={() => router.push(item.route)}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconWrap, item.isError ? styles.quickIconWrapError : null]}>
                <Ionicons name={item.icon} size={22} color={item.isError ? C.error : C.primary} />
              </View>

              {item.online ? (
                <View style={styles.liveTitleRow}>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              ) : (
                <Text style={styles.quickLabel}>{item.label}</Text>
              )}

              <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>

          <View style={styles.topicsCard}>
            {topics.map((topic, index) => (
              <TouchableOpacity
                key={topic}
                style={[styles.topicRow, index === topics.length - 1 ? styles.topicRowLast : null]}
                onPress={() =>
                  router.push({
                    pathname: '/(help)/faq',
                    params: { searchQuery: topic },
                  })
                }
              >
                <Ionicons name="help-circle-outline" size={20} color={C.primary} style={styles.topicIcon} />
                <Text style={styles.topicText}>{topic}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.textHint} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.85}>
            <Ionicons name="mail" size={24} color={C.primary} />
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactSubtitle}>support@doitapp.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactSubtitle}>9am-9pm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
      gap: 10,
    },
    backButton: {
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    heroCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      backgroundColor: C.primary,
    },
    heroIcon: {
      marginBottom: 10,
    },
    heroTitle: {
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
    },
    heroSubtitle: {
      marginTop: 4,
      textAlign: 'center',
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
    },
    searchWrap: {
      marginTop: 14,
      width: '100%',
      height: 44,
      borderRadius: 22,
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: '#1A1A1A',
      paddingVertical: 0,
    },
    quickGrid: {
      marginTop: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    quickCard: {
      width: '48%',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 16,
      alignItems: 'center',
    },
    quickIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    quickIconWrapError: {
      backgroundColor: isDark ? '#2E1010' : '#FDECEA',
    },
    quickLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
      textAlign: 'center',
    },
    quickSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
      textAlign: 'center',
    },
    liveTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.success,
      marginLeft: 2,
    },
    onlineText: {
      fontSize: 10,
      fontWeight: '600',
      color: C.success,
    },
    topicsSection: {
      marginTop: 24,
    },
    sectionTitle: {
      marginBottom: 10,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    topicsCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      overflow: 'hidden',
    },
    topicRow: {
      height: 52,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    topicRowLast: {
      borderBottomWidth: 0,
    },
    topicIcon: {
      marginRight: 12,
    },
    topicText: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    contactRow: {
      marginTop: 20,
      marginBottom: 32,
      flexDirection: 'row',
      gap: 12,
    },
    contactCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 14,
      alignItems: 'center',
    },
    contactTitle: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
      color: C.textPrimary,
    },
    contactSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: C.textSecondary,
      textAlign: 'center',
    },
  });
