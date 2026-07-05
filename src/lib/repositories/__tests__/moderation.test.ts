// Feature: realtime-feed-notifications, Property 9: Moderation state transition with audit trail
// **Validates: Requirements 6.4, 6.5, 6.6, 6.8**

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { PostRepository } from "../posts";

// Mock the Supabase server module
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// Creates a fresh chainable mock for Supabase queries
function createChainableMock() {
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["from", "select", "insert", "update", "delete", "eq", "is", "order", "range", "single", "limit"];

  for (const method of methods) {
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    });
  }

  // Make it thenable to resolve as a promise
  (chain as unknown as Record<string, unknown>)["then"] = (
    resolve: (val: unknown) => void,
    _reject?: (val: unknown) => void
  ) => {
    resolve({ data: { id: 1 }, error: null });
    return Promise.resolve({ data: { id: 1 }, error: null });
  };

  return { chain, calls };
}

let postsChain: ReturnType<typeof createChainableMock>;
let activityLogsChain: ReturnType<typeof createChainableMock>;
let mockSupabaseClient: { from: ReturnType<typeof vi.fn> };

beforeEach(() => {
  postsChain = createChainableMock();
  activityLogsChain = createChainableMock();

  mockSupabaseClient = {
    from: vi.fn((table: string) => {
      if (table === "activity_logs") {
        return activityLogsChain.chain;
      }
      return postsChain.chain;
    }),
  };
});

// UUID arbitrary for generating valid UUIDs
const uuidArb = fc.uuid();
// Post ID arbitrary (positive integers)
const postIdArb = fc.integer({ min: 1, max: 1_000_000 });

describe("Property 9: Moderation state transition with audit trail", () => {
  it("softDelete sets deleted_at to a non-null timestamp and logs activity with entity_type 'moderation' and action 'soft_delete'", () => {
    return fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, adminUserId) => {
        // Fresh mocks per iteration
        postsChain = createChainableMock();
        activityLogsChain = createChainableMock();
        mockSupabaseClient.from = vi.fn((table: string) => {
          if (table === "activity_logs") return activityLogsChain.chain;
          return postsChain.chain;
        });

        const repo = new PostRepository();
        await repo.softDelete(postId, adminUserId);

        // Verify posts table was called
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("posts");

        // Verify update was called with a non-null deleted_at timestamp
        expect(postsChain.chain.update).toHaveBeenCalledTimes(1);
        const updateArg = postsChain.chain.update.mock.calls[0][0];
        expect(updateArg).toHaveProperty("deleted_at");
        expect(updateArg.deleted_at).not.toBeNull();
        expect(typeof updateArg.deleted_at).toBe("string");
        // Verify it's a valid ISO timestamp
        expect(new Date(updateArg.deleted_at).toISOString()).toBe(updateArg.deleted_at);

        // Verify eq was called with the post id
        expect(postsChain.chain.eq).toHaveBeenCalledWith("id", postId);

        // Verify activity_logs insert was called with correct moderation params
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("activity_logs");
        expect(activityLogsChain.chain.insert).toHaveBeenCalledTimes(1);
        const insertArg = activityLogsChain.chain.insert.mock.calls[0][0];
        expect(insertArg).toMatchObject({
          user_id: adminUserId,
          action: "soft_delete",
          entity_type: "moderation",
          entity_id: String(postId),
        });
      }),
      { numRuns: 100 }
    );
  });

  it("unhide sets is_hidden=false and logs activity with entity_type 'moderation' and action 'unhide'", () => {
    return fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, adminUserId) => {
        // Fresh mocks per iteration
        postsChain = createChainableMock();
        activityLogsChain = createChainableMock();
        mockSupabaseClient.from = vi.fn((table: string) => {
          if (table === "activity_logs") return activityLogsChain.chain;
          return postsChain.chain;
        });

        const repo = new PostRepository();
        await repo.unhide(postId, adminUserId);

        // Verify posts table was called
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("posts");

        // Verify update was called with is_hidden=false
        expect(postsChain.chain.update).toHaveBeenCalledTimes(1);
        const updateArg = postsChain.chain.update.mock.calls[0][0];
        expect(updateArg).toEqual({ is_hidden: false });

        // Verify eq was called with the post id
        expect(postsChain.chain.eq).toHaveBeenCalledWith("id", postId);

        // Verify activity_logs insert was called with correct moderation params
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("activity_logs");
        expect(activityLogsChain.chain.insert).toHaveBeenCalledTimes(1);
        const insertArg = activityLogsChain.chain.insert.mock.calls[0][0];
        expect(insertArg).toMatchObject({
          user_id: adminUserId,
          action: "unhide",
          entity_type: "moderation",
          entity_id: String(postId),
        });
      }),
      { numRuns: 100 }
    );
  });

  it("hide (via update with is_hidden=true) sets is_hidden=true on the post", () => {
    return fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, _adminUserId) => {
        // Fresh mocks per iteration
        postsChain = createChainableMock();
        activityLogsChain = createChainableMock();
        mockSupabaseClient.from = vi.fn((table: string) => {
          if (table === "activity_logs") return activityLogsChain.chain;
          return postsChain.chain;
        });

        const repo = new PostRepository();
        await repo.update(postId, { is_hidden: true });

        // Verify posts table was called
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("posts");

        // Verify update was called with is_hidden=true (among other fields like updated_at)
        expect(postsChain.chain.update).toHaveBeenCalledTimes(1);
        const updateArg = postsChain.chain.update.mock.calls[0][0];
        expect(updateArg.is_hidden).toBe(true);

        // Verify eq was called with the post id
        expect(postsChain.chain.eq).toHaveBeenCalledWith("id", postId);
      }),
      { numRuns: 100 }
    );
  });
});
