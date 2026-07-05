# Requirements Document

## Introduction

Sprint 3.5 adds realtime capabilities and a notifications system to the M.A.G.E. Digital Guild Platform feed. This includes Supabase Realtime channel subscriptions so new posts, comments, and reactions appear without page refreshes; a notifications table and API for user-facing alerts; admin moderation tools (report queue, hide/unhide, soft delete, audit logging); online presence tracking; and performance enhancements (optimistic updates, caching via TanStack Query). No UI redesign is involved — the existing feed frontend is extended with realtime data connections.

## Glossary

- **Platform**: The M.A.G.E. Digital Guild web application built with Next.js 15 and Supabase
- **Feed_Service**: The backend service responsible for retrieving and managing feed posts with realtime subscriptions
- **Notification_Service**: The backend service responsible for creating, retrieving, and managing user notifications
- **Reaction_Service**: The backend service responsible for handling emoji reactions with optimistic UI updates
- **Activity_Service**: The backend service responsible for logging user actions and moderation events
- **Realtime_Channel**: A Supabase Realtime channel that pushes database changes to subscribed clients
- **Notification**: A persisted record alerting a user about an event relevant to them (new comment, reaction, mention, moderation action)
- **Moderation_Queue**: The admin interface for reviewing reported posts and taking moderation actions
- **Presence_Channel**: A Supabase Realtime Presence channel that tracks which guild members are currently online
- **Optimistic_Update**: A client-side pattern where the UI reflects a change immediately before server confirmation, rolling back on failure
- **RLS_Policy**: A Supabase Row Level Security policy that restricts data access at the database level
- **Soft_Delete**: Marking a record as deleted (via a flag column) without physically removing it from the database
- **TanStack_Query**: The data-fetching and caching library (@tanstack/react-query) used for client-side state management

## Requirements

### Requirement 1: Notifications Table and Data Model

**User Story:** As a guild member, I want a persistent notifications store, so that I can see alerts about activity relevant to me even after being offline.

#### Acceptance Criteria

1. THE Platform SHALL provide a `notifications` table with columns: id (bigint, identity PK), user_id (uuid, FK to profiles), type (text, constrained to 'comment', 'reaction', 'mention', 'post', 'moderation'), title (text), body (text), entity_type (text), entity_id (text), actor_id (uuid, FK to profiles), is_read (boolean, default false), created_at (timestamptz, default now())
2. THE Platform SHALL enforce an RLS_Policy on the notifications table that independently restricts each enabled policy type (SELECT and UPDATE) to rows where auth.uid() equals user_id
3. THE Platform SHALL enforce an RLS_Policy on the notifications table that permits INSERT operations from service-role and authenticated contexts
4. THE Platform SHALL create indexes on the notifications table for user_id, is_read, and created_at (descending)
5. WHEN a notification row is older than 90 days, THE Platform SHALL allow scheduled cleanup without affecting unread notifications

### Requirement 2: Notification Service

**User Story:** As a guild member, I want to be notified when someone interacts with my posts, so that I can stay engaged with the community.

#### Acceptance Criteria

1. WHEN a user adds a comment to a post, THE Notification_Service SHALL create a notification of type 'comment' for the post author with the commenter as actor_id
2. WHEN a user adds a reaction to a post, THE Notification_Service SHALL create a notification of type 'reaction' for the post author with the reactor as actor_id
3. WHEN a user creates a new post in a category, THE Notification_Service SHALL create a notification of type 'post' for guild members who have subscribed to that category
4. WHEN an admin hides or soft-deletes a post, THE Notification_Service SHALL create a notification of type 'moderation' for the post author explaining the action taken
5. THE Notification_Service SHALL NOT create a notification when the actor and the recipient are the same user, applying this check individually per notification type so that other eligible notifications for the same user are still generated
6. THE Notification_Service SHALL follow the repository pattern by extending BaseRepository

### Requirement 3: Notification API Routes

**User Story:** As a guild member, I want API endpoints to retrieve and manage my notifications, so that the frontend can display and update them.

