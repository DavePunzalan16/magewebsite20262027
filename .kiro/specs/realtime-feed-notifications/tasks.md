# Implementation Plan: Realtime Feed & Notifications

## Overview

This plan implements realtime feed subscriptions, a notifications system, admin moderation tools, online presence tracking, and optimistic updates for the M.A.G.E. Digital Guild Platform. The implementation follows the existing layered architecture (Repositories → Services → API Routes → Client Hooks) and integrates Supabase Realtime with TanStack React Query for cache management.

## Tasks

- [x] 1. Database migrations and schema setup
  - [x] 1.1 Create the notifications table migration
    - Create SQL migration file with the notifications table (id, user_id, type, title, body, entity_type, entity_id, actor_id, is_read, created_at)
    - Add CHECK constraint on type column for allowed values
    - Create indexes: idx_notifications_user_unread(user_id, is_read, created_at DESC) and idx_notifications_user_created(user_id, created_at DESC)
    - Set REPLICA IDENTITY FULL on notifications table
    - Add RLS policies: users read own, users update own, service role inserts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.3, 9.4_

  - [x] 1.2 Create the reports table migration
    - Create SQL migration file with reports table (id, post_id, reporter_id, reason, status, reviewed_by, created_at, reviewed_at)
    - Add CHECK constraint on status column for 'pending', 'reviewed', 'dismissed'
    - Create index: idx_reports_status_created(status, created_at)
    - Add RLS policies: authenticated users can insert own reports, admins can read all
    - _Requirements: 6.1, 9.5_

  - [x] 1.3 Add deleted_at column to posts table and enable REPLICA IDENTITY
    - Add deleted_at (timestamptz, nullable, default null) column to posts table
    - Set REPLICA IDENTITY FULL on posts, comments, and reactions tables
    - Add RLS policy for authenticated users to read visible (non-hidden, non-deleted) posts via realtime
    - _Requirements: 6.7, 9.1, 9.2_

- [x] 2. TypeScript interfaces and Zod validators
  - [x] 2.1 Add Notification, Report, and PresenceState interfaces to types/database.ts
    - Add Notification interface with all columns and optional joined actor field
    - Add Report interface with all columns and optional joined posts/reporter fields
    - Add PresenceState interface (user_id, full_name, avatar_url, online_at)
    - Update the Post interface to include optional deleted_at field
    - _Requirements: 10.6_

  - [x] 2.2 Create Zod validators for notifications, reports, and moderation
    - Create `src/lib/validators/notifications.ts` with notificationQuerySchema (limit, offset)
    - Create `src/lib/validators/reports.ts` with createReportSchema (post_id, reason) and moderatePostSchema (action, reason)
    - _Requirements: 10.5_

- [ ] 3. Repository layer
  - [~] 3.1 Create NotificationRepository extending BaseRepository
    - Create `src/lib/repositories/notifications.ts`
    - Implement create(), findByUser() with pagination, markAsRead(), markAllAsRead(), getUnreadCount()
    - _Requirements: 2.6, 10.2_

  - [~] 3.2 Write property tests for NotificationRepository
    - **Property 4: Notification ordering and pagination**
    - **Property 5: Mark-all-read completeness**
    - **Property 6: Unread count accuracy**
    - **Validates: Requirements 3.1, 3.3, 3.4**

  - [~] 3.3 Create ReportRepository extending BaseRepository
    - Create `src/lib/repositories/reports.ts`
    - Implement create(), findPending() with joined post/profile data, review()
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 3.4 Write property test for ReportRepository
    - **Property 10: Report creation invariant**
    - **Validates: Requirements 6.2**

  - [~] 3.5 Extend PostRepository with softDelete and unhide methods
    - Add softDelete(id, userId) method that sets deleted_at timestamp and logs activity
    - Add unhide(id, userId) method that sets is_hidden=false and logs activity
    - Update findMany() to exclude posts where deleted_at IS NOT NULL
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

  - [~] 3.6 Write property tests for moderation state transitions
    - **Property 9: Moderation state transition with audit trail**
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.8**

