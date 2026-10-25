// Identify a file by its first bytes instead of trusting the browser-supplied type.
export type Sniffed = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf" | "video/mp4" | "video/webm";

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);

export function sniffFile(b: Uint8Array): Sniffed | null {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith(b, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (startsWith(b, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(b, [0x66, 0x74, 0x79, 0x70], 4)) return "video/mp4";
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  return null;
}

export const AVATAR_TYPES: Sniffed[] = ["image/jpeg", "image/png", "image/webp"];
export const EXT: Record<Sniffed, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "application/pdf": "pdf", "video/mp4": "mp4", "video/webm": "webm",
};
