import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

const safetyTips = [
  {
    title: 'Never share personal info outside the app',
    description: 'Keep calls, payments, and identity verification inside Do It for your safety and traceability.',
  },
  {
    title: 'Always pay through Do It wallet',
    description: 'Wallet and escrow payments protect both parties and allow fast dispute support if needed.',
  },
  {
    title: 'Verify provider before physical meetups',
    description: 'Check profile ratings, verification badges, and recent reviews before confirming in-person jobs.',
  },
  {
    title: 'Report suspicious users immediately',
    description: 'Use the in-app reporting flow as soon as you notice harassment, scams, or unsafe behavior.',
  },
  {
    title: 'Keep all communication within the app',
    description: 'In-app chat helps moderation teams review incidents quickly and accurately when required.',
  },
] as const;

export default function SafetyCenterScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Ionicons name="shield-checkmark" size={48} color="white" style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Your Safety is Our Priority</Text>
          <Text style={styles.heroSubtitle}>
            Do It uses advanced fraud detection and KYC verification to keep everyone safe.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How we protect you</Text>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapPrimary}>
            <Ionicons name="shield-checkmark" size={24} color={C.primary} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={styles.featureTitle}>Verified Providers Only</Text>
            <Text style={styles.featureDesc}>Every provider is identity-verified with KYC.</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapPrimary}>
            <Ionicons name="lock-closed" size={24} color={C.primary} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={styles.featureTitle}>Escrow Payment Protection</Text>
            <Text style={styles.featureDesc}>Money held safely until job confirmed done.</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapAmber}>
            <Ionicons name="eye" size={24} color={C.amber} />
          </View>
          <View style={styles.featureTextWrap}>
            <Text style={styles.featureTitle}>24/7 Fraud Monitoring</Text>
            <Text style={styles.featureDesc}>Automated systems monitor all activity.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitleTips}>Safety Tips</Text>

        <View style={styles.tipsCard}>
          {safetyTips.map((tip, index) => {
            const expanded = expandedTip === tip.title;

            return (
              <TouchableOpacity
                key={tip.title}
                style={[styles.tipRow, index === safetyTips.length - 1 ? styles.tipRowLast : null]}
                onPress={() => setExpandedTip((prev) => (prev === tip.title ? null : tip.title))}
                activeOpacity={0.9}
              >
                <View style={styles.tipHeaderRow}>
                  <Ionicons name="checkmark-circle" size={18} color={C.primary} style={styles.tipIcon} />
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Ionicons name={expanded ? 'remove' : 'add'} size={18} color={C.textHint} />
                </View>

                {expanded ? <Text style={styles.tipDesc}>{tip.description}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.emergencyWrap}>
          <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/(help)/report')}>
            <Ionicons name="alert-circle" size={20} color={C.error} />
            <Text style={styles.reportButtonText}>Report Safety Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencySupportButton}
            onPress={() => router.push('/(help)/live-chat')}
          >
            <Ionicons name="headset" size={20} color="white" />
            <Text style={styles.emergencySupportText}>Contact Emergency Support</Text>
            <Text style={styles.emergencySupportSub}>Available 24/7</Text>
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
      backgroundColor: C.primary,
      padding: 24,
      alignItems: 'center',
    },
    heroIcon: {
      marginBottom: 10,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
    heroSubtitle: {
      marginTop: 6,
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
      lineHeight: 20,
    },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 12,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    featureCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      padding: 16,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    featureIconWrapPrimary: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    featureIconWrapAmber: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.amberLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    featureTextWrap: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    featureDesc: {
      marginTop: 4,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
    sectionTitleTips: {
      marginTop: 20,
      marginBottom: 12,
      fontSize: 16,
      fontWeight: '600',
      color: C.textPrimary,
    },
    tipsCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: isDark ? '#152E2C' : C.card,
      overflow: 'hidden',
    },
    tipRow: {
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
      padding: 14,
    },
    tipRowLast: {
      borderBottomWidth: 0,
    },
    tipHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tipIcon: {
      marginTop: 1,
    },
    tipTitle: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
    },
    tipDesc: {
      marginTop: 8,
      marginLeft: 26,
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
    },
    emergencyWrap: {
      marginTop: 20,
      marginBottom: 32,
      gap: 12,
    },
    reportButton: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.error,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: C.card,
    },
    reportButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: C.error,
    },
    emergencySupportButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emergencySupportText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'white',
    },
    emergencySupportSub: {
      marginLeft: 4,
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
    },
  });
