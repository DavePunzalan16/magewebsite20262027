// Feature: realtime-feed-notifications, Property 4: Notification ordering and pagination
// Feature: realtime-feed-notifications, Property 5: Mark-all-read completeness
// Feature: realtime-feed-notifications, Property 6: Unread count accuracy

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NotificationRepository } from "../notifications";
import type { Notification } from "@/lib/types/database";

// Mock the Supabase server module
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// Build a chainable mock for Supabase query builder
function createMockQueryBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "from",
    "select",
    "insert",
    "update",
    "eq",
    "order",
    "range",
    "single",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }

  // Apply overrides (for terminal methods that return data)
  Object.assign(builder, overrides);

  return builder;
}

let mockSupabaseClient: ReturnType<typeof createMockQueryBuilder>;

// Arbitrary for generating notification-like data
const notificationTypeArb = fc.constantFrom(
  "comment",
  "reaction",
  "mention",
  "post",
  "moderation"
) as fc.Arbitrary<Notification["type"]>;

const notificationArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  user_id: fc.uuid(),
  type: notificationTypeArb,
  title: fc.string({ minLength: 1, maxLength: 50 }),
  body: fc.string({ minLength: 1, maxLength: 100 }),
  entity_type: fc.option(fc.constantFrom("post", "comment"), { nil: null }),
  entity_id: fc.option(fc.stringify(fc.integer({ min: 1 })), { nil: null }),
  actor_id: fc.option(fc.uuid(), { nil: null }),
  is_read: fc.boolean(),
  created_at: fc.date({ min: new Date("2024-01-01"), max: new Date("2025-12-31") }).map(
    (d) => d.toISOString()
  ),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationRepository - Property 4: Notification ordering and pagination", () => {
  // **Validates: Requirements 3.1**
  // For any set of notifications, findByUser returns them ordered by created_at descending.
  // For any limit L and offset O, the returned list contains at most L items.

  it("should return notifications ordered by created_at descending and respect pagination limits", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(notificationArb, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 20 }),
        fc.uuid(),
        async (notifications, limit, offset, userId) => {
          // Filter to the user and sort descending by created_at (simulating DB behavior)
          const userNotifications = notifications.map((n) => ({
            ...n,
            user_id: userId,
            profiles: null,
          }));

          const sorted = [...userNotifications].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Apply pagination: range(offset, offset + limit - 1)
          const paginated = sorted.slice(offset, offset + limit);

          // Setup mock to return the paginated result
          mockSupabaseClient = createMockQueryBuilder();
          const queryBuilder = createMockQueryBuilder({
            then: undefined,
          });

          // Make the chain resolve with paginated data
          let capturedAscending: boolean | undefined;
          let capturedRangeStart: number | undefined;
          let capturedRangeEnd: number | undefined;

          const finalBuilder = {
            ...queryBuilder,
            eq: vi.fn(() => finalBuilder),
            order: vi.fn((_col: string, opts: { ascending: boolean }) => {
              capturedAscending = opts.ascending;
              return finalBuilder;
            }),
            range: vi.fn((start: number, end: number) => {
              capturedRangeStart = start;
              capturedRangeEnd = end;
              return Promise.resolve({ data: paginated, error: null });
            }),
          };

          const selectBuilder = {
            ...queryBuilder,
            eq: vi.fn(() => finalBuilder),
          };

          const fromBuilder = {
            select: vi.fn(() => selectBuilder),
          };

          mockSupabaseClient.from = vi.fn(() => fromBuilder);

          const repo = new NotificationRepository();
          const result = await repo.findByUser({ userId, limit, offset });

          // Property: result length is at most limit
          expect(result.length).toBeLessThanOrEqual(limit);

          // Property: result length matches paginated slice
          expect(result.length).toBe(paginated.length);

          // Property: order method was called with ascending: false
          expect(capturedAscending).toBe(false);

          // Property: range was called with correct offset and limit
          expect(capturedRangeStart).toBe(offset);
          expect(capturedRangeEnd).toBe(offset + limit - 1);

          // Property: the returned notifications are in descending order by created_at
          for (let i = 1; i < result.length; i++) {
            const prev = new Date(result[i - 1].created_at).getTime();
            const curr = new Date(result[i].created_at).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("NotificationRepository - Property 5: Mark-all-read completeness", () => {
  // **Validates: Requirements 3.3**
  // For any user with N unread notifications, after calling markAllAsRead,
  // getUnreadCount returns 0.

  it("should mark all unread notifications as read so unread count becomes 0", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(notificationArb, { minLength: 0, maxLength: 30 }),
        async (userId, notifications) => {
          const userNotifications = notifications.map((n) => ({
            ...n,
            user_id: userId,
          }));
          const unreadCount = userNotifications.filter((n) => !n.is_read).length;

          // Track state: after markAllAsRead, all become read
          let allMarkedAsRead = false;

          // Mock for markAllAsRead
          const markAllUpdateBuilder = {
            eq: vi.fn(function (this: typeof markAllUpdateBuilder) {
              return this;
            }),
          };

          // The final .eq("is_read", false) call resolves the promise
          let eqCallCount = 0;
          markAllUpdateBuilder.eq = vi.fn(() => {
            eqCallCount++;
            if (eqCallCount >= 2) {
              // After both .eq calls, resolve
              allMarkedAsRead = true;
              return Promise.resolve({ error: null });
            }
            return markAllUpdateBuilder;
          });

          // Mock for getUnreadCount (returns 0 after mark all)
          const countSelectBuilder = {
            eq: vi.fn(function (this: typeof countSelectBuilder) {
              return this;
            }),
          };
          let countEqCalls = 0;
          countSelectBuilder.eq = vi.fn(() => {
            countEqCalls++;
            if (countEqCalls >= 2) {
              // After markAllAsRead, unread count is 0
              return Promise.resolve({
                count: allMarkedAsRead ? 0 : unreadCount,
                error: null,
              });
            }
            return countSelectBuilder;
          });

          mockSupabaseClient = createMockQueryBuilder();

          let fromCallCount = 0;
          mockSupabaseClient.from = vi.fn(() => {
            fromCallCount++;
            if (fromCallCount === 1) {
              // markAllAsRead call
              return { update: vi.fn(() => markAllUpdateBuilder) };
            }
            // getUnreadCount call
            return { select: vi.fn(() => countSelectBuilder) };
          });

          const repo = new NotificationRepository();

          // Execute markAllAsRead
          await repo.markAllAsRead(userId);

          // Now get unread count - should be 0
          const count = await repo.getUnreadCount(userId);

          // Property: after markAllAsRead, unread count is 0
          expect(count).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("NotificationRepository - Property 6: Unread count accuracy", () => {
  // **Validates: Requirements 3.4**
  // For any set of notifications with varying is_read statuses,
  // getUnreadCount returns exactly the count where is_read=false.

  it("should return exactly the count of notifications where is_read is false", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
        async (userId, notifications) => {
          const userNotifications = notifications.map((n) => ({
            ...n,
            user_id: userId,
          }));

          // Calculate expected unread count
          const expectedUnreadCount = userNotifications.filter(
            (n) => !n.is_read
          ).length;

          // Mock getUnreadCount: Supabase's select with count: "exact", head: true
          // filters by user_id and is_read=false, returns count
          const countBuilder = {
            eq: vi.fn(function (this: typeof countBuilder) {
              return this;
            }),
          };
          let eqCalls = 0;
          countBuilder.eq = vi.fn(() => {
            eqCalls++;
            if (eqCalls >= 2) {
              // Both .eq("user_id", userId) and .eq("is_read", false) applied
              return Promise.resolve({
                count: expectedUnreadCount,
                error: null,
              });
            }
            return countBuilder;
          });

          mockSupabaseClient = createMockQueryBuilder();
          mockSupabaseClient.from = vi.fn(() => ({
            select: vi.fn(() => countBuilder),
          }));

          const repo = new NotificationRepository();
          const count = await repo.getUnreadCount(userId);

          // Property: count equals exactly the number of unread notifications
          expect(count).toBe(expectedUnreadCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
