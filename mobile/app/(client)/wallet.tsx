import { useState, useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { walletService, type Wallet, type Transaction, type TransactionType, type TransactionStatus } from '@/src/services/walletService';
import { Colors, type AppColors } from '@/src/theme/colors';

const TYPE_LABELS: Record<TransactionType, string> = {
  topup: 'Top-up',
  topup_reversal: 'Top-up Reversal',
  escrow_lock: 'Escrow Locked',
  escrow_release: 'Escrow Released',
  escrow_refund: 'Escrow Refunded',
  platform_fee: 'Platform Fee',
  payout: 'Payout',
  payout_reversal: 'Payout Reversal',
  adjustment: 'Adjustment',
  refund: 'Refund',
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  completed: '#27AE60',
  pending: '#F39C12',
  failed: '#E74C3C',
  cancelled: '#95A5A6',
};

const formatCurrency = (cents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function WalletScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TransactionType>('all');
  const [stats, setStats] = useState<{ balance: number; escrowBalance: number; availableBalance: number } | null>(null);

  // Pagination values live in refs so loadWallet has a stable identity. If it
  // depended on skip/hasMore, the focus effect would re-fire every time it
  // advanced skip → infinite reload loop.
  const skipRef = useRef(0);
  const hasMoreRef = useRef(true);

  const loadWallet = useCallback(async (reset = false) => {
    if (reset) {
      skipRef.current = 0;
      hasMoreRef.current = true;
    }
    if (!hasMoreRef.current && !reset) return;

    try {
      const currentSkip = reset ? 0 : skipRef.current;
      const [walletRes, txnsRes, statsRes] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactionHistory({ skip: currentSkip, limit: 20 }),
        walletService.getWalletStats(),
      ]);

      if (reset) {
        setWallet(walletRes);
        setTransactions(txnsRes.transactions);
      } else {
        setTransactions((prev) => [...prev, ...txnsRes.transactions]);
      }
      const more = txnsRes.transactions.length === 20;
      hasMoreRef.current = more;
      skipRef.current = currentSkip + txnsRes.transactions.length;
      setStats({ balance: statsRes.balance, escrowBalance: statsRes.escrowBalance, availableBalance: statsRes.availableBalance });
    } catch (e) {
      console.error('Failed to load wallet:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWallet(true);
  }, [loadWallet]);

  const onEndReached = useCallback(() => {
    // hasMoreRef avoids depending on state (stable callback).
    if (!loadingMore && hasMoreRef.current) {
      setLoadingMore(true);
      loadWallet(false);
    }
  }, [loadingMore, loadWallet]);

  // Refresh on focus so the balance is current after a top-up or escrow event.
  // reset=true replaces the list at the end rather than clearing it upfront, so
  // there's no blank→refill flash when the tab re-opens.
  useFocusEffect(
    useCallback(() => {
      void loadWallet(true);
    }, [loadWallet]),
  );

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'topup': return 'card-outline';
      case 'escrow_lock': return 'lock-closed-outline';
      case 'escrow_release': return 'lock-open-outline';
      case 'escrow_refund': return 'cash-outline';
      case 'payout': return 'send-outline';
      case 'platform_fee': return 'cash-outline';
      default: return 'swap-horizontal-outline';
    }
  };

  const getTypeColor = (type: TransactionType, C: AppColors) => {
    switch (type) {
      case 'topup': return C.success;
      case 'escrow_lock': return C.warning;
      case 'escrow_release': return C.primary;
      case 'escrow_refund': return C.success;
      case 'payout': return C.primary;
      case 'platform_fee': return C.warning;
      default: return C.textSecondary;
    }
  };

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '-';
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.txnCard} activeOpacity={0.7}>
      <View style={styles.txnHeader}>
        <View style={styles.txnType}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type, C) }]}>
            <Ionicons name={getTypeIcon(item.type)} size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.txnTypeLabel}>{TYPE_LABELS[item.type] || item.type}</Text>
            <Text style={styles.txnDescription}>{item.description}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.txnAmountRow}>
        <Text style={[styles.txnAmount, { color: item.amount >= 0 ? C.success : C.error }]}>
          {formatAmount(item.amount)}
        </Text>
        <Text style={styles.txnDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      {item.metadata?.jobId && (
        <View style={styles.txnMeta}>
          <Text style={styles.txnMetaText}>Job: {item.metadata.jobId.substring(0, 8)}...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const TYPE_FILTERS: (TransactionType | 'all')[] = ['all', 'topup', 'escrow_lock', 'escrow_release', 'escrow_refund', 'payout', 'platform_fee', 'adjustment', 'refund'];

  // The filter tabs actually filter the loaded list (they were decorative).
  const visibleTransactions = activeTab === 'all'
    ? transactions
    : transactions.filter((t) => t.type === activeTab);

  if (loading && wallet === null) {
    return (
      <SafeAreaViewCompat style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaViewCompat>
    );
  }

  return (
    <SafeAreaViewCompat style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/wallet/topup')}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.topUpBtnText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(stats?.availableBalance || 0)}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>In Escrow</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(stats?.escrowBalance || 0)}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(stats?.balance || 0)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal style={styles.filterScroll} contentContainerStyle={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {TYPE_FILTERS.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              activeTab === type && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[styles.filterTabLabel, activeTab === type && styles.filterTabLabelActive]}>
              {type === 'all' ? 'All' : TYPE_LABELS[type as TransactionType] || type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={visibleTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'Your transactions will appear here' : `No ${TYPE_LABELS[activeTab]?.toLowerCase() || activeTab} transactions`}
              </Text>
            </View>
          ) : null
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      )}
    </SafeAreaViewCompat>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
    topUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 20 },
    topUpBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    balanceContainer: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
    balanceRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
    balanceCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' },
    balanceLabel: { fontSize: 11, color: C.textHint, marginBottom: 6 },
    balanceAmount: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
    // Fixed-height filter row so the chips don't reflow/jump.
    filterScroll: { flexGrow: 0, maxHeight: 52 },
    filterContainer: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 8 },
    filterTab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    filterTabLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    filterTabLabelActive: { color: '#fff' },
    txnCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12 },
    txnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    txnType: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    typeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    txnTypeLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    txnDescription: { fontSize: 12, color: C.textSecondary, marginTop: 1, maxWidth: 200 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
    txnAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    txnAmount: { fontSize: 16, fontWeight: '700' },
    txnDate: { fontSize: 11, color: C.textHint },
    txnMeta: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.divider },
    txnMetaText: { fontSize: 11, color: C.textHint },
    // paddingBottom clears the tab bar (60) + safe area.
    listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 96, flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
  });