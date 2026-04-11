import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type FaqCategory =
  | 'Getting Started'
  | 'Payments'
  | 'Jobs'
  | 'Providers'
  | 'Safety'
  | 'Account'
  | 'Technical';

type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
};

const categories: Array<'All' | FaqCategory> = [
  'All',
  'Getting Started',
  'Payments',
  'Jobs',
  'Providers',
  'Safety',
  'Account',
  'Technical',
];

const seedFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer:
      'Tap Register, choose your role, verify your phone or email, and complete your profile. You can start posting or accepting jobs right away.',
  },
  {
    id: 'faq-2',
    category: 'Jobs',
    question: 'How do I post a job?',
    answer:
      'Go to Post Job, select a category, add location and budget, then publish. Providers in your area will submit proposals.',
  },
  {
    id: 'faq-3',
    category: 'Payments',
    question: 'How does payment work?',
    answer:
      'Payments are held securely in escrow. Funds are released when work is marked complete or after dispute resolution if needed.',
  },
  {
    id: 'faq-4',
    category: 'Account',
    question: 'How do I reset my password?',
    answer:
      'From login, tap Forgot Password and follow the OTP flow. Choose a new password and sign in again.',
  },
  {
    id: 'faq-5',
    category: 'Providers',
    question: 'How do I verify my identity?',
    answer:
      'Open KYC from provider tools and upload your required documents and selfie. Reviews usually complete within 24-48 hours.',
  },
  {
    id: 'faq-6',
    category: 'Safety',
    question: 'What happens if there is a dispute?',
    answer:
      'Either side can raise a dispute from job details. Payment is temporarily frozen while admin reviews evidence from both parties.',
  },
  {
    id: 'faq-7',
    category: 'Payments',
    question: 'How do I withdraw my earnings?',
    answer:
      'Go to Wallet Withdraw, choose your payout method, confirm conversion if applicable, and submit. Transfers arrive in 1-3 business days.',
  },
  {
    id: 'faq-8',
    category: 'Technical',
    question: 'The app is not loading. What should I do?',
    answer:
      'Check your connection, restart the app, and update to the latest version. If it continues, contact support with screenshots.',
  },
  {
    id: 'faq-9',
    category: 'Jobs',
    question: 'Can I cancel a job after posting?',
    answer:
      'Yes. Open the job and cancel before assigning a provider. If work started, cancellation may require mutual agreement.',
  },
  {
    id: 'faq-10',
    category: 'Providers',
    question: 'How are provider ratings calculated?',
    answer:
      'Ratings combine review score, completion consistency, and recent performance trends to keep profiles fair and current.',
  },
  {
    id: 'faq-11',
    category: 'Safety',
    question: 'How do I report a suspicious user?',
    answer:
      'Use Report Issue in Help. Include profile/job references and evidence. Our moderation team investigates promptly.',
  },
  {
    id: 'faq-12',
    category: 'Account',
    question: 'Can I switch from client to provider?',
    answer:
      'Yes. You can choose a role from onboarding/settings and complete required profile fields for provider mode.',
  },
];

export default function FaqScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ searchQuery?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const initialQuery = Array.isArray(params.searchQuery)
    ? (params.searchQuery[0] ?? '')
    : (params.searchQuery ?? '');

  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<'All' | FaqCategory>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqs] = useState<FaqItem[]>(seedFaqs);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return faqs.filter((item) => {
      const categoryMatch = activeCategory === 'All' ? true : item.category === activeCategory;
      const queryMatch =
        q.length === 0
          ? true
          : item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);

      return categoryMatch && queryMatch;
    });
  }, [activeCategory, faqs, search]);

  const onToggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={C.textHint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search FAQs..."
          placeholderTextColor={C.textHint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryPill, active ? styles.categoryPillActive : styles.categoryPillIdle]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={active ? styles.categoryTextActive : styles.categoryTextIdle}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredFaqs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <Text style={styles.footerPrompt}>Didn't find your answer?</Text>
            <TouchableOpacity style={styles.contactButton} onPress={() => router.push('/(help)/live-chat')}>
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;

          return (
            <TouchableOpacity style={styles.faqCard} activeOpacity={0.9} onPress={() => onToggleFaq(item.id)}>
              <View style={styles.faqHeaderRow}>
                <Text style={styles.questionText}>{item.question}</Text>
                <Ionicons name={expanded ? 'remove' : 'add'} size={20} color={C.primary} />
              </View>

              {expanded ? (
                <View style={styles.expandedWrap}>
                  <Text style={styles.answerText}>{item.answer}</Text>

                  <View style={styles.helpfulRow}>
                    <Text style={styles.helpfulLabel}>Was this helpful?</Text>

                    <TouchableOpacity style={styles.helpfulChip}>
                      <Text style={styles.helpfulChipText}>👍 Yes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.helpfulChip}>
                      <Text style={styles.helpfulChipText}>👎 No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
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
    searchWrap: {
      marginHorizontal: 20,
      marginTop: 12,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    categoryScroll: {
      marginVertical: 10,
      maxHeight: 44,
    },
    categoryRow: {
      paddingHorizontal: 20,
      gap: 8,
      alignItems: 'center',
    },
    categoryPill: {
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    categoryPillActive: {
      borderColor: C.primary,
      backgroundColor: C.primary,
    },
    categoryPillIdle: {
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
    },
    categoryTextActive: {
      fontSize: 13,
      color: 'white',
      fontWeight: '600',
    },
    categoryTextIdle: {
      fontSize: 13,
      color: C.textPrimary,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    separator: {
      height: 8,
    },
    faqCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      overflow: 'hidden',
    },
    faqHeaderRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    questionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: C.textPrimary,
    },
    expandedWrap: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1F4A47' : C.divider,
    },
    answerText: {
      fontSize: 14,
      lineHeight: 22,
      color: C.textSecondary,
    },
    helpfulRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    helpfulLabel: {
      fontSize: 13,
      color: C.textSecondary,
    },
    helpfulChip: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: isDark ? '#0D1F1E' : C.card,
    },
    helpfulChipText: {
      fontSize: 12,
      color: C.textPrimary,
    },
    footerWrap: {
      marginTop: 16,
      marginBottom: 32,
    },
    footerPrompt: {
      marginBottom: 10,
      textAlign: 'center',
      fontSize: 14,
      color: C.textSecondary,
    },
    contactButton: {
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
  });
