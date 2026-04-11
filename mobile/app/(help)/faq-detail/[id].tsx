import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type Article = {
  id: string;
  category: string;
  question: string;
  intro: string;
  steps: string[];
  tip: string;
  relatedIds: string[];
};

const articleMap: Record<string, Article> = {
  'faq-1': {
    id: 'faq-1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    intro:
      'Creating your account takes less than two minutes. Start by tapping Register, choose your role, and complete verification to unlock your dashboard.',
    steps: [
      'Open the app and tap Register on the welcome screen.',
      'Select Client or Provider based on how you plan to use Do It.',
      'Enter your phone or email and verify with the OTP code.',
      'Add your profile details and save to finish setup.',
    ],
    tip: 'Use a valid phone/email you can access quickly. Verification is required for secure payments and dispute support.',
    relatedIds: ['faq-4', 'faq-5', 'faq-12'],
  },
  'faq-2': {
    id: 'faq-2',
    category: 'Jobs',
    question: 'How do I post a job?',
    intro:
      'Posting a job helps providers send proposals that match your timeline and budget. Be specific so you get faster and better responses.',
    steps: [
      'Go to Post Job from the client home tab.',
      'Choose the category, location, date, and preferred budget.',
      'Add clear requirements and optional photos for context.',
      'Publish and review proposals from available providers.',
    ],
    tip: 'Detailed job descriptions improve proposal quality and reduce back-and-forth in chat.',
    relatedIds: ['faq-9', 'faq-3', 'faq-6'],
  },
  'faq-3': {
    id: 'faq-3',
    category: 'Payments',
    question: 'How does payment work?',
    intro:
      'Do It uses escrow for safer transactions. Funds are secured first, then released after completion or admin resolution if a dispute is raised.',
    steps: [
      'Add funds to your wallet using a supported method.',
      'Confirm payment for a selected provider when work begins.',
      'Funds stay protected in escrow while the job is active.',
      'Release payment on completion, or raise a dispute if needed.',
    ],
    tip: 'Escrow protects both sides by ensuring the amount is available while keeping release conditional on job progress.',
    relatedIds: ['faq-6', 'faq-7', 'faq-11'],
  },
};

const fallbackArticle: Article = articleMap['faq-3'];

export default function FaqDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const articleId = Array.isArray(id) ? (id[0] ?? 'faq-3') : (id ?? 'faq-3');

  const [article, setArticle] = useState<Article>(articleMap[articleId] ?? fallbackArticle);
  const [helpful, setHelpful] = useState<null | 'yes' | 'no'>(null);

  useEffect(() => {
    setArticle(articleMap[articleId] ?? fallbackArticle);
    setHelpful(null);
  }, [articleId]);

  const relatedArticles = useMemo(
    () => article.relatedIds.map((relatedId) => articleMap[relatedId]).filter(Boolean),
    [article.relatedIds]
  );

  const onShare = async () => {
    try {
      await Share.share({
        message: `${article.question} - Do It Help Center`,
      });
    } catch {
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help Article</Text>

        <TouchableOpacity style={styles.headerIconButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.articleCard}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{article.category}</Text>
          </View>

          <Text style={styles.questionText}>{article.question}</Text>

          <Text style={styles.bodyText}>
            {article.intro.split(' ').slice(0, 8).join(' ')}{' '}
            <Text style={styles.bodyTextStrong}>{article.intro.split(' ').slice(8, 14).join(' ')}</Text>{' '}
            {article.intro.split(' ').slice(14).join(' ')}
          </Text>

          <View style={styles.stepsWrap}>
            {article.steps.map((step, index) => (
              <View key={`${article.id}-step-${index}`} style={styles.stepRow}>
                <View style={styles.stepIndexCircle}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCallout}>
            <Ionicons name="information-circle" size={16} color={C.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>{article.tip}</Text>
          </View>

          <View style={styles.helpfulSection}>
            <Text style={styles.helpfulTitle}>Was this article helpful?</Text>

            <View style={styles.helpfulButtonsRow}>
              <TouchableOpacity
                style={[styles.helpfulButton, helpful === 'yes' ? styles.helpfulYesSelected : null]}
                onPress={() => setHelpful('yes')}
              >
                <Ionicons
                  name="thumbs-up"
                  size={18}
                  color={helpful === 'yes' ? C.success : C.textHint}
                />
                <Text style={[styles.helpfulButtonText, helpful === 'yes' ? styles.helpfulYesText : null]}>
                  Yes, helpful
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpfulButton, helpful === 'no' ? styles.helpfulNoSelected : null]}
                onPress={() => setHelpful('no')}
              >
                <Ionicons
                  name="thumbs-down"
                  size={18}
                  color={helpful === 'no' ? C.error : C.textHint}
                />
                <Text style={[styles.helpfulButtonText, helpful === 'no' ? styles.helpfulNoText : null]}>
                  Not helpful
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Articles</Text>

            {relatedArticles.slice(0, 3).map((related, index) => (
              <TouchableOpacity
                key={related.id}
                style={[styles.relatedRow, index === 2 ? styles.relatedRowLast : null]}
                onPress={() =>
                  router.push({
                    pathname: '/(help)/faq-detail/[id]',
                    params: { id: related.id },
                  })
                }
              >
                <Text style={styles.relatedText}>{related.question}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textHint} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Still need help?</Text>

            <TouchableOpacity style={styles.supportButton} onPress={() => router.push('/(help)/live-chat')}>
              <Text style={styles.supportButtonText}>Chat with Support</Text>
            </TouchableOpacity>
          </View>
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    articleCard: {
      marginTop: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 20,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      borderRadius: 20,
      backgroundColor: C.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 10,
    },
    categoryPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: C.primary,
    },
    questionText: {
      marginBottom: 16,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
      color: C.textPrimary,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 24,
      color: C.textSecondary,
    },
    bodyTextStrong: {
      fontWeight: '700',
      color: C.textPrimary,
    },
    stepsWrap: {
      marginTop: 14,
      gap: 10,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    stepIndexCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepIndexText: {
      fontSize: 11,
      color: 'white',
      fontWeight: '700',
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 22,
      color: C.textSecondary,
    },
    infoCallout: {
      marginVertical: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: C.primary,
      backgroundColor: isDark ? '#0F3330' : C.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      marginRight: 8,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
    helpfulSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    helpfulTitle: {
      marginBottom: 12,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    helpfulButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    helpfulButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#0D1F1E' : C.card,
    },
    helpfulButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: C.textHint,
    },
    helpfulYesSelected: {
      borderColor: C.success,
    },
    helpfulYesText: {
      color: C.success,
    },
    helpfulNoSelected: {
      borderColor: C.error,
    },
    helpfulNoText: {
      color: C.error,
    },
    relatedSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    relatedTitle: {
      marginBottom: 10,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    relatedRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    relatedRowLast: {
      borderBottomWidth: 0,
    },
    relatedText: {
      flex: 1,
      fontSize: 14,
      color: C.primary,
    },
    supportSection: {
      marginTop: 20,
      marginBottom: 32,
      alignItems: 'center',
    },
    supportTitle: {
      marginBottom: 10,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    supportButton: {
      width: '100%',
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
  });
