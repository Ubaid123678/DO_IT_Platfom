import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, type AppColors } from '@/src/theme/colors';

type TransactionType = 'topup' | 'payment' | 'refund';
type FilterTab = 'all' | 'topup' | 'payment' | 'refund';

type WalletTransaction = {
  id: string;
  type: TransactionType;
  label: string;
  date: string;
  amount: number;
};

const tabs: Array<{ key: FilterTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'topup', label: 'Top Up' },
  { key: 'payment', label: 'Payments' },
  { key: 'refund', label: 'Refunds' },
];

const mockTransactions: WalletTransaction[] = [
  {
    id: 't-1',
    type: 'topup',
    label: 'Card Top Up',
    date: 'Apr 11, 10:20 AM',
    amount: 50,
  },
  {
    id: 't-2',
    type: 'payment',
    label: 'Payment for AC Servicing',
    date: 'Apr 10, 3:45 PM',
    amount: -30,
  },
  {
    id: 't-3',
    type: 'refund',
    label: 'Dispute Refund',
    date: 'Apr 09, 2:10 PM',
    amount: 20,
  },
  {
    id: 't-4',
    type: 'payment',
    label: 'Advance Payment for Delivery',
    date: 'Apr 08, 11:12 AM',
    amount: -15,
  },
];

const getAmountLabel = (value: number) => {
  const abs = Math.abs(value);
  return `${value >= 0 ? '+' : '-'}$${abs.toFixed(0)}`;
};

export default function ClientWalletScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C, isDark);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filterTab === 'all') {
      return transactions;
    }
    return transactions.filter((item) => item.type === filterTab);
  }, [transactions, filterTab]);

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
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Wallet</Text>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push('/(shared)/settings')}>
                <Ionicons name="settings-outline" size={22} color={C.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>$240.00</Text>
              <Text style={styles.balanceSubValue}>≈ PKR 66,840</Text>

              <View style={styles.balanceActionsRow}>
                <TouchableOpacity
                  style={styles.balanceActionButton}
                  onPress={() => router.push('/(client)/wallet-topup')}
                >
                  <Text style={styles.balanceActionText}>Top Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.balanceActionButton}
                  onPress={() => router.push('/(client)/wallet-withdraw')}
                >
                  <Text style={styles.balanceActionText}>Withdraw</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.balanceActionButton}
                  onPress={() => router.push('/(client)/wallet-withdraw')}
                >
                  <Text style={styles.balanceActionText}>Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>In Escrow</Text>
                <Text style={[styles.statValue, { color: C.amber }]}>$50.00</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Spent This Month</Text>
                <Text style={[styles.statValue, { color: C.primary }]}>$180.00</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, { color: C.textHint }]}>$0.00</Text>
              </View>
            </View>

            <View style={styles.filterTabsRow}>
              {tabs.map((tab) => {
                const active = filterTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.filterTabButton}
                    onPress={() => setFilterTab(tab.key)}
                  >
                    <Text style={active ? styles.filterTabTextActive : styles.filterTabTextInactive}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const iconName: keyof typeof Ionicons.glyphMap =
            item.type === 'topup'
              ? 'arrow-down'
              : item.type === 'payment'
                ? 'arrow-up'
                : 'return-up-back';

          const iconBg =
            item.type === 'topup'
              ? C.primaryLight
              : item.type === 'payment'
                ? C.amberLight
                : isDark
                  ? '#0F2E1F'
                  : '#E8F8F2';

          const iconColor = item.type === 'payment' ? C.amber : item.type === 'topup' ? C.primary : C.success;

          const amountColor = item.type === 'payment' ? C.error : C.success;

          return (
            <View style={styles.transactionRow}>
              <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>

              <View style={styles.centerCol}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.amountText, { color: amountColor }]}>{getAmountLabel(item.amount)}</Text>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Completed</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="wallet-outline" size={42} color={C.primary} />
            </View>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
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
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
      flexGrow: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: C.textPrimary,
    },
    headerIconButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
    },
    balanceCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    balanceLabel: {
      fontSize: 12,
      color: 'white',
      opacity: 0.7,
      marginBottom: 4,
    },
    balanceValue: {
      fontSize: 36,
      fontWeight: '800',
      color: 'white',
    },
    balanceSubValue: {
      fontSize: 13,
      color: 'white',
      opacity: 0.6,
      marginTop: 2,
    },
    balanceActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },
    balanceActionButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    balanceActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'white',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
    },
    statLabel: {
      fontSize: 11,
      color: C.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    filterTabsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    filterTabButton: {
      paddingBottom: 4,
    },
    filterTabTextActive: {
      fontSize: 13,
      fontWeight: '600',
      color: C.primary,
      borderBottomWidth: 2,
      borderBottomColor: C.primary,
      paddingBottom: 4,
    },
    filterTabTextInactive: {
      fontSize: 13,
      color: C.textSecondary,
      paddingBottom: 4,
    },
    itemSeparator: {
      height: 0,
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
      backgroundColor: isDark ? '#0F2E1F' : '#E8F8F2',
    },
    completedPillText: {
      fontSize: 10,
      fontWeight: '500',
      color: C.success,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 56,
    },
    emptyIllustration: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: C.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: C.textSecondary,
      fontWeight: '500',
    },
  });
