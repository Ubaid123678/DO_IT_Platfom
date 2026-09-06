import { AppError } from '../../common/errors/AppError.js';
import { MessageModel, type IMessage, type IConversation, type MessageType, type ConversationType, type MessageStatus } from './message.model.js';
import { ConversationModel } from './message.model.js';
import { NotificationModel, type INotification, type NotificationType, type NotificationChannel } from './message.model.js';
import UserModel from '../auth/auth.model.js';
import { JobModel } from '../jobs/job.model.js';
import { ProposalModel } from '../proposals/proposal.model.js';
import { socketService } from './socket.service.js';
import { fcmService } from './fcm.service.js';
import { emailService } from './email-sms.service.js';
import mongoose from 'mongoose';

const serializeConversation = (conversation: IConversation) => {
  const obj = conversation.toJSON?.() ?? conversation;
  return obj;
};

const serializeMessage = (message: IMessage) => {
  const obj = message.toJSON?.() ?? message;
  return obj;
};

const serializeNotification = (notification: INotification) => {
  const obj = notification.toJSON?.() ?? notification;
  return obj;
};

interface CreateConversationInput {
  type: ConversationType;
  participants: string[];
  jobId?: string;
  proposalId?: string;
  disputeId?: string;
  title?: string;
  avatar?: string;
}

interface SendMessageInput {
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
    replyToMessageId?: string;
    forwardFromMessageId?: mongoose.Types.ObjectId;
  };
}

interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

interface GetMessagesParams {
  conversationId: string;
  limit?: number;
  skip?: number;
  before?: string;
  after?: string;
}

interface GetConversationsParams {
  userId: string;
  type?: ConversationType;
  status?: 'active' | 'archived' | 'muted' | 'pinned';
  limit?: number;
  skip?: number;
  sortBy?: 'lastMessageAt' | 'createdAt' | 'unreadCount';
  sortOrder?: 'asc' | 'desc';
}

interface GetNotificationsParams {
  userId: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'dismissed' | 'all';
  type?: string;
  limit?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'sentAt' | 'readAt';
  sortOrder?: 'asc' | 'desc';
}

const generateConversationId = () => new mongoose.Types.ObjectId().toString();

