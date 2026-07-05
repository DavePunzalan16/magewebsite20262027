// Feature: realtime-feed-notifications, Property 9: Moderation state transition with audit trail
// **Validates: Requirements 6.4, 6.5, 6.6, 6.8**

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { PostRepository } from "../posts";

// Mock the Supabase server module
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

// Chainable mock builder for Supabase query methods
function createChainableMock(resolveValue: { data?: unknown; error: null | { message: string }; count?: number }) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "select", "insert", "update", "delete", "eq", "is", "order", "range", "single", "limit"];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  // Terminal methods resolve
  chain["then"] = (resolve: (val: unknown) => void) => resolve(resolveValue);
  // Make it thenable
  Object.defineProperty(chain, "then", {
    value: (resolve: (val: unknown) => void) => {
      resolve(resolveValue);
      return Promise.resolve(resolveValue);
    },
  });
  return chain;
}

let mockUpdateChain: ReturnType<typeof createChainableMock>;
let mockInsertChain: ReturnType<typeof createChainableMock>;
let mockFromFn: ReturnType<typeof vi.fn>;
let mockSupabaseClient: { from: ReturnType<typeof vi.fn> };

beforeEach(() => {
  mockUpdateChain = createChainableMock({ data: null, error: null });
  mockInsertChain = createChainableMock({ data: null, error: null });

  mockFromFn = vi.fn((table: string) => {
    if (table === "activity_logs") {
      return mockInsertChain;
    }
    return mockUpdateChain;
  });

  mockSupabaseClient = { from: mockFromFn };
});

// UUID arbitrary for generating valid UUIDs
const uuidArb = fc.uuid();
// Post ID arbitrary (positive integers)
const postIdArb = fc.integer({ min: 1, max: 1_000_000 });

describe("Property 9: Moderation state transition with audit trail", () => {
  it("softDelete sets deleted_at to a non-null timestamp and logs activity with entity_type 'moderation' and action 'soft_delete'", () => {
    fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, adminUserId) => {
        // Reset mocks for each iteration
        mockUpdateChain = createChainableMock({ data: null, error: null });
        mockInsertChain = createChainableMock({ data: null, error: null });
        mockFromFn.mockImplementation((table: string) => {
          if (table === "activity_logs") {
            return mockInsertChain;
          }
          return mockUpdateChain;
        });

        const repo = new PostRepository();
        await repo.softDelete(postId, adminUserId);

        // Verify posts table was updated with a non-null deleted_at
        expect(mockFromFn).toHaveBeenCalledWith("posts");
        const updateFn = mockUpdateChain["update"] as ReturnType<typeof vi.fn>;
        expect(updateFn).toHaveBeenCalledTimes(1);
        const updateArg = updateFn.mock.calls[0][0];
        expect(updateArg).toHaveProperty("deleted_at");
        expect(updateArg.deleted_at).not.toBeNull();
        expect(typeof updateArg.deleted_at).toBe("string");
        // Verify it's a valid ISO timestamp
        expect(new Date(updateArg.deleted_at).toISOString()).toBe(updateArg.deleted_at);

        // Verify eq was called with the post id
        const eqFn = mockUpdateChain["eq"] as ReturnType<typeof vi.fn>;
        expect(eqFn).toHaveBeenCalledWith("id", postId);

        // Verify activity_logs was called with correct params
        expect(mockFromFn).toHaveBeenCalledWith("activity_logs");
        const insertFn = mockInsertChain["insert"] as ReturnType<typeof vi.fn>;
        expect(insertFn).toHaveBeenCalledTimes(1);
        const insertArg = insertFn.mock.calls[0][0];
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
    fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, adminUserId) => {
        // Reset mocks for each iteration
        mockUpdateChain = createChainableMock({ data: null, error: null });
        mockInsertChain = createChainableMock({ data: null, error: null });
        mockFromFn.mockImplementation((table: string) => {
          if (table === "activity_logs") {
            return mockInsertChain;
          }
          return mockUpdateChain;
        });

        const repo = new PostRepository();
        await repo.unhide(postId, adminUserId);

        // Verify posts table was updated with is_hidden=false
        expect(mockFromFn).toHaveBeenCalledWith("posts");
        const updateFn = mockUpdateChain["update"] as ReturnType<typeof vi.fn>;
        expect(updateFn).toHaveBeenCalledTimes(1);
        const updateArg = updateFn.mock.calls[0][0];
        expect(updateArg).toEqual({ is_hidden: false });

        // Verify eq was called with the post id
        const eqFn = mockUpdateChain["eq"] as ReturnType<typeof vi.fn>;
        expect(eqFn).toHaveBeenCalledWith("id", postId);

        // Verify activity_logs was called with correct params
        expect(mockFromFn).toHaveBeenCalledWith("activity_logs");
        const insertFn = mockInsertChain["insert"] as ReturnType<typeof vi.fn>;
        expect(insertFn).toHaveBeenCalledTimes(1);
        const insertArg = insertFn.mock.calls[0][0];
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
    fc.assert(
      fc.asyncProperty(postIdArb, uuidArb, async (postId, _adminUserId) => {
        // For hide, we use the update method with is_hidden: true
        // The update method also sets updated_at, so we verify is_hidden is part of the payload
        const mockSelectChain = createChainableMock({
          data: { id: postId, is_hidden: true },
          error: null,
        });

        mockFromFn.mockImplementation((table: string) => {
          if (table === "posts") {
            return mockSelectChain;
          }
          return mockInsertChain;
        });

        const repo = new PostRepository();
        await repo.update(postId, { is_hidden: true });

        // Verify posts table was called
        expect(mockFromFn).toHaveBeenCalledWith("posts");
        const updateFn = mockSelectChain["update"] as ReturnType<typeof vi.fn>;
        expect(updateFn).toHaveBeenCalledTimes(1);
        const updateArg = updateFn.mock.calls[0][0];
        expect(updateArg.is_hidden).toBe(true);

        // Verify eq was called with the post id
        const eqFn = mockSelectChain["eq"] as ReturnType<typeof vi.fn>;
        expect(eqFn).toHaveBeenCalledWith("id", postId);
      }),
      { numRuns: 100 }
    );
  });
});
