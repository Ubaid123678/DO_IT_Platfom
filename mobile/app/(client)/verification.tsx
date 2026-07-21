import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

const verificationItems = [
  {
    label: 'Email verification',
    status: 'Verified',
    icon: 'mail-outline' as const,
  },
  {
    label: 'Phone verification',
    status: 'Verified',
    icon: 'call-outline' as const,
  },
  {
    label: 'Profile completion',
    status: '92%',
    icon: 'person-circle-outline' as const,
  },
  {
    label: 'Security settings',
    status: 'Review',
    icon: 'shield-checkmark-outline' as const,
  },
] as const;

export default function ClientVerificationScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={30} color={C.primary} />
          </View>
          <Text style={styles.heroTitle}>Your client account is verified</Text>
          <Text style={styles.heroSubtitle}>
            Keep your client profile and security settings up to date from this screen.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          {verificationItems.map((item, index) => {
            const isLast = index === verificationItems.length - 1;
            return (
              <View key={item.label} style={[styles.row, !isLast ? styles.rowDivider : null]}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={20} color={C.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowStatus}>{item.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textHint} />
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={C.amber} />
          <Text style={styles.infoText}>
            If you need to update contact details or security preferences, use client settings.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(shared)/settings')}>
          <Text style={styles.primaryButtonText}>Open Client Settings</Text>
        </TouchableOpacity>
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
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
    },
    heroIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
      textAlign: 'center',
    },
    heroSubtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: C.textSecondary,
      textAlign: 'center',
    },
    sectionCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    row: {
      minHeight: 64,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryLight,
    },
    rowTextWrap: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
    },
    rowStatus: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    infoCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#1B2F2D' : C.amberLight,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: C.textPrimary,
    },
    primaryButton: {
      marginTop: 18,
      height: 52,
      borderRadius: 14,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: 'white',
    },
  });
