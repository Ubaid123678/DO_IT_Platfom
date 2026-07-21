import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type Period = 'week' | 'month' | 'all';
type TxType = 'earning' | 'withdrawal' | 'bonus';

type EarningsTransaction = {
  id: string;
  type: TxType;
  label: string;
  date: string;
  amount: number;
  bucket: 'week' | 'month';
};

type PeriodSummary = {
  total: number;
  jobs: number;
  avgJob: number;
  rating: number;
  pending: number;
  available: number;
  bars: number[];
  labels: string[];
};

const periodTabs: Array<{ key: Period; label: string }> = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const summaryByPeriod: Record<Period, PeriodSummary> = {
  week: {
    total: 860,
    jobs: 11,
    avgJob: 78,
    rating: 4.9,
    pending: 40,
    available: 820,
    bars: [52, 44, 67, 58, 71, 80, 75],
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
  month: {
    total: 3450,
    jobs: 47,
    avgJob: 73,
    rating: 4.9,
    pending: 120,
    available: 3330,
    bars: [42, 58, 66, 78, 62, 86, 74],
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
  },
  all: {
    total: 15320,
    jobs: 204,
    avgJob: 75,
    rating: 4.9,
    pending: 120,
    available: 15200,
    bars: [20, 32, 48, 58, 76, 84, 96],
    labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J'],
  },
};

const mockTransactions: EarningsTransaction[] = [
  {
    id: 'e-101',
    type: 'earning',
    label: 'Payment Received - Delivery Job',
    date: 'Apr 11, 09:30 AM',
    amount: 50,
    bucket: 'week',
  },
  {
    id: 'e-102',
    type: 'withdrawal',
    label: 'Withdrawal to Bank',
    date: 'Apr 10, 04:10 PM',
    amount: -120,
    bucket: 'week',
  },
  {
    id: 'e-103',
    type: 'bonus',
    label: 'Performance Bonus',
    date: 'Apr 08, 01:00 PM',
    amount: 35,
    bucket: 'week',
  },
  {
    id: 'e-104',
    type: 'earning',
    label: 'Payment Received - Cleaning Job',
    date: 'Apr 04, 11:45 AM',
    amount: 80,
    bucket: 'month',
  },
  {
    id: 'e-105',
    type: 'earning',
    label: 'Payment Received - Design Job',
    date: 'Mar 27, 08:20 PM',
    amount: 145,
    bucket: 'month',
  },
];

const formatAmount = (value: number) => {
  const abs = Math.abs(value);
  return `${value >= 0 ? '+' : '-'}$${abs.toFixed(0)}`;
};

export default function ProviderEarningsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);

  const [period, setPeriod] = useState<Period>('month');
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 320);

    return () => clearTimeout(timer);
  }, []);

  const summary = summaryByPeriod[period];

  const visibleTransactions = useMemo(() => {
    if (period === 'all') {
      return transactions;
    }

    if (period === 'month') {
      return transactions;
    }

    return transactions.filter((item) => item.bucket === 'week');
  }, [period, transactions]);

  const maxBar = Math.max(...summary.bars, 1);
  const highlightedBarIndex = summary.bars.indexOf(maxBar);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="calendar-outline" size={24} color={C.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.periodTabsWrap}>
            {periodTabs.map((tab) => {
              const active = period === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.periodTab, active ? styles.periodTabActive : null]}
                  onPress={() => setPeriod(tab.key)}
                >
                  <Text style={active ? styles.periodTabTextActive : styles.periodTabTextInactive}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.totalText}>{`$${summary.total.toFixed(2)}`}</Text>
          <Text style={styles.totalSubText}>Total earnings</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricValue}>{`Jobs: ${summary.jobs}`}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricValue}>{`Avg/Job: $${summary.avgJob}`}</Text>
              <Text style={styles.metricLabel}>Efficiency</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricValue}>{`Rating: ${summary.rating.toFixed(1)}★`}</Text>
              <Text style={styles.metricLabel}>Service</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Earnings Over Time</Text>

          <View style={styles.chartArea}>
            {summary.bars.map((value, idx) => {
              const barHeight = Math.max(16, Math.round((value / maxBar) * 108));
              const active = idx === highlightedBarIndex;
              return (
                <View key={`${summary.labels[idx]}-${idx}`} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: active ? C.amber : C.primary,
                        opacity: 0.85,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{summary.labels[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.pendingCard}>
            <Text style={styles.breakdownLabel}>Pending</Text>
            <Text style={styles.pendingValue}>{`$${summary.pending.toFixed(2)}`}</Text>
          </View>

          <View style={styles.availableCard}>
            <Text style={styles.breakdownLabel}>Available</Text>
            <Text style={styles.availableValue}>{`$${summary.available.toFixed(2)}`}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.withdrawButton} onPress={() => router.push('/(provider)/withdraw')}>
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>

        <View style={styles.transactionsWrap}>
          {visibleTransactions.map((item) => {
            const iconName: keyof typeof Ionicons.glyphMap =
              item.type === 'earning'
                ? 'arrow-down'
                : item.type === 'withdrawal'
                  ? 'arrow-up'
                  : 'return-up-back';

            const iconBg =
              item.type === 'earning'
                ? C.primaryLight
                : item.type === 'withdrawal'
                  ? C.amberLight
                  : isDark
                    ? '#0F2E1F'
                    : '#E8F8F2';

            const iconColor =
              item.type === 'withdrawal' ? C.amber : item.type === 'earning' ? C.primary : C.success;

            const amountColor = item.type === 'withdrawal' ? C.error : C.success;

            return (
              <View key={item.id} style={styles.transactionRow}>
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}> 
                  <Ionicons name={iconName} size={20} color={iconColor} />
                </View>

                <View style={styles.centerCol}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>

                <View style={styles.rightCol}>
                  <Text style={[styles.amountText, { color: amountColor }]}>{formatAmount(item.amount)}</Text>
                  <View style={styles.completedPill}>
                    <Text style={styles.completedPillText}>Completed</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {visibleTransactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="wallet-outline" size={38} color={C.textHint} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    headerIconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    earningsCard: {
      marginTop: 12,
      borderRadius: 20,
      backgroundColor: C.primary,
      padding: 20,
    },
    periodTabsWrap: {
      flexDirection: 'row',
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.2)',
      padding: 4,
      marginBottom: 16,
    },
    periodTab: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodTabActive: {
      backgroundColor: 'white',
    },
    periodTabTextActive: {
      color: C.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    periodTabTextInactive: {
      color: 'white',
      opacity: 0.7,
      fontSize: 13,
      fontWeight: '500',
    },
    totalText: {
      fontSize: 32,
      fontWeight: '800',
      color: 'white',
      textAlign: 'center',
    },
    totalSubText: {
      marginTop: 2,
      fontSize: 12,
      color: 'white',
      opacity: 0.6,
      textAlign: 'center',
    },
    metricsRow: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 6,
    },
    metricCol: {
      alignItems: 'center',
      flex: 1,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
    },
    metricLabel: {
      marginTop: 2,
      fontSize: 11,
      color: 'white',
      opacity: 0.6,
      textAlign: 'center',
    },
    chartCard: {
      marginTop: 16,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    chartTitle: {
      marginBottom: 16,
      fontSize: 14,
      fontWeight: '600',
      color: C.textPrimary,
    },
    chartArea: {
      height: 140,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    barLabel: {
      marginTop: 4,
      fontSize: 10,
      color: C.textHint,
    },
    breakdownRow: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 12,
    },
    pendingCard: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.amber,
      padding: 14,
    },
    availableCard: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.primary,
      padding: 14,
    },
    breakdownLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },
    pendingValue: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: '700',
      color: C.amber,
    },
    availableValue: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: '700',
      color: C.primary,
    },
    withdrawButton: {
      marginTop: 16,
      height: 52,
      borderRadius: 12,
      backgroundColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    withdrawButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    transactionsWrap: {
      marginTop: 20,
      marginBottom: 32,
    },
    transactionRow: {
      height: 64,
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: C.divider,
      backgroundColor: 'transparent',
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerCol: {
      flex: 1,
      marginLeft: 12,
    },
    itemLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: C.textPrimary,
    },
    itemDate: {
      marginTop: 2,
      fontSize: 12,
      color: C.textSecondary,
    },
    rightCol: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontSize: 15,
      fontWeight: '700',
    },
    completedPill: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 2,
      backgroundColor: C.primaryLight,
    },
    completedPillText: {
      fontSize: 10,
      fontWeight: '500',
      color: C.success,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 26,
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      color: C.textSecondary,
    },
  });
