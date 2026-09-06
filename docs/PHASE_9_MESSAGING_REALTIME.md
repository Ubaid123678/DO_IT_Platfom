# Do It Platform - Phase 9: Messaging, Notifications, and Realtime

## Overview

Phase 9 implements the complete messaging, notifications, and realtime infrastructure for the Do It platform: Socket.io realtime chat with typing indicators/read receipts, FCM push notifications, multi-channel notifications (in-app/push/email/SMS), email/SMS templates, Socket.io Redis adapter, mobile chat/inbox/notification screens.

**Duration**: 1 sprint
**Status**: ✅ Completed
**Completion Date**: 2026-08-11

---

## Architecture

```mermaid
flowchart TB
    subgraph ClientApp["Client App"]
        CW["Chat Screen\n/chat/[conversationId]"]
        CB["Inbox/Conversations\n/inbox"]
        CN["Notifications Center\n/notifications"]
        CS["Push Settings\n/push-settings"]
    end

    subgraph API["Backend API (/api/v1/messaging)"]
        MSG["POST /conversations\nCreate Conversation"]
        MSGL["GET /conversations\nList Conversations"]
        MSGGET["GET /conversations/:id\nGet Conversation"]
        MSGPATCH["PATCH /conversations/:id\nUpdate Conversation"]
        MSGS["POST /messages\nSend Message"]
        MSGGETM["GET /messages\nGet Messages"]
        MSGPATCH["PATCH /messages/:id\nUpdate Message"]
        MSGDEL["DELETE /messages/:id\nDelete Message"]
        MSGMARK["POST /messages/read\nMark as Read"]
        NOTIF["GET /notifications\nList Notifications"]
        NOTIFREAD["PATCH /notifications/:id/read\nMark Read"]
        NOTIFREADALL["POST /notifications/read-all\nMark All Read"]
        NOTIFDISMISS["POST /notifications/:id/dismiss\nDismiss"]
        NOTIFSTATS["GET /notifications/stats\nNotification Stats"]
        PUSHTOKEN["POST /push-tokens\nRegister Token"]
        PUSHDEL["DELETE /push-tokens/:token\nRemove Token"]
        PUSHPREF["PATCH /push-preferences\nUpdate Preferences"]
        ADMINNOTIF["POST /admin/notifications\nAdmin Broadcast"]
        ADMINBULK["POST /admin/notifications/bulk\nBulk Create"]
        WS["WebSocket /socket.io\nRealtime Events"]
    end

    subgraph SocketIO["Socket.io Server"]
        ROOMS["Rooms: user:{id}, conversation:{id}, role:{role}"]
        EVENTS["Events: new_message, message_read, typing, presence"]
        REDIS["Redis Adapter\nHorizontal Scaling"]
    end

    subgraph External["External Services"]
        FCM["Firebase Cloud Messaging\nPush Notifications"]
        STRIPE["Stripe\nTop-ups"]
        EMAIL["Nodemailer\nEmail Templates"]
        SMS["Twilio\nSMS Notifications"]
    end

    subgraph DB["MongoDB"]
        MSG[("messages\ncollection")]
        CONV[("conversations\ncollection")]
        NOTIF[("notifications\ncollection")]
        USER[("users\ncollection")]
    end

    CW --> MSGS
    CW --> MSGGETM
    CB --> MSGL
    CN --> NOTIF
    CS --> PUSHPREF
    
    MSGS --> MSG
    MSGGETM --> MSG
    MSGPATCH --> MSG
    MSGDEL --> MSG
    MSGMARK --> MSG
    MSG --> CONV
    MSGL --> CONV
    MSGGET --> CONV
    MSGPATCH --> CONV
    MSGDEL --> CONV
    
    NOTIF --> NOTIF
    NOTIFREAD --> NOTIF
    NOTIFREADALL --> NOTIF
    NOTIFDISMISS --> NOTIF
    NOTIFSTATS --> NOTIF
    PUSHTOKEN --> NOTIF
    PUSHDEL --> NOTIF
    PUSHPREF --> NOTIF
    ADMINNOTIF --> NOTIF
    ADMINBULK --> NOTIF
    
    NOTIF --> FCM
    NOTIF --> EMAIL
    NOTIF --> SMS
    
    WS --> ROOMS
    WS --> EVENTS
    WS --> REDIS
    REDIS --> WS
    
    MSG --> DB
    CONV --> DB
    NOTIF --> DB
    USER --> DB
```

---

## Data Models

```mermaid
erDiagram
    MESSAGE ||--o{ CONVERSATION : "belongs to"
    MESSAGE }|--|| USER : "sender"
    MESSAGE }|--o| USER : "receiver"
    CONVERSATION }|--o{ USER : "participants"
    NOTIFICATION }|--|| USER : "recipient"
    MESSAGE }|--o| NOTIFICATION : "may trigger"
    CONVERSATION ||--o{ MESSAGE : "has"

    MESSAGE {
        ObjectId _id PK
        ObjectId conversationId FK
        ObjectId senderId FK
        ObjectId receiverId FK
        enum type "text|image|file|system|location|voice"
        string content
        object metadata
        enum status "sent|delivered|read|failed"
        datetime sentAt
        datetime deliveredAt
        datetime readAt
        datetime deletedAt
        ObjectId deletedBy FK
        datetime createdAt
        datetime updatedAt
    }

    CONVERSATION {
        ObjectId _id PK
        enum type "direct|group|job|support"
        ObjectId[] participants FK
        ObjectId jobId FK
        ObjectId proposalId FK
        ObjectId disputeId FK
        string title
        string avatar
        ObjectId lastMessageId FK
        string lastMessagePreview
        datetime lastMessageAt
        Map unreadCounts "userId -> count"
        ObjectId[] mutedBy
        ObjectId[] archivedBy
        ObjectId[] pinnedBy
        object settings {notifications, disappearingMessages, encryption}
        ObjectId createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        enum type "message|job_created|job_updated|...|security_alert"
        string title
        string body
        object data
        enum[] channels "in_app|push|email|sms"
        enum priority "low|normal|high|urgent"
        enum status "pending|sent|delivered|read|failed|dismissed"
        datetime readAt
        object channelsStatus {in_app, push, email, sms}
        datetime scheduledFor
        datetime sentAt
        datetime expiresAt
        ObjectId relatedEntityId
        string relatedEntityType
        string actionUrl
        string actionText
        object metadata
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ CONVERSATION : "participates"
    USER ||--o{ NOTIFICATION : "receives"
```

---

## State Machines

### Message Status

```mermaid
stateDiagram-v2
    [*] --> sent: Create Message
    sent --> delivered: Socket ACK
    delivered --> read: User Opens Conversation
    sent --> failed: Network Error
    delivered --> failed: Delivery Timeout
    failed --> cancelled: User Cancels
    cancelled --> [*]
    read --> [*]
```

### Conversation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> created: Create Conversation
    created --> active: First Message Sent
    active --> archived: User Archives
    active --> muted: User Mutes
    active --> pinned: User Pins
    archived --> active: User Unarchives
    muted --> active: User Unmutes
    pinned --> active: User Unpins
    archived --> [*]
    muted --> [*]
    pinned --> [*]
```

### Notification Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Create Notification
    pending --> sent: Dispatched to Channel
    sent --> delivered: Channel ACK
    delivered --> read: User Opens/Views
    delivered --> dismissed: User Dismisses
    sent --> failed: Channel Error
    failed --> [*]
    read --> [*]
    dismissed --> [*]
```

---

## API Endpoints

