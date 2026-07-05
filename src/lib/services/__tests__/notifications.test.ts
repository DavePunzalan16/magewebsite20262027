// Feature: realtime-feed-notifications, Property 1: Self-notification prevention
// Feature: realtime-feed-notifications, Property 2: Interaction notification creation
// Feature: realtime-feed-notifications, Property 3: Moderation notification creation

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NotificationService } from "../notifications";

// Mock the Supabase server module (required by BaseRepository)
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

// Mock the NotificationRepository module
vi.mock("@/lib/repositories/notifications", () => {
  return {
    NotificationRepository: class MockNotificationRepository {
      create = vi.fn().mockResolvedValue({});
    },
  };
});

// Arbitraries for generating test data
const uuidArb = fc.uuid();
const postIdArb = fc.integer({ min: 1, max: 1_000_000 });
const commentPreviewArb = fc.string({ minLength: 0, maxLength: 200 });
const moderationActionArb = fc.constantFrom("hidden", "unhidden", "soft_deleted", "removed");
const reasonArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined });

describe("NotificationService - Property 1: Self-notification prevention", () => {
  // **Validates: Requirements 2.1, 2.5**
  // For any interaction event where actor_id === recipient user_id,
  // NotificationService SHALL NOT create a notification record.

  let service: NotificationService;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
    mockCreate = vi.fn().mockResolvedValue({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).repo = { create: mockCreate };
  });

  it("notifyComment does not create a notification when actor === post author", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        postIdArb,
        commentPreviewArb,
        async (userId, postId, commentPreview) => {
          mockCreate.mockClear();

          await service.notifyComment(userId, userId, postId, commentPreview);

          // Property: repo.create is never called when actor === recipient
          expect(mockCreate).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("notifyReaction does not create a notification when actor === post author", async () => {
    await fc.assert(
      fc.asyncProperty(uuidArb, postIdArb, async (userId, postId) => {
        mockCreate.mockClear();

        await service.notifyReaction(userId, userId, postId);

        // Property: repo.create is never called when actor === recipient
        expect(mockCreate).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});

describe("NotificationService - Property 2: Interaction notification creation", () => {
  // **Validates: Requirements 2.1, 2.2**
  // For any comment/reaction where actor !== post author,
  // NotificationService creates exactly one notification with correct type, user_id, and actor_id.

  let service: NotificationService;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
    mockCreate = vi.fn().mockResolvedValue({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).repo = { create: mockCreate };
  });

  it("notifyComment creates exactly one notification with type 'comment', correct user_id and actor_id", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        postIdArb,
        commentPreviewArb,
        async (postAuthorId, actorId, postId, commentPreview) => {
          // Pre-condition: actor !== post author
          fc.pre(postAuthorId !== actorId);

          mockCreate.mockClear();

          await service.notifyComment(postAuthorId, actorId, postId, commentPreview);

          // Property: exactly one notification created
          expect(mockCreate).toHaveBeenCalledTimes(1);

          const callArgs = mockCreate.mock.calls[0][0];

          // Property: correct type
          expect(callArgs.type).toBe("comment");

          // Property: notification is for the post author
          expect(callArgs.userId).toBe(postAuthorId);

          // Property: actor_id is the commenter
          expect(callArgs.actorId).toBe(actorId);

          // Property: entityType is "post" and entityId matches
          expect(callArgs.entityType).toBe("post");
          expect(callArgs.entityId).toBe(String(postId));

          // Property: body is truncated to 100 chars
          expect(callArgs.body.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("notifyReaction creates exactly one notification with type 'reaction', correct user_id and actor_id", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        postIdArb,
        async (postAuthorId, actorId, postId) => {
          // Pre-condition: actor !== post author
          fc.pre(postAuthorId !== actorId);

          mockCreate.mockClear();

          await service.notifyReaction(postAuthorId, actorId, postId);

          // Property: exactly one notification created
          expect(mockCreate).toHaveBeenCalledTimes(1);

          const callArgs = mockCreate.mock.calls[0][0];

          // Property: correct type
          expect(callArgs.type).toBe("reaction");

          // Property: notification is for the post author
          expect(callArgs.userId).toBe(postAuthorId);

          // Property: actor_id is the reactor
          expect(callArgs.actorId).toBe(actorId);

          // Property: entityType is "post" and entityId matches
          expect(callArgs.entityType).toBe("post");
          expect(callArgs.entityId).toBe(String(postId));
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("NotificationService - Property 3: Moderation notification creation", () => {
  // **Validates: Requirements 2.4**
  // For any moderation action, NotificationService creates exactly one notification
  // of type 'moderation' for the post author with the admin as actor_id.

  let service: NotificationService;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
    mockCreate = vi.fn().mockResolvedValue({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).repo = { create: mockCreate };
  });

  it("notifyModeration always creates exactly one notification of type 'moderation' for the post author", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        postIdArb,
        moderationActionArb,
        reasonArb,
        async (postAuthorId, adminId, postId, action, reason) => {
          mockCreate.mockClear();

          await service.notifyModeration(postAuthorId, adminId, postId, action, reason);

          // Property: exactly one notification created
          expect(mockCreate).toHaveBeenCalledTimes(1);

          const callArgs = mockCreate.mock.calls[0][0];

          // Property: type is 'moderation'
          expect(callArgs.type).toBe("moderation");

          // Property: notification is for the post author
          expect(callArgs.userId).toBe(postAuthorId);

          // Property: actor_id is the admin
          expect(callArgs.actorId).toBe(adminId);

          // Property: entityType is "post" and entityId matches
          expect(callArgs.entityType).toBe("post");
          expect(callArgs.entityId).toBe(String(postId));

          // Property: title contains the action
          expect(callArgs.title).toContain(action);

          // Property: body is either the provided reason or the default message
          if (reason) {
            expect(callArgs.body).toBe(reason);
          } else {
            expect(callArgs.body).toContain(action);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("notifyModeration creates a notification even when admin === post author (no self-prevention for moderation)", async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        postIdArb,
        moderationActionArb,
        reasonArb,
        async (userId, postId, action, reason) => {
          mockCreate.mockClear();

          // Admin and post author are the same person
          await service.notifyModeration(userId, userId, postId, action, reason);

          // Property: notification is still created (moderation has no self-prevention)
          expect(mockCreate).toHaveBeenCalledTimes(1);

          const callArgs = mockCreate.mock.calls[0][0];
          expect(callArgs.type).toBe("moderation");
          expect(callArgs.userId).toBe(userId);
          expect(callArgs.actorId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
