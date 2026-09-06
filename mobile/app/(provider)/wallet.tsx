import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
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

const formatAmount = (amount: number, type: TransactionType) => {
  const isCredit = ['topup', 'escrow_release', 'escrow_refund'].includes(type);
  const prefix = isCredit ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};

export default function ProviderWalletScreen() {
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
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | TransactionType>('all');
  const [stats, setStats] = useState<{ balance: number; escrowBalance: number; availableBalance: number } | null>(null);

  const loadWallet = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setTransactions([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
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
      setTotal(txnsRes.total);
      setHasMore(txnsRes.transactions.length === 20);
      setSkip(currentSkip + txnsRes.transactions.length);
      setStats({ balance: statsRes.balance, escrowBalance: statsRes.escrowBalance, availableBalance: statsRes.availableBalance });
    } catch (e) {
      console.error('Failed to load wallet:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [skip, hasMore]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWallet(true);
  }, [loadWallet]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadWallet(false);
    }
  }, [loadingMore, hasMore, loadWallet]);

  useEffect(() => {
    loadWallet(true);
  }, []);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.txnCard} activeOpacity={0.8}>
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
        <Text style={[styles.txnAmount, { color: ['topup', 'escrow_release', 'escrow_refund'].includes(item.type) ? C.success : C.error }]}>
          {formatCurrency(item.amount)}
        </Text>
        <Text style={styles.txnDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      {item.metadata?.jobId && (
        <View style={styles.txnMeta}>
          <TouchableOpacity onPress={() => router.push(`/job-detail/${item.metadata.jobId}`)}>
            <Text style={styles.txnMetaText}>Job: {item.metadata.jobId.substring(0, 8)}...</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const TYPE_FILTERS: (TransactionType | 'all')[] = ['all', 'topup', 'escrow_lock', 'escrow_release', 'escrow_refund', 'payout', 'platform_fee', 'adjustment', 'refund'];

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
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/wallet/topup')}>
          <Ionicons name="add-circle-outline" size={24} color={C.primary} />
          <Text style={styles.topUpBtnText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Cards */}
      <ScrollView horizontal contentContainerStyle={styles.balanceContainer} showsHorizontalScrollIndicator={false}>
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
      </ScrollView>

      {/* Payout Button */}
      {stats && stats.availableBalance > 0 && (
        <TouchableOpacity style={styles.payoutBtn} onPress={() => router.push('/wallet/payout')}>
          <Ionicons name="send-outline" size={20} color="#fff" />
          <Text style={styles.payoutBtnText}>Request Payout (${formatCurrency(stats.availableBalance)})</Text>
        </TouchableOpacity>
      )}

      {/* Filter Tabs */}
      <ScrollView horizontal contentContainerStyle={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {['all', 'topup', 'escrow_lock', 'escrow_release', 'escrow_refund', 'payout', 'platform_fee', 'adjustment', 'refund'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              activeTab === type && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab(type as any)}
          >
            <Text style={[styles.filterTabLabel, activeTab === type && styles.filterTabLabelActive]}>
              {type === 'all' ? 'All' : TYPE_LABELS[type] || type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'Your transactions will appear here' : `No ${TYPE_LABELS[activeTab]?.toLowerCase() || activeTab} transactions`}
              </Text>
            </View>
          )
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

const onRefresh = () => {};
const onEndReached = () => {};
const getTypeIcon = () => '';
const getTypeColor = () => '';
const formatCurrency = () => '';
const TYPE_LABELS: Record<string, string> = {};
const STATUS_COLORS: Record<string, string> = {};

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
    balanceCard: { flex: 1, minWidth: 100, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' },
    balanceLabel: { fontSize: 12, color: C.textHint, marginBottom: 4 },
    balanceAmount: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
    filterContainer: { paddingHorizontal: 20, gap: 8, marginVertical: 8 },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    filterTabLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    filterTabLabelActive: { color: '#fff' },
    txnCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, marginHorizontal: 20 },
    txnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    txnType: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    typeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    txnTypeLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    txnDescription: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
    txnAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    txnAmount: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
    txnDate: { fontSize: 11, color: C.textHint },
    txnMeta: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.divider },
    txnMetaText: { fontSize: 11, color: C.textHint },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary, marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
    payoutBtn: {
      marginHorizontal: 20,
      marginVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: C.success,
    },
    payoutBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });