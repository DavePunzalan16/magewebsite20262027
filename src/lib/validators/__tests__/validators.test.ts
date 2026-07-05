// Feature: realtime-feed-notifications, Property 15: Zod validation rejects invalid input
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { notificationQuerySchema } from "../notifications";
import { createReportSchema, moderatePostSchema } from "../reports";

/**
 * **Validates: Requirements 10.5**
 *
 * Property 15: Zod validation rejects invalid input
 * For any request body that violates the schema constraints (missing fields, wrong types, out-of-range values),
 * the schema rejects it. For any request body that satisfies all constraints, the schema accepts it.
 */

describe("Zod Validation - Property 15: Zod validation rejects invalid input", () => {
  describe("notificationQuerySchema", () => {
    it("should accept any valid input where limit is 1-50 and offset >= 0", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 100_000 }),
          (limit, offset) => {
            const result = notificationQuerySchema.safeParse({ limit, offset });
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.limit).toBe(limit);
              expect(result.data.offset).toBe(offset);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when limit is less than 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }),
          (limit) => {
            const result = notificationQuerySchema.safeParse({ limit, offset: 0 });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when limit is greater than 50", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 51, max: 10_000 }),
          (limit) => {
            const result = notificationQuerySchema.safeParse({ limit, offset: 0 });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when offset is negative", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10_000, max: -1 }),
          (offset) => {
            const result = notificationQuerySchema.safeParse({ limit: 20, offset });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject non-coercible types for limit and offset", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant("abc"),
            fc.constant(""),
            fc.array(fc.integer(), { minLength: 1 }),
            fc.dictionary(fc.string(), fc.integer())
          ),
          (invalidValue) => {
            const result = notificationQuerySchema.safeParse({
              limit: invalidValue,
              offset: 0,
            });
            // Non-coercible values (non-numeric strings, arrays, objects) should fail
            // because coerce.number() produces NaN which fails min(1)
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("createReportSchema", () => {
    it("should accept any valid input with positive integer post_id and reason 5-500 chars", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }),
          fc.string({ minLength: 5, maxLength: 500 }).filter((s) => s.length >= 5),
          (postId, reason) => {
            const result = createReportSchema.safeParse({
              post_id: postId,
              reason,
            });
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.post_id).toBe(postId);
              expect(result.data.reason).toBe(reason);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when post_id is zero or negative", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1_000_000, max: 0 }),
          (postId) => {
            const result = createReportSchema.safeParse({
              post_id: postId,
              reason: "Valid reason text",
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when post_id is a non-integer number", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }).filter(
            (n) => !Number.isInteger(n)
          ),
          (postId) => {
            const result = createReportSchema.safeParse({
              post_id: postId,
              reason: "Valid reason text",
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when reason is shorter than 5 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 4 }),
          (reason) => {
            const result = createReportSchema.safeParse({
              post_id: 1,
              reason,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when reason is longer than 500 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 1000 }),
          (reason) => {
            const result = createReportSchema.safeParse({
              post_id: 1,
              reason,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when required fields are missing", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant({}),
            fc.constant({ post_id: 1 }),
            fc.constant({ reason: "Valid reason" })
          ),
          (input) => {
            const result = createReportSchema.safeParse(input);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when post_id has wrong type", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.boolean(),
            fc.constant(null),
            fc.array(fc.integer())
          ),
          (invalidPostId) => {
            const result = createReportSchema.safeParse({
              post_id: invalidPostId,
              reason: "Valid reason text",
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("moderatePostSchema", () => {
    it("should accept any valid action with optional reason up to 500 chars", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("hide", "unhide", "soft_delete"),
          fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          (action, reason) => {
            const input: Record<string, unknown> = { action };
            if (reason !== undefined) {
              input.reason = reason;
            }
            const result = moderatePostSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.action).toBe(action);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when action is not one of the allowed values", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(
            (s) => !["hide", "unhide", "soft_delete"].includes(s)
          ),
          (invalidAction) => {
            const result = moderatePostSchema.safeParse({
              action: invalidAction,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when action is missing", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (reason) => {
            const result = moderatePostSchema.safeParse({ reason });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when reason exceeds 500 characters", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("hide", "unhide", "soft_delete"),
          fc.string({ minLength: 501, maxLength: 1000 }),
          (action, reason) => {
            const result = moderatePostSchema.safeParse({ action, reason });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject when action has wrong type", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.array(fc.string())
          ),
          (invalidAction) => {
            const result = moderatePostSchema.safeParse({
              action: invalidAction,
            });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