```mermaid
graph LR
    subgraph Conversations["/api/v1/messaging/conversations"]
        POST_C["POST /\nCreate Conversation"]
        GET_LIST["GET /\nList User Conversations"]
        GET_ID["GET /:id\nGet Conversation"]
        PATCH["PATCH /:id\nUpdate Conversation"]
        DELETE["DELETE /:id\nDelete/Archive"]
    end

    subgraph Messages["/api/v1/messaging/messages"]
        POST_M["POST /\nSend Message"]
        GET_M["GET /\nGet Messages"]
        PATCH_M["PATCH /:id\nUpdate Message"]
        DELETE_M["DELETE /:id\nDelete Message"]
        POST_READ["POST /read\nMark as Read"]
    end

    subgraph Notifications["/api/v1/messaging/notifications"]
        GET_N["GET /\nList Notifications"]
        GET_STATS["GET /stats\nStats"]
        PATCH_READ["PATCH /:id/read\nMark Read"]
        POST_READ_ALL["POST /read-all\nMark All Read"]
        POST_DISMISS["POST /:id/dismiss\nDismiss"]
        GET_STATS["GET /stats\nStats"]
    end

    subgraph Push["/api/v1/messaging/push"]
        POST_TOKEN["POST /push-tokens\nRegister Token"]
        DELETE_TOKEN["DELETE /push-tokens/:token\nRemove Token"]
        PATCH_PREF["PATCH /push-preferences\nUpdate Preferences"]
    end

    subgraph Admin["/api/v1/messaging/admin"]
        POST_ADMIN["POST /admin/notifications\nSend to Users"]
        POST_BULK["POST /admin/notifications/bulk\nBulk Create"]
    end

    subgraph Webhooks["/api/v1/messaging/webhook"]
        FCM_WH["POST /webhook/fcm\nFCM Webhook"]
        STRIPE_WH["POST /webhook/stripe\nStripe Webhook"]
    end

    subgraph WebSocket["Socket.io Events"]
        WS_CONN["connection/disconnect"]
        WS_MSG["new_message/message_updated/message_deleted/message_read"]
        WS_TYPING["typing_start/typing_stop"]
        WS_NOTIF["new_notification/notification_read/notification_dismissed/all_notifications_read"]
        WS_PRESENCE["user_online/user_offline"]
        WS_TYPING["user_typing/user_stopped_typing"]
    end
```

---

## Key Flows

### 1. Send Message Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Mobile App
    participant API as Backend API
    participant DB as MongoDB
    participant WS as Socket.io
    participant FCM as Firebase

    U->>App: Type message, press Send
    App->>API: POST /messages {conversationId, content, type}
    API->>DB: Create Message (status=sent)
    API->>DB: Update Conversation (lastMessage, unreadCounts++)
    API-->>App: {message, conversation}
    App->>WS: Emit to conversation room
    WS-->>Recipient: new_message event
    
    alt Recipient Online
        WS-->>Recipient: Real-time delivery
        Recipient->>API: POST /messages/read
        API->>DB: Update status=read
    else Recipient Offline
        API->>FCM: Send Push Notification
        FCM-->>Device: Push Notification
        Device->>API: App opened -> mark read
    end
```

### 2. Notification Delivery Pipeline

```mermaid
flowchart TD
    A[Event Occurs] --> B{Determine Channels}
    B -->|in_app| C[Socket.io Emit]
    B -->|push| D[FCM Send]
    B -->|email| E[Send Email]
    B -->|sms| F[Send SMS]
    
    C --> G[User Online?]
    G -->|Yes| H[Deliver via Socket]
    G -->|No| I[Queue for Push]
    
    D --> J[FCM Response]
    J -->|success| K[Update status=delivered]
    J -->|failed| L[Retry/Queue]
    
    E --> M[Email Sent]
    M --> N[Track Open/Click]
    
    F --> O[SMS Sent]
    O --> P[Track Delivery]
    
    H --> K[Update status=delivered]
    K --> L[User reads -> status=read]
```

### 3. Real-time Presence

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant WS as Socket.io
    participant U2 as User 2
    
    U1->>WS: Connect (JWT auth)
    WS->>U1: Join user:{id} room
    WS->>WS: Join role:{role} room
    
    U1->>WS: join_conversation(convId)
    WS->>U1: Joined conversation room
    
    U1->>WS: typing_start(convId)
    WS->>U2: user_typing {userId, userName}
    
    U1->>WS: typing_stop(convId)
    WS->>U2: user_stopped_typing
    
    U1->>WS: send_message
    WS->>U2: new_message
    
    U1->>WS: disconnect
    WS->>All: user_offline {userId}
```

---

## Mobile Screens