#### Acceptance Criteria

1. WHEN a GET request is made to /api/notifications, THE Platform SHALL return the authenticated user's notifications ordered by created_at descending with pagination (limit, offset query parameters)
2. WHEN a PATCH request is made to /api/notifications/[id]/read, THE Platform SHALL set is_read to true for the specified notification belonging to the authenticated user
3. WHEN a PATCH request is made to /api/notifications/read-all, THE Platform SHALL set is_read to true for all unread notifications belonging to the authenticated user
4. WHEN a GET request is made to /api/notifications/unread-count, THE Platform SHALL return the count of unread notifications for the authenticated user
5. IF an unauthenticated request is made to any notifications endpoint, THEN THE Platform SHALL respond with HTTP 401 status; any authenticated request to notification endpoints SHALL always succeed regardless of token age or permission level

### Requirement 4: Supabase Realtime Feed Subscriptions

**User Story:** As a guild member, I want new posts, comments, and reactions to appear in my feed without refreshing the page, so that I have a live community experience.

#### Acceptance Criteria

1. WHEN a new post is inserted into the posts table, THE Realtime_Channel SHALL broadcast the insert event to all connected clients subscribed to the feed channel
2. WHEN a new comment is inserted into the comments table, THE Realtime_Channel SHALL broadcast the insert event to clients viewing the associated post
3. WHEN a new reaction is inserted into or deleted from the reactions table, THE Realtime_Channel SHALL broadcast the change event to clients viewing the associated post
4. WHILE a client is subscribed to the feed channel, THE Platform SHALL maintain the connection with automatic reconnection on any disconnection (including explicit client disconnects and network interruptions)
5. THE Platform SHALL enable Supabase Realtime on the posts, comments, reactions, and notifications tables via replica identity configuration
6. WHEN a realtime event is received by the client, THE Feed_Service SHALL update the TanStack_Query cache to reflect the new data without a full refetch

### Requirement 5: Realtime Notifications Push

**User Story:** As a guild member, I want to receive notification alerts in real time without refreshing, so that I can respond promptly to community activity.

#### Acceptance Criteria

1. WHEN a new notification row is inserted for a user, THE Realtime_Channel SHALL broadcast the notification to that specific user's subscription
2. WHEN a realtime notification event is received, THE Platform SHALL increment the unread notification badge count in the UI
3. WHILE the user is on any page of the Platform, THE Platform SHALL maintain a persistent notification channel subscription
4. IF the realtime connection is lost, THEN THE Platform SHALL attempt reconnection with exponential backoff and reconcile missed notifications on reconnect

### Requirement 6: Admin Moderation Tools

**User Story:** As an admin, I want moderation tools to manage reported and inappropriate content, so that I can maintain a safe community environment.

#### Acceptance Criteria

1. THE Platform SHALL provide a `reports` table with columns: id (bigint, identity PK), post_id (bigint, FK to posts), reporter_id (uuid, FK to profiles), reason (text), status (text, constrained to 'pending', 'reviewed', 'dismissed'), reviewed_by (uuid, FK to profiles, nullable), created_at (timestamptz), reviewed_at (timestamptz, nullable)
2. WHEN a member submits a report via POST /api/reports, THE Platform SHALL create a report record with status 'pending'
3. WHEN an admin accesses GET /api/admin/reports, THE Platform SHALL return all pending reports with associated post content and reporter profile
4. WHEN an admin hides a post via PATCH /api/admin/posts/[id]/moderate, THE Platform SHALL set is_hidden to true on the post and create a moderation audit log entry; audit logs SHALL only be created for explicit admin actions, not automated or system-initiated changes
5. WHEN an admin soft-deletes a post via PATCH /api/admin/posts/[id]/moderate with action 'soft_delete', THE Platform SHALL set a deleted_at timestamp on the post and create a moderation audit log entry; the deletion SHALL succeed even if audit logging fails
6. WHEN an admin unhides a post via PATCH /api/admin/posts/[id]/moderate with action 'unhide', THE Platform SHALL set is_hidden to false and create a moderation audit log entry
7. THE Platform SHALL add a deleted_at (timestamptz, nullable) column to the posts table to support Soft_Delete
8. THE Platform SHALL store moderation actions in the activity_logs table with entity_type 'moderation' and metadata containing the action, reason, and admin user_id

