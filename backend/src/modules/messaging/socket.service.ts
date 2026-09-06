import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { AppError } from '../../common/errors/AppError.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface ServerToClientEvents {
  new_message: (message: any) => void;
  message_updated: (message: any) => void;
  message_deleted: (data: { messageId: string; conversationId: string; deletedForEveryone: boolean }) => void;
  message_read: (data: { conversationId: string; messageIds: string[]; readBy: string }) => void;
  new_conversation: (conversation: any) => void;
  conversation_updated: (conversation: any) => void;
  conversation_deleted: (conversationId: string) => void;
  unread_counts_updated: (data: { userId: string; conversationId: string; unreadCount: number }) => void;
  conversation_muted: (data: { conversationId: string; mutedBy: string; duration?: number }) => void;
  conversation_archived: (data: { conversationId: string; archivedBy: string }) => void;
  conversation_pinned: (data: { conversationId: string; pinnedBy: string }) => void;
  typing_start: (data: { conversationId: string; userId: string; userName: string }) => void;
  typing_stop: (data: { conversationId: string; userId: string }) => void;
  new_notification: (notification: any) => void;
  notification_read: (notificationId: string) => void;
  notification_dismissed: (notificationId: string) => void;
  all_notifications_read: () => void;
  notification_stats_updated: (stats: any) => void;
  job_status_changed: (data: { jobId: string; status: string; updatedBy: string }) => void;
  job_created: (job: any) => void;
  job_assigned: (data: { jobId: string; providerId: string }) => void;
  proposal_received: (proposal: any) => void;
  proposal_updated: (proposal: any) => void;
  dispute_created: (dispute: any) => void;
  dispute_updated: (dispute: any) => void;
  review_received: (review: any) => void;
  review_moderated: (review: any) => void;
  payout_status_changed: (payout: any) => void;
  wallet_updated: (wallet: any) => void;
  payout_status_changed: (payout: any) => void;
  system_announcement: (announcement: any) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  user_typing: (data: { conversationId: string; userId: string; userName: string }) => void;
  user_stopped_typing: (data: { conversationId: string; userId: string }) => void;
}

interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: { conversationId: string; content: string; type?: string; metadata?: any }) => void;
  update_message: (data: { messageId: string; content: string }) => void;
  delete_message: (data: { messageId: string; deleteForEveryone: boolean }) => void;
  mark_as_read: (data: { conversationId: string; messageIds?: string[] }) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
  join_conversation_room: (conversationId: string) => void;
  leave_conversation_room: (conversationId: string) => void;
  mute_conversation: (conversationId: string, duration?: number) => void;
  archive_conversation: (conversationId: string) => void;
  pin_conversation: (conversationId: string) => void;
  mark_notification_read: (notificationId: string) => void;
  mark_all_notifications_read: () => void;
  dismiss_notification: (notificationId: string) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  userRole: string;
  userName: string;
  userAvatar?: string;
}

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

let pubClient: ReturnType<typeof createClient> | null = null;
let subClient: ReturnType<typeof createClient> | null = null;