- [~] 4. Checkpoint - Ensure repository layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Service layer
  - [~] 5.1 Create NotificationService with business logic
    - Create `src/lib/services/notifications.ts`
    - Implement notifyComment(), notifyReaction(), notifyModeration()
    - Enforce self-notification prevention (actor_id === recipient → no-op)
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [~] 5.2 Write property tests for NotificationService
    - **Property 1: Self-notification prevention**
    - **Property 2: Interaction notification creation**
    - **Property 3: Moderation notification creation**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

  - [~] 5.3 Integrate NotificationService into existing interaction flows
    - Update `src/app/api/posts/[id]/comments/route.ts` POST handler to call notifyComment()
    - Update `src/app/api/posts/[id]/reactions/route.ts` POST handler to call notifyReaction()
    - _Requirements: 2.1, 2.2_

- [ ] 6. API routes for notifications
  - [~] 6.1 Create GET /api/notifications route
    - Create `src/app/api/notifications/route.ts`
    - Authenticate user, validate query params with notificationQuerySchema
    - Return paginated notifications ordered by created_at descending
    - _Requirements: 3.1, 3.5_

  - [~] 6.2 Create PATCH /api/notifications/[id]/read route
    - Create `src/app/api/notifications/[id]/read/route.ts`
    - Authenticate user, mark single notification as read
    - _Requirements: 3.2, 3.5_

  - [~] 6.3 Create PATCH /api/notifications/read-all route
    - Create `src/app/api/notifications/read-all/route.ts`
    - Authenticate user, mark all unread notifications as read
    - _Requirements: 3.3, 3.5_

  - [~] 6.4 Create GET /api/notifications/unread-count route
    - Create `src/app/api/notifications/unread-count/route.ts`
    - Authenticate user, return unread count
    - _Requirements: 3.4, 3.5_

- [ ] 7. API routes for reports and moderation
  - [~] 7.1 Create POST /api/reports route
    - Create `src/app/api/reports/route.ts`
    - Authenticate user, validate body with createReportSchema
    - Create report record with status 'pending'
    - _Requirements: 6.2_

  - [~] 7.2 Create GET /api/admin/reports route
    - Create `src/app/api/admin/reports/route.ts`
    - Authenticate admin user, return pending reports with joined post and profile data
    - _Requirements: 6.3_

  - [~] 7.3 Create PATCH /api/admin/posts/[id]/moderate route
    - Create `src/app/api/admin/posts/[id]/moderate/route.ts`
    - Authenticate admin user, validate body with moderatePostSchema
    - Handle hide, unhide, and soft_delete actions
    - Create moderation audit log entry in activity_logs
    - Call NotificationService.notifyModeration() for post author
    - _Requirements: 6.4, 6.5, 6.6, 6.8, 2.4_

  - [~] 7.4 Write property test for Zod validation
    - **Property 15: Zod validation rejects invalid input**
    - **Validates: Requirements 10.5**

