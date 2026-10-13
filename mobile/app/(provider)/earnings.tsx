import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import { walletService } from '@/src/services/walletService';
import { jobService } from '@/src/services/jobService';
import { reviewService } from '@/src/services/reviewService';

type Period = 'week' | 'month' | 'all';
type TxType = 'earning' | 'withdrawal' | 'bonus';

type EarningsTransaction = {
  id: string;
  type: TxType;
  label: string;
  date: string;
  amount: number;
};

// Raw wallet transaction with a parsed date, used for the summary + chart.
type EarningsTransactionRaw = {
  id: string;
  amount: number;
  createdAt: Date | null;
};

const periodTabs: Array<{ key: Period; label: string }> = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

type ComputedSummary = {
  total: number;
  jobs: number;
  avgJob: number;
  rating: number;
  bars: number[];
  labels: string[];
};

const DAY = 24 * 60 * 60 * 1000;

// Bucket dated transactions into a period and return the summary + bar chart.
// `rating` is a live figure (not period-based) — reviews have no completion date
// to filter by, so it reflects the provider's current average.
const computeSummary = (
  period: Period,
  txns: EarningsTransactionRaw[],
  completedJobs: number,
  rating: number,
): ComputedSummary => {
  const now = Date.now();
  const windowMs = period === 'week' ? 7 * DAY : period === 'month' ? 30 * DAY : null;
  const inPeriod = windowMs == null
    ? txns
    : txns.filter((t) => t.createdAt != null && now - t.createdAt.getTime() <= windowMs);

  const earnings = inPeriod.filter((t) => t.amount > 0);
  const total = earnings.reduce((sum, t) => sum + t.amount, 0);
  const jobs = earnings.length; // one positive credit ≈ one paid job
  const avgJob = jobs > 0 ? Math.round(total / jobs) : 0;

  // Bar chart: 7 buckets across the period (days for week, ~4-5 day groups for
  // month, months for all-time — capped at 7 for layout).
  const labels: string[] = [];
  const bars: number[] = [];
  if (period === 'all') {
    // Last 7 months.
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }).slice(0, 1));
      bars.push(
        txns
          .filter((t) => t.amount > 0 && t.createdAt && t.createdAt.toISOString().slice(0, 7) === key)
          .reduce((s, t) => s + t.amount, 0),
      );
    }
  } else {
    // 7 equal day-buckets across the window.
    const days = period === 'week' ? 7 : 30;
    const bucketSize = Math.ceil(days / 7);
    for (let i = 0; i < 7; i++) {
      const from = now - (days - i * bucketSize) * DAY;
      const to = now - (days - (i + 1) * bucketSize) * DAY;
      labels.push(i === 6 ? 'Now' : `${bucketSize * (6 - i)}d`);
      bars.push(
        earnings
          .filter((t) => t.createdAt && t.createdAt.getTime() > from && t.createdAt.getTime() <= to)
          .reduce((s, t) => s + t.amount, 0),
      );
    }
  }

  return {
    total,
    jobs: period === 'all' ? Math.max(completedJobs, jobs) : jobs,
    avgJob,
    rating,
    bars,
    labels,
  };
};


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
  const [rawTxns, setRawTxns] = useState<EarningsTransactionRaw[]>([]);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<{ balance: number; escrowBalance: number; availableBalance: number }>({
    balance: 0,
    escrowBalance: 0,
    availableBalance: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const [stats, history, jobStats] = await Promise.all([
            walletService.getWalletStats(),
            walletService.getTransactionHistory({ limit: 50 }),
            jobService.getProviderJobStats(),
          ]);
          // Reviews are optional — a provider with none still gets the screen.
          let avgRating = 0;
          try {
            const rs = await reviewService.getReviewStats('current');
            avgRating = rs?.averageRating ?? 0;
          } catch {
            // ignore
          }
          if (!active) return;
          setWallet({
            balance: stats.balance,
            escrowBalance: stats.escrowBalance,
            availableBalance: stats.availableBalance,
          });
          setCompletedJobs(jobStats?.completed ?? 0);
          setRating(avgRating);

          const list = history.transactions || [];
          setRawTxns(list.map((t: any) => ({
            id: t._id ?? t.transactionId,
            amount: (t.amount ?? 0) / 100,
            createdAt: t.createdAt ? new Date(t.createdAt) : null,
          })));
          setTransactions(list.map((t: any) => ({
            id: t._id ?? t.transactionId,
            type: t.type === 'payout' ? 'withdrawal' : t.amount >= 0 ? 'earning' : 'withdrawal',
            label: t.description || t.type,
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            amount: (t.amount ?? 0) / 100,
          })));
        } catch {
          if (active) {
            setTransactions([]);
            setRawTxns([]);
          }
        } finally {
          if (active) setLoading(false);
        }
      };
      void load();
      return () => {
        active = false;
      };
    }, []),
  );

  const summary = useMemo(
    () => computeSummary(period, rawTxns, completedJobs, rating),
    [period, rawTxns, completedJobs, rating],
  );

  // Show only transactions inside the selected period window.
  const visibleTransactions = useMemo(() => {
    if (period === 'all') return transactions;
    const windowMs = period === 'week' ? 7 * DAY : 30 * DAY;
    const cutoff = Date.now() - windowMs;
    const inWindow = new Set(
      rawTxns.filter((t) => t.createdAt && t.createdAt.getTime() >= cutoff).map((t) => t.id),
    );
    return transactions.filter((item) => inWindow.has(item.id));
  }, [period, transactions, rawTxns]);

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

          <Text style={styles.totalText}>{`$${(wallet.balance / 100).toFixed(2)}`}</Text>
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
            <Text style={styles.pendingValue}>{`$${(wallet.escrowBalance / 100).toFixed(2)}`}</Text>
          </View>

          <View style={styles.availableCard}>
            <Text style={styles.breakdownLabel}>Available</Text>
            <Text style={styles.availableValue}>{`$${(wallet.availableBalance / 100).toFixed(2)}`}</Text>
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
