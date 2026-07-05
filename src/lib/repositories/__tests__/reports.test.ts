// Feature: realtime-feed-notifications, Property 10: Report creation invariant
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { createAdminClient } from "@/lib/supabase/server";
import { ReportRepository } from "../reports";

/**
 * **Validates: Requirements 6.2**
 *
 * Property 10: Report creation invariant
 * For any valid report submission (valid post_id, authenticated reporter_id, non-empty reason),
 * the created report record SHALL always have status equal to 'pending' and reviewed_by equal to null.
 */

// Mock the Supabase admin client
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

const mockedCreateAdminClient = vi.mocked(createAdminClient);

describe("ReportRepository - Property 10: Report creation invariant", () => {
  let capturedInserts: Record<string, unknown>[];

  beforeEach(() => {
    capturedInserts = [];

    const mockSingle = vi.fn();
    const mockSelect = vi.fn(() => ({ single: mockSingle }));
    const mockInsert = vi.fn((data: Record<string, unknown>) => {
      capturedInserts.push(data);
      mockSingle.mockReturnValue({
        data: {
          id: Math.floor(Math.random() * 10000),
          ...data,
          created_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        },
        error: null,
      });
      return { select: mockSelect };
    });
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));

    mockedCreateAdminClient.mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>);
  });

  it("should always insert with status 'pending' and no reviewed_by for any valid report inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid post IDs (positive integers)
        fc.integer({ min: 1, max: 1_000_000 }),
        // Generate random valid UUID reporter IDs
        fc.uuid(),
        // Generate random non-empty reason strings
        fc.string({ minLength: 1, maxLength: 500 }),
        async (postId, reporterId, reason) => {
          // Reset captured inserts for this iteration
          capturedInserts.length = 0;

          const repo = new ReportRepository();
          const result = await repo.create({ postId, reporterId, reason });

          // Verify that the insert was called with status 'pending'
          expect(capturedInserts).toHaveLength(1);
          const insertedData = capturedInserts[0];
          expect(insertedData.status).toBe("pending");

          // Verify that reviewed_by is NOT included in the insert (null by DB default)
          expect(insertedData).not.toHaveProperty("reviewed_by");

          // Verify the returned report has status 'pending' and reviewed_by null
          expect(result.status).toBe("pending");
          expect(result.reviewed_by).toBeNull();

          // Verify the correct post_id, reporter_id, and reason were passed
          expect(insertedData.post_id).toBe(postId);
          expect(insertedData.reporter_id).toBe(reporterId);
          expect(insertedData.reason).toBe(reason);
        }
      ),
      { numRuns: 100 }
    );
  });
});
