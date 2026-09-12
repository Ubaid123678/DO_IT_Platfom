import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

import Ionicons from '@expo/vector-icons/Ionicons';
import { notificationService, type INotification, type NotificationStatus, type NotificationType } from '@/src/services/notificationService';
import { socketService } from '@/src/services/socketService';
import { Colors, type AppColors } from '@/src/theme/colors';

const STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
  dismissed: 'Dismissed',
};

const STATUS_COLORS: Record<NotificationStatus, string> = {
  pending: '#F39C12',
  sent: '#3498DB',
  delivered: '#3498DB',
  read: '#27AE60',
  failed: '#E74C3C',
  dismissed: '#95A5A6',
};

const TYPE_LABELS: Record<NotificationType, string> = {
  message: 'Message',
  job_created: 'Job Created',
  job_updated: 'Job Updated',
  job_assigned: 'Job Assigned',
  job_completed: 'Job Completed',
  job_cancelled: 'Job Cancelled',
  proposal_received: 'Proposal Received',
  proposal_accepted: 'Proposal Accepted',
  proposal_rejected: 'Proposal Rejected',
  proposal_withdrawn: 'Proposal Withdrawn',
  dispute_created: 'Dispute Created',
  dispute_evidence_added: 'Dispute Evidence Added',
  dispute_resolved: 'Dispute Resolved',
  review_received: 'Review Received',
  review_flagged: 'Review Flagged',
  review_moderated: 'Review Moderated',
  payout_requested: 'Payout Requested',
  payout_completed: 'Payout Completed',
  payout_failed: 'Payout Failed',
  wallet_topup: 'Wallet Top-up',
  wallet_low_balance: 'Low Balance',
  wallet_escrow_locked: 'Escrow Locked',
  wallet_escrow_released: 'Escrow Released',
  wallet_escrow_refunded: 'Escrow Refunded',
  verification_submitted: 'Verification Submitted',
  verification_approved: 'Verification Approved',
  verification_rejected: 'Verification Rejected',
  kyc_submitted: 'KYC Submitted',
  kyc_approved: 'KYC Approved',
  kyc_rejected: 'KYC Rejected',
  system_announcement: 'System Announcement',
  promotion: 'Promotion',
  security_alert: 'Security Alert',
};

