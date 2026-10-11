import { api } from './api';

// Types
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'dismissed';
export type NotificationType = 
  | 'message'
  | 'job_created' | 'job_updated' | 'job_assigned' | 'job_completed' | 'job_cancelled'
  | 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_withdrawn'
  | 'dispute_created' | 'dispute_evidence_added' | 'dispute_resolved'
  | 'review_received' | 'review_flagged' | 'review_moderated'
  | 'payout_requested' | 'payout_completed' | 'payout_failed'
  | 'wallet_topup' | 'wallet_low_balance' | 'wallet_escrow_locked' | 'wallet_escrow_released' | 'wallet_escrow_refunded'
  | 'verification_submitted' | 'verification_approved' | 'verification_rejected'
  | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected'
  | 'system_announcement' | 'promotion' | 'security_alert';

export type INotification = {
  _id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
};

export type GetNotificationsParams = {
  status?: NotificationStatus;
  skip?: number;
  limit?: number;
};

export type GetNotificationsResponse = {
  notifications: INotification[];
  total: number;
};

export type NotificationStats = {
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  dismissed: number;
  unread: number;
};

export type PushPreferences = {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
};

// Service
export const notificationService = {
  getNotifications: async (params: GetNotificationsParams = {}): Promise<GetNotificationsResponse> => {
    const { status, skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', limit.toString());
    
    const response = await api.get<{ success: boolean; data: GetNotificationsResponse }>(
      `/notifications?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await api.get<{ success: boolean; data: NotificationStats }>(
      '/notifications/stats'
    );
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.post<{ success: boolean; data: null }>(
      `/notifications/${notificationId}/read`,
      {}
    );
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post<{ success: boolean; data: null }>(
      '/notifications/read-all',
      {}
    );
  },

  dismissNotification: async (notificationId: string): Promise<void> => {
    await api.post<{ success: boolean; data: null }>(
      `/notifications/${notificationId}/dismiss`,
      {}
    );
  },

  getPushPreferences: async (): Promise<PushPreferences> => {
    const response = await api.get<{ success: boolean; data: PushPreferences }>(
      '/notifications/preferences'
    );
    return response.data.data;
  },

  updatePushPreferences: async (prefs: PushPreferences): Promise<void> => {
    await api.patch<{ success: boolean; data: null }>(
      '/notifications/preferences',
      prefs
    );
  },
};