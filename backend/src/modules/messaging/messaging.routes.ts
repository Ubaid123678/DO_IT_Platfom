import { Router, type Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { authenticate, type AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { messagingService } from './messaging.service.js';
import { messagingValidators } from './messaging.validation.js';

const router = Router();
router.use(authenticate);

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

// Envelope helper: every response uses the repo-standard shape.
const ok = (res: Response, data: unknown, message = 'Success') =>
  res.status(200).json({ success: true, data, meta: { message } });

const validate = <T>(schema: { validate: (value: unknown, options?: Record<string, unknown>) => { error?: { message: string }; value: T } }, payload: unknown): T => {
  const result = schema.validate(payload, { stripUnknown: true, abortEarly: false });
  if (result.error) throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

// ---------------------------------------------------------------------------
// Conversations / messages (mobile service base path: /messaging)
// ---------------------------------------------------------------------------

router.get('/conversations', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const query = validate(messagingValidators.getConversations, req.query);
  const result = await messagingService.getUserConversations(userId, query);
  ok(res, result, 'Conversations fetched successfully');
}));

router.post('/conversations', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const payload = validate(messagingValidators.createConversation, req.body);
  // Mobile sends participantIds; the service field is participants. Normalize
  // here so the mobile contract holds.
  const participants = (payload as unknown as { participants?: string[]; participantIds?: string[] });
  if (!participants.participants && Array.isArray(participants.participantIds)) {
    participants.participants = participants.participantIds;
  }
  if (!payload.participants || payload.participants.length < 2) {
    throw new AppError('At least two participants are required', 400, 'VALIDATION_ERROR');
  }
  const conversation = await messagingService.createConversation(payload, userId);
  res.status(201).json({ success: true, data: conversation, meta: { message: 'Conversation created successfully' } });
}));

router.get('/conversations/:conversationId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const conversation = await messagingService.getConversationById(req.params.conversationId, userId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  ok(res, conversation, 'Conversation fetched successfully');
}));

router.get('/conversations/:conversationId/messages', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const conversation = await messagingService.getConversationById(req.params.conversationId, userId);
  if (!conversation) throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  const query = validate(messagingValidators.getMessages, { ...req.query, conversationId: req.params.conversationId });
  const result = await messagingService.getMessages(query);
  ok(res, result, 'Messages fetched successfully');
}));

router.post('/messages', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const payload = validate(messagingValidators.sendMessage, req.body);
  const message = await messagingService.sendMessage({ ...payload, senderId: userId });
  res.status(201).json({ success: true, data: message, meta: { message: 'Message sent successfully' } });
}));

router.post('/conversations/:conversationId/read', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  await messagingService.markAsRead(req.params.conversationId, userId);
  ok(res, null, 'Messages marked as read');
}));

router.delete('/messages/:messageId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const { deleteForEveryone } = validate(messagingValidators.deleteMessage, req.body ?? {});
  await messagingService.deleteMessage(req.params.messageId, userId, deleteForEveryone);
  ok(res, null, 'Message deleted successfully');
}));

// ---------------------------------------------------------------------------
// Notifications (mobile service base path: /notifications)
// ---------------------------------------------------------------------------

router.get('/notifications', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const query = validate(messagingValidators.getNotifications, req.query);
  const result = await messagingService.getNotifications(userId, query);
  ok(res, result, 'Notifications fetched successfully');
}));

router.get('/notifications/stats', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const stats = await messagingService.getNotificationStats(userId);
  ok(res, stats, 'Notification statistics fetched successfully');
}));

router.post('/notifications/read-all', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const modified = await messagingService.markAllAsRead(userId);
  ok(res, null, `${modified} notifications marked as read`);
}));

router.post('/notifications/:notificationId/read', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const notification = await messagingService.markNotificationAsRead(req.params.notificationId, userId);
  ok(res, notification, 'Notification marked as read');
}));

router.post('/notifications/:notificationId/dismiss', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  await messagingService.dismissNotification(req.params.notificationId, userId);
  ok(res, null, 'Notification dismissed');
}));

router.get('/notifications/preferences', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const prefs = await messagingService.getPushPreferences(userId);
  ok(res, prefs, 'Push preferences fetched successfully');
}));

router.patch('/notifications/preferences', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = getUserId(req);
  const payload = validate(messagingValidators.updatePushPreferences, req.body);
  await messagingService.updatePushPreferences(userId, payload);
  ok(res, null, 'Push preferences saved');
}));

export default router;
