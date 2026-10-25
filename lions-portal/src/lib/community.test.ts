import { describe, expect, it } from "vitest";
import { commentSchema, postSchema, reportSchema, safeFileName } from "./community";

describe("community validation", () => {
  it("rejects empty and oversized posts", () => {
    expect(postSchema.safeParse({ categoryId: 1, body: "   " }).success).toBe(false);
    expect(postSchema.safeParse({ categoryId: 1, body: "x".repeat(5001) }).success).toBe(false);
    expect(postSchema.safeParse({ categoryId: 1, body: "Food drive on Saturday" }).success).toBe(true);
  });
  it("requires uuids for comments and reports", () => {
    expect(commentSchema.safeParse({ postId: "nope", body: "hi" }).success).toBe(false);
    expect(reportSchema.safeParse({ kind: "post", id: "3f2b1c9e-0000-4000-8000-000000000001", reason: "spam" }).success).toBe(true);
    expect(reportSchema.safeParse({ kind: "user", id: "x", reason: "spam" }).success).toBe(false);
  });
  it("strips path tricks from file names", () => {
    expect(safeFileName("../../etc/passwd")).not.toContain("/");
    expect(safeFileName("my photo (1).jpg")).toBe("my_photo__1_.jpg");
  });
});