export const socketService = {
  initialize: (httpServer: any) => {
    io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize Redis adapter for multi-server scaling
    socketService.initializeRedisAdapter();

    io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new AppError('Authentication token required', 401, 'UNAUTHORIZED'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        
        socket.data.userId = decoded.sub;
        socket.data.userRole = decoded.role;
        socket.data.userName = decoded.name || decoded.fullName;
        socket.data.userAvatar = decoded.avatar;
        
        next();
      } catch (error) {
        next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
      }
    });

    io.on('connection', (socket: any) => {
      const userId = socket.data.userId;
      const userRole = socket.data.userRole;
      const userName = socket.data.userName;
      const userAvatar = socket.data.userAvatar;

      console.log(`User connected: ${userId} (${userRole})`);

      // Join user's personal room for direct notifications
      socket.join(`user:${socket.data.userId}`);

      // Join role-based room
      socket.join(`role:${socket.data.userRole}`);

      // Handle conversation events
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        type?: string;
        metadata?: any;
      }) => {
        try {
          // This would typically call the messaging service
          // For now, we'll broadcast to the conversation room
          io!.to(`conversation:${data.conversationId}`).emit('new_message', {
            conversationId: data.conversationId,
            content: data.content,
            type: data.type || 'text',
            metadata: data.metadata,
            senderId: socket.data.userId,
            senderName: socket.data.userName,
            senderAvatar: socket.data.userAvatar,
            sentAt: new Date(),
          });
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      socket.on('update_message', async (data: { messageId: string; content: string }) => {
        // Broadcast message update
        io!.to(`conversation:*`).emit('message_updated', {
          messageId: data.messageId,
          content: data.content,
          updatedAt: new Date(),
        });
      });

      socket.on('delete_message', async (data: { messageId: string; deleteForEveryone: boolean }) => {
        io!.to(`conversation:*`).emit('message_deleted', {
          messageId: data.messageId,
          deletedForEveryone: data.deleteForEveryone,
        });
      });

      socket.on('mark_as_read', (data: { conversationId: string; messageIds?: string[] }) => {
        socket.to(`conversation:${data.conversationId}`).emit('message_read', {
          conversationId: data.conversationId,
          messageIds: data.messageIds,
          readBy: socket.data.userId,
        });
      });

      socket.on('typing_start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.data.userId,
          userName: socket.data.userName,
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          conversationId,
          userId: socket.data.userId,
        });
      });

      socket.on('join_conversation_room', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('leave_conversation_room', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      socket.on('mute_conversation', (conversationId: string, duration?: number) => {
        socket.to(`conversation:${conversationId}`).emit('conversation_muted', {
          conversationId,
          mutedBy: socket.data.userId,
          duration,
        });
      });

      socket.on('archive_conversation', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('conversation_archived', {
          conversationId,
          archivedBy: socket.data.userId,
        });
      }

      socket.on('pin_conversation', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('conversation_pinned', {
          conversationId,
          pinnedBy: socket.data.userId,
        });
      });

      socket.on('mark_notification_read', (notificationId: string) => {
        // Handle notification read
      });

      socket.on('mark_all_notifications_read', () => {
        // Handle mark all as read
      });

      socket.on('dismiss_notification', (notificationId: string) => {
        // Handle dismiss notification
      });

      // Track online status
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${userId} (${reason})`);
        
        // Broadcast offline status
        io!.emit('user_offline', userId);
      });
    });

    console.log('Socket.io server initialized');
  },

  initializeRedisAdapter: async () => {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('Redis URL not configured, skipping Redis adapter');
        return;
      }

      pubClient = createClient({ url: process.env.REDIS_URL });
      subClient = createClient({ url: process.env.REDIS_URL });

      await Promise.all([
        pubClient.connect(),
        subClient.connect(),
      ]);

      io!.adapter(createAdapter(pubClient, subClient));
      console.log('Redis adapter initialized for Socket.io');
    } catch (error) {
      console.error('Failed to initialize Redis adapter:', error);
    }
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },

  emitToUser: (userId: string, event: string, data: any) => {
    io!.to(`user:${userId}`).emit(event, data);
  },

  emitToConversation: (conversationId: string, event: string, data: any) => {
    io!.to(`conversation:${conversationId}`).emit(event, data);
  },

  emitToRole: (role: string, event: string, data: any) => {
    io!.to(`role:${role}`).emit(event, data);
  },

  broadcast: (event: string, data: any) => {
    io!.emit(event, data);
  },

  getConnectedUsers: () => {
    if (!io) return [];
    const users: string[] = [];
    io!.sockets.sockets.forEach((socket: any) => {
      if (socket.data.userId) {
        users.push(socket.data.userId);
      }
    }
    return users;
  },

  isUserOnline: (userId: string): boolean => {
    if (!io) return false;
    const sockets = io.sockets.adapter.rooms.get(`user:${userId}`);
    return sockets !== undefined && sockets.size > 0;
  },

  getOnlineUsersCount: (): number => {
    if (!io) return 0;
    return io.sockets.sockets.size;
  },

  sendNotification: async (userId: string, notification: any) => {
    io!.to(`user:${userId}`).emit('new_notification', notification);
  },

  sendToConversation: (conversationId: string, event: string, data: any) => {
    io!.to(`conversation:${conversationId}`).emit(event, data);
  },

  emitJobEvent: (jobId: string, event: string, data: any) => {
    io!.to(`job:${jobId}`).emit(event, data);
  },

  emitProposalEvent: (proposalId: string, event: string, data: any) => {
    io!.to(`proposal:${proposalId}`).emit(event, data);
  },

  emitDisputeEvent: (disputeId: string, event: string, data: any) => {
    io!.to(`dispute:${disputeId}`).emit(event, data);
  },

  emitToRole: (role: string, event: string, data: any) => {
    io!.to(`role:${role}`).emit(event, data);
  },

  shutdown: async () => {
    if (io) {
      await io.close();
    }
    if (pubClient) {
      await pubClient.quit();
    }
    if (subClient) {
      await subClient.quit();
    }
  },
};

export default socketService;