const TYPE_ICONS: Record<NotificationType, string> = {
  message: 'chatbox-outline',
  job_created: 'briefcase-outline',
  job_updated: 'briefcase-outline',
  job_assigned: 'person-add-outline',
  job_completed: 'checkmark-circle-outline',
  job_cancelled: 'close-circle-outline',
  proposal_received: 'document-text-outline',
  proposal_accepted: 'checkmark-circle-outline',
  proposal_rejected: 'close-circle-outline',
  proposal_withdrawn: 'arrow-back-circle-outline',
  dispute_created: 'alert-circle-outline',
  dispute_evidence_added: 'document-outline',
  dispute_resolved: 'checkmark-circle-outline',
  review_received: 'star-outline',
  review_flagged: 'flag-outline',
  review_moderated: 'shield-checkmark-outline',
  payout_requested: 'cash-outline',
  payout_completed: 'cash-outline',
  payout_failed: 'close-circle-outline',
  wallet_topup: 'card-outline',
  wallet_low_balance: 'alert-circle-outline',
  wallet_escrow_locked: 'lock-closed-outline',
  wallet_escrow_released: 'lock-open-outline',
  wallet_escrow_refunded: 'cash-outline',
  verification_submitted: 'document-outline',
  verification_approved: 'checkmark-circle-outline',
  verification_rejected: 'close-circle-outline',
  kyc_submitted: 'id-card-outline',
  kyc_approved: 'checkmark-circle-outline',
  kyc_rejected: 'close-circle-outline',
  system_announcement: 'megaphone-outline',
  promotion: 'pricetag-outline',
  security_alert: 'shield-alert-outline',
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const styles = makeStyles(C);
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | NotificationStatus>('all');
  const [stats, setStats] = useState<any>({
    pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, dismissed: 0, unread: 0
  });

  const loadNotifications = useCallback(async (reset = false) => {
    if (reset) {
      setSkip(0);
      setNotifications([]);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    try {
      const currentSkip = reset ? 0 : skip;
      const result = await notificationService.getNotifications({
        status: activeTab === 'all' ? undefined : activeTab,
        skip: currentSkip,
        limit: 20,
      });
      if (reset) {
        setNotifications(result.notifications);
      } else {
        setNotifications((prev) => [...prev, ...result.notifications]);
      }
      setTotal(result.total);
      setHasMore(result.notifications.length === 20);
      setSkip(currentSkip + result.notifications.length);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load notifications';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, skip, hasMore]);

  const loadStats = useCallback(async () => {
    try {
      const data = await notificationService.getNotificationStats();
      setStats(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadNotifications(true);
    loadStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(true);
    loadStats();
  }, [loadNotifications, loadStats]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadNotifications(false);
    }
  }, [loadingMore, hasMore, loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, status: 'read' } : n));
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleDismiss = useCallback(async (notificationId: string) => {
    try {
      await notificationService.dismissNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleDismissAll = useCallback(async () => {
    try {
      const unread = notifications.filter(n => n.status !== 'read' && n.status !== 'dismissed');
      for (const n of unread) {
        await notificationService.dismissNotification(n._id);
      }
      setNotifications(prev => prev.map(n => n.status !== 'read' && n.status !== 'dismissed' ? { ...n, status: 'dismissed' } : n));
    } catch (e) {
      // Ignore
    }
  }, [notifications]);

  const renderNotification = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={styles.notificationCard} onPress={() => handleMarkAsRead(item._id)} activeOpacity={0.7}>
      <View style={styles.notificationHeader}>
        <View style={[
          styles.typeIcon,
          { backgroundColor: getTypeColor(item.type) }
        ]}>
          <Ionicons name={TYPE_ICONS[item.type] || 'notifications-outline'} size={20} color="#fff" />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notificationBody} numberOfLines={2}>{item.body}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: STATUS_COLORS[item.status] }
        ]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.notificationMeta}>
        <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        {item.data?.jobId && (
          <TouchableOpacity onPress={() => router.push(`/job-detail/${item.data.jobId}`)}>
            <Text style={styles.metaText}>Job: {item.data.jobId.substring(0, 8)}...</Text>
          </TouchableOpacity>
        )}
        {item.data?.proposalId && (
          <TouchableOpacity onPress={() => router.push(`/proposal-detail/${item.data.proposalId}`)}>
            <Text style={styles.metaText}>Proposal: {item.data.proposalId.substring(0, 8)}...</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notificationActions}>
        {item.status !== 'read' && (
          <TouchableOpacity style={styles.markReadBtn} onPress={() => handleMarkAsRead(item._id)}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(item._id)}>
          <Ionicons name="close-circle-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), []);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      message: '#3498DB',
      job_created: '#27AE60',
      job_updated: '#3498DB',
      job_assigned: '#9B59B6',
      job_completed: '#27AE60',
      job_cancelled: '#E74C3C',
      proposal_received: '#F39C12',
      proposal_accepted: '#27AE60',
      proposal_rejected: '#E74C3C',
      dispute_created: '#F39C12',
      dispute_evidence_added: '#F39C12',
      dispute_resolved: '#27AE60',
      review_received: '#F39C12',
      review_flagged: '#E74C3C',
      review_moderated: '#27AE60',
      payout_requested: '#F39C12',
      payout_completed: '#27AE60',
      payout_failed: '#E74C3C',
      wallet_topup: '#3498DB',
      wallet_low_balance: '#F39C12',
      wallet_escrow_locked: '#3498DB',
      wallet_escrow_released: '#27AE60',
      wallet_escrow_refunded: '#F39C12',
      verification_submitted: '#3498DB',
      verification_approved: '#27AE60',
      verification_rejected: '#E74C3C',
      kyc_submitted: '#3498DB',
      kyc_approved: '#27AE60',
      kyc_rejected: '#E74C3C',
      system_announcement: '#9B59B6',
      promotion: '#F39C12',
      security_alert: '#E74C3C',
    };
    return colors[type] || '#3498DB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead} disabled={stats.unread === 0}>
          <Text style={[
            styles.markAllReadBtn,
            stats.unread === 0 && styles.markAllReadBtnDisabled,
          ]}>
            {stats.unread > 0 ? `Mark All as Read (${stats.unread})` : 'All Read'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal contentContainerStyle={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {(['all', 'pending', 'sent', 'delivered', 'read', 'failed', 'dismissed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              activeTab === status && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab(status)}
          >
            <Text style={[
              styles.filterTabLabel,
              activeTab === status && styles.filterTabLabelActive,
            ]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            <Text style={[
              styles.filterTabCount,
              activeTab === status && styles.filterTabCountActive,
            ]}>
              {status === 'all' ? total : stats[status]?.count || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
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
              <Ionicons name="notifications-outline" size={48} color={C.textHint} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all' ? 'You\'re all caught up!' : `No ${activeTab} notifications`}
              </Text>
            </View>
          )
        }
      />

      {loadingMore && (
        <View style={styles.loadMoreWrapper}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}

      {stats.unread > 0 && (
        <TouchableOpacity style={styles.markAllReadFab} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.markAllReadFabText}>Mark All as Read</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 16, color: C.textSecondary, marginTop: 12 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E8E8E8',
      backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
    markAllReadBtn: { fontSize: 14, fontWeight: '600', color: '#27AE60' },
    markAllReadBtnDisabled: { opacity: 0.5, color: '#95A5A6' },
    filterContainer: { paddingHorizontal: 20, gap: 8, marginVertical: 8 },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#F1F3F4',
      borderWidth: 1,
      borderColor: '#E8E8E8',
      minWidth: 80,
      alignItems: 'center',
    },
    filterTabActive: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
    filterTabLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    filterTabLabelActive: { color: '#fff' },
    filterTabCount: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    filterTabCountActive: { color: 'rgba(255,255,255,0.8)' },
    notificationCard: { 
      backgroundColor: '#fff', 
      borderRadius: 16, 
      padding: 16, 
      borderWidth: 1, 
      borderColor: '#F1F3F4', 
      marginBottom: 12, 
      marginHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    notificationHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    typeIcon: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginTop: 2 
    },
    notificationInfo: { flex: 1, marginLeft: 12 },
    notificationTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 4 },
    notificationBody: { fontSize: 13, color: '#4A5568', lineHeight: 18 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    notificationMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    notificationTime: { fontSize: 11, color: '#9CA3AF' },
    metaText: { fontSize: 12, color: '#3498DB', fontWeight: '500' },
    notificationActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F3F4' },
    markReadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#27AE60' },
    dismissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E74C3C', borderWidth: 1, borderColor: '#E74C3C' },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginTop: 16 },
    emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 },
    loadMoreWrapper: { padding: 20, alignItems: 'center' },
    loadingMoreText: { fontSize: 13, color: '#9CA3AF' },
    markAllReadFab: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      left: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: '#27AE60',
      shadowColor: '#27AE60',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    markAllReadFabText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  });