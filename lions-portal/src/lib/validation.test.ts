import { describe, expect, it } from "vitest";
import { registerSchema, safeNext } from "./validation";

describe("safeNext", () => {
  it("keeps same-site paths", () => expect(safeNext("/member/dashboard")).toBe("/member/dashboard"));
  it("blocks protocol-relative and absolute URLs", () => {
    expect(safeNext("//evil.com")).toBe("/member/dashboard");
    expect(safeNext("https://evil.com")).toBe("/member/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/member/dashboard");
  });
  it("falls back when empty", () => expect(safeNext(null)).toBe("/member/dashboard"));
});

describe("registerSchema", () => {
  const ok = { email: "A@Example.com", username: "Lion_One", displayName: "Test Lion", password: "long-enough-pass" };
  it("normalizes email and username", () => {
    const r = registerSchema.parse(ok);
    expect(r.email).toBe("a@example.com");
    expect(r.username).toBe("lion_one");
  });
  it("rejects short passwords and bad usernames", () => {
    expect(registerSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, username: "no spaces" }).success).toBe(false);
  });
});
