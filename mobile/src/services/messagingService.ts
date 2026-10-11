import { api } from './api';

// Types
export type IConversation = {
  _id: string;
  title: string;
  type: 'direct' | 'group' | 'job' | 'support';
  avatar?: string;
  participants: Array<{
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  }>;
  lastMessage?: {
    _id: string;
    content: string;
    type: string;
    sentAt: string;
    senderId: string;
  };
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCounts?: number;
  jobId?: string;
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
};

export type IMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  status: 'sent' | 'delivered' | 'read';
  readAt?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type GetConversationsParams = {
  type?: 'direct' | 'group' | 'job' | 'support' | 'all';
  skip?: number;
  limit?: number;
};

export type GetConversationsResponse = {
  conversations: IConversation[];
  total: number;
};

export type GetMessagesParams = {
  conversationId: string;
  skip?: number;
  limit?: number;
};

export type GetMessagesResponse = {
  messages: IMessage[];
  total: number;
};

export type SendMessageParams = {
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'file';
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
};

// Service
export const messagingService = {
  getUserConversations: async (params: GetConversationsParams = {}): Promise<GetConversationsResponse> => {
    const { type, skip = 0, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    if (type && type !== 'all') queryParams.append('type', type);
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', limit.toString());
    
    const response = await api.get<{ success: boolean; data: GetConversationsResponse }>(
      `/messaging/conversations?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getConversationById: async (conversationId: string): Promise<IConversation> => {
    const response = await api.get<{ success: boolean; data: IConversation }>(
      `/messaging/conversations/${conversationId}`
    );
    return response.data.data;
  },

  getMessages: async (params: GetMessagesParams): Promise<GetMessagesResponse> => {
    const { conversationId, skip = 0, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', limit.toString());
    
    const response = await api.get<{ success: boolean; data: GetMessagesResponse }>(
      `/messaging/conversations/${conversationId}/messages?${queryParams.toString()}`
    );
    return response.data.data;
  },

  sendMessage: async (params: SendMessageParams): Promise<IMessage> => {
    const response = await api.post<{ success: boolean; data: IMessage }>(
      '/messaging/messages',
      params
    );
    return response.data.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post<{ success: boolean; data: null }>(
      `/messaging/conversations/${conversationId}/read`,
      {}
    );
  },

  createConversation: async (params: {
    type: 'direct' | 'group' | 'job' | 'support';
    participantIds: string[];
    jobId?: string;
    title?: string;
  }): Promise<IConversation> => {
    const response = await api.post<{ success: boolean; data: IConversation }>(
      '/messaging/conversations',
      params
    );
    return response.data.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete<{ success: boolean; data: null }>(
      `/messaging/messages/${messageId}`
    );
  },

  uploadAttachment: async (file: { uri: string; name: string; type: string }): Promise<{ url: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('file', file as any);
    
    const response = await api.post<{ success: boolean; data: { url: string; fileName: string } }>(
      '/messaging/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};