- [~] 8. Checkpoint - Ensure all API routes and service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Client-side realtime hooks and cache utilities
  - [-] 9.1 Install fast-check dependency
    - Add fast-check as a devDependency
    - _Requirements: (testing infrastructure)_

  - [~] 9.2 Create pure cache update utility functions
    - Create `src/lib/utils/feed-cache.ts`
    - Implement updateFeedCacheWithNewPost() with deduplication
    - Implement applyOptimisticToggle() for reaction/bookmark toggles
    - Implement applyOptimisticComment() for comment count increment
    - _Requirements: 4.6, 8.1, 8.2, 8.3, 8.6_

  - [~] 9.3 Write property tests for cache utility functions
    - **Property 7: Realtime cache update correctness**
    - **Property 8: Cache deduplication**
    - **Property 11: Toggle optimistic update correctness**
    - **Property 12: Comment optimistic update**
    - **Validates: Requirements 4.6, 8.1, 8.2, 8.3, 8.6**

  - [~] 9.4 Create useRealtimeFeed hook
    - Create `src/hooks/useRealtimeFeed.ts`
    - Subscribe to Supabase Realtime channel for posts, comments, and reactions tables
    - Use cache update utilities to update TanStack Query cache on events
    - Handle automatic reconnection on network interruption
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [~] 9.5 Create useRealtimeNotifications hook
    - Create `src/hooks/useRealtimeNotifications.ts`
    - Subscribe to per-user notification channel with filter on user_id
    - Increment unread badge count and prepend to notification list on INSERT event
    - Handle reconnection with exponential backoff and reconcile missed notifications
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [~] 9.6 Create usePresence hook
    - Create `src/hooks/usePresence.ts`
    - Subscribe to presence:guild channel with user metadata tracking
    - Return onlineMembers list and onlineCount
    - Handle presence sync events (join/leave)
    - Send heartbeat signals to maintain presence state
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. RealtimeProvider and optimistic updates
  - [~] 10.1 Create RealtimeProvider component
    - Create `src/components/providers/RealtimeProvider.tsx`
    - Initialize useRealtimeFeed and useRealtimeNotifications hooks
    - Provide presence context to child components
    - Wrap feed pages with this provider
    - _Requirements: 4.4, 5.3_

  - [~] 10.2 Implement optimistic updates for reactions, comments, and bookmarks
    - Update feed mutation hooks to use onMutate/onError/onSettled pattern
    - Apply optimistic toggle for reactions using applyOptimisticToggle
    - Apply optimistic toggle for bookmarks using applyOptimisticToggle
    - Apply optimistic comment count using applyOptimisticComment
    - Roll back on server error
    - _Requirements: 8.1, 8.2, 8.3_

  - [~] 10.3 Update QueryProvider with feed-specific stale times
    - Configure staleTime of 30s for feed data queries
    - Configure staleTime of 60s for notification count queries
    - _Requirements: 8.4_

  - [~] 10.4 Implement cursor-based pagination for feed
    - Update PostRepository.findMany() to accept cursor parameter (timestamp)
    - Update /api/feed route to support cursor query parameter
    - Return only posts with created_at < cursor, ordered descending
    - _Requirements: 8.5_

  - [~] 10.5 Write property test for cursor-based pagination
    - **Property 13: Cursor-based pagination correctness**
    - **Validates: Requirements 8.5**

- [ ] 11. UI components
  - [~] 11.1 Create NotificationBell component
    - Create `src/components/feed/NotificationBell.tsx`
    - Bell icon with unread badge count
    - Dropdown panel showing recent notifications
    - Mark individual notification as read on click
    - Mark all as read button
    - _Requirements: 5.2, 3.1, 3.2, 3.3_

  - [~] 11.2 Create OnlinePresenceIndicator component
    - Create `src/components/feed/OnlinePresenceIndicator.tsx`
    - Display count of online members
    - Expandable avatar list showing online member details
    - _Requirements: 7.4, 7.5_

  - [~] 11.3 Create ReportDialog component
    - Create `src/components/feed/ReportDialog.tsx`
    - Use Radix Dialog for modal
    - Form with reason text input (min 5 chars, max 500)
    - Submit to POST /api/reports
    - _Requirements: 6.2_

  - [~] 11.4 Wire UI components into existing feed layout
    - Add NotificationBell to dashboard layout header
    - Add OnlinePresenceIndicator to feed sidebar or header
    - Add Report button to post card options menu triggering ReportDialog
    - Wrap feed pages with RealtimeProvider
    - _Requirements: 5.2, 7.4_

- [ ] 12. Notification cleanup utility
  - [~] 12.1 Create notification cleanup function
    - Create `src/lib/utils/notification-cleanup.ts`
    - Implement cleanupOldNotifications() that deletes read notifications older than 90 days
    - Preserve all unread notifications regardless of age
    - _Requirements: 1.5_

  - [~] 12.2 Write property test for notification cleanup
    - **Property 14: Notification cleanup preserves unread**
    - **Validates: Requirements 1.5**

- [~] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `fast-check` library is used for property-based testing (Property 1–15)
- All realtime channels use Supabase's built-in reconnection with exponential backoff
- Optimistic updates use TanStack Query's onMutate/onError/onSettled pattern

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "2.1", "2.2", "9.1"] },
    { "id": 1, "tasks": ["3.1", "3.3", "3.5"] },
    { "id": 2, "tasks": ["3.2", "3.4", "3.6", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["7.4", "9.2"] },
    { "id": 6, "tasks": ["9.3", "9.4", "9.5", "9.6", "10.4"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.5", "12.1"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3", "12.2"] },
    { "id": 9, "tasks": ["11.4"] }
  ]
}
```