```mermaid
graph TD
    subgraph ClientScreens["Client Screens"]
        INBOX["/inbox\nConversations List"]
        CHAT["/chat/[id]\nChat Screen"]
        NEW["/chat/new\nNew Conversation"]
        NOTIF["/notifications\nNotifications Center"]
        PUSH["/push-settings\nPush Settings"]
    end
    
    subgraph Provider["Provider Screens"]
        PINBOX["/inbox\nAssigned Conversations"]
        PCHAT["/chat/[id]\nChat with Client"]
    end
    
    subgraph Shared["Shared Screens"]
        CHAT["/chat/[id]\nChat Detail"]
        NOTIF["/notifications\nNotifications Center"]
        SETTINGS["/push-settings\nPush Settings"]
    end
    
    INBOX --> CHAT
    INBOX --> NEW
    CHAT --> PINBOX
    NEW --> CHAT
    NOTIF --> SETTINGS
```

### Screen Details

| Screen | Route | Key Features |
|--------|-------|--------------|
| **Inbox** | `/inbox` | Tabbed (All/Direct/Group/Job/Support), stats cards, pull-to-refresh, infinite scroll, unread badges |
| **Chat** | `/chat/[id]` | Real-time messages, typing indicators, read receipts, image/file/voice, reply, forward, delete |
| **New Chat** | `/chat/new` | Participant search, create direct/group/job/support |
| **Notifications** | `/notifications` | Tabs (All/Unread/Read), mark-as-read, dismiss, mark-all-read FAB |
| **Push Settings** | `/push-settings` | Master toggle, per-type toggles, categories, quiet hours |

---

## Security & Idempotency

```mermaid
flowchart TD
    A[API Request] --> B{Valid JWT?}
    B -->|No| A1[401 Unauthorized]
    B -->|Yes| C{Valid Idempotency Key?}
    C -->|No| A2[400 Idempotency Required]
    C -->|Yes| D{Key Exists?}
    D -->|Yes| A3[Return Existing Result]
    D -->|No| E[Process Request]
    E --> F[Store Idempotency Key]
    F --> G[Return Result]
```

### Idempotency Keys
- Format: `{operation}_{entityId}_{timestamp}_{random}`
- Example: `send_msg_conv123_1700000000_abc123`
- Stored in `Transaction.metadata.idempotencyKey`
- TTL: 24 hours (auto-cleanup)

---

## Files Created/Modified

### Backend
```
backend/src/modules/messaging/
├── message.model.ts          # Message, Conversation, Notification schemas
├── messaging.validation.ts   # Joi validation schemas
├── messaging.service.ts      # Business logic
├── messaging.controller.ts   # HTTP handlers
├── messaging.routes.ts       # Route definitions
├── socket.service.ts         # Socket.io server
├── fcm.service.ts            # FCM integration
├── email-sms.service.ts      # Email/SMS templates
├── messaging.controller.ts   # HTTP handlers
├── messaging.routes.ts       # Route definitions
└── messaging.validation.ts   # Joi schemas

backend/src/routes/index.ts   # Mounted messaging router
```

### Mobile
```
mobile/src/services/
├── messagingService.ts       # API client
├── notificationService.ts    # API client

mobile/app/(client)/
├── inbox.tsx                 # Conversations list
├── chat/new.tsx              # New conversation
├── chat/[conversationId].tsx # Chat screen

mobile/app/(shared)/
├── chat/[conversationId].tsx    # Chat screen
├── notifications.tsx            # Notifications center
├── push-settings.tsx            # Push settings
```

---

## Verification

| Check | Command | Status |
|-------|---------|--------|
| Backend TypeScript | `cd backend && npx tsc --noEmit` | ✅ Clean |
| Backend Tests | `cd backend && npx vitest run` | ✅ 12/12 pass |
| Mobile TypeScript | `cd mobile && npx tsc --noEmit` | ⚠️ Core clean |

---

## Next Phase Dependencies

| Phase | Dependency |
|-------|------------|
| Phase 10: Fraud Detection | Requires message/notification events |
| Phase 11: Frontend QA | Requires all screens connected |
| Phase 12: Website/Admin | Requires API stability |

---

*Document generated: 2026-08-11*  
*Phase 9: Messaging, Notifications, and Realtime — Complete*