### Requirement 7: Online Presence Tracking

**User Story:** As a guild member, I want to see which other members are currently online, so that I know who is available for interaction.

#### Acceptance Criteria

1. WHEN a user opens the Platform, THE Presence_Channel SHALL track the user's online status with their user_id and profile metadata (full_name, avatar_url)
2. WHEN a user closes the Platform or disconnects, THE Presence_Channel SHALL remove the user from the online members list within 30 seconds
3. WHILE the user is active on the Platform, THE Presence_Channel SHALL send periodic heartbeat signals to maintain presence state
4. WHEN presence state changes (join or leave), THE Platform SHALL update the online members list in the UI without page refresh
5. THE Platform SHALL expose online member count and list through a client-side hook (usePresence)

### Requirement 8: Performance Optimizations

**User Story:** As a guild member, I want the feed to feel responsive with instant feedback on my actions, so that interaction feels smooth and fast.

#### Acceptance Criteria

1. WHEN a user toggles a reaction, THE Platform SHALL apply an Optimistic_Update restricted to +1 or -1 changes to the reaction count and state in the TanStack_Query cache, rolling back on server error
2. WHEN a user adds a comment, THE Platform SHALL apply an Optimistic_Update to prepend the comment in the TanStack_Query cache, enforcing rollback within this operation on server error
3. WHEN a user bookmarks a post, THE Platform SHALL apply an Optimistic_Update to the bookmark state in the TanStack_Query cache, enforcing guaranteed rollback within this operation on server error
4. THE Platform SHALL configure TanStack_Query with stale time of 30 seconds for feed data and 60 seconds for notification counts to reduce redundant network requests
5. WHEN fetching feed posts, THE Platform SHALL use cursor-based pagination compatible with the existing infinite scroll implementation
6. THE Platform SHALL deduplicate realtime events that arrive for data already present in the TanStack_Query cache

### Requirement 9: Realtime RLS and Database Configuration

**User Story:** As a developer, I want proper database configuration for realtime, so that Supabase Realtime can broadcast row changes securely.

#### Acceptance Criteria

1. THE Platform SHALL set replica identity to FULL on the posts, comments, reactions, and notifications tables to enable Supabase Realtime change broadcasting
2. THE Platform SHALL create an RLS_Policy on the posts table that allows authenticated users to receive realtime SELECT events for non-hidden, non-deleted posts; hidden posts SHALL NOT generate realtime events for any user regardless of their role or ownership
3. THE Platform SHALL create an RLS_Policy on the notifications table that restricts realtime SELECT events to the notification's own user_id
4. THE Platform SHALL create an index on notifications(user_id, is_read, created_at DESC) for efficient unread notification queries
5. THE Platform SHALL create an index on reports(status, created_at) for efficient pending report queue queries

### Requirement 10: Service Layer Architecture

**User Story:** As a developer, I want well-structured service classes following existing patterns, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Feed_Service SHALL extend BaseRepository and provide methods for fetching paginated posts with enriched counts, handling realtime cache updates, and cursor-based pagination
2. THE Notification_Service SHALL extend BaseRepository and provide methods for creating notifications, listing with pagination, marking as read, marking all as read, and counting unread
3. THE Reaction_Service SHALL extend BaseRepository and provide methods for toggling reactions with notification creation as a side effect
4. THE Activity_Service SHALL extend BaseRepository and provide methods for logging moderation actions with structured metadata
5. THE Platform SHALL validate all API request bodies using Zod schemas before processing
6. THE Platform SHALL export TypeScript interfaces for Notification, Report, and PresenceState in the types/database.ts file
