import admin from 'firebase-admin';
import { AppError } from '../../common/errors/AppError.js';

let firebaseApp: admin.app.App | null = null;

export const fcmService = {
  initialize: () => {
    if (firebaseApp) return firebaseApp;

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      console.warn('Firebase service account not configured, FCM will not be available');
      return null;
    }

    try {
      const serviceAccountObj = JSON.parse(serviceAccount);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
      });
      console.log('Firebase Admin initialized');
      return firebaseApp;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      return null;
    }
  },

  getMessaging: () => {
    if (!firebaseApp) {
      fcmService.initialize();
    }
    if (!firebaseApp) {
      throw new Error('Firebase Admin not initialized');
    }
    return firebaseApp.messaging();
  },

  sendToToken: async (token: string, notification: {
    title: string;
    body: string;
    imageUrl?: string;
  }, data?: Record<string, string>) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
      return response;
    } catch (error) {
      console.error('FCM send error:', error);
      throw new Error(`FCM send failed: ${error}`);
    }
  },

  sendToTokens: async (tokens: string[], notification: {
    title: string;
    body: string;
    imageUrl?: string;
  }, data?: Record<string, string>) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
      return response;
    } catch (error) {
      console.error('FCM multicast send error:', error);
      throw new Error(`FCM multicast send failed: ${error}`);
    }
  },

  sendToTopic: async (topic: string, notification: {
    title: string;
    body: string;
    imageUrl?: string;
  }, data?: Record<string, string>) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.send({
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
      });
      return response;
    } catch (error) {
      console.error('FCM topic send error:', error);
      throw new Error(`FCM topic send failed: ${error}`);
    }
  },

  subscribeToTopic: async (tokens: string[], topic: string) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('FCM subscribe to topic error:', error);
      throw new Error(`FCM subscribe failed: ${error}`);
    }
  },

  unsubscribeFromTopic: async (tokens: string[], topic: string) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('FCM unsubscribe error:', error);
      throw new Error(`FCM unsubscribe failed: ${error}`);
    }
  },

  sendToDeviceGroup: async (notificationKey: string, notification: {
    title: string;
    body: string;
    imageUrl?: string;
  }, data?: Record<string, string>) => {
    const messaging = fcmService.getMessaging();
    try {
      const response = await messaging.send({
        notification_key: notificationKey,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
      });
      return response;
    } catch (error) {
      console.error('FCM device group send error:', error);
      throw new Error(`FCM device group send failed: ${error}`);
    }
  },
};

export default fcmService;