export const messagingService = {
  // Conversations
  createConversation: async (input: CreateConversationInput, creatorId: string) => {
    // For direct conversations, check if one already exists
    if (input.type === 'direct') {
      const existing = await ConversationModel.findOne({
        type: 'direct',
        participants: { $all: input.participants, $size: input.participants.length },
      });
      if (existing) return serializeConversation(existing);
    }

    const conversation = await ConversationModel.create({
      type: input.type || 'direct',
      participants: input.participants,
      jobId: input.jobId,
      proposalId: input.proposalId,
      disputeId: input.disputeId,
      title: input.title,
      avatar: input.avatar,
      createdBy: creatorId,
    });

    // Notify participants via socket
    for (const participantId of input.participants) {
      if (participantId !== creatorId) {
        socketService.emitToUser(participantId, 'new_conversation', {
          conversation: serializeConversation(conversation),
        });
      }
    }

    return serializeConversation(conversation);
  },

  getOrCreateDirectConversation: async (userId1: string, userId2: string): Promise<IConversation> => {
    const existing = await ConversationModel.findOne({
      type: 'direct',
      participants: { $all: [userId1, userId2], $size: 2 },
    });

    if (existing) return serializeConversation(existing);

    const conversation = await ConversationModel.create({
      type: 'direct',
      participants: [userId1, userId2],
      createdBy: userId1,
    });

    return serializeConversation(conversation);
  },

  getConversationById: async (conversationId: string, userId: string): Promise<IConversation | null> => {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) return null;
    return serializeConversation(conversation);
  },

  getUserConversations: async (userId: string, params: GetConversationsParams): Promise<{
    conversations: IConversation[];
    total: number;
  }> => {
    const filter: any = { participants: userId };
    if (params.type) filter.type = params.type;
    
    // Handle status filters
    if (params.status === 'archived') {
      filter.archivedBy = new mongoose.Types.ObjectId(userId);
    } else if (params.status === 'muted') {
      filter.mutedBy = new mongoose.Types.ObjectId(userId);
    } else if (params.status === 'pinned') {
      filter.pinnedBy = new mongoose.Types.ObjectId(userId);
    } else if (params.status === 'active') {
      filter.archivedBy = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    const sort: Record<string, 1 | -1> = {};
    const order = params.sortOrder === 'asc' ? 1 : -1;
    sort[params.sortBy || 'lastMessageAt'] = order;

    const [conversations, total] = await Promise.all([
      ConversationModel.find(filter)
        .sort(sort)
        .skip(params.skip || 0)
        .limit(params.limit || 20)
        .populate('lastMessageId', 'content type sentAt senderId')
        .populate('participants', 'fullName provider_profile.avatar_url')
        .lean(),
      ConversationModel.countDocuments(filter),
    );

    return {
      conversations: conversations.map(serializeConversation),
      total,
    };
  },

  updateConversation: async (conversationId: string, userId: string, updates: Partial<IConversation>): Promise<IConversation> => {
    const conversation = await ConversationModel.findOne({ _id: conversationId, participants: userId });
    if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

    Object.assign(conversation, updates);
    await conversation.save();
    return serializeConversation(conversation);
  },

  deleteConversation: async (conversationId: string, userId: string, deleteForEveryone: boolean = false): Promise<void> => {
    const conversation = await ConversationModel.findOne({ _id: conversationId, participants: userId });
    if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

    if (deleteForEveryone) {
      // Delete all messages and conversation
      await MessageModel.deleteMany({ conversationId });
      await conversation.deleteOne();
    } else {
      // Archive for this user only
      conversation.archivedBy.push(new mongoose.Types.ObjectId(userId));
      await conversation.save();
    }
  },

  // Messages
  sendMessage: async (input: SendMessageInput): Promise<IMessage> => {
    const conversation = await ConversationModel.findById(input.conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

    // Check if sender is participant
    if (!conversation.participants.map(id => id.toString()).includes(input.senderId)) {
      throw new AppError('Not a participant in this conversation', 403, 'NOT_PARTICIPANT');
    }

    const message = await MessageModel.create({
      conversationId: input.conversationId,
      senderId: input.senderId,
      receiverId: input.receiverId, // For direct messages
      type: input.type,
      content: input.content,
      metadata: input.metadata,
      status: 'sent',
      sentAt: new Date(),
    });

    // Update conversation
    conversation.lastMessageId = message._id;
    conversation.lastMessagePreview = input.content.substring(0, 200);
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for other participants
    for (const participantId of conversation.participants) {
      const pid = participantId.toString();
      if (pid !== input.senderId) {
        const current = conversation.unreadCounts.get(pid) || 0;
        conversation.unreadCounts.set(pid, current + 1);
      }
    }
    await conversation.save();

    // Emit real-time event
    socketService.emitToConversation(input.conversationId, 'new_message', {
      conversationId: input.conversationId,
      message: serializeMessage(await MessageModel.findById(message._id).populate('senderId', 'fullName provider_profile.avatar_url').lean()),
    });

    // Send push notification to offline participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== input.senderId) {
        // In a real app, check if user is online and send push notification
        // await fcmService.sendToTokens(user.deviceTokens, { ... });
      }
    }

    return serializeMessage(message);
  },

  getMessages: async (params: GetMessagesParams): Promise<{ messages: IMessage[]; total: number }> => {
    const filter: any = { conversationId: params.conversationId };
    if (params.before) filter.sentAt = { $lt: new Date(params.before) };
    if (params.after) filter.sentAt = { ...filter.sentAt, $gt: new Date(params.after) };

    const messages = await MessageModel.find(filter)
      .sort({ sentAt: -1 })
      .skip(params.skip || 0)
      .limit(params.limit || 50)
      .populate('senderId', 'fullName provider_profile.avatar_url')
      .lean();

    const total = await MessageModel.countDocuments(filter);

    return {
      messages: messages.map(serializeMessage).reverse(),
      total,
    };
  },

  updateMessage: async (messageId: string, userId: string, updates: { content?: string; metadata?: any }): Promise<IMessage> => {
    const message = await MessageModel.findOne({ _id: messageId, senderId: userId });
    if (!message) throw new AppError('Message not found or not authorized', 404, 'MESSAGE_NOT_FOUND');

    if (updates.content) message.content = updates.content;
    if (updates.metadata) {
      message.metadata = { ...message.metadata, ...updates.metadata, isEdited: true, editedAt: new Date() };
    }

    await message.save();
    return serializeMessage(message);
  },

  deleteMessage: async (messageId: string, userId: string, deleteForEveryone: boolean): Promise<void> => {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');

    if (message.senderId.toString() !== userId && !deleteForEveryone) {
      throw new AppError('Not authorized to delete this message', 403, 'NOT_AUTHORIZED');
    }

    if (deleteForEveryone) {
      message.status = 'deleted';
      message.deletedAt = new Date();
      message.deletedBy = new mongoose.Types.ObjectId(userId);
      await message.save();
    } else {
      await message.deleteOne();
    }

    // Emit deletion event
    socketService.emitToConversation(message.conversationId.toString(), 'message_deleted', {
      messageId: message._id.toString(),
      conversationId: message.conversationId.toString(),
      deletedForEveryone,
    });
  },

  markAsRead: async (conversationId: string, userId: string, messageIds?: string[]): Promise<void> => {
    const conversation = await ConversationModel.findOne({ _id: conversationId, participants: userId });
    if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');

    const messageIds = messageIds || (await MessageModel.find({ conversationId, readAt: { $exists: false }, senderId: { $ne: userId } }).distinct('_id'));
    
    if (messageIds.length > 0) {
      await MessageModel.updateMany(
        { _id: { $in: messageIds }, senderId: { $ne: userId } },
        { status: 'read', readAt: new Date() }
      );

      // Update unread count
      const currentUnread = conversation.unreadCounts.get(userId) || 0;
      conversation.unreadCounts.set(userId, Math.max(0, currentUnread - messageIds.length));
      await conversation.save();

      // Emit read event
      socketService.emitToConversation(messageIds[0].toString(), 'message_read', {
        conversationId,
        messageIds: messageIds.map(id => id.toString()),
        readBy: userId,
      });
    }
  },

  // Notifications
  sendNotification: async (input: SendNotificationInput): Promise<INotification> => {
    const notification = await NotificationModel.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      channels: input.channels,
      priority: input.priority || 'normal',
      scheduledFor: input.scheduledFor,
      relatedEntityId: input.relatedEntityId,
      relatedEntityType: input.relatedEntityType,
      actionUrl: input.actionUrl,
      actionText: input.actionText,
      metadata: input.metadata,
    });

    // Send via socket if user is online
    if (input.channels.includes('in_app')) {
      socketService.emitToUser(input.userId, 'new_notification', serializeNotification(notification));
    }

    // Send push notification
    if (input.channels.includes('push')) {
      // In a real app, check if user is online and send push notification
      // await fcmService.sendToTokens(user.deviceTokens, { ... });
    }

    // Send email
    if (input.channels.includes('email')) {
      // Send email via email service
    }

    // Send SMS
    if (input.channels.includes('sms')) {
      // Send SMS
    }

    return serializeNotification(notification);
  },

  getNotifications: async (userId: string, params: GetNotificationsParams): Promise<{ notifications: INotification[]; total: number }> => {
    const filter: any = { userId };
    if (params.status && params.status !== 'all') filter.status = params.status;
    if (params.type) filter.type = params.type;

    const sort: Record<string, 1 | -1> = {};
    sort[params.sortBy || 'createdAt'] = params.sortOrder === 'asc' ? 1 : -1;

    const notifications = await NotificationModel.find(filter)
      .sort(sort)
      .skip(params.skip || 0)
      .limit(params.limit || 20)
      .lean();

    const total = await NotificationModel.countDocuments(filter);

    return {
      notifications: notifications.map(serializeNotification),
      total,
    };
  },

  markAsRead: async (notificationId: string, userId: string): Promise<INotification> => {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { status: 'read', readAt: new Date(), 'channelsStatus.in_app.read': true, 'channelsStatus.in_app.readAt': new Date() },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    return serializeNotification(notification);
  },

  markAllAsRead: async (userId: string): Promise<number> => {
    const result = await NotificationModel.updateMany(
      { userId, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date(), 'channelsStatus.in_app.read': true, 'channelsStatus.in_app.readAt': new Date() }
    );
    return result.modifiedCount;
  },

  dismissNotification: async (notificationId: string, userId: string): Promise<void> => {
    await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { status: 'dismissed' }
    );
  },

  getNotificationStats: async (userId: string) => {
    const stats = await NotificationModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = {
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      dismissed: 0,
      unread: 0,
    };

    for (const stat of stats) {
      if (stat._id in result) {
        result[stat._id] = stat.count;
      }
    }

    result.unread = (result.pending || 0) + (result.sent || 0) + (result.delivered || 0);

    return result;
  },

  // Push token management
  registerPushToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: { token, platform, deviceId, createdAt: new Date() } },
    });
  },

  removePushToken: async (userId: string, token: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: { token } },
    });
  },

  // Push preferences
  updatePushPreferences: async (userId: string, preferences: {
    enabled?: boolean;
    types?: string[];
    quietHours?: { enabled: boolean; start: string; end: string; timezone?: string };
  }): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { pushPreferences: preferences },
    });
  },

  // Admin functions
  adminSendNotification: async (adminId: string, payload: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    channels: NotificationChannel[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledFor?: Date;
  }): Promise<number> => {
    const userIds = payload.userIds;
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');

    const notifications = userIds.map(userId => ({
      userId,
      type: 'system_announcement' as NotificationType,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      channels: payload.channels,
      priority: payload.priority,
      scheduledFor: payload.scheduledFor,
      metadata: { sentByAdmin: adminId },
    });

    const notifications = await NotificationModel.insertMany(notifications);
    
    // Send real-time
    for (const notification of notifications) {
      socketService.emitToUser(notification.userId.toString(), 'new_notification', notification);
    }

    return notifications.length;
  },

  // Push token management
  registerPushToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: { token, platform, deviceId, createdAt: new Date() } },
    });
  },

  removePushToken: async (userId: string, token: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: { token } },
    });
  },

  // Push preferences
  updatePushPreferences: async (userId: string, preferences: {
    enabled?: boolean;
    types?: string[];
    quietHours?: { enabled: boolean; start: string; end: string; timezone?: string };
  }): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { pushPreferences: preferences },
    });
  },

  // Admin functions
  adminSendNotification: async (adminId: string, payload: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    channels: NotificationChannel[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledFor?: Date;
  }): Promise<number> => {
    const userIds = payload.userIds;
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');

    const notifications = userIds.map(userId => ({
      userId,
      type: 'system_announcement' as NotificationType,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      channels: payload.channels,
      priority: payload.priority,
      scheduledFor: payload.scheduledFor,
      metadata: { sentByAdmin: adminId },
    });

    const notifications = await NotificationModel.insertMany(notifications);
    
    // Send real-time
    for (const notification of notifications) {
      socketService.emitToUser(notification.userId.toString(), 'new_notification', notification);
    }

    return notifications.length;
  },

  // Push token management
  registerPushToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: { token, platform, deviceId, createdAt: new Date() } },
    });
  },

  removePushToken: async (userId: string, token: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: { token } },
    });
  },

  // Push preferences
  updatePushPreferences: async (userId: string, preferences: {
    enabled?: boolean;
    types?: string[];
    quietHours?: { enabled: boolean; start: string; end: string; timezone?: string };
  }): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { pushPreferences: preferences },
    });
  },

  // Admin functions
  adminSendNotification: async (adminId: string, payload: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    channels: NotificationChannel[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledFor?: Date;
  }): Promise<number> => {
    const userIds = payload.userIds;
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');

    const notifications = userIds.map(userId => ({
      userId,
      type: 'system_announcement' as NotificationType,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      channels: payload.channels,
      priority: payload.priority,
      scheduledFor: payload.scheduledFor,
      metadata: { sentByAdmin: adminId },
    });

    const notifications = await NotificationModel.insertMany(notifications);
    
    // Send real-time
    for (const notification of notifications) {
      socketService.emitToUser(notification.userId.toString(), 'new_notification', notification);
    }

    return notifications.length;
  },

  // Push token management
  registerPushToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: { token, platform, deviceId, createdAt: new Date() } },
    });
  },

  removePushToken: async (userId: string, token: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: { token } },
    });
  },

  // Push preferences
  updatePushPreferences: async (userId: string, preferences: {
    enabled?: boolean;
    types?: string[];
    quietHours?: { enabled: boolean; start: string; end: string; timezone?: string };
  }): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { pushPreferences: preferences },
    });
  },

  // Admin functions
  adminSendNotification: async (adminId: string, payload: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    channels: NotificationChannel[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledFor?: Date;
  }): Promise<number> => {
    const userIds = payload.userIds;
    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');

    const notifications = userIds.map(userId => ({
      userId,
      type: 'system_announcement' as NotificationType,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      channels: payload.channels,
      priority: payload.priority,
      scheduledFor: payload.scheduledFor,
      metadata: { sentByAdmin: adminId },
    });

    const notifications = await NotificationModel.insertMany(notifications);
    
    // Send real-time
    for (const notification of notifications) {
      socketService.emitToUser(notification.userId.toString(), 'new_notification', notification);
    }

    return notifications.length;
  },

  // Push token management
  registerPushToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { deviceTokens: { token, platform, deviceId, createdAt: new Date() } },
    });
  },

  removePushToken: async (userId: string, token: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { deviceTokens: { token } },
    });
  },

  // Push preferences
  updatePushPreferences: async (userId: string, preferences: {
    enabled?: boolean;
    types?: string[];
    quietHours?: { enabled: boolean; start: string; end: string; timezone?: string };
  }): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { pushPreferences: preferences },
    });
  },
};