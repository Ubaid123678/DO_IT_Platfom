import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

export const messagingValidators = {
  createConversation: Joi.object({
    type: Joi.string().valid('direct', 'group', 'job', 'support').default('direct'),
    participants: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).min(2).max(50).required(),
    jobId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    proposalId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    disputeId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    title: Joi.string().max(100).optional(),
    avatar: Joi.string().uri().optional(),
    settings: Joi.object({
      notifications: Joi.boolean().default(true),
      disappearingMessages: Joi.object({
        enabled: Joi.boolean().default(false),
        duration: Joi.number().integer().min(60).max(2592000).optional(),
      }).optional(),
      encryption: Joi.boolean().default(false),
    }).optional(),
  }),

  sendMessage: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    type: Joi.string().valid('text', 'image', 'file', 'system', 'location', 'voice').default('text'),
    content: Joi.string().max(10000).required(),
    metadata: Joi.object({
      fileName: Joi.string().optional(),
      fileSize: Joi.number().integer().min(0).optional(),
      mimeType: Joi.string().optional(),
      duration: Joi.number().integer().min(0).optional(),
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
      address: Joi.string().max(500).optional(),
      replyToMessageId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
      forwardFromMessageId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    }).optional(),
  },

  updateMessage: Joi.object({
    content: Joi.string().max(10000).optional(),
    metadata: Joi.object({
      isEdited: Joi.boolean().optional(),
    }).optional(),
  }).min(1),

  deleteMessage: Joi.object({
    deleteForEveryone: Joi.boolean().default(false),
  }),

  getMessages: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    skip: Joi.number().integer().min(0).default(0),
    before: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    after: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
  }),

  getConversations: Joi.object({
    type: Joi.string().valid('direct', 'group', 'job', 'support').optional(),
    status: Joi.string().valid('active', 'archived', 'muted', 'pinned').optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('lastMessageAt', 'createdAt', 'unreadCount').default('lastMessageAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  markAsRead: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    messageIds: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).optional(),
  }),

  muteConversation: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
    duration: Joi.number().integer().min(1).max(365 * 24 * 60 * 60 * 1000).optional(),
  }),

  archiveConversation: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  pinConversation: Joi.object({
    conversationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  // Notification validators
  getNotifications: Joi.object({
    status: Joi.string().valid('pending', 'sent', 'delivered', 'read', 'failed', 'dismissed', 'all').default('all'),
    type: Joi.string().valid(
      'message',
      'job_created', 'job_updated', 'job_assigned', 'job_completed', 'job_cancelled',
      'proposal_received', 'proposal_accepted', 'proposal_rejected', 'proposal_withdrawn',
      'dispute_created', 'dispute_evidence_added', 'dispute_resolved',
      'review_received', 'review_flagged', 'review_moderated',
      'payout_requested', 'payout_completed', 'payout_failed',
      'wallet_topup', 'wallet_low_balance', 'wallet_escrow_locked', 'wallet_escrow_released', 'wallet_escrow_refunded',
      'verification_submitted', 'verification_approved', 'verification_rejected',
      'kyc_submitted', 'kyc_approved', 'kyc_rejected',
      'system_announcement', 'promotion', 'security_alert'
    ).optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('createdAt', 'sentAt', 'readAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  markNotificationAsRead: Joi.object({
    notificationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  markAllNotificationsAsRead: Joi.object({}),

  dismissNotification: Joi.object({
    notificationId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  getNotificationStats: Joi.object({}),

  registerPushToken: Joi.object({
    token: Joi.string().required(),
    platform: Joi.string().valid('ios', 'android', 'web').required(),
    deviceId: Joi.string().optional(),
  }),

  removePushToken: Joi.object({
    token: Joi.string().required(),
  }),

  updatePushPreferences: Joi.object({
    enabled: Joi.boolean().optional(),
    types: Joi.array().items(Joi.string()).optional(),
    quietHours: Joi.object({
      enabled: Joi.boolean().default(false),
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timezone: Joi.string().optional(),
    }).optional(),
  }),

  sendTestPush: Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    data: Joi.object().optional(),
  }),

  adminSendNotification: Joi.object({
    userIds: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).min(1).max(1000).required(),
    title: Joi.string().max(200).required(),
    body: Joi.string().max(1000).required(),
    data: Joi.object().optional(),
    channels: Joi.array().items(Joi.string().valid('in_app', 'push', 'email', 'sms')).default(['in_app', 'push']),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    scheduledFor: Joi.date().optional(),
  }),

  adminBulkCreateNotifications: Joi.object({
    userIds: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).min(1).max(10000).required(),
    templateId: Joi.string().optional(),
    title: Joi.string().max(200).required(),
    body: Joi.string().max(1000).required(),
    data: Joi.object().optional(),
    channels: Joi.array().items(Joi.string().valid('in_app', 'push', 'email', 'sms')).default(['in_app', 'push']),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    scheduledFor: Joi.date().optional(),
  }),
};