import { z } from "zod";

export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, "Use 3 to 30 letters, numbers or underscores.");
export const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Enter a display name.").max(60),
  password: passwordSchema,
});

export const applicationSchema = z.object({ message: z.string().trim().max(1000).optional() });

/** Accept only same-site relative paths after login. Blocks //evil.com and absolute URLs. */
export function safeNext(next: string | null | undefined, fallback = "/member/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export const MUNICIPALITIES = ["Oshawa", "Whitby", "Ajax", "Pickering", "Clarington", "Scugog", "Uxbridge", "Brock", "Elsewhere"] as const;
export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name.").max(60),
  nickname: z.string().trim().max(30).optional().transform((v) => v || null),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters.").optional().transform((v) => v || null),
  municipality: z.enum(MUNICIPALITIES).optional().or(z.literal("").transform(() => undefined)),
});
